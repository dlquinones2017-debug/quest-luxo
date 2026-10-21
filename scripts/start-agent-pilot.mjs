import { createServer } from "node:http";
import { readFile, realpath, mkdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { commitDurablePipelines, readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { syntheticRecords } from "./factory-agent-runtime.mjs";
import { inspectPersistentSyntheticSnapshot, maintainPilotStorage, createPilotMonitor } from "./pilot-storage-maintenance.mjs";
import { validateSyntheticAgentTeam } from "./pilot-agent-team.mjs";

import { initializeSyntheticIntake, maintainSyntheticIntake } from "./pilot-intake-maintenance.mjs";

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
    // An existing retention store proves prior initialization. Never hide primary loss by reseeding on restart.
    try { await lstat(join(directory, "retained")); throw Error("Existing retained state requires operator recovery; initialization held."); }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
    recoveredExisting = false;
    snapshot = await commitDurablePipelines(synthetic, key, "EMPTY", syntheticRecords());
  }
  const { report } = await inspectPersistentSyntheticSnapshot(directory, key);
  const intake = await initializeSyntheticIntake(directory, key);
  return { source: "SYNTHETIC_ONLY", recoveredExisting, intakeRecoveredExisting: intake.recoveredExisting, report, independentBackupVerified: false };
}

export async function startPilot() {
  await verifyPilotEnvironment();
  const key = Buffer.from(process.env.QUEST_PIPELINE_KEY_HEX, "hex");
  let result;
  try { result = await runPersistentSyntheticPilot(process.env.QUEST_PIPELINE_DIRECTORY, key); }
  finally { key.fill(0); }
  const monitor = createPilotMonitor(async () => {
    await verifyPilotEnvironment();
    const managedKey = Buffer.from(process.env.QUEST_PIPELINE_KEY_HEX, "hex");
    try {
      await maintainPilotStorage(process.env.QUEST_PIPELINE_DIRECTORY, managedKey);
      await maintainSyntheticIntake(process.env.QUEST_PIPELINE_DIRECTORY, managedKey);
      await validateSyntheticAgentTeam();
    }
    finally { managedKey.fill(0); }
  });
  if (!await monitor.run()) throw Error("Initial storage and retained-backup verification failed.");
  console.log(JSON.stringify({ event: "SYNTHETIC_PILOT_PASSED", recoveredExisting: result.recoveredExisting,
    intakeRecoveredExisting: result.intakeRecoveredExisting, intakeFixtureValidated: true,
    independentBackupVerified: false, businessDataReady: false, generatedTemplatesValidated: 3 }));
  const server = createPilotHealthServer(monitor);
  const interval = setInterval(async () => {
    const passed = await monitor.run();
    console[passed ? "log" : "error"](JSON.stringify({ event: passed ? "PILOT_STORAGE_CHECK_PASSED" : "PILOT_STORAGE_CHECK_FAILED",
      independentBackupVerified: false, businessDataReady: false }));
  }, 60_000);
  interval.unref();
  server.once("close", () => clearInterval(interval));
  server.listen(Number(process.env.PORT || 10000), "0.0.0.0");
  for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
  return server;
}

export function createPilotHealthServer(monitor) {
  // Expose readiness only. Never serve reports, records, backups, keys or mutation endpoints.
  const ready = { service: "quest-luxo-agent-pilot", mode: "SYNTHETIC_ONLY", storage: "PERSISTENT_ENCRYPTED",
    independentBackupVerified: false, businessDataReady: false, gmail: false, crm: false };
  return createServer((req, res) => {
    res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET" || req.url !== "/healthz") { res.writeHead(404); res.end('{"error":"not_found"}'); return; }
    const healthy = monitor.healthy();
    res.writeHead(healthy ? 200 : 503);
    res.end(JSON.stringify({ ...ready, fixturePassed: healthy, storageVerified: healthy, localBackupVerified: healthy,
      generatedTemplatesValidated: healthy ? 3 : 0 }));
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await startPilot(); }
  catch { console.error("Pilot failed closed; operator must verify isolated identity, persistent storage, key and fixture integrity."); process.exitCode = 1; }
}
