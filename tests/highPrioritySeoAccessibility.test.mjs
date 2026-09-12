import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = (...segments) => readFile(join(root, ...segments), "utf8");

const publicSourceFiles = async () => {
  const roots = ["components", "layouts", "pages"];
  const files = [];
  for (const directory of roots) {
    const base = join(root, "src", directory);
    const entries = await readdir(base, {
      recursive: true,
      withFileTypes: true,
    });
    for (const entry of entries) {
      if (!entry.isFile() || !/\.(astro|ts)$/.test(entry.name)) continue;
      const parent = entry.parentPath ?? entry.path;
      const file = join(parent, entry.name);
      if (file.includes(`${join("pages", "operations")}`)) continue;
      if (file.includes(`${join("components", "operations")}`)) continue;
      files.push(file);
    }
  }
  return files;
};

test("every public page inherits canonical social and institutional metadata", async () => {
  const [layout, sitemap, robots] = await Promise.all([
    source("src", "layouts", "BaseLayout.astro"),
    source("src", "pages", "sitemap.xml.ts"),
    source("src", "pages", "robots.txt.ts"),
  ]);

  for (const contract of [
    'rel="canonical"',
    'property="og:title"',
    'property="og:description"',
    'property="og:url"',
    'property="og:image"',
    'name="twitter:image"',
    '"@type": "Organization"',
    '"@type": "WebSite"',
    'type="application/ld+json"',
  ]) {
    assert.match(layout, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(sitemap, /collectionRegistry/);
  assert.match(sitemap, /referencePath/);
  assert.match(sitemap, /Content-Type": "application\/xml/);
  assert.match(robots, /Disallow: \/operations/);
  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Sitemap:/);
});

test("public colors, focus treatment, and controls meet the launch accessibility contract", async () => {
  const files = await publicSourceFiles();
  for (const file of files) {
    const contents = await readFile(file, "utf8");
    assert.doesNotMatch(
      contents,
      /(?:^|[;{\s])color\s*:\s*#d4b06a\b/im,
      `${file} uses low-contrast gold as text`
    );
    assert.doesNotMatch(
      contents,
      /(?:^|[;{\s])color\s*:\s*#(?:777|777777|6d7480)\b/im,
      `${file} uses a marginal muted-text color`
    );
  }

  const [layout, navbar, toolbar, footer] = await Promise.all([
    source("src", "layouts", "BaseLayout.astro"),
    source("src", "components", "Navbar.astro"),
    source("src", "components", "QuestLuxoDirectoryToolbar.astro"),
    source("src", "components", "Footer.astro"),
  ]);
  assert.match(layout, /prefers-reduced-motion/);
  assert.match(layout, /outline: 3px solid #8a682b/);
  assert.match(navbar, /min-height: 44px/);
  assert.match(toolbar, /min-height: 50px/);
  assert.ok((toolbar.match(/min-height: 44px/g) ?? []).length >= 2);
  assert.match(footer, /min-height: 44px/);
});

test("the production image contract prevents layout shift and oversized legacy branding", async () => {
  const [navbar, card, reference, logo] = await Promise.all([
    source("src", "components", "Navbar.astro"),
    source("src", "components", "ReferenceCard.astro"),
    source("src", "components", "CollectionReferenceExperience.astro"),
    stat(join(root, "public", "images", "quest-luxo-logo.webp")),
  ]);
  assert.ok(logo.size < 10_000, `logo is ${logo.size} bytes`);
  assert.match(navbar, /width="160"/);
  assert.match(navbar, /height="160"/);
  assert.match(navbar, /fetchpriority="high"/);
  assert.match(card, /width="960"/);
  assert.match(card, /height="960"/);
  assert.match(reference, /width="960"/);
  assert.match(reference, /height="960"/);
  await assert.rejects(
    stat(join(root, "public", "images", "quest-luxo-logo.png")),
    { code: "ENOENT" }
  );
});
