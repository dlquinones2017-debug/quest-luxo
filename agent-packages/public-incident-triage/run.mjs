import { readFile } from "node:fs/promises";
import { runApprovedPublicIncidentAgent } from "../../scripts/factory-agent-runtime.mjs";
const spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));
console.log(JSON.stringify(await runApprovedPublicIncidentAgent(spec), null, 2));
