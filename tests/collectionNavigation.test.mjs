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

const assertMetadata = (html, route) => {
  for (const contract of [
    /<meta name="description" content="[^"]+"/,
    /<link rel="canonical" href="https?:\/\/[^"]+"/,
    /<meta property="og:title" content="[^"]+"/,
    /<meta property="og:description" content="[^"]+"/,
    /<meta property="og:url" content="https?:\/\/[^"]+"/,
    /<meta property="og:image" content="https?:\/\/[^"]+"/,
    /<meta name="twitter:image" content="https?:\/\/[^"]+"/,
  ]) {
    assert.match(html, contract, `${route} metadata contract`);
  }
};

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
    "node --experimental-strip-types scripts/start-production.mjs"
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
  const serverEntry = join(repositoryRoot, "dist", "server", "entry.mjs");
  const child = spawn(
    process.execPath,
    [serverEntry],
    {
      cwd: repositoryRoot,
      stdio: "ignore",
      windowsHide: true,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: String(port),
      },
    }
  );

  t.after(() => {
    if (!child.killed) child.kill();
  });

  const origin = `http://127.0.0.1:${port}`;
  await waitForServer(origin);
  const renderedPages = new Map();
  const discoveredRoutes = new Set(["/"]);

  for (const brandSlug of brandSlugs) {
    const brandRoute = `/collections/${brandSlug}`;
    const brandResponse = await fetch(`${origin}${brandRoute}`);
    const brandHtml = await brandResponse.text();
    renderedPages.set(brandRoute, brandHtml);
    discoveredRoutes.add(brandRoute);
    assert.equal(brandResponse.status, 200, brandRoute);
    assertMetadata(brandHtml, brandRoute);

    const collectionLinks = [
      ...brandHtml.matchAll(
        new RegExp(`href="(${escapeRegExp(brandRoute)}/[^"]+)"`, "g")
      ),
    ].map((match) => match[1]);
    if (!collectionLinks.length) continue;

    for (const collectionRoute of new Set(collectionLinks)) {
      const collectionResponse = await fetch(`${origin}${collectionRoute}`);
      const collectionHtml = await collectionResponse.text();
      renderedPages.set(collectionRoute, collectionHtml);
      discoveredRoutes.add(collectionRoute);
      assert.equal(collectionResponse.status, 200, collectionRoute);

      const referenceLinks = [
        ...collectionHtml.matchAll(
          new RegExp(`href="(${escapeRegExp(collectionRoute)}/[^"]+)"`, "g")
        ),
      ].map((match) => match[1]);
      if (!referenceLinks.length) continue;

      for (const referenceRoute of new Set(referenceLinks)) {
        assert.equal(
          referenceRoute,
          referenceRoute.toLowerCase(),
          `${referenceRoute} is canonical lowercase`
        );
        const referenceResponse = await fetch(`${origin}${referenceRoute}`);
        const referenceHtml = await referenceResponse.text();
        renderedPages.set(referenceRoute, referenceHtml);
        discoveredRoutes.add(referenceRoute);
        assert.equal(referenceResponse.status, 200, referenceRoute);
      }
    }
  }

  const homeResponse = await fetch(origin);
  const homeHtml = await homeResponse.text();
  renderedPages.set("/", homeHtml);
  assertMetadata(homeHtml, "/");
  const homeBrandLinks = [
    ...homeHtml.matchAll(/href="(\/collections\/[^"]+)"/g),
  ].map((match) => match[1]);
  assert.ok(homeBrandLinks.length > 0, "home links to the collections directory");

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
  renderedPages.set("/contact?collection=Rolex%20Daytona", contactHtml);
  discoveredRoutes.add("/contact");
  assert.equal(contactResponse.status, 200);
  assert.match(contactHtml, /<title>Begin Your Quest \| Quest Luxo<\/title>/);
  assert.match(contactHtml, /data-contact-intro/);
  assert.match(contactHtml, /data-contact-link/);

  const privateSourcingResponse = await fetch(`${origin}/private-sourcing`, {
    redirect: "manual",
  });
  assert.ok([301, 302, 307, 308].includes(privateSourcingResponse.status));
  assert.equal(privateSourcingResponse.headers.get("location"), "/contact");

  for (const [legacyRoute, target] of [
    ["/services", "/#services"],
    ["/market-insights", "/#collections"],
  ]) {
    const response = await fetch(`${origin}${legacyRoute}`, {
      redirect: "manual",
    });
    assert.ok(
      [301, 302, 307, 308].includes(response.status),
      `${legacyRoute} returns a redirect`
    );
    assert.equal(response.headers.get("location"), target, legacyRoute);
  }

  const missingResponse = await fetch(
    `${origin}/collections/not-a-watch-house`
  );
  const missingHtml = await missingResponse.text();
  assert.equal(missingResponse.status, 404);
  assert.match(missingHtml, /ROUTE NOT FOUND/);

  const robotsResponse = await fetch(`${origin}/robots.txt`);
  const robots = await robotsResponse.text();
  assert.equal(robotsResponse.status, 200);
  assert.match(
    robotsResponse.headers.get("content-type") ?? "",
    /text\/plain/
  );
  assert.match(robots, /Disallow: \/api\//);

  const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
  const sitemap = await sitemapResponse.text();
  assert.equal(sitemapResponse.status, 200);
  assert.match(
    sitemapResponse.headers.get("content-type") ?? "",
    /application\/xml/
  );

  const internalLinks = new Set();
  for (const html of renderedPages.values()) {
    for (const match of html.matchAll(/href="([^"]+)"/g)) {
      const href = match[1].replaceAll("&amp;", "&");
      if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) {
        continue;
      }
      internalLinks.add(href.split("#")[0]);
    }
  }
  for (const href of internalLinks) {
    const response = await fetch(`${origin}${href}`);
    assert.ok(response.status < 400, `${href} resolves without an error`);
  }

  for (const brokerRoute of [
    "/broker",
    "/broker-console",
    "/broker?key=legacy-access-key",
  ]) {
    const response = await fetch(`${origin}${brokerRoute}`);
    assert.equal(
      response.status,
      200,
      `${brokerRoute} remains an available Broker Console route`
    );
  }
});
