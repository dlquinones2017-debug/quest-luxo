import { registerHooks } from "node:module";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (!specifier.startsWith(".")) throw error;
    for (const suffix of [".ts", "/index.ts"]) {
      try { return next(specifier + suffix, context); } catch {}
    }
    throw error;
  }
} });

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { verifiedExpansionRows } = await import("../src/data/verified-catalog-expansion.ts");
const { collectionRegistry } = await import("../src/data/collectionRegistry.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");
const { referencePath } = await import("../src/lib/routes/collectionRoutes.ts");

const args = process.argv.slice(2);
const requireComplete = args.includes("--require-complete");
const write = args.includes("--write");
const brandFilter = args.find(arg => arg.startsWith("--brand="))?.slice(8);
const rows = verifiedExpansionRows.filter(row => !brandFilter || row[1] === brandFilter);
if (brandFilter && rows.length === 0) throw Error("No expansion references for brand: " + brandFilter);

function prioritize(brandSlug, collectionSlug, dial, material, strap, model) {
  const favored = ["omega", "tudor", "zenith", "iwc", "breitling", "franck-muller"];
  let score = 50;
  if (favored.includes(brandSlug)) score += 10;
  if (/seamaster|speedmaster|defy|chronomaster|navitimer|black-bay/i.test(collectionSlug)) score += 8;
  if (/gold|sedna|carbotech/i.test(material)) score += 5;
  if (/blue|green|pink|white|orange|gray/i.test(dial)) score += 4;
  if (/rubber/i.test(strap)) score += 3;
  if (/007|james bond|milano|tourbillon|fr2|special|limited/i.test(model)) score += 3;
  return score;
}

const references = [];
for (const row of rows) {
  const [brand, brandSlug, collection, collectionSlug, reference, model, caseSize,
    movement, dial, bracelet, material, specificationSource] = row;
  const canonical = collectionRegistry.find(c => c.brandSlug === brandSlug && c.slug === collectionSlug);
  const asset = canonical?.assets.find(a => a.reference === reference);
  if (!asset) throw Error("Missing catalog asset for " + brandSlug + "/" + collectionSlug + "/" + reference);
  const photo = approvedPhotograph(asset, watchPhotographs);
  let status = "ACQUISITION_REQUIRED";
  let actualSha256 = null;
  if (photo) {
    try {
      const content = await readFile(join(root, "public", photo.src.slice(1)));
      actualSha256 = createHash("sha256").update(content).digest("hex");
      status = actualSha256 === photo.sha256.toLowerCase() ? "APPROVED_WITH_VALID_DERIVATIVE" : "CHECKSUM_MISMATCH";
    } catch (error) {
      if (error.code === "ENOENT") status = "APPROVED_FILE_MISSING";
      else throw error;
    }
  }
  references.push({
    brand, brandSlug, collection, collectionSlug, reference, model,
    canonicalRoute: referencePath(brandSlug, collectionSlug, reference),
    configuration: {caseSize, movement, dial, bracelet, material},
    specificationSource, score: prioritize(brandSlug, collectionSlug, dial, material, bracelet, model),
    status, photoAssetId: photo?.assetId ?? null,
    derivativePath: photo?.src ?? null, recordedSha256: photo?.sha256 ?? null, actualSha256,
    rightsRecord: photo?.licenseRecord ?? null,
    nextAction: status === "APPROVED_WITH_VALID_DERIVATIVE"
      ? "Retain approved source, white-canvas derivative, attribution and reference mapping."
      : status === "CHECKSUM_MISMATCH"
        ? "Quarantine changed derivative, restore approved bytes and re-review against original."
        : status === "APPROVED_FILE_MISSING"
          ? "Restore the missing verified derivative from the approved asset library; validate SHA-256."
          : "Source authentic exact-reference original; obtain commercial-use license and provenance, prepare approved full-watch white-canvas derivative and register the matching SHA-256.",
  });
}
references.sort((a,b) => b.score-a.score || a.brand.localeCompare(b.brand) || a.reference.localeCompare(b.reference));

const seen = new Set();
for (const item of references) {
  if (seen.has(item.canonicalRoute)) throw Error("Duplicate canonical reference: " + item.canonicalRoute);
  seen.add(item.canonicalRoute);
}
const byBrand = [...new Set(references.map(x => x.brand))].sort().map(brand => {
  const subset = references.filter(x => x.brand === brand);
  return {brand, references: subset.length, approved: subset.filter(x => x.status === "APPROVED_WITH_VALID_DERIVATIVE").length,
    outstanding: subset.filter(x => x.status !== "APPROVED_WITH_VALID_DERIVATIVE").length};
});
const approved = references.filter(x=>x.status === "APPROVED_WITH_VALID_DERIVATIVE").length;
const missing = references.filter(x=>x.status === "APPROVED_FILE_MISSING").length;
const corrupted = references.filter(x=>x.status === "CHECKSUM_MISMATCH").length;
const summary = {
  expansionReferences: references.length,
  brands: byBrand.length,
  collections: new Set(references.map(x => x.brandSlug + "/" + x.collectionSlug)).size,
  approvedValidReferences: approved, missingApprovedDerivative: missing, checksumFailures: corrupted,
  acquisitionRequired: references.length-approved-missing-corrupted,
  notReleaseReady: references.length-approved,
  imageCoveragePercent: Number((100*approved/(references.length||1)).toFixed(1)),
};
const report = {reviewedAt: new Date().toISOString(),
  scope: brandFilter ? brandFilter + " expansion only" : "All verified-catalog-expansion.ts references only; excludes legacy inventory",
  policy: "Source URL is NOT image-rights evidence. Exact watch, strap, dial, material, white-canvas original, licensing, website approval and actual derivative SHA256 are required.",
  summary, byBrand, references,
};
if (write) {
  const filename = brandFilter ? brandFilter.toUpperCase().replace(/[^A-Z0-9]/g,"_") + "_EXPANSION_PHOTO_COVERAGE.json" : "MULTIBRAND_EXPANSION_PHOTO_COVERAGE.json";
  await writeFile(join(root,"docs",filename),JSON.stringify(report,null,2)+"\n","utf8");
}
console.log(JSON.stringify({summary,byBrand},null,2));
if (missing || corrupted || (requireComplete && approved !== references.length)) process.exitCode = 1;
