import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { enterpriseLeadIntelligence } from "../src/lib/command/enterpriseLeadIntelligence.ts";
import { enterpriseIntakeReconciliation } from "../src/lib/command/enterpriseIntakeReconciliation.ts";
import { storedEnterpriseRevenueBrief } from "../src/lib/command/storedEnterpriseRevenueBrief.ts";

const now = new Date("2026-10-19T23:30:00.000Z");
const hash = s => createHash("sha256").update(s).digest("hex");
function receipt(division, tag, canonicalRecordId, extras = {}) {
  const sourceRecordId = "gmail:" + hash(tag);
  return {
    division, provider: "FORMSUBMIT", sourceRecordId,
    ...(canonicalRecordId ? { canonicalRecordId } : {}),
    receivedAt: "2026-10-19T23:15:00.000Z",
    evidenceIds: [sourceRecordId, "approval:" + tag],
    receiptVerification: "VERIFIED",
    qualificationVerification: "UNKNOWN", notification: "UNKNOWN",
    ...extras,
  };
}
function capital(borrowerId, evidenceIds = []) {
  return {
    borrowerId, stage: "SOURCE_MATCH", status: "REQUIRES_FOUNDER",
    reason: "Synthetic review", updatedAt: now.toISOString(),
    evidenceIds, evidenceState: "UNKNOWN",
  };
}
function realty(leadId, evidenceIds = []) {
  return {
    leadId, stage: "SOURCE_MATCH", status: "REQUIRES_FOUNDER",
    reason: "Synthetic review", updatedAt: now.toISOString(),
    evidenceIds, evidenceState: "UNKNOWN",
  };
}
const evaluate = (receipts, capitalRecords = [], realtyRecords = []) =>
  enterpriseIntakeReconciliation(
    enterpriseLeadIntelligence(receipts, now), capitalRecords, realtyRecords);

test("unlinked Capital and Realty source receipts remain reviewable, never silently assigned", () => {
  const c = receipt("CAPITAL_ADVISORY", "c1");
  const r = receipt("REALTY", "r1");
  const report = evaluate([c, r]);
  assert.deepEqual(report.findings.map(f => f.state),
    ["CANONICAL_LINK_MISSING", "CANONICAL_LINK_MISSING"]);
  assert.deepEqual(report.divisions.map(d => d.missingCanonicalLinks), [1, 1]);
  assert.equal(report.externalActionsTaken, false);
  assert.ok(report.findings.every(f => f.founderApprovalRequired));
  assert.ok(report.divisions.every(d => d.durableReconciliationVerified === false));
});

test("canonical case absent after restart is reported without fabricating a recovered CRM record", () => {
  const c = receipt("CAPITAL_ADVISORY", "missing", "capital-case");
  const report = evaluate([c], [], []);
  assert.equal(report.findings[0].state, "CANONICAL_RECORD_MISSING");
  assert.equal(report.divisions[0].missingCanonicalRecords, 1);
  assert.equal(report.divisions[0].matchedInMemoryOnly, 0);
});

test("matching case identity without linked evidence cannot pass reconciliation", () => {
  const c = receipt("CAPITAL_ADVISORY", "bad-evidence", "capital-case");
  const report = evaluate([c], [capital("capital-case", ["unrelated-proof"])]);
  assert.equal(report.findings[0].state, "CANONICAL_EVIDENCE_MISSING");
  assert.equal(report.divisions[0].missingEvidence, 1);
});

test("source-linked record is still marked volatile even with matching evidence", () => {
  const c = receipt("CAPITAL_ADVISORY", "match-capital", "capital-case");
  const r = receipt("REALTY", "match-realty", "realty-case");
  const report = evaluate(
    [c, r],
    [capital("capital-case", [c.sourceRecordId])],
    [realty("realty-case", [r.evidenceIds[1]])],
  );
  assert.deepEqual(report.findings.map(f => f.state),
    ["MATCHED_VOLATILE_ONLY", "MATCHED_VOLATILE_ONLY"]);
  assert.deepEqual(report.divisions.map(d => d.matchedInMemoryOnly), [1, 1]);
  assert.ok(report.divisions.every(d => !d.durableReconciliationVerified));
});

test("incorrect division record cannot claim the matched canonical case", () => {
  const c = receipt("CAPITAL_ADVISORY", "cross-div", "same-id");
  const report = evaluate([c], [], [realty("same-id", [c.sourceRecordId])]);
  assert.equal(report.findings[0].state, "CANONICAL_RECORD_MISSING");
});

test("unverified source is held before checking a purported canonical match", () => {
  const c = receipt("CAPITAL_ADVISORY", "invalid", "capital-case",
    { receiptVerification: "UNKNOWN" });
  const report = evaluate([c], [capital("capital-case", [c.sourceRecordId])]);
  assert.equal(report.findings[0].state, "SOURCE_REVIEW_REQUIRED");
  assert.equal(report.divisions[0].sourceReviewRequired, 1);
});

test("Founder Brief exposes reconciliation separately from financial queue and keeps readers read-only", async () => {
  const c = receipt("CAPITAL_ADVISORY", "brief-c", "capital-case");
  const r = receipt("REALTY", "brief-r");
  let readCapital = 0, readRealty = 0;
  const capitalRecords = [capital("capital-case", [c.sourceRecordId])];
  const realtyRecords = [];
  const before = JSON.stringify({ capitalRecords, realtyRecords });
  const result = await storedEnterpriseRevenueBrief(now, {
    readBrokerage: async () => [],
    readBrokerageSnapshot: async () => ({
      records: [], status: "COMPLETE", malformedRows: 0,
    }),
    readCapital: () => { readCapital++; return capitalRecords; },
    readRealty: () => { readRealty++; return realtyRecords; },
    readIntakeSnapshot: async () => ({
      receipts: [c, r],
      observations: {
        CAPITAL_ADVISORY: { status: "PARTIAL" },
        REALTY: { status: "PARTIAL" },
      },
    }),
  });
  assert.equal(readCapital, 1);
  assert.equal(readRealty, 1);
  assert.deepEqual(result.intakeReconciliation.divisions.map(d => d.retainedReceipts), [1, 1]);
  assert.deepEqual(result.intakeReconciliation.findings.map(f => f.state),
    ["MATCHED_VOLATILE_ONLY", "CANONICAL_LINK_MISSING"]);
  assert.ok(result.queue.filter(q =>
    q.division === "CAPITAL_ADVISORY" || q.division === "REALTY")
    .every(q => q.expectedRevenue === null));
  assert.equal(result.intakeReconciliation.externalActionsTaken, false);
  assert.equal(JSON.stringify({ capitalRecords, realtyRecords }), before);
});

test("no retained receipts is not counted as durable CRM completeness", () => {
  const report = evaluate([]);
  assert.equal(report.findings.length, 0);
  assert.deepEqual(report.divisions.map(d => d.retainedReceipts), [0, 0]);
  assert.ok(report.divisions.every(d => d.durableReconciliationVerified === false));
});
