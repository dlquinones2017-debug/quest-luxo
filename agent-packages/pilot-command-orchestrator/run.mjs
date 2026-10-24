import { readFile } from "node:fs/promises";
import { runApprovedPilotCommandAgent } from "../../scripts/factory-agent-runtime.mjs";
const spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));
console.log(JSON.stringify(await runApprovedPilotCommandAgent(spec), null, 2));
