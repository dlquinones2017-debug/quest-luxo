import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = (...segments) => readFile(join(root, ...segments), "utf8");

test("adaptive MSRP schema preserves historical and verified-current fields", async () => {
  const schema = await source("src", "types", "questLuxo.ts");

  assert.match(schema, /originalMSRP\?: number \| null/);
  assert.match(schema, /currentMSRP\?: number \| null/);
  assert.match(schema, /msrpEffectiveDate\?: string \| null/);
  assert.match(schema, /msrpSource\?: string \| null/);
});

test("reference cards separate historical MSRP from verified current retail metadata", async () => {
  const card = await source("src", "components", "ReferenceCard.astro");

  assert.match(card, /Original MSRP/);
  assert.match(card, /Current MSRP/);
  assert.match(card, /Retail price requires verification/);
  assert.match(card, /MSRP effective date/);
  assert.match(card, /Official source/);
  assert.match(card, /hasVerifiedCurrentMsrp\(config\.currentMSRP\)/);
  assert.doesNotMatch(card, /currentMSRP\s*:\s*config\.originalMSRP/);
});
