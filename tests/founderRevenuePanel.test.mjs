import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("..",import.meta.url));
const source=(...parts)=>readFile(join(root,...parts),"utf8");

test("broker console mounts the founder revenue panel behind console auth",async()=>{
 const page=await source("src","pages","broker-console.astro");
 assert.match(page,/FounderRevenuePanel/);
 assert.match(page,/<FounderRevenuePanel hidden=\{isBrokerConsoleLocked\}/);
});

test("founder revenue panel is read only and uses authoritative endpoint",async()=>{
 const panel=await source("src","components","FounderRevenuePanel.astro");
 assert.match(panel,/fetch\("\/api\/broker\/revenue"/);
 assert.match(panel,/verifiedEstimatedRevenue/);
 assert.match(panel,/verifiedExpectedRevenue/);
 assert.match(panel,/founderActions/);
 assert.match(panel,/No verified enterprise revenue records yet\./);
 assert.doesNotMatch(panel,/method:\s*["'](?:POST|PUT|PATCH|DELETE)/);
});
