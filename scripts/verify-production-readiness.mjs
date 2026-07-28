import { verifyProductionReadiness } from "../src/lib/leads/productionReadiness.mjs";

const result = await verifyProductionReadiness();
console.log(JSON.stringify(result, null, 2));
if (!result.healthy) process.exitCode = 1;
