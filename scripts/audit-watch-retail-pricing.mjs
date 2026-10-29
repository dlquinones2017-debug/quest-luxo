import { registerHooks } from "node:module";
import { writeFile } from "node:fs/promises";
registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (!specifier.startsWith(".")) throw error;
    for (const suffix of [".ts", "/index.ts"]) {
      try { return next(specifier + suffix, context); } catch {}
    }
    throw error;
  }
} });
const { collectionRegistry } = await import("../src/data/collectionRegistry.ts");
const { getVerifiedRetailPrices, getVerifiedUsdRetailBenchmark } = await import("../src/lib/intelligence/watchRetailPricing.ts");
const { referencePath } = await import("../src/lib/routes/collectionRoutes.ts");
const catalogRows = collectionRegistry.flatMap(collection => collection.assets.map(asset => {
  const prices = getVerifiedRetailPrices(asset, collection.brand);
  return {
    brand: collection.brand, collection: collection.name,
    reference: asset.displayReference ?? asset.reference,
    path: referencePath(collection.brandSlug, collection.slug, asset.reference),
    status: prices.length ? "sourced-list-price" : "research-pending",
    prices,
    currentUsBudgetBenchmark: getVerifiedUsdRetailBenchmark({ ...asset, brand: collection.brand }),
    identitySources: asset.specificationSources ?? [],
  };
}));
const rows = [...new Map(catalogRows.map(row => [row.path, row])).values()];
const report = {
  catalogReferences: rows.length,
  duplicateCatalogRows: catalogRows.length - rows.length,
  sourcedReferences: rows.filter(row => row.prices.length).length,
  pendingReferences: rows.filter(row => !row.prices.length).length,
  currentUsBudgetEligibleReferences: rows.filter(row => row.currentUsBudgetBenchmark !== null).length,
  currentInternationalOnlyReferences: rows.filter(row => row.currentUsBudgetBenchmark === null && row.prices.some(price => price.basis === "current-list" && price.configurationScope !== "base-reference" && (price.currency !== "USD" || price.market !== "United States"))).length,
  historicalOnlyReferences: rows.filter(row => row.prices.length && row.prices.every(price => price.basis === "historical-list")).length,
  baseReferenceOnlyBenchmarks: rows.filter(row => row.prices.length && row.prices.every(price => price.configurationScope === "base-reference")).length,
  exactConfigurationSourcedReferences: rows.filter(row => row.prices.some(price => price.configurationScope !== "base-reference")).length,
  note: "Coverage counts canonical reference pages, including documented aliases. Sourced benchmarks may be current, historical or base-reference; current U.S. budget eligibility is counted separately. Checked dates record source observation, not manufacturer price-effective dates. Unknown values are never imputed.",
  rows,
};
const destination = process.argv[2];
if (destination) await writeFile(destination, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ catalogReferences: report.catalogReferences, sourcedReferences: report.sourcedReferences, pendingReferences: report.pendingReferences, currentUsBudgetEligibleReferences: report.currentUsBudgetEligibleReferences, historicalOnlyReferences: report.historicalOnlyReferences, baseReferenceOnlyBenchmarks: report.baseReferenceOnlyBenchmarks, destination: destination ?? null }));
