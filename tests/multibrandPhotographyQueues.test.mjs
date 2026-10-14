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
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const omega = await read("../docs/OMEGA_PHOTOGRAPHY_ACQUISITION_QUEUE_2026-10-14.json");
const other = await read("../docs/MULTIBRAND_NON_OMEGA_PHOTOGRAPHY_QUEUE_2026-10-14.json");

test("entire 99-reference expansion has exactly one correctly configured photography acquisition task", () => {
  assert.equal(omega.queue.length, 55);
  assert.equal(other.queue.length, 44);
  const all = [...omega.queue.map(x=>({
    brandSlug:x.brandSlug, collectionSlug:x.collectionSlug, reference:x.reference,
    dial:x.dial, strap:x.braceletOrStrap, material:x.material, source:x.specificationSource
  })), ...other.queue.map(x=>({
    brandSlug:x.brandSlug, collectionSlug:x.collectionSlug, reference:x.reference,
    dial:x.configuration.dial, strap:x.configuration.strapOrBracelet,
    material:x.configuration.material, source:x.identitySource
  }))];
  assert.equal(all.length, 99);
  assert.equal(new Set(all.map(x=>[x.brandSlug,x.collectionSlug,x.reference].join("/"))).size, 99);
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
  assert.equal(cleared.length, 1, "recover one existing exact-reference cleared Zenith photograph");
  assert.equal(cleared[0].reference, "03.3100.3600/69.M3100");
  assert.equal(other.summary.approvedForImageRelease, cleared.length);
  assert.equal(other.summary.tasksAwaitingExactImageRightsReview, queued.length);
  assert.equal(queued.length + cleared.length, other.queue.length);
  assert.ok(cleared.every(x=>x.webDerivativeSHA256 && x.commercialUseRightsRecord && x.rawSourceFileId));
  assert.ok(queued.every(x=>!x.webDerivativePath&&!x.commercialUseRightsRecord));
  assert.ok(other.queue.every(x=>x.identitySource.startsWith("https://")));
  assert.ok(omega.queue.every(x=>x.specificationSource.startsWith("https://")));
});
