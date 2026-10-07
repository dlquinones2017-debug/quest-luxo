import test from "node:test";
import assert from "node:assert/strict";
import { classifyProspect, rankProspects } from "../src/lib/agents/prospectIntelligenceAgent.ts";
const base=(id,overrides={})=>({id,name:id,source:"verified-test",evidenceState:"VERIFIED",commercialFit:80,referralLeverage:50,accessibility:70,conversationRelevance:80,reason:"verified fit",...overrides});
test("high direct buyer is prioritized",()=>{const r=classifyProspect(base("buyer",{commercialFit:95}));assert.equal(r.classification,"DIRECT_BUYER");assert.equal(r.priority,"HIGH");assert.ok((r.score??0)>=75);});
test("referral node can outrank weak buyer fit",()=>{const r=classifyProspect(base("referrer",{commercialFit:40,referralLeverage:95}));assert.equal(r.classification,"REFERRAL_NODE");assert.ok(["HIGH","MEDIUM"].includes(r.priority));});
test("unverified prospect cannot be promoted",()=>{const r=classifyProspect(base("unknown",{evidenceState:"REQUIRES_VERIFICATION"}));assert.equal(r.priority,"VERIFY");assert.equal(r.score,null);});
test("ranking is deterministic",()=>{const r=rankProspects([base("low",{commercialFit:20,conversationRelevance:20}),base("high",{commercialFit:95,conversationRelevance:95})]);assert.equal(r[0].prospectId,"high");});
