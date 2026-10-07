import test from "node:test";
import assert from "node:assert/strict";
import { coordinateRevenueAgents } from "../src/lib/command/revenueAgentCoordinator.ts";

const action = (division, recordId) => ({
  key: `${division}:${recordId}:QUALIFICATION`,
  division,
  recordId,
  stage: "QUALIFICATION",
  status: "READY",
  reason: "verified",
  evidenceIds: ["evidence-1"],
  sourceSystem: "test",
  updatedAt: "2026-10-07T00:00:00Z",
  estimatedRevenue: 1000,
  probability: null,
  urgency: 50,
  evidenceState: "VERIFIED",
  expectedRevenue: null,
  revenueScore: 1000,
});

test("coordinator delegates each revenue division exactly once", () => {
  const result = coordinateRevenueAgents([
    action("WATCH_BROKERAGE", "watch-1"),
    action("CAPITAL_ADVISORY", "capital-1"),
    action("REALTY", "realty-1"),
  ]);
  assert.equal(result.brokerage.length, 1);
  assert.equal(result.capital.length, 1);
  assert.equal(result.realty.length, 1);
  assert.equal(result.totalRecommendations, 3);
});

test("coordinator preserves empty authoritative state", () => {
  const result = coordinateRevenueAgents([]);
  assert.deepEqual(result.brokerage, []);
  assert.deepEqual(result.capital, []);
  assert.deepEqual(result.realty, []);
  assert.equal(result.totalRecommendations, 0);
});

test("coordinator does not create cross-division recommendations", () => {
  const result = coordinateRevenueAgents([action("WATCH_BROKERAGE", "watch-1")]);
  assert.equal(result.brokerage.length, 1);
  assert.equal(result.capital.length, 0);
  assert.equal(result.realty.length, 0);
});
