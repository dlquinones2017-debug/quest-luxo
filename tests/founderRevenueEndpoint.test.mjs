import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root=fileURLToPath(new URL("..",import.meta.url));
const endpoint=()=>readFile(join(root,"src","pages","api","broker","revenue.astro"),"utf8");

test("founder revenue endpoint is authenticated and read only",async()=>{
 const source=await endpoint();
 assert.match(source,/validateBrokerConsoleAccess\(Astro\.request\)/);
 assert.match(source,/createBrokerAuthJsonResponse\(brokerAuth\)/);
 assert.match(source,/founderRevenueReadModel\(\)/);
 assert.match(source,/Content-Type.*application\/json/);
 assert.doesNotMatch(source,/export const (POST|PUT|PATCH|DELETE)/);
});

test("founder revenue endpoint fails closed without fabricating state",async()=>{
 const source=await endpoint();
 assert.match(source,/status=500/);
 assert.match(source,/Unable to read founder revenue state\./);
 assert.doesNotMatch(source,/success:true/);
});
