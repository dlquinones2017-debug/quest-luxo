import test from "node:test";
import assert from "node:assert/strict";
import { operationsCoordinator } from "../src/lib/command/operationsCoordinator.ts";
import { bottleneckExceptionAgent } from "../src/lib/command/bottleneckExceptionAgent.ts";
import { ownershipDelegationAgent } from "../src/lib/command/ownershipDelegationAgent.ts";
import { slaAgingIntelligence } from "../src/lib/command/slaAgingIntelligence.ts";

const now = new Date("2026-10-08T12:00:00Z");
const action = (division, recordId, overrides = {}) => ({
  key: `${division}:${recordId}:ACTIVE`, division, recordId, stage: "ACTIVE", status: "READY",
  reason: "Verified active work", evidenceState: "VERIFIED", evidenceIds: [`work-${recordId}`],
  sourceSystem: division.toLowerCase(), updatedAt: "2026-10-07T12:00:00Z", requiredHumanAction: null, ...overrides,
});
const roleFor = { REALTY: "REALTY_OPERATIONS", CAPITAL_ADVISORY: "CAPITAL_ADVISORY_OPERATIONS" };
const runWave = ({ queue = [], annotations = [], facts = [], ownershipEvidence = [], authorityEvidence = [], timestamps = [], thresholds = [] }) => {
  const work = operationsCoordinator({ queue, annotations }, now);
  const exceptions = bottleneckExceptionAgent({ work, facts }, now);
  const delegations = ownershipDelegationAgent({ work, exceptions, ownershipEvidence, authorityEvidence });
  const aging = slaAgingIntelligence({ work, delegations, timestamps, thresholds }, now);
  return { work, exceptions, delegations, aging };
};
const ownership = item => ({ workKey: item.key, division: item.division, role: roleFor[item.division], evidenceState: "VERIFIED", evidenceIds: [`role-${item.recordId}`], reason: "Verified operating model" });
const timestamp = item => ({ workKey: item.key, observedAt: item.updatedAt, evidenceState: "VERIFIED", evidenceIds: [`time-${item.recordId}`], sourceReference: `${item.sourceSystem}.updated_at` });
const threshold = (division, attention = "ADVANCE") => ({ division, attention, warningAfterHours: 24, overdueAfterHours: 48, evidenceState: "VERIFIED", evidenceIds: [`sla-${division}-${attention}`], configReference: "wave4-policy-v1" });

test("Wave 4 honest zero state stays empty end to end", () => {
  const result = runWave({});
  assert.deepEqual(result, { work: [], exceptions: [], delegations: [], aging: [] });
});

test("Wave 4 verified path composes one store-free recommendation chain", () => {
  const item = action("REALTY", "verified");
  const result = runWave({ queue: [item], ownershipEvidence: [ownership(item)], timestamps: [timestamp(item)], thresholds: [threshold("REALTY")] });
  assert.equal(result.work.length, 1);
  assert.equal(result.delegations[0].recommendedOwningRole, "REALTY_OPERATIONS");
  assert.equal(result.aging[0].slaState, "AT_RISK");
});

test("Wave 4 never turns missing evidence or configuration into overdue", () => {
  const item = action("REALTY", "unknown", { evidenceState: "UNKNOWN", evidenceIds: [], status: "UNKNOWN", updatedAt: "invalid" });
  const result = runWave({ queue: [item] });
  assert.equal(result.work[0].attention, "VERIFY");
  assert.equal(result.delegations[0].ownershipState, "UNKNOWN");
  assert.equal(result.aging[0].slaState, "UNKNOWN");
});

test("Wave 4 preserves founder approval through every downstream layer", () => {
  const item = action("CAPITAL_ADVISORY", "founder", { status: "REQUIRES_FOUNDER", requiredHumanAction: "Approve binding capital terms" });
  const result = runWave({ queue: [item], ownershipEvidence: [ownership(item)], timestamps: [timestamp(item)], thresholds: [threshold("CAPITAL_ADVISORY", "FOUNDER_DECISION")] });
  assert.equal(result.work[0].founderApprovalRequired, true);
  assert.equal(result.exceptions[0].founderActionRequired, true);
  assert.equal(result.delegations[0].founderEscalation, true);
  assert.equal(result.aging[0].requiredFounderAction, "Approve binding capital terms");
});

test("Wave 4 cross-division dependency, ownership conflict, and source records are preserved", () => {
  const realty = action("REALTY", "cross");
  const capital = action("CAPITAL_ADVISORY", "dependency");
  const input = {
    queue: [realty, capital], annotations: [{ workKey: realty.key, dependencyKeys: [capital.key], dependencyState: "VERIFIED", evidenceIds: ["dependency-1"] }],
    ownershipEvidence: [ownership(realty), { ...ownership(realty), division: "CAPITAL_ADVISORY", role: "CAPITAL_ADVISORY_OPERATIONS", evidenceIds: ["role-conflict"] }, ownership(capital)],
    timestamps: [timestamp(realty), timestamp(capital)], thresholds: [threshold("REALTY", "COORDINATE"), threshold("CAPITAL_ADVISORY")],
  };
  const before = structuredClone(input);
  const result = runWave(input);
  const cross = result.aging.find(x => x.workKey === realty.key);
  assert.deepEqual(input, before);
  assert.deepEqual(cross.coordinatingDivisions, ["CAPITAL_ADVISORY"]);
  assert.equal(cross.ownershipState, "CONFLICT");
  assert.equal(cross.division, "REALTY");
});

test("Wave 4 is deterministic, deduplicated, evidence-traceable, and non-mutating", () => {
  const item = action("REALTY", "stable");
  const input = { queue: [item, structuredClone(item)], ownershipEvidence: [ownership(item), ownership(item)], timestamps: [timestamp(item), timestamp(item)], thresholds: [threshold("REALTY"), threshold("REALTY")] };
  const before = structuredClone(input);
  const first = runWave(input);
  const second = runWave({ ...input, queue: [...input.queue].reverse() });
  assert.deepEqual(input, before);
  assert.deepEqual(first, second);
  assert.equal(first.aging.length, 1);
  assert.deepEqual(first.aging[0].evidenceIds, ["role-stable", "sla-REALTY-ADVANCE", "time-stable", "work-stable"]);
  assert.ok(first.aging[0].prohibitedActions.includes("MUTATE_AUTHORITATIVE_STATE"));
});
