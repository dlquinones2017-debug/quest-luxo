import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";
registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (!specifier.startsWith(".")) throw error;
    for (const suffix of [".ts", "/index.ts"]) {
      try { return next(specifier + suffix, context); } catch {}
    }
    throw error;
  }
}});
const { verifiedExpansionRows } = await import("../src/data/verified-catalog-expansion.ts");
const { collectionRegistry } = await import("../src/data/collectionRegistry.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const omega = await read("../docs/OMEGA_PHOTOGRAPHY_ACQUISITION_QUEUE_2026-10-14.json");
const other = await read("../docs/MULTIBRAND_NON_OMEGA_PHOTOGRAPHY_QUEUE_2026-10-14.json");

test("entire verified reference expansion has exactly one correctly configured photography acquisition task", () => {
  assert.equal(omega.queue.length, verifiedExpansionRows.filter(row => row[1] === "omega").length);
  assert.equal(other.queue.length, verifiedExpansionRows.filter(row => row[1] !== "omega").length);
  const all = [...omega.queue.map(x=>({
    brandSlug:x.brandSlug, collectionSlug:x.collectionSlug, reference:x.reference,
    dial:x.dial, strap:x.braceletOrStrap, material:x.material, source:x.specificationSource
  })), ...other.queue.map(x=>({
    brandSlug:x.brandSlug, collectionSlug:x.collectionSlug, reference:x.reference,
    dial:x.configuration.dial, strap:x.configuration.strapOrBracelet,
    material:x.configuration.material, source:x.identitySource
  }))];
  assert.equal(all.length, verifiedExpansionRows.length);
  assert.equal(new Set(all.map(x=>[x.brandSlug,x.collectionSlug,x.reference].join("/"))).size, verifiedExpansionRows.length);
  for (const [brand,brandSlug,collection,collectionSlug,reference,model,caseSize,movement,dial,strap,material,source] of verifiedExpansionRows) {
    const task = all.find(x=>x.brandSlug===brandSlug&&x.collectionSlug===collectionSlug&&x.reference===reference);
    assert.ok(task, "No photo task: "+brand+" "+reference);
    assert.equal(task.dial,dial);
    assert.equal(task.strap,strap);
    assert.equal(task.material,material);
    assert.equal(task.source,source);
  }
  const cleared = other.queue.filter(x=>x.status==="APPROVED_WITH_VALID_DERIVATIVE");
  const queued = other.queue.filter(x=>x.status==="RIGHTS_AND_EXACT_CONFIGURATION_REVIEW_REQUIRED");
  assert.ok(cleared.some(x=>x.reference==="03.3100.3600/69.M3100"), "retain recovered exact-reference Zenith photograph");
  for (const item of other.queue) {
    const asset = collectionRegistry.find(c=>c.brandSlug===item.brandSlug&&c.slug===item.collectionSlug)?.assets.find(a=>a.reference===item.reference);
    assert.ok(asset, "missing catalog record: "+item.reference);
    const photo = approvedPhotograph(asset,watchPhotographs);
    assert.equal(item.status==="APPROVED_WITH_VALID_DERIVATIVE", Boolean(photo), "queue approval must match the exact cleared configuration: "+item.reference);
    if (photo) {
      assert.equal(item.webDerivativePath,photo.src);
      assert.equal(item.webDerivativeSHA256,photo.sha256);
      assert.equal(item.commercialUseRightsRecord,photo.licenseRecord);
    }
  }
  assert.equal(other.summary.approvedForImageRelease, cleared.length);
  assert.equal(other.summary.tasksAwaitingExactImageRightsReview, queued.length);
  assert.equal(queued.length + cleared.length, other.queue.length);
  assert.ok(cleared.every(x=>x.webDerivativeSHA256 && x.commercialUseRightsRecord && x.rawSourceFileId));
  assert.ok(queued.every(x=>!x.webDerivativePath&&!x.commercialUseRightsRecord));
  assert.ok(other.queue.every(x=>x.identitySource.startsWith("https://")));
  assert.ok(omega.queue.every(x=>x.specificationSource.startsWith("https://")));
});
