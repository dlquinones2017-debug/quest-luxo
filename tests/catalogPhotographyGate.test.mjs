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
} });

const { collectionRegistry } = await import("../src/data/collectionRegistry.ts");
const { watchPhotographs } = await import("../src/data/watch-photography.ts");
const { approvedPhotograph } = await import("../src/lib/media/watchPhotography.ts");

test("every visible catalog image has a matching, licensed and approved provenance record", () => {
  for (const collection of collectionRegistry) {
    for (const asset of collection.assets) {
      const approval = approvedPhotograph(asset, watchPhotographs);
      if (asset.imageVerified) {
        assert.ok(approval, `Unauthorized photograph: ${collection.brandSlug}/${collection.slug}/${asset.reference}`);
        assert.equal(asset.image, approval.src);
        assert.equal(approval.websiteApproved, true);
        assert.equal(approval.exactConfigurationVerified, true);
        assert.equal(approval.background, "white");
        assert.ok(approval.usageConditionsSatisfied);
      } else {
        assert.equal(asset.image, "/images/watch-reference-placeholder.svg", "unapproved imagery must not be shown");
      }
    }
  }
});

test("catalog image approval may not be inferred from the source asset imageVerified field", async () => {
  const source = await readFile(new URL("../src/data/collectionRegistry.ts", import.meta.url), "utf8");
  assert.match(source, /const verifiedImage = approved\?\.src;/);
  assert.doesNotMatch(source, /asset\.image && asset\.imageVerified/);
});
