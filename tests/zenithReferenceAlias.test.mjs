import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
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

const { getCollectionsForBrand } = await import("../src/data/collectionRegistry.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");

test("both catalog spellings of the same Zenith exact reference retain one approved genuine derivative", async () => {
  const collection = getCollectionsForBrand("zenith").find(x => x.slug === "chronomaster-sport");
  assert.ok(collection);
  const legacy = collection.assets.find(a => a.reference === "03-3100-3600-69-M3100");
  const official = collection.assets.find(a => a.reference === "03.3100.3600/69.M3100");
  assert.ok(legacy, "preserve the original manufacturer SKU route");
  assert.ok(official, "preserve the expanded manufacturer's official notation route");

  const first = approvedPhotograph(legacy,watchPhotographs);
  const second = approvedPhotograph(official,watchPhotographs);
  assert.ok(first && second, "both routes require central clearance");
  assert.equal(first.src, second.src);
  assert.equal(first.sha256, second.sha256);
  assert.equal(first.configuration.dial, "White with grey, anthracite and blue counters");
  assert.equal(second.configuration.dial, first.configuration.dial);
  assert.equal(first.configuration.bracelet, second.configuration.bracelet);
  assert.equal(first.configuration.material, second.configuration.material);
  assert.equal(first.websiteApproved, true);
  assert.equal(second.websiteApproved, true);
  assert.match(second.licenseRecord,/Founder directly confirmed website-use rights/);
  const binary = await readFile(new URL("../public"+second.src,import.meta.url));
  assert.equal(createHash("sha256").update(binary).digest("hex"),second.sha256);
  assert.equal(official.imageVerified,true);
  assert.equal(official.image,second.src);
});

test("a near-match configuration may not reuse the Zenith derivative", () => {
  const collection = getCollectionsForBrand("zenith").find(x => x.slug === "chronomaster-sport");
  const item = collection.assets.find(a => a.reference === "03.3100.3600/69.M3100");
  for(const variant of [
    {...item, configurations:[{dial:"Blue",bracelet:"Stainless-steel bracelet"}]},
    {...item, configurations:[{dial:"White with grey, anthracite and blue counters",bracelet:"Black rubber strap"}]},
    {...item, material:"18K Rose Gold"}
  ]) {
    assert.equal(approvedPhotograph(variant,watchPhotographs),undefined);
  }
});
