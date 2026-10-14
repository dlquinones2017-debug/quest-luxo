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

test("all exact-reference Omega expansion profiles have an acquisition/clearance task", () => {
  assert.equal(queue.summary.references, omega.length);
  assert.equal(queue.queue.length, omega.length);
  assert.ok(omega.length >= 55);
  const all = new Map(queue.queue.map(item => [item.collectionSlug + "/" + item.reference, item]));
  assert.equal(all.size, queue.queue.length, "duplicate photography tasks");
  const collections = getCollectionsForBrand("omega");
  for (const [brand, brandSlug, collection, collectionSlug, reference, model, size, movement, dial, strap, material, source] of omega) {
    const item = all.get(collectionSlug + "/" + reference);
    assert.ok(item, "missing photography acquisition task for " + reference);
    assert.equal(item.brand, brand);
    assert.equal(item.collection, collection);
    assert.equal(item.dial, dial);
    assert.equal(item.braceletOrStrap, strap);
    assert.equal(item.material, material);
    assert.equal(item.specificationSource, source);
    assert.equal(item.evidence.status, "ACQUISITION_REQUIRED");
    assert.equal(item.evidence.websiteUseRightsVerified, false);
    assert.equal(item.evidence.exactReferenceImageReviewed, false);
    assert.equal(item.evidence.centeredWhiteBackgroundVerified, false);
    assert.equal(item.evidence.webDerivativePath, null);
    assert.equal(item.imageSourceFoundInCurrentClearanceCode, false);
    const asset = collections.find(c => c.slug === collectionSlug)?.assets.find(a => a.reference === reference);
    assert.ok(asset, reference + " must have a canonical catalog route");
    assert.equal(approvedPhotograph(asset, watchPhotographs), undefined, reference + " must not borrow a different photo");
    assert.match(referencePath(brandSlug, collectionSlug, reference), /^\/collections\//);
  }
  assert.equal(queue.summary.requiresAcquisition, omega.length);
  assert.equal(queue.summary.clearedForPublication, 0);
});

test("Omega photo audit is executable, reports true coverage, and is not a false pass gate", async () => {
  const run = promisify(execFile);
  const root = fileURLToPath(new URL("../", import.meta.url));
  const script = fileURLToPath(new URL("../scripts/audit-omega-photography.mjs", import.meta.url));
  const { stdout } = await run(process.execPath, ["--experimental-strip-types", script], { cwd: root });
  const report = JSON.parse(stdout);
  assert.equal(report.sourceBackedOmegaReferences, omega.length);
  assert.equal(report.approvedWithLocalDerivative, 0);
  assert.equal(report.outstandingImageAcquisitions, omega.length);
  assert.equal(report.approvedButFileMissing, 0);

  await assert.rejects(
    () => run(process.execPath, ["--experimental-strip-types", script, "--require-complete"], { cwd: root }),
    error => error.code === 1,
    "strict photo readiness must not pass while acquisitions remain outstanding"
  );
});
