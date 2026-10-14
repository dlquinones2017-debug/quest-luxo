import { registerHooks } from "node:module";
import { readFile, writeFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
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
const { getCollectionsForBrand } = await import("../src/data/collectionRegistry.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");
const { referencePath } = await import("../src/lib/routes/collectionRoutes.ts");

const omega = verifiedExpansionRows.filter(row => row[1] === "omega");
const collections = getCollectionsForBrand("omega");
const rows = [];
for (const row of omega) {
  const [brand, brandSlug, collection, collectionSlug, reference, model, caseSize,
    movement, dial, bracelet, material, sourceUrl] = row;
  const destination = collections.find(c => c.slug === collectionSlug);
  const asset = destination?.assets.find(a => a.reference === reference);
  if (!asset) throw new Error(`Missing canonical Omega reference ${collectionSlug}/${reference}`);
  const photo = approvedPhotograph(asset, watchPhotographs);
  const hasFile = photo
    ? await access(resolve(root, "public" + photo.src)).then(() => true).catch(() => false)
    : false;
  const status = photo && hasFile ? "APPROVED_WITH_LOCAL_WEB" : photo ? "APPROVED_IMAGE_FILE_MISSING" : "ACQUISITION_REQUIRED";
  rows.push({
    brand, collection, collectionSlug, reference, model,
    configuration: { caseSize, movement, dial, bracelet, material },
    canonicalPath: referencePath(brandSlug, collectionSlug, reference),
    specificationSource: sourceUrl,
    status,
    approvedPhotoAssetId: photo?.assetId ?? null,
    photoPath: hasFile ? photo.src : null,
    nextAction: status === "APPROVED_WITH_LOCAL_WEB"
      ? "Preserve approval and verify image checksum and visible full-watch white-canvas quality."
      : status === "APPROVED_IMAGE_FILE_MISSING"
        ? "Restore the exact approved derivative from the asset library; verify SHA-256 before release."
        : "Acquire the exact watch configuration; establish commercial reuse permission, full original, white-canvas derivative and recorded approval before display.",
  });
}
const unique = new Set(rows.map(x => x.canonicalPath));
if (unique.size !== rows.length) throw new Error("Duplicate Omega reference route in source-backed expansion");
const approved = rows.filter(x => x.status === "APPROVED_WITH_LOCAL_WEB").length;
const missingFile = rows.filter(x => x.status === "APPROVED_IMAGE_FILE_MISSING").length;
const report = {
  reviewedAt: new Date().toISOString(),
  scope: "Omega exact-reference profiles in src/data/verified-catalog-expansion.ts only (not the full legacy catalog).",
  policy: "Approved image requires exact configuration, recorded founder/rights clearance, website approval, white background and local derivative. Manufacturer photo source is not reuse permission.",
  summary: {
    sourceBackedOmegaReferences: rows.length,
    approvedWithLocalDerivative: approved,
    approvedButFileMissing: missingFile,
    outstandingImageAcquisitions: rows.length - approved - missingFile,
    photoCoveragePercent: Number((100 * approved / (rows.length || 1)).toFixed(1)),
  },
  references: rows,
};
if (process.argv.includes("--write")) {
  await writeFile(resolve(root, "docs/OMEGA_PHOTO_COVERAGE_LIVE.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
}
console.log(JSON.stringify(report.summary, null, 2));
if (process.argv.includes("--require-complete") && approved !== rows.length) process.exitCode = 1;
if (missingFile) process.exitCode = 1;
