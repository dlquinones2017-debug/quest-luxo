import test from "node:test";
import assert from "node:assert/strict";
import {
  enterpriseLeadIntelligence,
  enterpriseLeadRevenueRecords,
  enterpriseLeadFounderQueue,
} from "../src/lib/command/enterpriseLeadIntelligence.ts";

const now = new Date("2026-10-18T20:00:00Z");
const lead = (changes = {}) => ({
  division: "CAPITAL_ADVISORY", provider: "FORMSUBMIT", sourceRecordId: "gmail-a1",
  receivedAt: "2026-10-18T18:00:00Z", evidenceIds: ["gmail-message-a1"],
  receiptVerification: "VERIFIED", notification: "UNKNOWN", ...changes,
});

test("honest zero state without phantom leads", () => {
  assert.deepEqual(enterpriseLeadIntelligence([], now), []);
  assert.deepEqual(enterpriseLeadFounderQueue([], now), []);
});
test("three divisions route into existing enterprise revenue queue with no invented economics", () => {
  const findings = enterpriseLeadIntelligence([
    lead({ division: "WATCH_BROKERAGE", provider: "BEGIN_YOUR_QUEST", sourceRecordId: "w1" }),
    lead({ division: "REALTY", sourceRecordId: "r1" }),
    lead({ sourceRecordId: "c1" }),
  ], now);
  const queue = enterpriseLeadFounderQueue(findings, now);
  assert.equal(queue.length, 3);
  assert.deepEqual(new Set(queue.map((r) => r.division)), new Set(["WATCH_BROKERAGE", "REALTY", "CAPITAL_ADVISORY"]));
  assert.ok(queue.every((r) => r.expectedRevenue === null && r.estimatedRevenue === null));
});
test("a verified receipt is not a qualified borrower or an approved outreach", () => {
  const item = enterpriseLeadIntelligence([lead()], now)[0];
  assert.equal(item.state, "QUALIFICATION_NEEDED");
  assert.equal(item.founderApprovalRequired, true);
  assert.equal(enterpriseLeadFounderQueue([item], now)[0].status, "UNKNOWN");
});
test("qualification requires its own evidence and only founder can act", () => {
  const item = enterpriseLeadIntelligence([lead({ qualificationVerification: "VERIFIED", qualificationEvidenceIds: ["qualified-a1"] })], now)[0];
  assert.equal(item.state, "READY_FOR_FOUNDER");
  const queue = enterpriseLeadFounderQueue([item], now);
  assert.equal(queue[0].status, "REQUIRES_FOUNDER");
  assert.equal(queue[0].estimatedRevenue, null);
});
test("unverified, missing, malformed or future timestamps are never silently replaced", () => {
  for (const receivedAt of [undefined, null, "yesterday", "2026-10-19T10:00:00Z"]) {
    const item = enterpriseLeadIntelligence([lead({ receivedAt })], now)[0];
    assert.equal(item.receivedAt, null);
    assert.equal(item.state, "VERIFY_SOURCE");
    assert.equal(enterpriseLeadRevenueRecords([item]).length, 0);
  }
});
test("a claim of VERIFIED without receipt evidence stays unverified", () => {
  const item = enterpriseLeadIntelligence([lead({ evidenceIds: [] })], now)[0];
  assert.equal(item.state, "VERIFY_SOURCE");
  assert.equal(enterpriseLeadFounderQueue([item], now)[0].status, "UNKNOWN");
});
test("verified notification failure is operationally blocked, never silently classified as success", () => {
  const item = enterpriseLeadIntelligence([lead({ notification: "FAILED" })], now)[0];
  assert.equal(item.state, "NOTIFICATION_FAILURE");
  assert.equal(enterpriseLeadFounderQueue([item], now)[0].status, "BLOCKED");
});
test("duplicate receipts are stable, sorted and idempotent", () => {
  const a = lead({sourceRecordId: "a"});
  const b = lead({sourceRecordId: "b"});
  assert.deepEqual(enterpriseLeadIntelligence([b,a,a],now),enterpriseLeadIntelligence([a,b],now));
});
test("conflicting observations of one source record fail closed", () => {
  const records = [lead({notification:"FAILED"}),lead({notification:"ACCEPTED_BY_PROVIDER"})];
  const item=enterpriseLeadIntelligence(records,now)[0];
  assert.equal(item.state,"EVIDENCE_CONFLICT");
  assert.equal(item.receivedAt,null);
  assert.equal(enterpriseLeadRevenueRecords([item]).length,0);
});
test("mismatched providers and identifying emails cannot impersonate trusted inputs", () => {
  assert.throws(()=>enterpriseLeadIntelligence([lead({division:"REALTY",provider:"BEGIN_YOUR_QUEST"})],now));
  assert.throws(()=>enterpriseLeadIntelligence([lead({sourceRecordId:"person@example.com"})],now));
});
test("metadata conversion does not mutate evidence, source data or input arrays", () => {
  const raw=Object.freeze(lead({ evidenceIds:Object.freeze(["ev-b","ev-a","ev-a"]) }));
  const inputs=Object.freeze([raw]);
  const findings=enterpriseLeadIntelligence(inputs,now);
  assert.deepEqual(findings[0].evidenceIds,["ev-a","ev-b"]);
  assert.deepEqual(raw.evidenceIds,["ev-b","ev-a","ev-a"]);
  assert.ok(Object.isFrozen(findings[0]));
  assert.ok(Object.isFrozen(findings[0].evidenceIds));
});
test("unknown evidence and qualification states are preserved", () => {
  const item=enterpriseLeadIntelligence([lead({receiptVerification:"UNKNOWN",qualificationVerification:"REQUIRES_VERIFICATION"})],now)[0];
  assert.equal(item.receiptVerification,"UNKNOWN");
  assert.equal(item.qualificationVerification,"REQUIRES_VERIFICATION");
  assert.equal(item.state,"VERIFY_SOURCE");
});
