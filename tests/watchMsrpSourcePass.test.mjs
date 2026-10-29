import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { readFile } from "node:fs/promises";
import test from "node:test";
registerHooks({ resolve(s, c, next) {
  try { return next(s, c); } catch (error) {
    if (!s.startsWith(".")) throw error;
    for (const suffix of [".ts", "/index.ts"]) try { return next(s + suffix, c); } catch {}
    throw error;
  }
} });
const { collectionRegistry } = await import("../src/data/collectionRegistry.ts");
const { sourceCompletionRetailPrices } = await import("../src/data/verified-retail-prices-source-completion.ts");
const { getVerifiedRetailPrices, getVerifiedUsdRetailBenchmark, formatRetailPrice } = await import("../src/lib/intelligence/watchRetailPricing.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const assets = collectionRegistry.flatMap(c => c.assets.map(a => ({ ...a, brand: c.brand })));

test("regional and historical figures cannot become current dollar budget estimates", () => {
  for (const price of sourceCompletionRetailPrices.filter(p => p.currency !== "USD")) {
    const asset = assets.find(a => a.brand === price.brand && (a.displayReference ?? a.reference) === price.reference);
    assert.ok(asset, price.reference);
    assert.equal(getVerifiedUsdRetailBenchmark(asset), null, price.reference);
    assert.ok(!formatRetailPrice(price).includes("NaN"));
  }
  for (const price of sourceCompletionRetailPrices.filter(p => p.currency === "CHF")) {
    assert.equal(price.amount, 9800);
    assert.equal(price.taxBasis, "excluded");
    assert.equal(price.basis, "historical-list");
    assert.equal(price.effectivePeriod, "2025-11");
    assert.equal(price.effectiveDate, null, "publication date must not invent an effective day");
  }
});

test("new benchmarks preserve exact approved photography and amended specifications on both AP routes", () => {
  const matched = assets.filter(a => sourceCompletionRetailPrices.some(p => p.brand === a.brand && p.reference === (a.displayReference ?? a.reference)));
  assert.equal(new Set(matched.map(a => `${a.brand}|${a.collection}|${a.reference}`)).size, 13);
  for (const asset of matched) {
    assert.ok(approvedPhotograph(asset, watchPhotographs), `${asset.brand} ${asset.reference}`);
    const price = getVerifiedRetailPrices(asset)[0];
    assert.ok(asset.specificationSources.some(s => s.url === price.sourceUrl));
  }
  const ap = matched.filter(a => a.reference === "15202ST");
  assert.equal(ap.length, 2);
  for (const asset of ap) {
    assert.equal(asset.configurations[0].caseSize, "39 mm");
    assert.match(asset.configurations[0].movement, /2121.*40-hour/);
    assert.equal(asset.configurations[0].waterResistance, "50 m");
    assert.match(getVerifiedRetailPrices(asset)[0].configuration, /not an original launch or last-production price/);
  }
});

test("specific sources cannot price unverified neighbours or turn retailer asking prices into RRP", () => {
  for (const [brand, reference] of [["Audemars Piguet", "15400ST"], ["Patek Philippe", "5167/1A"], ["Omega", "220.10.41.21.03.004"], ["Franck Muller", "V45"]]) {
    assert.equal(getVerifiedRetailPrices({ brand, reference }).length, 0, reference);
  }
  const retailer = sourceCompletionRetailPrices.filter(p => p.sourceType === "authorized-retailer");
  assert.equal(retailer.length, 2);
  assert.ok(retailer.every(p => p.priceLabel === "RRP" && p.currency === "GBP"));
  assert.deepEqual(retailer.map(p => p.amount).sort((a,b) => a-b), [5800,23800]);
});

test("archived manufacturer-entry pricing keeps the exact Freak Vision SKU and cannot enter current budgets", () => {
  const watch = assets.find(a => a.brand === "Ulysse Nardin" && a.reference === "Freak");
  assert.equal(watch.displayReference, "2505-250");
  assert.ok(approvedPhotograph(watch, watchPhotographs));
  const [price] = getVerifiedRetailPrices(watch);
  assert.equal(price.amount, 95000);
  assert.equal(price.currency, "CHF");
  assert.equal(price.taxBasis, "included");
  assert.equal(price.sourceType, "manufacturer-submission");
  assert.equal(price.basis, "historical-list");
  assert.equal(price.effectivePeriod, "2018");
  assert.equal(price.effectiveDate, null);
  assert.equal(getVerifiedUsdRetailBenchmark(watch), null);
  assert.equal(getVerifiedRetailPrices({ brand: "Ulysse Nardin", reference: "2505-250" })[0], price);
  assert.equal(getVerifiedRetailPrices({ brand: "Ulysse Nardin", reference: "Freak X" })[0].manufacturerReference, "2303-270/03");
  assert.match(watch.configurations[0].movement, /UN-250.*50-hour/);
});

test("additional authorized RRP evidence remains exact, tax-unconfirmed and outside dollar budgets", async () => {
  const { stockistContinuationRetailPrices } = await import("../src/data/verified-retail-prices-stockist-continuation.ts");
  assert.equal(stockistContinuationRetailPrices.length, 2);
  for (const [reference, amount] of [["434.10.41.21.03.001", 5700], ["215.30.44.22.01.001", 8200]]) {
    const watch = assets.find(a => a.brand === "Omega" && a.reference === reference);
    const [price] = getVerifiedRetailPrices(watch);
    assert.equal(price.amount, amount);
    assert.equal(price.priceLabel, "RRP");
    assert.equal(price.sourceType, "authorized-retailer");
    assert.equal(price.currency, "GBP");
    assert.equal(price.taxBasis, "unconfirmed");
    assert.equal(price.effectiveDate, null);
    assert.equal(getVerifiedUsdRetailBenchmark(watch), null);
    assert.ok(approvedPhotograph(watch, watchPhotographs));
    assert.ok(watch.specificationSources.some(s => s.url === price.sourceUrl));
  }
});

test("full pictured SKUs preserve photograph approvals and never invent prices for the fourteen amended profiles", async () => {
  const ledger = JSON.parse(await readFile(new URL("../docs/WATCH_MSRP_STOCKIST_CONTINUATION_2026-10-29.json", import.meta.url), "utf8"));
  assert.equal(ledger.identityAmendments.length, 14);
  for (const row of ledger.identityAmendments) {
    const watch = assets.find(a => a.brand === row.brand && a.reference === row.previousReference);
    assert.equal(watch.displayReference, row.displayReference);
    assert.ok(approvedPhotograph(watch, watchPhotographs), row.displayReference);
    assert.equal(getVerifiedRetailPrices(watch).length, 0, row.displayReference);
    assert.equal(getVerifiedUsdRetailBenchmark(watch), null);
  }
  const patek = assets.find(a => a.brand === "Patek Philippe" && a.reference === "5196");
  assert.equal(patek.displayReference, "5196R-001");
  assert.equal(patek.material, "18K rose gold", "white-gold 5196G cannot replace the approved rose-gold watch");
});

test("all 297 pages reconcile to prices or specific unresolved evidence requirements without claiming full numeric completion", async () => {
  const read = async name => JSON.parse(await readFile(new URL(`../docs/${name}`, import.meta.url), "utf8"));
  const c = await read("WATCH_RETAIL_PRICING_COVERAGE_SOURCE_PASS_2026-10-29.json");
  const q = await read("WATCH_RETAIL_PRICING_REMAINING_SOURCE_QUEUE_SOURCE_PASS_2026-10-29.json");
  assert.equal(c.catalogReferences, 297);
  assert.equal(c.sourcedReferences, 230);
  assert.equal(c.pendingReferences, 67);
  assert.equal(c.exactConfigurationSourcedReferences, 225);
  assert.equal(c.baseReferenceOnlyBenchmarks, 5);
  assert.deepEqual(q.rows.map(r => r.path).sort(), c.rows.filter(r => !r.prices.length).map(r => r.path).sort());
  assert.ok(q.rows.every(r => r.outcome && r.requiredEvidence.length && r.continuationReview));
  const evidence = await read("WATCH_MSRP_SOURCE_PASS_2026-10-29.json");
  assert.deepEqual(evidence.prices, sourceCompletionRetailPrices);
  assert.ok(evidence.sources.every(s => s.httpStatus === 200 && s.scrapeId));
});
