import test from "node:test";
import assert from "node:assert/strict";
import { realtyRevenueAgent } from "../src/lib/agents/realtyRevenueAgent.ts";

const base = {
  key: "REALTY:lead-1:UNDERWRITE",
  division: "REALTY",
  recordId: "lead-1",
  stage: "UNDERWRITE",
  status: "READY",
  reason: "verified",
  evidenceIds: ["deal-1"],
  sourceSystem: "REALTY_PIPELINE",
  updatedAt: "2026-10-07T00:00:00Z",
  estimatedRevenue: 10000,
  probability: null,
  urgency: 80,
  evidenceState: "VERIFIED",
  expectedRevenue: null,
  revenueScore: 10000,
};

test("agent ignores non-realty actions", () => {
  const out = realtyRevenueAgent([{ ...base, division: "CAPITAL_ADVISORY" }]);
  assert.equal(out.length, 0);
});

test("founder-required realty work remains founder controlled", () => {
  const [rec] = realtyRevenueAgent([{ ...base, status: "REQUIRES_FOUNDER" }]);
  assert.equal(rec.kind, "FOUNDER_REVIEW");
  assert.match(rec.requiredHumanAction, /Founder must review and explicitly approve/);
});

test("unknown realty evidence becomes verification work", () => {
  const [rec] = realtyRevenueAgent([{
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

test("verified ready realty work is recommendation-only", () => {
  const [rec] = realtyRevenueAgent([base]);
  assert.equal(rec.kind, "ADVANCE_DEAL_WORK");
  assert.match(rec.requiredHumanAction, /sends no offers and makes no external commitment/);
});
