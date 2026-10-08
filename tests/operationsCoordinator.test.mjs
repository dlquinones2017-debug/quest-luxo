import test from "node:test";
import assert from "node:assert/strict";
import { operationsCoordinator } from "../src/lib/command/operationsCoordinator.ts";

const now = new Date("2026-10-07T22:00:00Z");
const action = (recordId, overrides = {}) => ({
  key: `REALTY:${recordId}:ACTIVE`, division: "REALTY", recordId, stage: "ACTIVE", status: "READY",
  reason: "Verified work", evidenceIds: [`ev-${recordId}`], sourceSystem: "realty", updatedAt: "2026-10-05T22:00:00Z",
  priority: 3, estimatedRevenue: 1000, probability: .5, urgency: 20, evidenceState: "VERIFIED",
  expectedRevenue: 500, revenueScore: 600, ...overrides,
});

test("zero state is honest and deterministic", () => assert.deepEqual(operationsCoordinator({ queue: [] }, now), []));

test("UNKNOWN and REQUIRES_VERIFICATION are preserved without inferred ownership", () => {
  const unknown = action("unknown", { status: "UNKNOWN", evidenceState: "REQUIRES_VERIFICATION", evidenceIds: [] });
  const [item] = operationsCoordinator({ queue: [unknown], annotations: [{ workKey: unknown.key, owner: "Ops", ownerState: "REQUIRES_VERIFICATION", evidenceIds: [] }] }, now);
  assert.equal(item.attention, "VERIFY");
  assert.equal(item.evidenceState, "REQUIRES_VERIFICATION");
  assert.equal(item.owner, null);
  assert.equal(item.ownerState, "REQUIRES_VERIFICATION");
  assert.equal(item.blockerState, "UNKNOWN");
});

test("founder gates remain first-class and cannot be executed by the coordinator", () => {
  const founder = action("founder", { status: "REQUIRES_FOUNDER", requiredHumanAction: "Approve terms" });
  const [item] = operationsCoordinator({ queue: [founder] }, now);
  assert.equal(item.attention, "FOUNDER_DECISION");
  assert.equal(item.founderApprovalRequired, true);
  assert.equal(item.requiredHumanAction, "Approve terms");
  assert.equal(item.authority, "RECOMMENDATION_ONLY");
  assert.ok(item.prohibitedActions.includes("MAKE_COMMITMENT"));
  assert.ok(item.prohibitedActions.includes("MUTATE_AUTHORITATIVE_STATE"));
});

test("ownership is represented only with verified authoritative evidence", () => {
  const work = action("owned");
  const [item] = operationsCoordinator({ queue: [work], annotations: [{ workKey: work.key, owner: "Enterprise Operations", ownerState: "VERIFIED", evidenceIds: ["assignment-1"] }] }, now);
  assert.equal(item.owner, "Enterprise Operations");
  assert.equal(item.ownerState, "VERIFIED");
  assert.equal(item.ageDays, 2);
});

test("duplicate inputs resolve idempotently and do not duplicate work", () => {
  const older = action("duplicate", { updatedAt: "2026-10-01T22:00:00Z" });
  const newer = action("duplicate", { updatedAt: "2026-10-06T22:00:00Z", reason: "Latest" });
  const first = operationsCoordinator({ queue: [older, newer] }, now);
  const second = operationsCoordinator({ queue: [newer, older] }, now);
  assert.equal(first.length, 1);
  assert.deepEqual(second, first);
  assert.equal(first[0].updatedAt, newer.updatedAt);
});

test("verified dependencies expose cross-division coordination without transferring authority", () => {
  const realty = action("realty");
  const capital = action("capital", { key: "CAPITAL_ADVISORY:capital:ACTIVE", division: "CAPITAL_ADVISORY", sourceSystem: "capital" });
  const [item] = operationsCoordinator({ queue: [realty, capital], annotations: [{ workKey: realty.key, dependencyKeys: [capital.key], dependencyState: "VERIFIED", evidenceIds: ["dependency-1"] }] }, now).filter(x => x.recordId === "realty");
  assert.equal(item.attention, "COORDINATE");
  assert.deepEqual(item.dependencyKeys, [capital.key]);
  assert.deepEqual(item.coordinatingDivisions, ["CAPITAL_ADVISORY"]);
  assert.equal(item.authority, "RECOMMENDATION_ONLY");
});

test("coordination is non-mutating across authoritative and annotation inputs", () => {
  const work = action("immutable", { status: "BLOCKED", reason: "External dependency" });
  const annotation = { workKey: work.key, blocker: "Await verified document", blockerState: "VERIFIED", evidenceIds: ["blocker-1"] };
  const input = { queue: [work], annotations: [annotation] };
  const before = structuredClone(input);
  const first = operationsCoordinator(input, now);
  assert.deepEqual(input, before);
  assert.deepEqual(operationsCoordinator(input, now), first);
  assert.equal(first[0].blocker, "Await verified document");
});
