import test from "node:test";
import assert from "node:assert/strict";
import { assessAgentReadiness, buildFounderOperationsBrief } from "../src/lib/agents/agentReadinessPolicy.ts";
import { syntheticReadinessEvidence, syntheticRecords } from "../scripts/factory-agent-runtime.mjs";
import { buildManualPipelineReport } from "../scripts/manual-pipeline-agent-report.mjs";

const now = "2026-10-21T12:00:00.000Z";
const report = () => buildManualPipelineReport({ sequence: 1, records: syntheticRecords() });
const evidence = () => syntheticReadinessEvidence(now);
test("readiness distinguishes specific missing recovery and source requirements", () => {
  const r = assessAgentReadiness(evidence(), now);
  assert.equal(r.status, "HOLD");
  assert.deepEqual(r.requiredActions, ["KEY_RECOVERY", "RETENTION_POLICY", "SOURCE_SCOPE"]);
  assert.equal(r.businessDataExecutionAllowed, false);
});
test("even complete evidence recommends review without granting execution or communications", () => {
  const r = assessAgentReadiness(evidence().map(e => ({ ...e, state: "VERIFIED" })), now);
  assert.equal(r.status, "READY_FOR_FOUNDER_REVIEW");
  assert.deepEqual(r.requiredActions, []);
  assert.equal(r.businessDataExecutionAllowed, false);
  assert.equal(r.activatesGmail, false);
  assert.equal(r.writesCRM, false);
  assert.equal(r.sendsMessages, false);
});
test("missing, stale, conflicting and future evidence cannot become verified", () => {
  assert.equal(assessAgentReadiness([], now).requiredActions.length, 7);
  const input = evidence().map(e => ({ ...e, state: "VERIFIED" }));
  input[0].observedAt = "2026-10-19T12:00:00Z";
  input[1].observedAt = "2026-10-22T12:00:00Z";
  input[2].state = "CONFLICT";
  const r = assessAgentReadiness(input, now);
  assert.deepEqual(r.checks.slice(0,3).map(c => c.state), ["STALE", "CONFLICT", "CONFLICT"]);
  assert.equal(r.status, "HOLD");
});
test("readiness rejects duplicate checks, unknown fields, secrets, invalid dates and oversized input", () => {
  const rows = evidence();
  for (const bad of [[rows[0], rows[0]], [{ ...rows[0], check: "ALLOW_GMAIL" }], [{ ...rows[0], apiKey: "never-retained" }],
    [{ ...rows[0], observedAt: "invalid" }], [{ ...rows[0], evidenceRef: "https://host/private?token=x" }], [...rows, rows[0]]])
    assert.throws(() => assessAgentReadiness(bad, now));
  assert.throws(() => assessAgentReadiness(rows, "invalid"));
});
test("founder brief reuses exact division aggregates and does not mutate inputs or dispatch", () => {
  const aggregate = report(), rows = evidence(), before = structuredClone({ aggregate, rows });
  const r = buildFounderOperationsBrief(aggregate, rows, now);
  assert.deepEqual({ aggregate, rows }, before);
  assert.deepEqual(r.divisions.map(d => [d.total, d.blocked, d.founderReview]), [[1,1,0],[1,0,1]]);
  assert.equal(r.status, "HOLD");
  assert.equal(r.dispatchesWork, false);
  assert.equal(r.businessDataExecutionAllowed, false);
  assert.equal(r.pipelineSource, "AUTHENTICATED_AGGREGATE");
});
test("missing pipeline is unknown rather than a zero-case founder report", () => {
  const r = buildFounderOperationsBrief(null, evidence(), now);
  assert.equal(r.pipelineSource, "MISSING");
  assert.equal(r.divisions, null);
  assert.ok(r.requiredActions.includes("PIPELINE_SOURCE_MISSING"));
});
test("founder brief rejects inconsistent counts, wrong divisions, sending flags and embedded raw records", () => {
  const badCount = report(); badCount.divisions[0].blocked = 2;
  const badDivision = report(); badDivision.divisions[1].division = "CAPITAL_ADVISORY";
  const rawRecord = report(); rawRecord.divisions[0].borrowerId = "hidden";
  for (const r of [badCount, badDivision, rawRecord, { ...report(), sendsMessages: true }, { ...report(), privateKey: "hidden" }])
    assert.throws(() => buildFounderOperationsBrief(r, evidence(), now));
});
