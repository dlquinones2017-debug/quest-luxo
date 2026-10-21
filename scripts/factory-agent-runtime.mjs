import { randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateFactorySpec } from "../src/lib/agents/agentFactory.ts";
import { commitDurablePipelines, readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { buildManualPipelineReport } from "./manual-pipeline-agent-report.mjs";

export const syntheticRecords = () => ({
  capital: [{ borrowerId: "synthetic-capital", stage: "QUALIFY", status: "BLOCKED", reason: "Synthetic only",
    updatedAt: "2026-10-21T12:00:00Z", evidenceIds: ["synthetic-proof-capital"], evidenceState: "UNKNOWN" }],
  realty: [{ leadId: "synthetic-realty", stage: "REVIEW", status: "REQUIRES_FOUNDER", reason: "Synthetic only",
    updatedAt: "2026-10-21T12:00:00Z", evidenceIds: ["synthetic-proof-realty"], evidenceState: "REQUIRES_VERIFICATION" }],
});

export async function runFactoryAgent(input) {
  await validateFactorySpec(input);
  const directory = await mkdtemp(join(tmpdir(), "quest-factory-eval-"));
  const key = randomBytes(32);
  try {
    await commitDurablePipelines(directory, key, "EMPTY", syntheticRecords());
    return { source: "SYNTHETIC_FIXTURE_ONLY", report: buildManualPipelineReport(await readDurablePipelines(directory, key)) };
  } finally { key.fill(0); await rm(directory, { recursive: true, force: true }); }
}
