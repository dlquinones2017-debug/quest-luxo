import test from "node:test";
import assert from "node:assert/strict";
import { watchBrokerageRevenueAgent } from "../src/lib/agents/watchBrokerageRevenueAgent.ts";

const base = {
  key: "WATCH_BROKERAGE:lead-1:QUALIFICATION",
  division: "WATCH_BROKERAGE",
  recordId: "lead-1",
  stage: "QUALIFICATION",
  status: "READY",
  reason: "verified",
  evidenceIds: ["econ-1"],
  sourceSystem: "quest-luxo-lead-storage",
  updatedAt: "2026-10-07T00:00:00Z",
  estimatedRevenue: 2000,
  probability: null,
  urgency: 80,
  evidenceState: "VERIFIED",
  expectedRevenue: null,
  revenueScore: 2000,
};

test("agent ignores non-brokerage actions", () => {
  const out = watchBrokerageRevenueAgent([{ ...base, division: "REALTY" }]);
  assert.equal(out.length, 0);
});

test("founder-required records remain founder controlled", () => {
  const [rec] = watchBrokerageRevenueAgent([{ ...base, status: "REQUIRES_FOUNDER" }]);
  assert.equal(rec.kind, "FOUNDER_REVIEW");
  assert.match(rec.requiredHumanAction, /Founder must review and explicitly approve/);
});

test("unknown evidence becomes verification work, not a revenue claim", () => {
  const [rec] = watchBrokerageRevenueAgent([{
    ...base,
    status: "UNKNOWN",
    evidenceState: "REQUIRES_VERIFICATION",
    estimatedRevenue: null,
    expectedRevenue: null,
    revenueScore: null,
    evidenceIds: [],
  }]);
  assert.equal(rec.kind, "VERIFY_ECONOMICS");
});

test("verified ready work is recommendation-only", () => {
  const [rec] = watchBrokerageRevenueAgent([base]);
  assert.equal(rec.kind, "ADVANCE_REVENUE_WORK");
  assert.match(rec.requiredHumanAction, /no external action is executed by this agent/);
});
