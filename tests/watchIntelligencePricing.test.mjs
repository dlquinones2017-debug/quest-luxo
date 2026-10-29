import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import { readFile } from "node:fs/promises";

registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (!specifier.startsWith(".")) throw error;
    for (const suffix of [".ts", "/index.ts"]) {
      try { return next(specifier + suffix, context); } catch {}
    }
    throw error;
  }
} });

const { parseWatchIntent, getEstimatedWatchPrice, rankWatchAssets } = await import("../src/lib/intelligence/watchIntelligenceEngine.ts");
const { createSearchIndexRecord, searchWatchRecords, rankSearchRecordsWithIntelligence } = await import("../src/lib/intelligence/searchIndexGenerator.ts");
const { askQuestLuxo, getAskQuestLuxoCatalog } = await import("../src/lib/intelligence/askQuestLuxo.ts");
const { getVerifiedRetailPrices, getRetailPriceSummary, getVerifiedUsdRetailBenchmark, formatRetailTaxBasis } = await import("../src/lib/intelligence/watchRetailPricing.ts");
const { verifiedRetailPrices } = await import("../src/data/verified-retail-prices.ts");
const { collectionRegistry } = await import("../src/data/collectionRegistry.ts");
const { rolexAssets } = await import("../src/data/rolex/index.ts");

test("preserves decimal, comma, space, and million budget values and consumes their search terms", () => {
  for (const [query, expected] of [
    ["Rolex under $12.5k", 12500], ["under USD 12,500", 12500],
    ["budget 12 500", 12500], ["up to 25K", 25000],
    ["I have $1.25m", 1250000], ["under $12500.50", 12500.5],
    ["under 12.5k USD", 12500],
  ]) {
    const intent = parseWatchIntent(query);
    assert.equal(intent.maxBudget, expected, query);
    assert.ok(!intent.keywords.some(term => /^(?:k|m|\d)/.test(term)), query);
  }
});

test("chooses the specific ice-blue dial and recognizes supported extra brands", () => {
  assert.equal(parseWatchIntent("ice blue Rolex").dialColor, "ice blue");
  assert.equal(parseWatchIntent("Zenith chronograph").brand, "Zenith");
  assert.equal(parseWatchIntent("Girard-Perregaux Laureato").brand, "Girard-Perregaux");
  assert.equal(parseWatchIntent("Breguet Classique").brand, "Breguet");
  assert.equal(parseWatchIntent("not Rolex Omega").brand, "Omega");
  assert.equal(parseWatchIntent("not a Rolex Omega").brand, "Omega");
  assert.equal(parseWatchIntent("without any Rolex").brand, undefined);
});

test("unsourced legacy or historical numbers never qualify a watch for a current budget", () => {
  const asset = { brand: "Rolex", reference: "historical-unknown", model: "Historical", configurations: [{ originalMSRP: 1500, currentMSRP: 2500 }] };
  assert.equal(getEstimatedWatchPrice(asset), null);
  assert.equal(rankWatchAssets({ assets: [asset], intent: "under $5000" }).length, 0);
  assert.equal(rankWatchAssets({ assets: [asset], intent: "under $5000", includeUnknownPrice: true }).length, 1);
});

test("verified price follows exact brand/reference and preserves configuration-specific bracelet prices", () => {
  assert.equal(getEstimatedWatchPrice({ brand: "Rolex", reference: "124060", model: "Submariner" }), 10050);
  assert.equal(getEstimatedWatchPrice({ brand: "Omega", reference: "124060", model: "Wrong brand" }), null);
  const gmt = getVerifiedRetailPrices({ brand: "Rolex", reference: "126710BLNR" });
  assert.equal(gmt.find(price => price.configuration.includes("Oyster")).amount, 11800);
  assert.equal(gmt.find(price => price.configuration.includes("Jubilee")).amount, 12000);
});

test("catalog fallback brand and collection survive indexing and intelligence ranking", () => {
  const record = createSearchIndexRecord({ brand: "Rolex", collection: "Submariner", asset: { reference: "124060", model: "Submariner", configurations: [{ dial: "Black", bracelet: "Oyster" }] } });
  assert.equal(record.asset.brand, "Rolex");
  assert.equal(record.estimatedPrice, 10050);
  assert.equal(searchWatchRecords({ records: [record], query: "Rolex under $12.5k" }).length, 1);
  const answer = askQuestLuxo({ records: [record], query: "Rolex under $12.5k" });
  assert.equal(answer.recommendations.length, 1);
  assert.match(answer.summary, /published U.S. MSRP benchmark/);
});

test("the public no-Rolex conversational example actually excludes Rolex", () => {
  const rolex = createSearchIndexRecord({ brand: "Rolex", asset: { reference: "124060", model: "Watch" } });
  const omega = createSearchIndexRecord({ brand: "Omega", asset: { reference: "test", model: "Watch" } });
  for (const query of ["not a Rolex", "without any Rolex", "excluding Rolex", "except Rolex"]) {
    const found = searchWatchRecords({ records: [rolex, omega], query, rankResults: false });
    assert.deepEqual(found.map(record => record.brand), ["Omega"], query);
  }
});

test("ranking does not mix two brands that share the same short reference number", () => {
  const records = ["Rolex", "Omega"].map(brand => createSearchIndexRecord({ brand, collection: "Test", asset: { reference: "same", model: `${brand} watch` } }));
  const found = rankSearchRecordsWithIntelligence(records);
  assert.equal(found.length, 2);
  assert.ok(found.every(result => result.recommendation.brand === result.record.brand));
  assert.equal(new Set(found.map(result => result.record.brand)).size, 2);
});

test("a corrected display SKU preserves the original catalog route and ranking identity", () => {
  const record = createSearchIndexRecord({ brand: "Omega", collection: "Speedmaster", url: "/collections/omega/speedmaster/310-33-42-50-01-002", asset: { reference: "310.33.42.50.01.002", displayReference: "310.32.42.50.01.002", model: "Moonwatch" } });
  const found = rankSearchRecordsWithIntelligence([record]);
  assert.equal(found[0].recommendation.reference, "310.32.42.50.01.002");
  assert.equal(found[0].record.url, record.url);
  assert.equal(found[0].record.reference, "310.33.42.50.01.002");
  const other = createSearchIndexRecord({ brand: "Omega", collection: "Speedmaster", asset: { reference: "310.30.42.50.01.001", model: "Another Moonwatch" } });
  const searched = searchWatchRecords({ records: [record, other], query: "310.32.42.50.01.002" });
  assert.deepEqual(searched.map(result => result.reference), [record.reference]);
});

test("all public retail entries carry auditable configuration, market and date evidence", () => {
  const identities = new Set();
  for (const price of verifiedRetailPrices) {
    assert.ok(price.amount > 0 && Number.isFinite(price.amount));
    assert.ok(["USD", "CHF", "EUR", "GBP"].includes(price.currency));
    assert.ok(price.market.trim().length > 0);
    assert.ok(["unconfirmed", "included", "excluded"].includes(price.taxBasis));
    if (price.checkedAt === "2026-10-24" && ["Rolex", "Tudor"].includes(price.brand)) assert.equal(price.taxBasis, "unconfirmed", "source silence must not establish a tax basis");
    assert.equal(price.sourceType, "manufacturer");
    const officialHosts = { Rolex: "www.rolex.com", Tudor: "www.tudorwatch.com", IWC: "www.iwc.com", Omega: "www.omegawatches.com", Breitling: "www.breitling.com", Cartier: "www.cartier.com", Hublot: "www.hublot.com", Panerai: "www.panerai.com", "Patek Philippe": "www.patek.com", "Audemars Piguet": "www.audemarspiguet.com", "Ulysse Nardin": "www.ulysse-nardin.com", Zenith: "www.zenith-watches.com", "Jaeger-LeCoultre": "www.jaeger-lecoultre.com", "Bell & Ross": "bellross.com", Blancpain: "www.blancpain.com", "Vacheron Constantin": "www.vacheron-constantin.com", "Girard-Perregaux": "www.girard-perregaux.com", "A. Lange & Söhne": "www.alange-soehne.com" };
    const archive = price.brand === "Rolex" && price.basis === "historical-list";
    if (archive) {
      assert.ok(["davidsw.com", "www.minus4plus6.com", "rolexforum.nl"].includes(new URL(price.sourceUrl).hostname));
      assert.match(price.sourceName, /manufacturer.*archived by/i);
    } else if (price.brand === "Tudor" && new URL(price.sourceUrl).hostname === "media.tudorwatch.com") {
      assert.equal(price.basis, "historical-list");
    } else assert.equal(new URL(price.sourceUrl).hostname, price.brand === "TAG Heuer" ? "www.tagheuer.com" : officialHosts[price.brand]);
    const compact = value => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    assert.equal(new URL(price.sourceUrl).protocol, "https:");
    // Hublot uses descriptive product URLs; its exact selected SKU is in page evidence.
    if (!archive && !price.sourceUrl.endsWith(".pdf") && !["Hublot", "Bell & Ross"].includes(price.brand)) assert.ok(compact(price.sourceUrl).includes(compact(price.manufacturerReference)), price.sourceUrl);
    assert.match(price.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    if (price.effectiveDate) {
      assert.match(price.effectiveDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(price.effectiveDate <= price.checkedAt);
    }
    if (price.effectivePeriod) assert.match(price.effectivePeriod, /^\d{4}(?:-(?:0[1-9]|1[0-2]))?$/);
    const identity = `${price.brand}:${price.manufacturerReference}`;
    assert.ok(!identities.has(identity), identity);
    identities.add(identity);
    assert.ok(collectionRegistry.some(collection => collection.brand === price.brand && collection.assets.some(asset => (asset.displayReference ?? asset.reference) === price.reference)) || rolexAssets.some(asset => asset.reference === price.reference), `missing public reference: ${price.reference}`);
  }
});

test("descriptive manufacturer URLs and generic catalog labels have exact configuration evidence", async () => {
  const evidence = JSON.parse(await readFile(new URL("../docs/WATCH_RETAIL_PRICING_EVIDENCE_2026-10-28_NEXT.json", import.meta.url), "utf8"));
  for (const price of verifiedRetailPrices.filter(price => ["Hublot", "Cartier", "Panerai", "Patek Philippe"].includes(price.brand))) {
    const row = evidence.prices.find(row => row.brand === price.brand && row.manufacturerReference === price.manufacturerReference);
    assert.ok(row, price.manufacturerReference);
    assert.equal(row.reference, price.reference);
    assert.equal(row.configuration, price.configuration);
    assert.equal(row.sourceUrl, price.sourceUrl);
    assert.equal(row.amount, price.amount);
    assert.match(row.evidence.catalogMatch, /exact|match|manufacturer technical reference/i);
    if (price.brand === "Patek Philippe") {
      assert.equal(row.evidence.priceData.currency, "USD");
      assert.equal(row.evidence.priceData.isoCode, "US");
      assert.equal(row.evidence.priceData.amount, price.amount);
    }
  }
});

test("browse filters intersect natural-language exclusions and verified budgets", () => {
  const records = [
    createSearchIndexRecord({ brand: "Rolex", asset: { reference: "124060", model: "Watch", configurations: [{ dial: "Black" }] } }),
    createSearchIndexRecord({ brand: "Omega", asset: { reference: "test", model: "Watch", configurations: [{ dial: "Blue" }] } }),
  ];
  assert.equal(askQuestLuxo({ records, query: "not Rolex", browse: { brand: "Rolex" } }).totalMatches, 0);
  assert.equal(askQuestLuxo({ records, query: "watches", browse: { brand: "Omega", tag: "blue" } }).totalMatches, 1);
  assert.equal(askQuestLuxo({ records, query: "under $25000", browse: { brand: "Omega" } }).totalMatches, 0);
  assert.equal(askQuestLuxo({ records, query: "under $25000", browse: { brand: "Omega" }, includeUnknownPrice: true }).totalMatches, 1);
});

test("default recommendations use unique exact references from active catalog routes", async () => {
  const { referencePath } = await import("../src/lib/routes/collectionRoutes.ts");
  const activePaths = new Set(collectionRegistry.flatMap(collection => collection.assets.map(asset => referencePath(collection.brandSlug, collection.slug, asset.reference))));
  const records = getAskQuestLuxoCatalog();
  assert.equal(new Set(records.map(record => record.url)).size, records.length);
  const identities = new Set(records.map(record => `${record.brand}:${record.asset.displayReference ?? record.reference}`));
  const paths = new Set(records.map(record => record.url));
  assert.equal(identities.size, records.length);
  assert.ok(records.every(record => activePaths.has(record.url)));
  for (const collection of collectionRegistry) for (const asset of collection.assets) {
    const visible = asset.displayReference ?? asset.reference;
    assert.ok(identities.has(`${collection.brand}:${visible}`) || paths.has(referencePath(collection.brandSlug, collection.slug, asset.reference)) || getVerifiedRetailPrices(asset, collection.brand).some(price => price.referenceAliases?.includes(visible) && identities.has(`${collection.brand}:${price.reference}`)), `missing unaliased reference: ${collection.brand}:${visible}`);
  }
});

test("verified aliases reuse one observation and recommend the full reference without changing public routes", () => {
  const family = getVerifiedRetailPrices({ brand: "Ulysse Nardin", reference: "Freak X" });
  const exact = getVerifiedRetailPrices({ brand: "Ulysse Nardin", reference: "2303-270/03" });
  assert.equal(family.length, 1);
  assert.equal(family[0], exact[0]);
  const matches = getAskQuestLuxoCatalog().filter(record => record.brand === "Ulysse Nardin" && ["Freak X", "2303-270/03"].includes(record.reference));
  assert.equal(matches.length, 1);
  assert.equal(matches[0].reference, "2303-270/03");
  assert.ok(collectionRegistry.some(collection => collection.assets.some(asset => asset.reference === "Freak X")), "legacy route remains in registry");
});

test("historical and international benchmarks never become current U.S. budget prices", () => {
  for (const reference of ["126710BLRO", "116710BLNR", "116520"]) {
    const asset = { brand: "Rolex", reference, model: "Historical watch" };
    assert.equal(getVerifiedUsdRetailBenchmark(asset), null);
    const record = createSearchIndexRecord({ brand: "Rolex", asset });
    assert.equal(searchWatchRecords({ records: [record], query: "under $50000" }).length, 0);
    assert.equal(searchWatchRecords({ records: [record], query: "under $50000", includeUnknownPrice: true }).length, 1);
  }
  const batman = getVerifiedRetailPrices({ brand: "Rolex", reference: "116710BLNR" })[0];
  assert.equal(batman.currency, "EUR");
  assert.equal(batman.market, "Netherlands");
  assert.equal(batman.effectiveDate, null);
  assert.equal(batman.effectivePeriod, "2016-02");
  assert.equal(getVerifiedRetailPrices({ brand: "Rolex", reference: "116520" })[0].configurationScope, "base-reference");
  const tudor = getVerifiedRetailPrices({ brand: "Tudor", reference: "79030N" })[0];
  assert.equal(tudor.currency, "CHF");
  assert.equal(tudor.amount, 3400);
  assert.equal(tudor.effectiveDate, null);
  assert.equal(tudor.effectivePeriod, "2018");
  assert.equal(getVerifiedUsdRetailBenchmark({ brand: "Tudor", reference: "79030N", model: "Fifty-Eight" }), null);
});

test("retail summary never treats lower foreign amounts or older historical periods as a comparable price range", () => {
  const base = getVerifiedRetailPrices({ brand: "Rolex", reference: "126710BLRO" })[0];
  const euro = { ...base, currency: "EUR", market: "Netherlands", amount: 1000 };
  const older = { ...base, amount: 2000, effectiveDate: "2012-06-01" };
  const selected = getRetailPriceSummary([euro, older, base]);
  assert.equal(selected.price.amount, 10700);
  assert.equal(selected.price.currency, "USD");
  assert.equal(selected.hasRange, false);
  const current = { ...euro, basis: "current-list", effectiveDate: null };
  assert.equal(getRetailPriceSummary([base, current]).price, current);
});

test("tax labels distinguish verified inclusion/exclusion from source silence", () => {
  assert.equal(formatRetailTaxBasis({ taxBasis: "unconfirmed" }), "Tax basis unconfirmed");
  assert.equal(formatRetailTaxBasis({ taxBasis: "included" }), "Taxes included");
  assert.equal(formatRetailTaxBasis({ taxBasis: "excluded" }), "Taxes excluded");
});

test("Tudor Monochrome benchmark follows its pictured three-link configuration", () => {
  const prices = getVerifiedRetailPrices({ brand: "Tudor", reference: "M7941A1A0NU" });
  assert.equal(prices.length, 1);
  assert.equal(prices[0].manufacturerReference, "M7941A1A0NU-0001");
  assert.equal(prices[0].amount, 5325);
  assert.ok(!prices.some(price => price.manufacturerReference.endsWith("-0003")));
});
