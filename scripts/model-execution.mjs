import { readFile } from "node:fs/promises";
import { assessModelExecutionPolicy, assertModelExecutionAllowed } from "../src/lib/agents/modelExecutionPolicy.ts";

// Deliberately no provider SDK, network transport, .env loader or credential access.
try {
  const policy = JSON.parse(await readFile(new URL("../config/agents/model-execution-policy.json", import.meta.url), "utf8"));
  if (process.argv.length !== 3 || !["status", "run"].includes(process.argv[2])) throw Error("Usage: model-execution.mjs status|run");
  if (process.argv[2] === "run") assertModelExecutionAllowed(policy);
  console.log(JSON.stringify(assessModelExecutionPolicy(policy)));
} catch {
  console.error("Model execution held. Paid API usage remains unauthorized.");
  process.exitCode = 2;
}
