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
const { getVerifiedRetailPrices, getVerifiedUsdRetailBenchmark } = await import("../src/lib/intelligence/watchRetailPricing.ts");
const { getAskQuestLuxoCatalog } = await import("../src/lib/intelligence/askQuestLuxo.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const asset = (brand, reference) => collectionRegistry.filter(c => c.brand === brand).flatMap(c => c.assets).find(a => a.reference === reference);

test("exact pictured identities replace family placeholders without breaking established URLs or photography", () => {
  const cases = [["Cartier", "Ballon Bleu 40 mm", "WSBB0061", "/collections/cartier/ballon-bleu/ballon-bleu-40-mm"],
    ["Tudor", "Tudor Royal 41 mm", "M28600-0005", "/collections/tudor/royal/tudor-royal-41-mm"],
    ["Tudor", "Prince Date", "74000", "/collections/tudor/prince/prince-date"]];
  const records = getAskQuestLuxoCatalog();
  for (const [brand, legacy, visible, path] of cases) {
    const watch = asset(brand, legacy);
    assert.equal(watch.displayReference, visible);
    assert.ok(watch.configurations.every(c => !/reference-dependent|bracelet or strap/i.test(`${c.dial} ${c.bracelet}`)));
    assert.ok(approvedPhotograph(watch, watchPhotographs), visible);
    assert.ok(records.some(r => r.asset.displayReference === visible && r.url === path), path);
    assert.ok(!watch.brokerageIntelligence.configurationSummary.includes("Reference-dependent"));
  }
});

test("historical base Rolex rows and exact Swiss Tudor evidence remain outside current dollar budgets", () => {
  for (const ref of ["116500LN", "228206", "118238"]) {
    const watch = asset("Rolex", ref);
    const price = getVerifiedRetailPrices(watch)[0];
    assert.equal(price.configurationScope, "base-reference");
    assert.equal(price.basis, "historical-list");
    assert.equal(getVerifiedUsdRetailBenchmark(watch), null);
    assert.match(price.configuration, /not separately priced/);
  }
  const royal = asset("Tudor", "Tudor Royal 41 mm");
  const price = getVerifiedRetailPrices(royal)[0];
  assert.equal(price.amount, 2200);
  assert.equal(price.currency, "CHF");
  assert.equal(price.market, "Switzerland");
  assert.equal(price.taxBasis, "included");
  assert.equal(price.effectivePeriod, "2020");
  assert.equal(price.effectiveDate, null);
  assert.equal(getVerifiedUsdRetailBenchmark(royal), null);
  assert.match(royal.configurations[0].movement, /T603/);
  assert.equal(getVerifiedRetailPrices(asset("Tudor", "Tudor Royal 38 mm")).length, 0, "41 mm price never leaks to diamond 38 mm");
});

test("Monaco current TH20-00 benchmark is supported by the actual catalog generation and discloses earlier movement", () => {
  const watch = asset("TAG Heuer", "CBL2111.FC6453");
  assert.equal(getVerifiedUsdRetailBenchmark(watch), 8300);
  assert.equal(watch.configurations.length, 1);
  assert.match(watch.configurations[0].movement, /TH20-00.*80-hour/);
  assert.equal(watch.configurations[0].bracelet, "Blue alligator leather strap");
  assert.equal(watch.configurations[0].waterResistance, "100 m");
  assert.match(watch.questLuxoView, /not original Heuer 02 MSRP/);
  assert.match(getVerifiedRetailPrices(watch)[0].configuration, /Current TH20-00/);
});

test("latest coverage reconciles all 297 public paths with the unresolved evidence queue", async () => {
  const coverage = JSON.parse(await readFile(new URL("../docs/WATCH_RETAIL_PRICING_COVERAGE_2026-10-29.json", import.meta.url)));
  const queue = JSON.parse(await readFile(new URL("../docs/WATCH_RETAIL_PRICING_REMAINING_SOURCE_QUEUE_2026-10-29.json", import.meta.url)));
  assert.equal(coverage.catalogReferences, 297);
  assert.equal(coverage.sourcedReferences + coverage.pendingReferences, 297);
  assert.deepEqual(queue.rows.map(r => r.path).sort(), coverage.rows.filter(r => !r.prices.length).map(r => r.path).sort());
  assert.ok(queue.rows.every(r => r.outcome && r.requiredEvidence.length));
});
