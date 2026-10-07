import test from "node:test";
import assert from "node:assert/strict";
import { capitalAdvisoryRevenueAgent } from "../src/lib/agents/capitalAdvisoryRevenueAgent.ts";

const base = {
  key: "CAPITAL_ADVISORY:borrower-1:FUNDABILITY",
  division: "CAPITAL_ADVISORY",
  recordId: "borrower-1",
  stage: "FUNDABILITY",
  status: "READY",
  reason: "verified",
  evidenceIds: ["funding-1"],
  sourceSystem: "CAPITAL_PIPELINE",
  updatedAt: "2026-10-07T00:00:00Z",
  estimatedRevenue: 5000,
  probability: null,
  urgency: 80,
  evidenceState: "VERIFIED",
  expectedRevenue: null,
  revenueScore: 5000,
};

test("agent ignores non-capital actions", () => {
  const out = capitalAdvisoryRevenueAgent([{ ...base, division: "WATCH_BROKERAGE" }]);
  assert.equal(out.length, 0);
});

test("founder-required capital work remains founder controlled", () => {
  const [rec] = capitalAdvisoryRevenueAgent([{ ...base, status: "REQUIRES_FOUNDER" }]);
  assert.equal(rec.kind, "FOUNDER_REVIEW");
  assert.match(rec.requiredHumanAction, /Founder must review and explicitly approve/);
});

test("unknown capital evidence becomes verification work", () => {
  const [rec] = capitalAdvisoryRevenueAgent([{
    ...base,
    status: "UNKNOWN",
    evidenceState: "REQUIRES_VERIFICATION",
    estimatedRevenue: null,
    expectedRevenue: null,
    revenueScore: null,
    evidenceIds: [],
  }]);
  assert.equal(rec.kind, "VERIFY_EVIDENCE");
});

test("verified ready capital work is recommendation-only", () => {
  const [rec] = capitalAdvisoryRevenueAgent([base]);
  assert.equal(rec.kind, "ADVANCE_FUNDING_WORK");
  assert.match(rec.requiredHumanAction, /makes no lender or client commitment/);
});
