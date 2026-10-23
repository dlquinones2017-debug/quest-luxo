import { readFile } from "node:fs/promises";
import { generateAgentPackage, loadFactoryRoster } from "../src/lib/agents/agentFactory.ts";
try {
  const [action, specPath] = process.argv.slice(2);
  if (action === "teams" && !specPath) {
    const { loadConsolidatedWorkforce } = await import("../src/lib/agents/workforceOperatingModel.ts");
    console.log(JSON.stringify(await loadConsolidatedWorkforce(), null, 2));
  }
  else if (action === "roster" && !specPath) console.log(JSON.stringify(await loadFactoryRoster(), null, 2));
  else if (action === "generate" && specPath && process.argv.length === 4)
    console.log(JSON.stringify(await generateAgentPackage(JSON.parse(await readFile(specPath, "utf8"))), null, 2));
  else throw Error("Usage: agent-factory.mjs teams | roster | generate SPEC.json");
} catch (error) { console.error(error instanceof Error ? error.message : "Factory held for operator review."); process.exitCode = 1; }
