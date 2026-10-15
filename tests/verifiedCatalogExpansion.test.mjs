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

test("retired tourbillon feature preserves manufacturer references and approved photography", async () => {
  const navbar = await readFile(new URL("../src/components/Navbar.astro", import.meta.url), "utf8");
  const config = await readFile(new URL("../astro.config.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(navbar, /complications\/tourbillon|>Tourbillons</);
  assert.match(config, /"\/complications\/tourbillon": \{ destination: "\/#collections", status: 301 \}/);
  assert.match(config, /"\/collections\/franck-muller\/vanguard-tourbillon\/v-45-t-br-tt": \{ destination: "\/collections\/franck-muller\/vanguard\/v-45-t-br-tt", status: 301 \}/);
  assert.ok(!collectionRegistry.some(c => c.slug === "vanguard-tourbillon"));
  const vanguard = collectionRegistry.find(c => c.brandSlug === "franck-muller" && c.slug === "vanguard");
  const watch = vanguard.assets.find(a => a.reference === "V 45 T BR (TT)");
  assert.equal(watch.model, "Vanguard Tourbillon");
  assert.equal(watch.image, "/images/watches/franck-muller/reviewed-v-45-t-br-tt-white-web.webp");
  assert.equal(watch.imageVerified, true);
  const models = verifiedExpansionAssets.filter(x => /\btourbillon\b/i.test(x.model));
  assert.ok(models.length >= 4);
  for (const asset of models) {
    assert.ok(collectionRegistry.some(c => c.assets.some(a => a.reference === asset.reference && a.model === asset.model)));
  }
});

test("founder-priority collection families are represented by source-backed references", () => {
  const keys = new Set(verifiedExpansionRows.map(row => `${row[1]}/${row[3]}`));
  for (const expected of [
    "zenith/defy-skyline", "zenith/defy-extreme", "zenith/chronomaster-sport",
    "iwc/ingenieur", "iwc/pilots-watches", "iwc/portugieser", "iwc/portofino", "iwc/aquatimer",
    "omega/dark-side-of-the-moon", "omega/seamaster", "omega/seamaster-300", "omega/planet-ocean",
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
