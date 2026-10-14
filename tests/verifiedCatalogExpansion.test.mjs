import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import { readFile } from "node:fs/promises";
registerHooks({ resolve(specifier, context, next) {
  try { return next(specifier, context); } catch (error) {
    if (!specifier.startsWith(".")) throw error;
    for (const suffix of [".ts", "/index.ts"]) {
      try { return next(specifier + suffix, context); } catch {}
    }
    throw error;
  }
}});
const { verifiedExpansionRows, verifiedExpansionAssets } = await import("../src/data/verified-catalog-expansion.ts");
const { collectionRegistry } = await import("../src/data/collectionRegistry.ts");
const { referencePath } = await import("../src/lib/routes/collectionRoutes.ts");

test("verified multi-brand expansion has unique source-backed exact-reference identities", () => {
  assert.ok(verifiedExpansionRows.length >= 40);
  assert.equal(verifiedExpansionRows.length, verifiedExpansionAssets.length);
  const keys = verifiedExpansionRows.map(row => [row[1],row[3],row[4]].join("/"));
  assert.equal(new Set(keys).size, keys.length, "no duplicate reference keys");
  assert.ok(new Set(verifiedExpansionRows.map(row => row[0])).size >= 10);
  for (const [index, row] of verifiedExpansionRows.entries()) {
    const [brand, brandSlug, collection, collectionSlug, reference, model] = row;
    const asset = verifiedExpansionAssets[index];
    assert.equal(asset.reference, reference);
    assert.ok(brand && brandSlug && collection && collectionSlug && reference && model);
    assert.ok(asset.specificationSources?.[0]?.url.startsWith("https://"));
    assert.equal(asset.imageVerified, undefined, "no implied photograph approval");
    assert.equal(asset.configurations[0].currentMSRP, null, "do not fabricate MSRP");
    assert.match(referencePath(brandSlug,collectionSlug,reference), /^\/collections\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/);
    const destination = collectionRegistry.find(c => c.brandSlug === brandSlug && c.slug === collectionSlug);
    assert.ok(destination, `missing collection: ${brandSlug}/${collectionSlug}`);
    assert.ok(destination.assets.some(candidate => candidate.reference === reference), `reference missing from route: ${reference}`);
  }
  const routeKeys = collectionRegistry.map(c => `${c.brandSlug}/${c.slug}`);
  assert.equal(new Set(routeKeys).size, routeKeys.length, "no duplicate collection paths");
});

test("tourbillon discovery is explicit, not based on skeleton styling alone", async () => {
  const source = await readFile(new URL("../src/pages/complications/tourbillon.astro", import.meta.url), "utf8");
  const navbar = await readFile(new URL("../src/components/Navbar.astro", import.meta.url), "utf8");
  assert.match(source, /tourbillon.*asset\.model/i);
  assert.match(source, /referencePath/);
  assert.match(source, /PrivateSourcingCTA/);
  assert.match(navbar, /href="\/complications\/tourbillon"/);
  const models = verifiedExpansionAssets.filter(x => /\btourbillon\b/i.test(x.model));
  assert.ok(models.length >= 4, "several manufacturer-sourced tourbillons must be represented");
});

test("founder-priority collection families are represented by source-backed references", () => {
  const keys = new Set(verifiedExpansionRows.map(row => `${row[1]}/${row[3]}`));
  for (const expected of [
    "zenith/defy-skyline", "zenith/defy-extreme", "zenith/chronomaster-sport",
    "iwc/ingenieur", "iwc/pilots-watches", "iwc/portugieser", "iwc/portofino", "iwc/aquatimer",
    "omega/dark-side-of-the-moon", "omega/seamaster-diver-300m", "omega/seamaster-300", "omega/seamaster-planet-ocean",
    "breitling/navitimer", "breitling/superocean-heritage", "breitling/avenger", "breitling/avenger-ii", "breitling/colt",
    "hublot/classic-fusion", "hublot/big-bang",
    "panerai/submersible", "panerai/luminor-gmt", "panerai/radiomir-gmt",
    "cartier/roadster", "bell-and-ross/br-01",
    "richard-mille/rm-27", "tag-heuer/carrera", "tag-heuer/monaco",
    "franck-muller/fr2nck-vanguard-beach", "franck-muller/vanguard-smurfette",
    "franck-muller/bamford-collaborations", "franck-muller/vanguard-encrypto"
  ]) {
    assert.ok(keys.has(expected), `founder priority missing: ${expected}`);
  }
  for (const reference of [
    "M79360N-0024", "M79360N-0019"
  ]) {
    assert.ok(collectionRegistry.some(c => c.assets.some(a => a.reference === reference)));
  }
});
