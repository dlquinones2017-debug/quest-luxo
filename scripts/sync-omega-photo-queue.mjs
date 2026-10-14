import { registerHooks } from "node:module";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
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
const path = resolve(root, "docs/OMEGA_PHOTOGRAPHY_ACQUISITION_QUEUE_2026-10-14.json");
const { verifiedExpansionRows } = await import("../src/data/verified-catalog-expansion.ts");
const { getCollectionsForBrand } = await import("../src/data/collectionRegistry.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");
const current = JSON.parse(await readFile(path, "utf8"));
const catalog = getCollectionsForBrand("omega");
const omega = verifiedExpansionRows.filter(row => row[1] === "omega");
const byReference = new Map(omega.map(row => [row[3] + "/" + row[4], row]));
if (byReference.size !== omega.length || current.queue.length !== omega.length) {
  throw Error("Omega queue is missing, duplicating or retaining stale source references; regenerate with an identity review.");
}
const queue = [];
let matched = 0;
let cleared = 0;
for (const item of current.queue) {
  const key = item.collectionSlug + "/" + item.reference;
  const row = byReference.get(key);
  if (!row) throw Error("Stale photography task: " + key);
  const [brand, brandSlug, collection, collectionSlug, reference, model, size, movement, dial, strap, material, source] = row;
  if (item.brand !== brand || item.collection !== collection || item.dial !== dial ||
      item.braceletOrStrap !== strap || item.material !== material || item.specificationSource !== source) {
    throw Error("Source evidence changed for " + key + "; manually reconcile exact variant before publishing.");
  }
  const asset = catalog.find(c => c.slug === collectionSlug)?.assets.find(a => a.reference === reference);
  if (!asset) throw Error("Missing catalog entry for " + key);
  const photo = approvedPhotograph(asset, watchPhotographs);
  let status = "ACQUISITION_REQUIRED";
  if (photo) {
    matched += 1;
    try {
      const bytes = await readFile(resolve(root, "public"+photo.src));
      const hash = createHash("sha256").update(bytes).digest("hex");
      status = hash === photo.sha256.toLowerCase() ? "APPROVED_WITH_VALID_DERIVATIVE" : "CHECKSUM_MISMATCH";
    } catch (error) {
      if (error.code === "ENOENT") status = "APPROVED_FILE_MISSING";
      else throw error;
    }
    if (status === "APPROVED_WITH_VALID_DERIVATIVE") cleared += 1;
  }
  const evidence = photo ? {
    ...item.evidence,
    webDerivativePath: photo.src,
    webDerivativeChecksum: photo.sha256,
    exactReferenceImageReviewed: photo.exactConfigurationVerified,
    centeredWhiteBackgroundVerified: photo.background === "white",
    websiteUseRightsVerified: photo.websiteApproved && photo.commercialUse !== "not-allowed" && photo.usageConditionsSatisfied,
    rightsRecord: photo.licenseRecord, approvalReviewer: photo.reviewer,
    approvedAssetId: photo.assetId, status,
  } : {
    ...item.evidence,
    // No automatic approval from research URLs or user-supplied metadata.
    status: item.evidence.status === "APPROVED_WITH_VALID_DERIVATIVE" ? "ACQUISITION_REQUIRED" : item.evidence.status,
  };
  queue.push({...item, imageSourceFoundInCurrentClearanceCode: Boolean(photo), evidence});
}
const next = {...current,
  summary: {...current.summary,
    references: queue.length,
    existingExactReferenceImageRecordMatches: matched,
    requiresAcquisition: queue.length-cleared,
    clearedForPublication: cleared,
  },
  queue,
};
const render = x => JSON.stringify(x,null,2)+"\n";
if (process.argv.includes("--check") && render(next) !== render(current)) {
  console.error("Omega photography queue is stale. Run npm run sync:omega-photography:queue and review the diff.");
  process.exitCode = 1;
}
if (process.argv.includes("--write") && render(next) !== render(current)) {
  await writeFile(path,render(next),"utf8");
}
console.log(JSON.stringify({references:queue.length,cleared,matched,requiresAcquisition:queue.length-cleared},null,2));
