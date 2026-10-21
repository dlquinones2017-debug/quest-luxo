import { createServer } from "node:http";
import { readFile, realpath, mkdir, lstat } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { commitDurablePipelines, readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { syntheticRecords, runApprovedPublicWebsiteAgent, runApprovedPublicIncidentAgent, runApprovedPublicOperationsAgent, runApprovedPilotRecoveryAgent, runApprovedPilotCommandAgent } from "./factory-agent-runtime.mjs";
import { inspectPersistentSyntheticSnapshot, maintainPilotStorage, createPilotMonitor } from "./pilot-storage-maintenance.mjs";
import { validateSyntheticAgentTeam } from "./pilot-agent-team.mjs";

import { initializeSyntheticIntake, maintainSyntheticIntake } from "./pilot-intake-maintenance.mjs";

import { createPublicWebsiteMonitor, PUBLIC_WEBSITE_INTERVAL_MS } from "../src/lib/agents/publicWebsiteHealth.ts";
import { assessModelExecutionPolicy } from "../src/lib/agents/modelExecutionPolicy.ts";

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
  const modelPolicy = JSON.parse(await readFile(new URL("../config/agents/model-execution-policy.json", import.meta.url), "utf8"));
  assessModelExecutionPolicy(modelPolicy);
  const key = Buffer.from(process.env.QUEST_PIPELINE_KEY_HEX, "hex");
  let result;
  try { result = await runPersistentSyntheticPilot(process.env.QUEST_PIPELINE_DIRECTORY, key); }
  finally { key.fill(0); }
  let recoveryReport = null, lastRecoveryCheck = -Infinity;
  const recoverySnapshot = () => ({ state: recoveryReport && performance.now() - lastRecoveryCheck <= 120_000 ? "CURRENT" : "CHECK_FAILED", report: recoveryReport });
  let publicBundle = null, commandReport = null, lastCommandCheck = -Infinity;
  const commandSnapshot = () => ({ state: commandReport && performance.now() - lastCommandCheck <= 120_000 ? "CURRENT" : "CHECK_FAILED", report: commandReport });
  const runCommandCheck = async () => {
    if (!publicBundle || !recoveryReport) { commandReport = null; return; }
    const sources = { ...publicBundle, recovery: recoveryReport, modelPolicy };
    try {
      const spec = JSON.parse(await readFile(new URL("../config/agents/pilot-command-orchestrator.spec.json", import.meta.url), "utf8"));
      commandReport = (await runApprovedPilotCommandAgent(spec, sources)).report;
      lastCommandCheck = performance.now();
      console.log(JSON.stringify({ event: "PILOT_COMMAND_ORCHESTRATOR_COMPLETED", report: commandReport }));
    } catch { commandReport = null; console.error(JSON.stringify({ event: "PILOT_COMMAND_ORCHESTRATOR_HELD" })); }
  };
  const monitor = createPilotMonitor(async () => {
    await verifyPilotEnvironment();
    const managedKey = Buffer.from(process.env.QUEST_PIPELINE_KEY_HEX, "hex");
    try {
      await maintainPilotStorage(process.env.QUEST_PIPELINE_DIRECTORY, managedKey);
      await maintainSyntheticIntake(process.env.QUEST_PIPELINE_DIRECTORY, managedKey);
      await validateSyntheticAgentTeam();
      try {
        const spec = JSON.parse(await readFile(new URL("../config/agents/pilot-recovery-audit.spec.json", import.meta.url), "utf8"));
        recoveryReport = (await runApprovedPilotRecoveryAgent(spec, { storageVerified: true, localBackupVerified: true })).report;
        lastRecoveryCheck = performance.now();
        console.log(JSON.stringify({ event: "PILOT_RECOVERY_AUDIT_AGENT_COMPLETED", report: recoveryReport }));
      } catch { recoveryReport = null; console.error(JSON.stringify({ event: "PILOT_RECOVERY_AUDIT_AGENT_HELD" })); }
      await runCommandCheck();
    }
    finally { managedKey.fill(0); }
  });
  if (!await monitor.run()) throw Error("Initial storage and retained-backup verification failed.");
  console.log(JSON.stringify({ event: "SYNTHETIC_PILOT_PASSED", recoveredExisting: result.recoveredExisting,
    intakeRecoveredExisting: result.intakeRecoveredExisting, intakeFixtureValidated: true,
    independentBackupVerified: recoveryReport?.independentBackupVerified === true, businessDataReady: false, generatedTemplatesValidated: 3 }));
  const publicMonitor = createPublicWebsiteMonitor(async () => {
    const spec = JSON.parse(await readFile(new URL("../config/agents/website-health.spec.json", import.meta.url), "utf8"));
    return (await runApprovedPublicWebsiteAgent(spec)).report;
  });
  let publicTeamStatus = "NOT_CHECKED";
  const runPublicCheck = async () => {
    try {
      const health = await publicMonitor.run(), now = new Date().toISOString();
      console.log(JSON.stringify({ event: "PUBLIC_WEBSITE_AGENT_COMPLETED", report: health }));
      const incidentSpec = JSON.parse(await readFile(new URL("../config/agents/public-incident-triage.spec.json", import.meta.url), "utf8"));
      const briefSpec = JSON.parse(await readFile(new URL("../config/agents/public-operations-brief.spec.json", import.meta.url), "utf8"));
      const incidents = await runApprovedPublicIncidentAgent(incidentSpec, health, now);
      const brief = await runApprovedPublicOperationsAgent(briefSpec, health, incidents.report, now);
      console.log(JSON.stringify({ event: "PUBLIC_INCIDENT_AGENT_COMPLETED", report: incidents.report }));
      console.log(JSON.stringify({ event: "PUBLIC_FOUNDER_BRIEF_AGENT_COMPLETED", report: brief.report }));
      publicBundle = { health, brief: brief.report };
      publicTeamStatus = "CURRENT";
      await runCommandCheck();
      console.log(JSON.stringify({ event: "PUBLIC_OPERATIONS_TEAM_COMPLETED", livePublicAgents: 3, businessDataReady: false }));
    } catch { publicTeamStatus = "CHECK_FAILED"; publicBundle = null; commandReport = null; console.error(JSON.stringify({ event: "PUBLIC_OPERATIONS_TEAM_CHECK_FAILED" })); }
  };
  await runPublicCheck();
  const publicInterval = setInterval(runPublicCheck, PUBLIC_WEBSITE_INTERVAL_MS);
  publicInterval.unref();
  const server = createPilotHealthServer(monitor, publicMonitor, () => publicTeamStatus, recoverySnapshot, commandSnapshot);
  const interval = setInterval(async () => {
    const passed = await monitor.run();
    console[passed ? "log" : "error"](JSON.stringify({ event: passed ? "PILOT_STORAGE_CHECK_PASSED" : "PILOT_STORAGE_CHECK_FAILED",
      independentBackupVerified: passed && recoveryReport?.independentBackupVerified === true, businessDataReady: false }));
  }, 60_000);
  interval.unref();
  server.once("close", () => { clearInterval(interval); clearInterval(publicInterval); });
  server.listen(Number(process.env.PORT || 10000), "0.0.0.0");
  for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  });
  return server;
}

export function createPilotHealthServer(monitor, publicMonitor, publicTeamState, recoverySnapshot, commandSnapshot) {
  // Expose readiness only. Never serve reports, records, backups, keys or mutation endpoints.
  const ready = { service: "quest-luxo-agent-pilot", mode: "SYNTHETIC_ONLY", storage: "PERSISTENT_ENCRYPTED",
    independentBackupVerified: false, businessDataReady: false, gmail: false, crm: false };
  return createServer((req, res) => {
    res.setHeader("Content-Type", "application/json"); res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET" || req.url !== "/healthz") { res.writeHead(404); res.end('{"error":"not_found"}'); return; }
    const healthy = monitor.healthy();
    const publicState = publicMonitor?.snapshot().state ?? "NOT_CONFIGURED";
    const teamState = publicState === "STALE" || publicState === "CHECK_FAILED" ? publicState : publicTeamState?.() ?? "NOT_CONFIGURED";
    const publicCurrent = publicState === "CURRENT" && teamState === "CURRENT";
    const recovery = recoverySnapshot?.();
    const recoveryCurrent = healthy && recovery?.state === "CURRENT";
    const independentVerified = recoveryCurrent && recovery.report?.independentBackupVerified === true &&
      Date.now() <= Date.parse(recovery.report.recoveryValidUntil);
    const command = commandSnapshot?.();
    const commandCurrent = healthy && recoveryCurrent && publicCurrent && command?.state === "CURRENT" && command.report?.operationalState === "CURRENT";
    res.writeHead(healthy ? 200 : 503);
    res.end(JSON.stringify({ ...ready, fixturePassed: healthy, storageVerified: healthy, localBackupVerified: healthy,
      generatedTemplatesValidated: healthy ? 3 : 0,
      publicWebsiteAgent: publicState, publicOperationsTeam: teamState, livePublicAgents: publicCurrent ? 3 : 0,
      recoveryAuditAgent: recoveryCurrent ? "CURRENT" : !healthy && recovery ? "HELD" : recovery?.state ?? "NOT_CONFIGURED",
      independentBackupVerified: Boolean(independentVerified), recurringOffsiteRetentionVerified: false,
      commandOrchestrator: commandCurrent ? "CURRENT" : command ? "HELD" : "NOT_CONFIGURED",
      paidModelExecution: "DISABLED_ZERO_BUDGET",
      liveOperationalAgents: (publicCurrent ? 3 : 0) + (recoveryCurrent ? 1 : 0) + (commandCurrent ? 1 : 0) }));
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { await startPilot(); }
  catch { console.error("Pilot failed closed; operator must verify isolated identity, persistent storage, key and fixture integrity."); process.exitCode = 1; }
}
