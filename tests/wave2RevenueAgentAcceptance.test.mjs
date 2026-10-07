import test from "node:test";
import assert from "node:assert/strict";
import { enterpriseLiveRevenueBrief } from "../src/lib/command/enterpriseLiveRevenueBrief.ts";
import { coordinateRevenueAgents } from "../src/lib/command/revenueAgentCoordinator.ts";

const now = new Date("2026-10-07T01:00:00Z");

test("stored capital and realty records flow through enterprise queue into the correct agents", () => {
  const capital = {
    borrowerId: "capital-1", stage: "SOURCE_MATCH", status: "REQUIRES_FOUNDER",
    reason: "Founder approval required", updatedAt: "2026-10-07T00:30:00Z",
    evidenceIds: ["capital-evidence"], evidenceState: "VERIFIED",
    estimatedRevenue: 4000, probability: .5, urgency: 80,
    requiredHumanAction: "Approve funding source",
  };
  const realty = {
    leadId: "realty-1", stage: "UNDERWRITING", status: "READY",
    reason: "Verified deal", updatedAt: "2026-10-07T00:30:00Z",
    evidenceIds: ["realty-evidence"], evidenceState: "VERIFIED",
    estimatedRevenue: 6000, probability: .5, urgency: 60,
  };
  const brief = enterpriseLiveRevenueBrief({ capital: [capital], realty: [realty] }, now);
  const coordinated = coordinateRevenueAgents(brief.queue);

  assert.equal(coordinated.brokerage.length, 0);
  assert.equal(coordinated.capital[0].kind, "FOUNDER_REVIEW");
  assert.equal(coordinated.realty[0].kind, "ADVANCE_DEAL_WORK");
  assert.equal(brief.founderActions[0].recordId, "capital-1");
});

test("unverified stored revenue evidence remains verification work after coordination", () => {
  const capital = {
    borrowerId: "capital-unknown", stage: "FUNDABILITY", status: "READY",
    reason: "Claimed ready", updatedAt: "2026-10-07T00:30:00Z",
    evidenceIds: [], evidenceState: "REQUIRES_VERIFICATION",
    estimatedRevenue: 9000, probability: .8, urgency: 90,
  };
  const brief = enterpriseLiveRevenueBrief({ capital: [capital] }, now);
  const coordinated = coordinateRevenueAgents(brief.queue);

  assert.equal(brief.queue[0].status, "UNKNOWN");
  assert.equal(brief.queue[0].expectedRevenue, null);
  assert.equal(coordinated.capital[0].kind, "VERIFY_EVIDENCE");
});

test("empty stored state stays empty through brief and agent coordination", () => {
  const brief = enterpriseLiveRevenueBrief({}, now);
  const coordinated = coordinateRevenueAgents(brief.queue);

  assert.equal(brief.queue.length, 0);
  assert.equal(brief.founderActions.length, 0);
  assert.equal(coordinated.totalRecommendations, 0);
});
