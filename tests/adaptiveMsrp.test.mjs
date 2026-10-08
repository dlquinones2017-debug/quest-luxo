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

test("Wave 1 applies only approved MSRP records and leaves unverified generic seeds unpriced", async () => {
  const submariner = await source("src", "data", "rolex", "submariner.ts");
  const gmtMasterII = await source("src", "data", "rolex", "gmt-master-ii.ts");
  const daytona = await source("src", "data", "rolex", "daytona.ts");
  const breitling = await source("src", "data", "breitling.ts");
  const patek = await source("src", "data", "patek-philippe.ts");
  const audemarsPiguet = await source("src", "data", "audemars-piguet.ts");

  assert.match(submariner, /reference: "124060"[\s\S]*?currentMSRP: 10050[\s\S]*?msrpEffectiveDate: null[\s\S]*?m124060-0001/);
  assert.match(gmtMasterII, /nickname: "Batman \/ Oyster"[\s\S]*?currentMSRP: 11800[\s\S]*?m126710blnr-0003/);
  assert.match(gmtMasterII, /nickname: "Batgirl \/ Jubilee"[\s\S]*?currentMSRP: 12000[\s\S]*?m126710blnr-0002/);
  assert.match(daytona, /reference: "126500LN"[\s\S]*?currentMSRP: 16900[\s\S]*?m126500ln-0001/);
  assert.match(breitling, /reference: "AB0138211B1A1"[\s\S]*?currentMSRP: 10700[\s\S]*?AB0138211B1A1/);
  assert.match(patek, /reference: "aquanaut-5167a-seed"[\s\S]*?currentMSRP: 27257[\s\S]*?5167A-001/);
  assert.doesNotMatch(audemarsPiguet, /currentMSRP:/);
});
