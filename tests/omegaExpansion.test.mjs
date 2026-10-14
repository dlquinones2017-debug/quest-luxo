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
}});
const { verifiedExpansionRows, verifiedExpansionAssets } = await import("../src/data/verified-catalog-expansion.ts");
const { collectionRegistry, getCollectionsForBrand } = await import("../src/data/collectionRegistry.ts");
const { getReferenceFilterTags, omegaDirectoryFilters } = await import("../src/lib/catalog/referenceFacets.ts");

test("Omega expansion includes color, Sedna Gold, rubber, wave/non-wave and GMT variants", () => {
  const omega = verifiedExpansionRows.filter(row => row[1] === "omega");
  assert.ok(omega.length >= 50, "expect substantive Omega exact-reference coverage");
  const collections = new Set(omega.map(row => row[3]));
  for (const collection of ["seamaster-diver-300m","speedmaster","dark-side-of-the-moon","aqua-terra","aqua-terra-worldtimer","planet-ocean-gmt","constellation","de-ville-prestige"]) {
    assert.ok(collections.has(collection), "Omega collection missing: " + collection);
  }

  const omegaAssets = verifiedExpansionAssets.filter(a => a.brand === "Omega");
  const available = new Set(omegaAssets.flatMap(asset => getReferenceFilterTags(asset)));
  for (const filter of omegaDirectoryFilters) {
    assert.ok(available.has(filter.value), "Omega filter has no source-backed candidate: " + filter.value);
  }

  const cases = [
    ["210.30.42.20.10.001", ["green", "wave-dial"], ["rubber-strap", "non-wave-dial"]],
    ["210.32.42.20.10.001", ["green", "wave-dial", "rubber-strap"], ["non-wave-dial"]],
    ["210.32.42.20.06.002", ["gray", "non-wave-dial", "rubber-strap"], ["wave-dial"]],
    ["210.62.42.20.03.001", ["sedna-gold", "precious-metal", "rubber-strap", "blue", "wave-dial"], []],
    ["220.12.43.22.03.001", ["blue", "gmt", "rubber-strap", "non-wave-dial"], ["wave-dial"]],
    ["215.30.44.22.01.001", ["gmt"], []],
    ["310.32.42.50.04.002", ["white", "rubber-strap", "non-wave-dial"], ["wave-dial"]],
    ["131.10.28.60.60.002", ["other-colors", "non-wave-dial"], ["wave-dial", "rubber-strap"]],
    ["131.23.41.21.03.001", ["blue", "sedna-gold", "precious-metal", "two-tone", "non-wave-dial"], ["rubber-strap"]],
    ["434.13.41.20.10.001", ["green", "non-wave-dial"], ["wave-dial", "rubber-strap"]],
  ];
  for (const [ref, includes, excludes] of cases) {
    const asset = omegaAssets.find(a => a.reference === ref);
    assert.ok(asset, "missing exact configuration " + ref);
    const tags = new Set(getReferenceFilterTags(asset));
    for (const key of includes) assert.ok(tags.has(key), ref + " must include " + key);
    for (const key of excludes) assert.ok(!tags.has(key), ref + " must not include " + key);
  }

  const omegaRoutes = getCollectionsForBrand("omega");
  for (const asset of omegaAssets) {
    assert.ok(omegaRoutes.some(c => c.assets.some(a => a.reference === asset.reference)), "Omega reference absent from routes: " + asset.reference);
    assert.ok(asset.specificationSources?.[0]?.url.startsWith("https://"));
    assert.equal(asset.imageVerified, undefined, "photography requires independent rights clearance");
    assert.equal(asset.configurations?.[0]?.originalMSRP, null, "no invented MSRP");
    assert.equal(asset.configurations?.[0]?.currentMSRP, null, "no invented MSRP");
  }
  assert.ok(collectionRegistry.length > 0);
});

test("facets never invent unspecified watch properties or misread movement decoration", () => {
  const undecorated = {
    reference: "T1", model: "Three Hand", material: "Steel",
    configurations: [{ dial: "Gray sunburst", movement: "Geneva waves in arabesque", bracelet: "Stainless steel" }]
  };
  const tags = getReferenceFilterTags(undecorated);
  assert.ok(tags.includes("gray"));
  assert.ok(!tags.includes("wave-dial"), "movement Geneva waves do not indicate a dial pattern");
  assert.ok(!tags.includes("non-wave-dial"), "no negative inference from omitted pattern");
  assert.ok(!tags.includes("rubber-strap"));
  assert.ok(!tags.includes("gmt"));
  assert.ok(!tags.includes("sedna-gold"));

  const multi = getReferenceFilterTags({
    reference:"T2",model:"Worldtimer",material:"Stainless Steel and 18K Sedna Gold",
    configurations:[{ dial:"Blue non-wave", bracelet:"Blue rubber strap" }]
  });
  assert.ok(multi.includes("two-tone"));
  assert.ok(multi.includes("sedna-gold"));
  assert.ok(multi.includes("gmt"));
  assert.ok(multi.includes("non-wave-dial"));
  assert.ok(!multi.includes("wave-dial"));
});

test("Omega filters are wired through the shared live directory, not a parallel site", async () => {
  const { readFile } = await import("node:fs/promises");
  const [experience, grid, toolbar] = await Promise.all([
    readFile(new URL("../src/components/CollectionExperience.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/components/QuestLuxoReferenceGrid.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/components/QuestLuxoDirectoryToolbar.astro", import.meta.url), "utf8"),
  ]);
  assert.match(experience, /collection\.brandSlug === "omega" \? \[\.\.\.omegaDirectoryFilters\]/);
  assert.match(grid, /getReferenceFilterTags\(asset\)\.join\(" "\)/);
  assert.match(grid, /data-directory-filter/);
  assert.match(grid, /activeFilter === "all" \|\| tags\.includes\(activeFilter\)/);
  assert.match(toolbar, /data-directory-filter/);
  assert.match(experience, /QuestLuxoReferenceGrid/);
});
