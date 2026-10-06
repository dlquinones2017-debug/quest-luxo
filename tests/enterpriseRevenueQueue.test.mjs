import test from "node:test";
import assert from "node:assert/strict";
import { enterpriseRevenueFounderQueue } from "../src/lib/command/enterpriseRevenueQueue.ts";

const now = new Date("2026-10-06T23:30:00Z");
const record = (division, recordId, overrides = {}) => ({
  division, recordId, stage: "ACTIVE", status: "READY", reason: "Verified revenue opportunity.",
  sourceSystem: "test", updatedAt: "2026-10-06T23:00:00Z", evidenceIds: [`ev-${recordId}`],
  evidenceState: "VERIFIED", estimatedRevenue: 1000, probability: 0.5, urgency: 0, ...overrides,
});

test("ranks verified revenue across brokerage, capital, and realty", () => {
  const q = enterpriseRevenueFounderQueue({
    brokerage: [record("WATCH_BROKERAGE", "watch", { estimatedRevenue: 2000, probability: 0.5 })],
    capital: [record("CAPITAL_ADVISORY", "capital", { estimatedRevenue: 5000, probability: 0.5 })],
    realty: [record("REALTY", "realty", { estimatedRevenue: 3000, probability: 0.5 })],
  }, now);
  assert.deepEqual(q.map(x => x.recordId), ["capital", "realty", "watch"]);
});

test("degrades unverified evidence instead of manufacturing revenue", () => {
  const q = enterpriseRevenueFounderQueue({ capital: [record("CAPITAL_ADVISORY", "unknown", {
    evidenceState: "REQUIRES_VERIFICATION", evidenceIds: [], estimatedRevenue: 999999, probability: 1,
  })] }, now);
  assert.equal(q[0].status, "UNKNOWN");
  assert.equal(q[0].estimatedRevenue, null);
  assert.equal(q[0].expectedRevenue, null);
});

test("deduplicates the same division record and stage using the latest evidence", () => {
  const older = record("REALTY", "deal", { updatedAt: "2026-10-06T22:00:00Z", estimatedRevenue: 1000 });
  const newer = record("REALTY", "deal", { updatedAt: "2026-10-06T23:00:00Z", estimatedRevenue: 4000 });
  const q = enterpriseRevenueFounderQueue({ realty: [older, newer] }, now);
  assert.equal(q.length, 1);
  assert.equal(q[0].estimatedRevenue, 4000);
});

test("preserves founder-required action without overriding revenue ranking", () => {
  const q = enterpriseRevenueFounderQueue({
    brokerage: [record("WATCH_BROKERAGE", "ready", { estimatedRevenue: 10000, probability: 1 })],
    capital: [record("CAPITAL_ADVISORY", "founder", {
      status: "REQUIRES_FOUNDER", requiredHumanAction: "Founder approval required",
      estimatedRevenue: 1000, probability: 0.5,
    })],
  }, now);
  assert.deepEqual(q.map(x => x.recordId), ["ready", "founder"]);
  const founder = q.find(x => x.recordId === "founder");
  assert.equal(founder?.status, "REQUIRES_FOUNDER");
  assert.equal(founder?.requiredHumanAction, "Founder approval required");
});

test("rejects records routed through the wrong division input", () => {
  assert.throws(() => enterpriseRevenueFounderQueue({
    capital: [record("WATCH_BROKERAGE", "misrouted")],
  }, now), /Expected CAPITAL_ADVISORY revenue record/);
});
