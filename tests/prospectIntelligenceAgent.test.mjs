import test from "node:test";
import assert from "node:assert/strict";
import { classifyProspect, rankProspects } from "../src/lib/agents/prospectIntelligenceAgent.ts";

const base = (id, overrides={}) => ({
  id, name:id, source:"verified-test", evidenceState:"VERIFIED",
  commercialFit:80, referralLeverage:50, accessibility:70, conversationRelevance:80,
  reason:"verified fit", ...overrides
});

test("high direct buyer is prioritized", () => {
  const result = classifyProspect(base("buyer",{commercialFit:95}));
  assert.equal(result.classification,"DIRECT_BUYER");
  assert.equal(result.priority,"HIGH");
  assert.ok((result.score ?? 0) >= 85);
});

test("referral node can outrank weak buyer fit", () => {
  const result = classifyProspect(base("referrer",{commercialFit:40,referralLeverage:95}));
  assert.equal(result.classification,"REFERRAL_NODE");
  assert.equal(result.priority,"MEDIUM");
});

test("unverified prospect cannot be promoted", () => {
  const result = classifyProspect(base("unknown",{evidenceState:"REQUIRES_VERIFICATION"}));
  assert.equal(result.priority,"VERIFY");
  assert.equal(result.score,null);
});

test("ranking is deterministic", () => {
  const result = rankProspects([base("low",{commercialFit:20,conversationRelevance:20}),base("high",{commercialFit:95,conversationRelevance:95})]);
  assert.equal(result[0].prospectId,"high");
});
