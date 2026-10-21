import { createServer } from "node:http";
import { readFile, realpath, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { commitDurablePipelines, readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { buildManualPipelineReport } from "./manual-pipeline-agent-report.mjs";
import { syntheticRecords } from "./factory-agent-runtime.mjs";

const PILOT_SERVICE = "srv-dbbkmb0n74is73d111hg";

export async function verifyPilotEnvironment(env = process.env, mountInfo) {
  if (env.RENDER_SERVICE_ID !== PILOT_SERVICE || env.QUEST_AGENT_PILOT_MODE !== "SYNTHETIC_ONLY")
    throw Error("Isolated pilot identity and explicit synthetic mode required.");
  if (env.QUEST_PIPELINE_DIRECTORY !== "/var/data/quest-agent-pilot" || !/^[a-fA-F0-9]{64}$/.test(env.QUEST_PIPELINE_KEY_HEX ?? ""))
    throw Error("Pilot-only managed key and persistent path required.");
  const mounts = mountInfo ?? await readFile("/proc/self/mountinfo", "utf8");
  if (!mounts.split("\n").some(line => line.split(" ")[4] === "/var/data")) throw Error("Persistent /var/data mount not verified.");
  if (["QUEST_ENABLE_GMAIL", "QUEST_ENABLE_CRM"].some(name => env[name] !== "false")) throw Error("Gmail and CRM must be explicitly disabled.");
  if (["OPENAI_API_KEY", "GOOGLE_APPLICATION_CREDENTIALS", "GMAIL_REFRESH_TOKEN"].some(name => env[name]))
    throw Error("Live connector credentials are not permitted in the synthetic pilot.");
  return true;
}

export async function runPersistentSyntheticPilot(directory, key) {
  const synthetic = join(directory, "synthetic");
  await mkdir(directory, { recursive: true, mode: 0o700 });
  if (await realpath(directory) !== directory) throw Error("Pilot directory ancestry must be real.");
  let snapshot = await readDurablePipelines(synthetic, key);
  let recoveredExisting = true;
  if (snapshot.revision === "EMPTY") {
    recoveredExisting = false;
    snapshot = await commitDurablePipelines(synthetic, key, "EMPTY", syntheticRecords());
  }
  // Do not silently operate on an unexpected or real-data snapshot in the synthetic namespace.
  if (snapshot.sequence !== 1 || JSON.stringify(snapshot.records) !== JSON.stringify(syntheticRecords()))
    throw Error("Synthetic snapshot conflicts with reviewed fixture; hold for operator review.");
  const report = buildManualPipelineReport(await readDurablePipelines(synthetic, key));
  if (JSON.stringify(report.divisions.map(r => [r.total, r.blocked, r.founderReview])) !== "[[1,1,0],[1,0,1]]")
    throw Error("Pilot aggregate acceptance failed.");
  return { source: "SYNTHETIC_ONLY", recoveredExisting, report, independentBackupVerified: false };
}

export async function startPilot() {
  await verifyPilotEnvironment();
  const key = Buffer.from(process.env.QUEST_PIPELINE_KEY_HEX, "hex");
  let result;
  try { result = await runPersistentSyntheticPilot(process.env.QUEST_PIPELINE_DIRECTORY, key); }
  finally { key.fill(0); }
  // Health responses expose readiness only. No report, records, keys, write endpoints or filesystem serving.
  const ready = { service: "quest-luxo-agent-pilot", mode: "SYNTHETIC_ONLY", storage: "PERSISTENT_ENCRYPTED",
    fixturePassed: true, independentBackupVerified: false, businessDataReady: false, gmail: false, crm: false };
  console.log(JSON.stringify({ event: "SYNTHETIC_PILOT_PASSED", recoveredExisting: result.recoveredExisting,
    independentBackupVerified: false, businessDataReady: false }));
  const server = createServer((req, res) => {
    res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET" || req.url !== "/healthz") { res.writeHead(404); res.end('{"error":"not_found"}'); return; }
    res.writeHead(200); res.end(JSON.stringify(ready));
  });
  server.listen(Number(process.env.PORT || 10000), "0.0.0.0");
  for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await startPilot(); }
  catch { console.error("Pilot failed closed; operator must verify isolated identity, persistent storage, key and fixture integrity."); process.exitCode = 1; }
}
