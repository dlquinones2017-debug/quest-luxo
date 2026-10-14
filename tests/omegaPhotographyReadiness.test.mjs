import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (!specifier.startsWith(".")) throw error;
    for (const suffix of [".ts", "/index.ts"]) {
      try { return next(specifier + suffix, context); } catch {}
    }
    throw error;
  }
} });

const { verifiedExpansionRows } = await import("../src/data/verified-catalog-expansion.ts");
const { getCollectionsForBrand } = await import("../src/data/collectionRegistry.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");
const { referencePath } = await import("../src/lib/routes/collectionRoutes.ts");

const queue = JSON.parse(await readFile(new URL("../docs/OMEGA_PHOTOGRAPHY_ACQUISITION_QUEUE_2026-10-14.json", import.meta.url), "utf8"));
const omega = verifiedExpansionRows.filter(row => row[1] === "omega");
const run = promisify(execFile);
const cwd = fileURLToPath(new URL("../", import.meta.url));
const args = (filename, ...options) =>
  [process.execPath, ["--experimental-strip-types", fileURLToPath(new URL("../scripts/"+filename, import.meta.url)), ...options], {cwd}];

test("exact Omega image queue covers the full catalog and never fabricates approvals", () => {
  assert.equal(queue.summary.references, omega.length);
  assert.equal(queue.queue.length, omega.length);
  assert.ok(omega.length >= 55);
  const all = new Map(queue.queue.map(item => [item.collectionSlug + "/" + item.reference, item]));
  assert.equal(all.size, queue.queue.length, "duplicate photography tasks");
  const collections = getCollectionsForBrand("omega");
  let approvedEntries = 0;
  let matchingPhotoEntries = 0;
  for (const [brand, brandSlug, collection, collectionSlug, reference, model, size, movement, dial, strap, material, source] of omega) {
    const item = all.get(collectionSlug + "/" + reference);
    assert.ok(item, "missing photography acquisition task: " + reference);
    assert.equal(item.brand, brand);
    assert.equal(item.collection, collection);
    assert.equal(item.dial, dial);
    assert.equal(item.braceletOrStrap, strap);
    assert.equal(item.material, material);
    assert.equal(item.specificationSource, source);
    const asset = collections.find(c => c.slug === collectionSlug)?.assets.find(a => a.reference === reference);
    assert.ok(asset, reference + " must have a catalog route");
    const photo = approvedPhotograph(asset, watchPhotographs);
    assert.equal(item.imageSourceFoundInCurrentClearanceCode, Boolean(photo));
    if (photo) {
      matchingPhotoEntries += 1;
      assert.equal(item.evidence.approvedAssetId, photo.assetId);
      assert.equal(item.evidence.webDerivativeChecksum, photo.sha256);
      assert.equal(item.evidence.webDerivativePath, photo.src);
      assert.equal(item.evidence.websiteUseRightsVerified, true);
      if (item.evidence.status === "APPROVED_WITH_VALID_DERIVATIVE") approvedEntries += 1;
    } else {
      assert.notEqual(item.evidence.status, "APPROVED_WITH_VALID_DERIVATIVE");
      assert.notEqual(item.evidence.websiteUseRightsVerified, true);
    }
    assert.match(referencePath(brandSlug, collectionSlug, reference), /^\/collections\//);
  }
  assert.equal(queue.summary.existingExactReferenceImageRecordMatches, matchingPhotoEntries);
  assert.equal(queue.summary.clearedForPublication, approvedEntries);
  assert.equal(queue.summary.requiresAcquisition, omega.length-approvedEntries);
});

test("Omega queue synchronizer stays current and is safe to run in acquisition waves", async () => {
  const [bin, argv, opts] = args("sync-omega-photo-queue.mjs","--check");
  const {stdout} = await run(bin,argv,opts);
  const report = JSON.parse(stdout);
  assert.equal(report.references, omega.length);
  assert.equal(report.cleared, queue.summary.clearedForPublication);
});

test("Omega strict photo readiness exits with failure until every image is rights-cleared and hash-validated", async () => {
  const [bin, argv, opts] = args("audit-omega-photography.mjs");
  const {stdout} = await run(bin,argv,opts);
  const report = JSON.parse(stdout);
  assert.equal(report.sourceBackedOmegaReferences, omega.length);
  assert.equal(report.approvedWithLocalDerivative, queue.summary.clearedForPublication);
  assert.equal(report.approvedButFileMissing, 0, "restore a missing approved derivative");
  assert.equal(report.approvedButChecksumMismatch, 0, "re-verify changed image bytes");
  assert.equal(report.outstandingImageAcquisitions, omega.length-report.approvedWithLocalDerivative);
  if (report.outstandingImageAcquisitions > 0) {
    await assert.rejects(() => run(...args("audit-omega-photography.mjs","--require-complete")),
      err => err.code === 1, "strict audit must fail while images are missing");
  } else {
    await run(...args("audit-omega-photography.mjs","--require-complete"));
  }
});
