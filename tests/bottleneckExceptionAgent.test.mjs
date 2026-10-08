import test from "node:test";
import assert from "node:assert/strict";
import { bottleneckExceptionAgent } from "../src/lib/command/bottleneckExceptionAgent.ts";

const now = new Date("2026-10-07T22:00:00Z");
const work = (recordId, overrides = {}) => ({
  key: `REALTY:${recordId}:ACTIVE`, division: "REALTY", recordId, attention: "ADVANCE",
  recommendation: "Advance internally", evidenceState: "VERIFIED", evidenceIds: [`ev-${recordId}`],
  founderApprovalRequired: false, requiredHumanAction: null, owner: "Enterprise Operations", ownerState: "VERIFIED",
  blocker: null, blockerState: "UNKNOWN", dependencyKeys: [], dependencyState: "UNKNOWN",
  coordinatingDivisions: [], updatedAt: "2026-10-05T22:00:00Z", ageDays: 2,
  sourceSystems: ["realty"], authority: "RECOMMENDATION_ONLY", prohibitedActions: ["MESSAGE", "MUTATE_AUTHORITATIVE_STATE"],
  ...overrides,
});
const fact = (workKey, kind, reference, overrides = {}) => ({
  workKey, kind, reference, evidenceState: "VERIFIED", evidenceIds: [`fact-${reference}`], ...overrides,
});

test("honest zero state has no manufactured exceptions", () => {
  assert.deepEqual(bottleneckExceptionAgent({ work: [] }, now), []);
  assert.deepEqual(bottleneckExceptionAgent({ work: [work("healthy")] }, now), []);
});

test("UNKNOWN, TBD, and REQUIRES_VERIFICATION facts never become failures", () => {
  const item = work("unknown", { evidenceState: "REQUIRES_VERIFICATION", evidenceIds: [], owner: null, ownerState: "UNKNOWN", updatedAt: "" });
  const facts = [
    fact(item.key, "OWNERSHIP_REQUIRED", "role", { evidenceState: "UNKNOWN" }),
    fact(item.key, "DEPENDENCY_DUE", "dep", { evidenceState: "TBD", dueAt: "2026-01-01T00:00:00Z" }),
    fact(item.key, "EVIDENCE_OBSERVED", "source", { evidenceState: "REQUIRES_VERIFICATION", occurredAt: "2020-01-01T00:00:00Z" }),
  ];
  assert.deepEqual(bottleneckExceptionAgent({ work: [item], facts }, now), []);
});

test("verified blocked work emits one recommendation-only exception", () => {
  const item = work("blocked", { attention: "BLOCKED", blocker: "Permit missing", blockerState: "VERIFIED" });
  const [exception] = bottleneckExceptionAgent({ work: [item] }, now);
  assert.equal(exception.exceptionType, "BLOCKED_WORK");
  assert.deepEqual(exception.blockerReferences, ["Permit missing"]);
  assert.equal(exception.authority, "RECOMMENDATION_ONLY");
  assert.ok(exception.prohibitedActions.includes("MESSAGE"));
  assert.ok(exception.prohibitedActions.includes("SUBMIT_APPLICATION"));
});

test("unresolved founder approval is immediate and remains founder-only", () => {
  const item = work("founder", { attention: "FOUNDER_DECISION", founderApprovalRequired: true, requiredHumanAction: "Approve terms" });
  const [exception] = bottleneckExceptionAgent({ work: [item] }, now);
  assert.equal(exception.exceptionType, "FOUNDER_APPROVAL");
  assert.equal(exception.urgency, "IMMEDIATE");
  assert.equal(exception.founderActionRequired, true);
});

test("ownerless work requires verified ownership-required evidence and never invents an owner", () => {
  const item = work("ownerless", { owner: null, ownerState: "UNKNOWN" });
  const [exception] = bottleneckExceptionAgent({ work: [item], facts: [fact(item.key, "OWNERSHIP_REQUIRED", "case-owner")] }, now);
  assert.equal(exception.exceptionType, "OWNERLESS_WORK");
  assert.equal(exception.owner, null);
  assert.equal(exception.ownershipState, "UNKNOWN");
});

test("missing timestamp keeps age UNKNOWN/null", () => {
  const item = work("ownerless-no-time", { owner: null, ownerState: "UNKNOWN", updatedAt: "" });
  const [exception] = bottleneckExceptionAgent({ work: [item], facts: [fact(item.key, "OWNERSHIP_REQUIRED", "case-owner")] }, now);
  assert.equal(exception.ageDays, null);
});

test("verified stale evidence is detected from its explicit observation timestamp", () => {
  const item = work("stale");
  const [exception] = bottleneckExceptionAgent({ work: [item], facts: [fact(item.key, "EVIDENCE_OBSERVED", "valuation", { occurredAt: "2026-08-01T00:00:00Z" })] }, now);
  assert.equal(exception.exceptionType, "STALE_EVIDENCE");
  assert.equal(exception.ageDays, 67);
});

test("overdue verified dependency includes the underlying reference", () => {
  const item = work("dependent", { dependencyKeys: ["CAPITAL_ADVISORY:capital:ACTIVE"], dependencyState: "VERIFIED" });
  const [exception] = bottleneckExceptionAgent({ work: [item], facts: [fact(item.key, "DEPENDENCY_DUE", "CAPITAL_ADVISORY:capital:ACTIVE", { dueAt: "2026-09-20T22:00:00Z" })] }, now);
  assert.equal(exception.exceptionType, "OVERDUE_DEPENDENCY");
  assert.deepEqual(exception.dependencyReferences, ["CAPITAL_ADVISORY:capital:ACTIVE"]);
  assert.equal(exception.severity, "HIGH");
});

test("contradictory state and repeated deferral require explicit verified history", () => {
  const item = work("history");
  const facts = [
    fact(item.key, "STATE_ASSERTION", "stage", { assertedValue: "READY", evidenceIds: ["state-1"] }),
    fact(item.key, "STATE_ASSERTION", "stage", { assertedValue: "BLOCKED", evidenceIds: ["state-2"] }),
    fact(item.key, "DEFERRAL", "founder-review", { occurredAt: "2026-09-01T00:00:00Z", evidenceIds: ["def-1"] }),
    fact(item.key, "DEFERRAL", "founder-review", { occurredAt: "2026-09-15T00:00:00Z", evidenceIds: ["def-2"] }),
  ];
  assert.deepEqual(bottleneckExceptionAgent({ work: [item], facts }, now).map(x => x.exceptionType).sort(), ["INVALID_STATE", "REPEATED_DEFERRAL"]);
});

test("duplicate signals collapse to stable keys and reruns are deterministic", () => {
  const item = work("dedup", { owner: null, ownerState: "UNKNOWN" });
  const a = fact(item.key, "OWNERSHIP_REQUIRED", "case-owner", { evidenceIds: ["owner-1"] });
  const b = fact(item.key, "OWNERSHIP_REQUIRED", "case-owner", { evidenceIds: ["owner-2"] });
  const first = bottleneckExceptionAgent({ work: [item], facts: [a, b] }, now);
  const second = bottleneckExceptionAgent({ work: [item], facts: [b, a] }, now);
  assert.equal(first.length, 1);
  assert.deepEqual(second, first);
  assert.equal(first[0].key, `${item.key}:EXCEPTION:case-owner`);
  assert.deepEqual(first[0].evidenceIds, ["owner-1", "owner-2"]);
});

test("different verified signals for the same underlying issue share one exception key", () => {
  const reference = "CAPITAL_ADVISORY:package:ACTIVE";
  const item = work("same-issue", { attention: "BLOCKED", blocker: reference, blockerState: "VERIFIED" });
  const result = bottleneckExceptionAgent({ work: [item], facts: [fact(item.key, "DEPENDENCY_DUE", reference, { dueAt: "2026-09-20T22:00:00Z" })] }, now);
  assert.equal(result.length, 1);
  assert.equal(result[0].exceptionType, "BLOCKED_WORK");
  assert.deepEqual(result[0].dependencyReferences, [reference]);
  assert.deepEqual(result[0].blockerReferences, [reference]);
});

test("cross-division inputs remain separate and source inputs are not mutated", () => {
  const realty = work("r", { attention: "BLOCKED", blocker: "Closing dependency", blockerState: "VERIFIED" });
  const capital = work("c", { key: "CAPITAL_ADVISORY:c:ACTIVE", division: "CAPITAL_ADVISORY", attention: "FOUNDER_DECISION", founderApprovalRequired: true, requiredHumanAction: "Approve package" });
  const brokerage = work("b", { key: "WATCH_BROKERAGE:b:ACTIVE", division: "WATCH_BROKERAGE", owner: null, ownerState: "UNKNOWN" });
  const input = { work: [realty, capital, brokerage], facts: [fact(brokerage.key, "OWNERSHIP_REQUIRED", "broker-owner")] };
  const before = structuredClone(input);
  const result = bottleneckExceptionAgent(input, now);
  assert.deepEqual(input, before);
  assert.deepEqual(result.map(x => x.division).sort(), ["CAPITAL_ADVISORY", "REALTY", "WATCH_BROKERAGE"]);
  assert.deepEqual(bottleneckExceptionAgent(input, now), result);
});
