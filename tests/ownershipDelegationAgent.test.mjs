import test from "node:test";
import assert from "node:assert/strict";
import { ownershipDelegationAgent } from "../src/lib/command/ownershipDelegationAgent.ts";

const work = (recordId, overrides = {}) => ({
  key: `REALTY:${recordId}:ACTIVE`, division: "REALTY", recordId, attention: "ADVANCE",
  recommendation: "Advance internally", evidenceState: "VERIFIED", evidenceIds: [`ev-${recordId}`],
  founderApprovalRequired: false, requiredHumanAction: null, owner: null, ownerState: "UNKNOWN",
  blocker: null, blockerState: "UNKNOWN", dependencyKeys: [], dependencyState: "UNKNOWN",
  coordinatingDivisions: [], updatedAt: "2026-10-07T22:00:00Z", ageDays: 0,
  sourceSystems: ["realty"], authority: "RECOMMENDATION_ONLY", prohibitedActions: ["MESSAGE", "MUTATE_AUTHORITATIVE_STATE"],
  ...overrides,
});
const claim = (workKey, overrides = {}) => ({
  workKey, division: "REALTY", role: "REALTY_OPERATIONS", evidenceState: "VERIFIED",
  evidenceIds: ["role-1"], reason: "Verified operating model assigns this work to Realty Operations.", ...overrides,
});
const exception = (workKey, overrides = {}) => ({
  key: `${workKey}:EXCEPTION:blocker`, workKey, division: "REALTY", exceptionType: "BLOCKED_WORK",
  severity: "HIGH", urgency: "HIGH", evidenceIds: ["exception-1"], owner: null, ownershipState: "UNKNOWN",
  dependencyReferences: [], blockerReferences: ["blocker"], ageDays: 1, founderActionRequired: false,
  recommendedInternalAction: "Resolve internally", authority: "RECOMMENDATION_ONLY", prohibitedActions: ["MESSAGE"], ...overrides,
});

test("honest zero state creates no delegations", () => assert.deepEqual(ownershipDelegationAgent({ work: [] }), []));

test("verified role evidence assigns an internal role, never a person", () => {
  const item = work("verified");
  const [result] = ownershipDelegationAgent({ work: [item], ownershipEvidence: [claim(item.key)] });
  assert.equal(result.recommendedOwningRole, "REALTY_OPERATIONS");
  assert.equal(result.ownershipState, "VERIFIED");
  assert.equal(result.founderEscalation, false);
});

test("absent and unverified ownership remain UNKNOWN without invention", () => {
  const item = work("unknown");
  const [result] = ownershipDelegationAgent({ work: [item], ownershipEvidence: [claim(item.key, { evidenceState: "REQUIRES_VERIFICATION", evidenceIds: [] })] });
  assert.equal(result.recommendedOwningRole, null);
  assert.equal(result.ownershipState, "UNKNOWN");
  assert.match(result.delegationReason, /without inventing/i);
});

test("conflicting verified roles are preserved as CONFLICT", () => {
  const item = work("conflict");
  const claims = [claim(item.key), claim(item.key, { division: "CAPITAL_ADVISORY", role: "CAPITAL_ADVISORY_OPERATIONS", evidenceIds: ["role-2"] })];
  const [result] = ownershipDelegationAgent({ work: [item], ownershipEvidence: claims });
  assert.equal(result.ownershipState, "CONFLICT");
  assert.equal(result.recommendedOwningRole, null);
  assert.equal(result.founderEscalation, true);
});

test("founder-reserved work escalates only the binding decision", () => {
  const item = work("founder", { founderApprovalRequired: true, requiredHumanAction: "Approve binding terms" });
  const [result] = ownershipDelegationAgent({ work: [item], ownershipEvidence: [claim(item.key)] });
  assert.equal(result.founderEscalation, true);
  assert.equal(result.requiredFounderAction, "Approve binding terms");
  assert.match(result.recommendedInternalHandoff, /operational preparation/i);
});

test("non-founder operational work stays delegated", () => {
  const item = work("ordinary");
  const [result] = ownershipDelegationAgent({ work: [item], ownershipEvidence: [claim(item.key)] });
  assert.equal(result.founderEscalation, false);
  assert.equal(result.requiredFounderAction, null);
  assert.match(result.recommendedInternalHandoff, /Route internally/);
});

test("verified cross-division routing uses the supported target role without mutating the source", () => {
  const item = work("cross");
  const input = { work: [item], ownershipEvidence: [claim(item.key, { division: "CAPITAL_ADVISORY", role: "CAPITAL_ADVISORY_OPERATIONS", evidenceIds: ["route-1"] })] };
  const before = structuredClone(input);
  const [result] = ownershipDelegationAgent(input);
  assert.equal(result.division, "CAPITAL_ADVISORY");
  assert.equal(result.recommendedOwningRole, "CAPITAL_ADVISORY_OPERATIONS");
  assert.deepEqual(input, before);
});

test("duplicate inputs collapse to stable delegation keys and deterministic output", () => {
  const older = work("duplicate", { updatedAt: "2026-10-01T00:00:00Z" });
  const newer = work("duplicate", { updatedAt: "2026-10-07T00:00:00Z" });
  const evidence = claim(newer.key);
  const first = ownershipDelegationAgent({ work: [older, newer], ownershipEvidence: [evidence, evidence] });
  const second = ownershipDelegationAgent({ work: [newer, older], ownershipEvidence: [evidence] });
  assert.equal(first.length, 1);
  assert.deepEqual(first, second);
  assert.equal(first[0].delegationKey, `${newer.key}:DELEGATION:REALTY%3AREALTY_OPERATIONS`);
});

test("upstream exception and all verified evidence IDs are preserved", () => {
  const item = work("evidence");
  const issue = exception(item.key);
  const [result] = ownershipDelegationAgent({ work: [item], exceptions: [issue], ownershipEvidence: [claim(item.key)] });
  assert.equal(result.exceptionKey, issue.key);
  assert.equal(result.upstreamBlockerExceptionReference, issue.key);
  assert.deepEqual(result.evidenceIds, ["ev-evidence", "exception-1", "role-1"]);
});

test("verified capital exposure requires founder action while UNKNOWN/TBD authority does not", () => {
  const capital = work("capital", { key: "CAPITAL_ADVISORY:capital:ACTIVE", division: "CAPITAL_ADVISORY" });
  const ownership = claim(capital.key, { division: "CAPITAL_ADVISORY", role: "CAPITAL_ADVISORY_OPERATIONS" });
  const unknown = { workKey: capital.key, kind: "CAPITAL_EXPOSURE", evidenceState: "TBD", evidenceIds: [], requiredFounderAction: "Approve capital deployment" };
  assert.equal(ownershipDelegationAgent({ work: [capital], ownershipEvidence: [ownership], authorityEvidence: [unknown] })[0].founderEscalation, false);
  const verified = { ...unknown, evidenceState: "VERIFIED", evidenceIds: ["capital-risk-1"] };
  const [result] = ownershipDelegationAgent({ work: [capital], ownershipEvidence: [ownership], authorityEvidence: [verified] });
  assert.equal(result.founderEscalation, true);
  assert.equal(result.requiredFounderAction, "Approve capital deployment");
  assert.ok(result.prohibitedActions.includes("DEPLOY_CAPITAL"));
  assert.ok(result.prohibitedActions.includes("SUBMIT_APPLICATION"));
});

test("the recommendation layer is non-mutating and idempotent", () => {
  const item = work("immutable", { blocker: "Permit", blockerState: "VERIFIED" });
  const input = { work: [item], exceptions: [exception(item.key)], ownershipEvidence: [claim(item.key)] };
  const before = structuredClone(input);
  const first = ownershipDelegationAgent(input);
  assert.deepEqual(input, before);
  assert.deepEqual(ownershipDelegationAgent(input), first);
  assert.equal(first[0].authority, "RECOMMENDATION_ONLY");
  assert.ok(first[0].prohibitedActions.includes("MUTATE_AUTHORITATIVE_STATE"));
});
