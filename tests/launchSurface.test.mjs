import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createHealthPayload } from "../src/lib/config/healthResponse.ts";

const readRepositoryFile = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const ready = Object.freeze({
  healthy: true,
  productionMode: true,
  requiredConfigurationPresent: true,
  storageProviderConfigured: true,
  storageDirectoryConfigured: true,
  storageWritable: true,
  notificationProviderConfigured: true,
  brokerConsoleProtected: true,
  issues: Object.freeze([]),
});

test("health payload exposes launch-critical checks without secrets or paths", () => {
  const payload = createHealthPayload(ready);

  assert.deepEqual(payload, {
    status: "ok",
    service: "quest-luxo",
    checks: {
      productionMode: true,
      configuration: true,
      storage: true,
      notifications: true,
      brokerConsole: true,
    },
  });
  assert.doesNotMatch(JSON.stringify(payload), /key|directory|recipient|email/i);
});

test("health payload fails closed when any production readiness gate fails", () => {
  const payload = createHealthPayload({
    ...ready,
    healthy: false,
    storageWritable: false,
    issues: Object.freeze(["LEAD_STORAGE_WRITABLE"]),
  });

  assert.equal(payload.status, "unavailable");
  assert.equal(payload.checks.storage, false);
});

test("developer playground is absent from the production route tree", async () => {
  await assert.rejects(
    readRepositoryFile("src/pages/dev/ask-quest-luxo.astro"),
    { code: "ENOENT" }
  );
});

test("launch navigation uses only canonical public destinations", async () => {
  const navbar = await readRepositoryFile("src/components/Navbar.astro");
  const hero = await readRepositoryFile("src/components/Hero.astro");

  for (const retiredPath of ["/brands", "/private-sourcing", "/market-insights", "/contact"]) {
    assert.doesNotMatch(`${navbar}\n${hero}`, new RegExp(`href=[{\"]${retiredPath}`));
  }
  assert.match(navbar, /href="\/collections"/);
  assert.match(hero, /buildBeginYourQuestUrl/);
});

test("robots policy keeps internal and mutation surfaces out of discovery", async () => {
  const robots = await readRepositoryFile("public/robots.txt");

  assert.match(robots, /Disallow: \/api\//);
  assert.match(robots, /Disallow: \/broker/);
  assert.match(robots, /Disallow: \/dev\//);
});

test("Bell & Ross launch data keeps Black Matte distinct from Black Steel", async () => {
  const data = await readRepositoryFile("src/data/bell-and-ross.ts");
  const brandRoute = await readRepositoryFile("src/pages/collections/bell-and-ross.astro");
  const collectionRoute = await readRepositoryFile("src/pages/collections/bell-and-ross/[collection]/index.astro");

  assert.match(data, /BR0192-BL-ST/);
  assert.match(data, /BR0392-BL-CE/);
  assert.match(data, /Matte black ceramic/);
  assert.doesNotMatch(data, /BR0392-BLC-ST/);
  assert.match(brandRoute, /BR 01/);
  assert.match(brandRoute, /BR 03/);
  assert.match(collectionRoute, /showMissingImagePlaceholder=\{true\}/);
});
