import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateFactorySpec } from "../src/lib/agents/agentFactory.ts";
import { commitDurablePipelines, readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { buildManualPipelineReport } from "./manual-pipeline-agent-report.mjs";
import { READINESS_CHECKS, assessAgentReadiness, buildFounderOperationsBrief } from "../src/lib/agents/agentReadinessPolicy.ts";

export const syntheticRecords = () => ({
  capital: [{ borrowerId: "synthetic-capital", stage: "QUALIFY", status: "BLOCKED", reason: "Synthetic only",
    updatedAt: "2026-10-21T12:00:00Z", evidenceIds: ["synthetic-proof-capital"], evidenceState: "UNKNOWN" }],
  realty: [{ leadId: "synthetic-realty", stage: "REVIEW", status: "REQUIRES_FOUNDER", reason: "Synthetic only",
    updatedAt: "2026-10-21T12:00:00Z", evidenceIds: ["synthetic-proof-realty"], evidenceState: "REQUIRES_VERIFICATION" }],
});

import { triagePublicWebsiteReport, buildPublicOperationsBrief } from "../src/lib/agents/publicOperationsTeam.ts";
import { checkPublicWebsites } from "../src/lib/agents/publicWebsiteHealth.ts";
import { assessPilotRecovery } from "../src/lib/agents/pilotRecoveryAudit.ts";
import { readPilotRecoveryAssessment } from "./pilot-recovery-audit.mjs";
import { coordinatePilotOperations } from "../src/lib/agents/pilotCommandOrchestrator.ts";

export async function runApprovedPilotCommandAgent(input, sources, assessedAt) {
  const spec = await validateFactorySpec(input);
  if (spec.version !== 5 || spec.template !== "pilot-command-orchestrator" || !sources ||
      Object.keys(sources).sort().join() !== ["health", "brief", "recovery", "modelPolicy"].sort().join()) throw Error("Reviewed command template and matching sources required.");
  return { source: "DERIVED_VERIFIED_PILOT_REPORTS", report: coordinatePilotOperations(sources.health, sources.brief, sources.recovery, sources.modelPolicy,
    assessedAt ?? new Date().toISOString()) };
}

export async function runApprovedPilotRecoveryAgent(input, storageState) {
  const spec = await validateFactorySpec(input);
  if (spec.version !== 4 || spec.template !== "pilot-recovery-audit") throw Error("Reviewed recovery auditor required.");
  return { source: "ISOLATED_PILOT_LOCAL_STATE", report: await readPilotRecoveryAssessment(storageState) };
}

export async function runApprovedPublicWebsiteAgent(input) {
  const spec = await validateFactorySpec(input);
  if (spec.version !== 3 || spec.template !== "website-health") throw Error("Reviewed public website template required.");
  return { source: "APPROVED_PUBLIC_HTTP_ONLY", report: await checkPublicWebsites() };
}

export async function runApprovedPublicIncidentAgent(input, priorHealth, assessedAt) {
  const spec = await validateFactorySpec(input);
  if (spec.version !== 3 || spec.template !== "public-incident-triage") throw Error("Reviewed public incident template required.");
  const health = priorHealth ?? await checkPublicWebsites();
  return { source: "DERIVED_PUBLIC_OBSERVATION", report: triagePublicWebsiteReport(health, assessedAt ?? new Date().toISOString()) };
}
export async function runApprovedPublicOperationsAgent(input, priorHealth, priorIncidents, assessedAt) {
  const spec = await validateFactorySpec(input);
  if (spec.version !== 3 || spec.template !== "public-operations-brief") throw Error("Reviewed public brief template required.");
  const health = priorHealth ?? await checkPublicWebsites(), now = assessedAt ?? new Date().toISOString();
  const incidents = priorIncidents ?? triagePublicWebsiteReport(health, now);
  return { source: "DERIVED_PUBLIC_OBSERVATION", report: buildPublicOperationsBrief(health, incidents, now) };
}

export async function runFactoryAgent(input) {
  const spec = await validateFactorySpec(input);
  if (spec.version === 5) {
    let index = 0;
    const now = new Date().toISOString();
    const health = await checkPublicWebsites({ now: () => new Date(now), reader: async () => new Response(null, { status: [200,403,503][index++] }) });
    const incidents = triagePublicWebsiteReport(health, now), brief = buildPublicOperationsBrief(health, incidents, now);
    const recovery = assessPilotRecovery({ storageVerified: true, localBackupVerified: true, pipelineRevision: "a".repeat(64), intakeRevision: "b".repeat(64) }, null, now);
    return { source: "SYNTHETIC_FIXTURE_ONLY", report: coordinatePilotOperations(health, brief, recovery,
      { version: 1, mode: "DISABLED_ZERO_BUDGET", enabled: false, dailyBudgetUsd: 0 }, now) };
  }
  if (spec.version === 4) return { source: "SYNTHETIC_FIXTURE_ONLY", report: assessPilotRecovery({ storageVerified: true, localBackupVerified: true,
    pipelineRevision: "a".repeat(64), intakeRevision: "b".repeat(64) }, null, new Date().toISOString()) };
  if (spec.version === 3) {
    let index = 0;
    const statuses = spec.template === "website-health" ? [200,200,200] : [200,403,503];
    const health = await checkPublicWebsites({ reader: async () => new Response(null, { status: statuses[index++] }) });
    const now = new Date().toISOString();
    const incidents = triagePublicWebsiteReport(health, now);
    return { source: "SYNTHETIC_FIXTURE_ONLY", report: spec.template === "website-health" ? health :
      spec.template === "public-incident-triage" ? incidents : buildPublicOperationsBrief(health, incidents, now) };
  }
  const now = new Date().toISOString();
  const evidence = syntheticReadinessEvidence(now);
  if (spec.version === 2 && spec.template === "readiness")
    return { source: "SYNTHETIC_FIXTURE_ONLY", report: assessAgentReadiness(evidence, now) };
  const directory = await mkdtemp(join(tmpdir(), "quest-factory-eval-"));
  const key = randomBytes(32);
  try {
    await commitDurablePipelines(directory, key, "EMPTY", syntheticRecords());
    const aggregate = buildManualPipelineReport(await readDurablePipelines(directory, key));
    return { source: "SYNTHETIC_FIXTURE_ONLY", report: spec.version === 2 ? buildFounderOperationsBrief(aggregate, evidence, now) : aggregate };
  } finally { key.fill(0); await rm(directory, { recursive: true, force: true }); }
}

export function syntheticReadinessEvidence(now) {
  return READINESS_CHECKS.map(check => ({ check, observedAt: now, evidenceRef: "synthetic-" + check.toLowerCase(),
    state: ["KEY_RECOVERY", "RETENTION_POLICY", "SOURCE_SCOPE"].includes(check) ? "MISSING" : "VERIFIED" }));
}
