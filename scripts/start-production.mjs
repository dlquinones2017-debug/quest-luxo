import { assertProductionReadiness } from "../src/lib/leads/productionReadiness.mjs";

await assertProductionReadiness();
await import("../dist/server/entry.mjs");
