import { readFile } from "node:fs/promises";
import { runFactoryAgent } from "../../scripts/factory-agent-runtime.mjs";
const spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));
console.log(JSON.stringify(await runFactoryAgent(spec), null, 2));
