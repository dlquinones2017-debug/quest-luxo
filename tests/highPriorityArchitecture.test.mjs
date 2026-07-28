import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = (...segments) => readFile(join(root, ...segments), "utf8");

test("all watch houses use one discoverable collection architecture", async () => {
  const [brands, registry, directory, collectionRoute, referenceRoute] =
    await Promise.all([
      source("src", "data", "brands.ts"),
      source("src", "data", "collectionRegistry.ts"),
      source("src", "components", "CollectionsDirectory.astro"),
      source(
        "src",
        "pages",
        "collections",
        "[brand]",
        "[collection]",
        "index.astro"
      ),
      source(
        "src",
        "pages",
        "collections",
        "[brand]",
        "[collection]",
        "[reference].astro"
      ),
    ]);

  const slugs = [...brands.matchAll(/slug:\s*"([^"]+)"/g)].map(
    (match) => match[1]
  );
  assert.equal(slugs.length, 22);
  assert.equal(new Set(slugs).size, 22);
  for (const slug of slugs) {
    assert.match(registry, new RegExp(`brandSlug:\\s*"${slug}"`), slug);
  }
  assert.match(directory, /brandPath\(brand\.slug\)/);
  assert.doesNotMatch(directory, /coming.soon/i);
  assert.match(collectionRoute, /<CollectionExperience/);
  assert.match(referenceRoute, /<CollectionReferenceExperience/);

  const collectionPages = await readdir(
    join(root, "src", "pages", "collections"),
    { recursive: true }
  );
  const astroPages = collectionPages
    .filter((path) => path.endsWith(".astro"))
    .sort();
  assert.deepEqual(astroPages, [
    "[brand].astro",
    join("[brand]", "[collection]", "[reference].astro"),
    join("[brand]", "[collection]", "index.astro"),
  ]);
});

test("canonical collection UX includes search, filters, sorting, references, and sourcing", async () => {
  const [experience, toolbar, grid, reference, navbar, hero] =
    await Promise.all([
      source("src", "components", "CollectionExperience.astro"),
      source("src", "components", "QuestLuxoDirectoryToolbar.astro"),
      source("src", "components", "QuestLuxoReferenceGrid.astro"),
      source("src", "components", "CollectionReferenceExperience.astro"),
      source("src", "components", "Navbar.astro"),
      source("src", "components", "Hero.astro"),
    ]);

  assert.match(experience, /QuestLuxoDirectoryToolbar/);
  assert.match(experience, /QuestLuxoReferenceGrid/);
  assert.match(experience, /PrivateSourcingCTA/);
  assert.match(toolbar, /data-directory-search/);
  assert.match(toolbar, /data-directory-filter/);
  assert.match(toolbar, /data-directory-sort/);
  assert.match(grid, /data-empty-state/);
  assert.match(reference, /width="960"/);
  assert.match(reference, /Reference illustration/);
  assert.doesNotMatch(hero, /href="\/private-sourcing"/);
  assert.doesNotMatch(hero, /href="\/market-insights"/);
  assert.match(navbar, /aria-label="Primary navigation"/);
  assert.match(navbar, /href="\/transaction-standards"/);
});
