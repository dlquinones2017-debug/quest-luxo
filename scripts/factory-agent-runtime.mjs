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

import { checkPublicWebsites } from "../src/lib/agents/publicWebsiteHealth.ts";

export async function runApprovedPublicWebsiteAgent(input) {
  const spec = await validateFactorySpec(input);
  if (spec.version !== 3 || spec.template !== "website-health") throw Error("Reviewed public website template required.");
  return { source: "APPROVED_PUBLIC_HTTP_ONLY", report: await checkPublicWebsites() };
}

export async function runFactoryAgent(input) {
  const spec = await validateFactorySpec(input);
  if (spec.version === 3) return { source: "SYNTHETIC_FIXTURE_ONLY", report: await checkPublicWebsites({ reader: async () => new Response(null, { status: 200 }) }) };
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
