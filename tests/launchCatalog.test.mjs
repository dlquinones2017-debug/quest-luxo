import assert from "node:assert/strict";
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
const { launchCatalogCollections } = await import("../src/data/launch-catalog.ts");
const { referencePath } = await import("../src/lib/routes/collectionRoutes.ts");

test("all approved launch collections have a unique populated catalog route", () => {
  const expected = [
    "patek-philippe/aquanaut", "tudor/pelagos", "breitling/superocean",
    "hublot/classic-fusion", "hublot/aerofusion", "hublot/big-bang-unico", "hublot/spirit-of-big-bang",
    "vacheron-constantin/historiques", "vacheron-constantin/traditionnelle", "vacheron-constantin/american-1921",
    "franck-muller/rabbit", "franck-muller/crazy-hours", "franck-muller/yachting",
    "jaeger-lecoultre/master-control", "jaeger-lecoultre/master-grande-tradition",
  ];
  assert.deepEqual(launchCatalogCollections.map(c => `${c.brandSlug}/${c.slug}`), expected);
  const paths = collectionRegistry.map(c => `${c.brandSlug}/${c.slug}`);
  assert.equal(new Set(paths).size, paths.length, "collection routes must not collide");
  for (const path of expected) {
    assert.equal(paths.filter(p => p === path).length, 1);
    assert.ok(collectionRegistry.find(c => `${c.brandSlug}/${c.slug}` === path)?.assets.length);
  }
});

test("launch reference facts have sources without invented scores, prices or availability", () => {
  for (const collection of launchCatalogCollections) {
    for (const asset of collection.assets) {
      assert.ok(asset.specificationSources?.every(source => source.url.startsWith("https://")));
      assert.equal(asset.specificationsReviewedAt, asset.reference === "8880CHACLB" ? "2026-10-13" : "2026-10-12");
      assert.equal(asset.intelligence, undefined);
      assert.equal(asset.productionStatus, "Availability not confirmed");
      assert.equal(asset.imageVerified, undefined);
      assert.ok(asset.configurations.every(config => config.originalMSRP === null && config.currentMSRP === null));
      assert.match(referencePath(collection.brandSlug, collection.slug, asset.reference), /^\/collections\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/);
    }
  }
  assert.equal(launchCatalogCollections.find(s => s.name === "Master Control").assets[0].reference, "Q4018421");
  assert.equal(launchCatalogCollections.find(s => s.name === "American 1921").assets[0].reference, "82035/000R-H114");
  assert.equal(launchCatalogCollections.find(s => s.name === "Rabbit").assets[0].reference, "V 41 SC DT FR2 GFGRNR (NR)");
});
