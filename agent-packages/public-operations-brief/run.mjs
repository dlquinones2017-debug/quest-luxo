import { readFile } from "node:fs/promises";
import { runApprovedPublicOperationsAgent } from "../../scripts/factory-agent-runtime.mjs";
const spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));
console.log(JSON.stringify(await runApprovedPublicOperationsAgent(spec), null, 2));
