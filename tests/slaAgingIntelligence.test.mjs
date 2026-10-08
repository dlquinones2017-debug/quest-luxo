import test from "node:test";
import assert from "node:assert/strict";
import { slaAgingIntelligence } from "../src/lib/command/slaAgingIntelligence.ts";

const now = new Date("2026-10-08T12:00:00Z");
const work = (recordId, overrides = {}) => ({
  key: `REALTY:${recordId}:ACTIVE`, division: "REALTY", recordId, attention: "ADVANCE",
  recommendation: "Advance internally", evidenceState: "VERIFIED", evidenceIds: [`work-${recordId}`],
  founderApprovalRequired: false, requiredHumanAction: null, owner: null, ownerState: "UNKNOWN",
  blocker: null, blockerState: "UNKNOWN", dependencyKeys: [], dependencyState: "UNKNOWN",
  coordinatingDivisions: [], updatedAt: "2026-10-08T08:00:00Z", ageDays: 0,
  sourceSystems: ["realty"], authority: "RECOMMENDATION_ONLY", prohibitedActions: ["MESSAGE"], ...overrides,
});
const timestamp = (workKey, observedAt, overrides = {}) => ({
  workKey, observedAt, evidenceState: "VERIFIED", evidenceIds: ["timestamp-1"], sourceReference: "realty.updated_at", ...overrides,
});
const threshold = (overrides = {}) => ({
  division: "REALTY", attention: "ADVANCE", warningAfterHours: 24, overdueAfterHours: 48,
  evidenceState: "VERIFIED", evidenceIds: ["config-1"], configReference: "sla-policy-v1", ...overrides,
});
const delegation = (item, overrides = {}) => ({
  delegationKey: `${item.key}:DELEGATION:REALTY%3AREALTY_OPERATIONS`, workKey: item.key, exceptionKey: null,
  division: "REALTY", recommendedOwningRole: "REALTY_OPERATIONS", ownershipState: "VERIFIED",
  delegationReason: "Verified role", evidenceIds: ["role-1"], founderEscalation: false, requiredFounderAction: null,
  upstreamBlockerExceptionReference: null, recommendedInternalHandoff: "Route internally", authority: "RECOMMENDATION_ONLY",
  prohibitedActions: ["MESSAGE"], ...overrides,
});

test("honest zero state creates no SLA recommendations", () => assert.deepEqual(slaAgingIntelligence({ work: [] }, now), []));

test("verified age remains within SLA below the warning boundary", () => {
  const item = work("within");
  const [result] = slaAgingIntelligence({ work: [item], timestamps: [timestamp(item.key, "2026-10-07T13:00:00Z")], thresholds: [threshold()] }, now);
  assert.equal(result.slaState, "WITHIN_SLA");
  assert.equal(result.ageHours, 23);
});

test("warning and overdue thresholds are inclusive exact boundaries", () => {
  const warning = work("warning");
  const overdue = work("overdue");
  const results = slaAgingIntelligence({
    work: [warning, overdue],
    timestamps: [timestamp(warning.key, "2026-10-07T12:00:00Z"), timestamp(overdue.key, "2026-10-06T12:00:00Z")],
    thresholds: [threshold()],
  }, now);
  assert.equal(results.find(x => x.workKey === warning.key).slaState, "AT_RISK");
  assert.equal(results.find(x => x.workKey === overdue.key).slaState, "OVERDUE");
});

test("equivalent timezone offsets produce identical age", () => {
  const utc = work("utc");
  const offset = work("offset");
  const results = slaAgingIntelligence({ work: [utc, offset], timestamps: [
    timestamp(utc.key, "2026-10-07T12:00:00Z"), timestamp(offset.key, "2026-10-07T08:00:00-04:00"),
  ], thresholds: [threshold()] }, now);
  assert.deepEqual(results.map(x => x.ageHours), [24, 24]);
});

test("missing, invalid, unverified, and future timestamps remain UNKNOWN", () => {
  const missing = work("missing");
  const invalid = work("invalid");
  const unverified = work("unverified");
  const future = work("future");
  const results = slaAgingIntelligence({ work: [missing, invalid, unverified, future], timestamps: [
    timestamp(invalid.key, "not-a-time"),
    timestamp(unverified.key, "2026-10-01T00:00:00Z", { evidenceState: "UNKNOWN", evidenceIds: [] }),
    timestamp(future.key, "2026-10-09T00:00:00Z"),
  ], thresholds: [threshold()] }, now);
  assert.ok(results.every(x => x.slaState === "UNKNOWN" && x.ageHours === null));
});

test("missing and invalid SLA configuration remain UNKNOWN, never overdue", () => {
  const missing = work("missing-config");
  const invalid = work("invalid-config");
  const results = slaAgingIntelligence({ work: [missing, invalid], timestamps: [
    timestamp(missing.key, "2026-01-01T00:00:00Z"), timestamp(invalid.key, "2026-01-01T00:00:00Z"),
  ], thresholds: [threshold({ warningAfterHours: 48, overdueAfterHours: 24 })] }, now);
  assert.ok(results.every(x => x.slaState === "UNKNOWN" && x.overdueAfterHours === null));
});

test("ownership conflicts are preserved and no role is assigned", () => {
  const item = work("conflict");
  const [result] = slaAgingIntelligence({ work: [item], delegations: [delegation(item, {
    recommendedOwningRole: null, ownershipState: "CONFLICT", founderEscalation: true,
    requiredFounderAction: "Resolve verified ownership conflict.",
  })], timestamps: [timestamp(item.key, "2026-10-07T12:00:00Z")], thresholds: [threshold()] }, now);
  assert.equal(result.ownershipState, "CONFLICT");
  assert.equal(result.recommendedOwningRole, null);
  assert.equal(result.founderEscalation, true);
});

test("cross-division coordination is preserved without changing source division", () => {
  const item = work("cross", { coordinatingDivisions: ["CAPITAL_ADVISORY"] });
  const [result] = slaAgingIntelligence({ work: [item], timestamps: [timestamp(item.key, "2026-10-07T12:00:00Z")], thresholds: [threshold()] }, now);
  assert.equal(result.division, "REALTY");
  assert.deepEqual(result.coordinatingDivisions, ["CAPITAL_ADVISORY"]);
});

test("evidence trace includes work, timestamp, threshold, and ownership evidence", () => {
  const item = work("trace");
  const [result] = slaAgingIntelligence({ work: [item], delegations: [delegation(item)], timestamps: [timestamp(item.key, "2026-10-07T12:00:00Z")], thresholds: [threshold()] }, now);
  assert.deepEqual(result.evidenceIds, ["config-1", "role-1", "timestamp-1", "work-trace"]);
  assert.equal(result.timestampSourceReference, "realty.updated_at");
  assert.equal(result.configReference, "sla-policy-v1");
});

test("duplicate inputs collapse deterministically and calls are idempotent", () => {
  const older = work("stable", { updatedAt: "2026-10-01T00:00:00Z" });
  const newer = work("stable", { updatedAt: "2026-10-08T08:00:00Z" });
  const input = { work: [older, newer], timestamps: [timestamp(newer.key, "2026-10-07T12:00:00Z"), timestamp(newer.key, "2026-10-07T12:00:00Z")], thresholds: [threshold(), threshold()] };
  const first = slaAgingIntelligence(input, now);
  const second = slaAgingIntelligence({ ...input, work: [newer, older] }, now);
  assert.equal(first.length, 1);
  assert.deepEqual(first, second);
  assert.deepEqual(slaAgingIntelligence(input, now), first);
});

test("recommendations are non-mutating and prohibit external or binding action", () => {
  const item = work("immutable", { founderApprovalRequired: true, requiredHumanAction: "Approve terms" });
  const input = { work: [item], timestamps: [timestamp(item.key, "2026-10-01T00:00:00Z")], thresholds: [threshold()] };
  const before = structuredClone(input);
  const [result] = slaAgingIntelligence(input, now);
  assert.deepEqual(input, before);
  assert.equal(result.authority, "RECOMMENDATION_ONLY");
  for (const action of ["MESSAGE", "MAKE_OFFER", "MAKE_PAYMENT", "MAKE_COMMITMENT", "INTRODUCE_LENDER", "SUBMIT_APPLICATION", "MUTATE_STATUS", "MUTATE_AUTHORITATIVE_STATE"]) assert.ok(result.prohibitedActions.includes(action));
  assert.equal(result.requiredFounderAction, "Approve terms");
});
