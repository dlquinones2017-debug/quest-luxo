import { readFile } from "node:fs/promises";
import { runApprovedPilotRecoveryAgent } from "../../scripts/factory-agent-runtime.mjs";
const spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));
console.log(JSON.stringify(await runApprovedPilotRecoveryAgent(spec), null, 2));
