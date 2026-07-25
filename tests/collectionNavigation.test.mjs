import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const execFileAsync = promisify(execFile);
const packageJson = JSON.parse(
  await readFile(join(repositoryRoot, "package.json"), "utf8")
);

const brandSlugs = [
  "rolex",
  "patek-philippe",
  "audemars-piguet",
  "richard-mille",
  "vacheron-constantin",
  "fp-journe",
  "hublot",
  "cartier",
  "omega",
  "tudor",
  "panerai",
  "breitling",
  "iwc",
  "blancpain",
  "jaeger-lecoultre",
  "ulysse-nardin",
  "franck-muller",
  "bell-and-ross",
  "a-lange-and-sohne",
  "breguet",
  "girard-perregaux",
  "zenith",
];

const getAvailablePort = () =>
  new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close((error) => {
        if (error) reject(error);
        else resolve(address.port);
      });
    });
  });

const waitForServer = async (url, attempts = 50) => {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError ?? new Error(`Server did not become ready at ${url}`);
};

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("collection routes are registry-driven and inherit one shared implementation", async () => {
  const collectionRoute = await readFile(
    join(
      repositoryRoot,
      "src",
      "pages",
      "collections",
      "[brand]",
      "[collection]",
      "index.astro"
    ),
    "utf8"
  );
  const referenceRoute = await readFile(
    join(
      repositoryRoot,
      "src",
      "pages",
      "collections",
      "[brand]",
      "[collection]",
      "[reference].astro"
    ),
    "utf8"
  );
  const sharedExperience = await readFile(
    join(repositoryRoot, "src", "components", "CollectionExperience.astro"),
    "utf8"
  );
  const routeHelpers = await readFile(
    join(repositoryRoot, "src", "lib", "routes", "collectionRoutes.ts"),
    "utf8"
  );

  assert.match(collectionRoute, /collectionRegistry\.map/);
  assert.match(collectionRoute, /<CollectionExperience collection=\{collection\}/);
  assert.match(referenceRoute, /collectionRegistry\.flatMap/);
  assert.match(referenceRoute, /referenceRouteParam\(asset\.reference\)/);
  assert.match(sharedExperience, /data-collection-experience/);
  assert.match(sharedExperience, /QuestLuxoDirectoryToolbar/);
  assert.match(sharedExperience, /QuestLuxoReferenceGrid/);
  assert.match(routeHelpers, /toLowerCase\(\)/);
});

test("production navigation resolves every collection, reference, brand, and lead route", async (t) => {
  assert.equal(
    packageJson.scripts["start:production"],
    "serve dist -l tcp://0.0.0.0:$PORT"
  );

  await execFileAsync(
    process.execPath,
    [join(repositoryRoot, "node_modules", "astro", "bin", "astro.mjs"), "build"],
    {
      cwd: repositoryRoot,
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
    }
  );

  const port = await getAvailablePort();
  const serveCli = join(repositoryRoot, "node_modules", "serve", "build", "main.js");
  const child = spawn(
    process.execPath,
    [serveCli, "dist", "-l", `tcp://127.0.0.1:${port}`],
    {
      cwd: repositoryRoot,
      stdio: "ignore",
      windowsHide: true,
    }
  );

  t.after(() => {
    if (!child.killed) child.kill();
  });

  const origin = `http://127.0.0.1:${port}`;
  await waitForServer(origin);

  for (const brandSlug of brandSlugs) {
    const brandRoute = `/collections/${brandSlug}`;
    const brandResponse = await fetch(`${origin}${brandRoute}`);
    const brandHtml = await brandResponse.text();
    assert.equal(brandResponse.status, 200, brandRoute);
    assert.match(brandHtml, /data-brand-directory/, brandRoute);
    assert.match(brandHtml, /rel="canonical"/, brandRoute);
    assert.match(brandHtml, /application\/ld\+json/, brandRoute);

    const collectionLinks = [
      ...brandHtml.matchAll(
        new RegExp(`href="(${escapeRegExp(brandRoute)}/[^"]+)"`, "g")
      ),
    ].map((match) => match[1]);
    assert.ok(
      collectionLinks.length > 0,
      `${brandRoute} has at least one migrated collection`
    );

    for (const collectionRoute of new Set(collectionLinks)) {
      const collectionResponse = await fetch(`${origin}${collectionRoute}`);
      const collectionHtml = await collectionResponse.text();
      assert.equal(collectionResponse.status, 200, collectionRoute);
      assert.match(collectionHtml, /data-collection-experience/, collectionRoute);
      assert.match(collectionHtml, /data-directory-search/, collectionRoute);
      assert.match(collectionHtml, /data-directory-filter="all"/, collectionRoute);
      assert.match(collectionHtml, /data-directory-sort/, collectionRoute);
      assert.match(collectionHtml, /data-analytics-event="begin_quest"/, collectionRoute);
      assert.match(collectionHtml, /rel="canonical"/, collectionRoute);
      assert.match(collectionHtml, /application\/ld\+json/, collectionRoute);

      const referenceLinks = [
        ...collectionHtml.matchAll(
          new RegExp(`href="(${escapeRegExp(collectionRoute)}/[^"]+)"`, "g")
        ),
      ].map((match) => match[1]);
      assert.ok(
        referenceLinks.length > 0,
        `${collectionRoute} renders reference links`
      );

      for (const referenceRoute of new Set(referenceLinks)) {
        assert.equal(
          referenceRoute,
          referenceRoute.toLowerCase(),
          `${referenceRoute} is canonical lowercase`
        );
        const referenceResponse = await fetch(`${origin}${referenceRoute}`);
        const referenceHtml = await referenceResponse.text();
        assert.equal(referenceResponse.status, 200, referenceRoute);
        assert.match(referenceHtml, /data-reference-experience/, referenceRoute);
        assert.match(referenceHtml, /data-analytics-event="begin_quest"/, referenceRoute);
        assert.match(referenceHtml, /rel="canonical"/, referenceRoute);
        assert.match(referenceHtml, /application\/ld\+json/, referenceRoute);
        assert.match(
          referenceHtml,
          /\/images\/watch-reference-placeholder\.svg/,
          referenceRoute
        );
      }
    }
  }

  const homeResponse = await fetch(origin);
  const homeHtml = await homeResponse.text();
  const homeBrandLinks = [
    ...homeHtml.matchAll(/href="(\/collections\/[^"]+)"/g),
  ].map((match) => match[1]);
  assert.equal(new Set(homeBrandLinks).size, brandSlugs.length);

  for (const route of new Set(homeBrandLinks)) {
    const response = await fetch(`${origin}${route}`);
    assert.equal(response.status, 200, route);
  }

  const placeholderResponse = await fetch(
    `${origin}/images/watch-reference-placeholder.svg`
  );
  assert.equal(placeholderResponse.status, 200);
  assert.match(
    placeholderResponse.headers.get("content-type") ?? "",
    /image\/svg\+xml/
  );

  const contactResponse = await fetch(
    `${origin}/contact?collection=Rolex%20Daytona`
  );
  const contactHtml = await contactResponse.text();
  assert.equal(contactResponse.status, 200);
  assert.match(contactHtml, /<title>Begin Your Quest \| Quest Luxo<\/title>/);
  assert.match(contactHtml, /data-contact-intro/);
  assert.match(contactHtml, /data-contact-link/);

  const privateSourcingResponse = await fetch(`${origin}/private-sourcing`);
  const privateSourcingHtml = await privateSourcingResponse.text();
  assert.equal(privateSourcingResponse.status, 200);
  assert.match(privateSourcingHtml, /url=\/contact/);
  assert.match(
    privateSourcingHtml,
    /rel="canonical" href="https:\/\/quest-luxo-production\.onrender\.com\/contact"/
  );

  for (const [legacyRoute, target] of [
    ["/services", "/#services"],
    ["/market-insights", "/#collections"],
  ]) {
    const response = await fetch(`${origin}${legacyRoute}`);
    const html = await response.text();
    assert.equal(response.status, 200, legacyRoute);
    assert.match(html, new RegExp(`url=${escapeRegExp(target)}`), legacyRoute);
  }

  const missingResponse = await fetch(
    `${origin}/collections/not-a-watch-house`
  );
  const missingHtml = await missingResponse.text();
  assert.equal(missingResponse.status, 404);
  assert.match(missingHtml, /ROUTE NOT FOUND/);
});
