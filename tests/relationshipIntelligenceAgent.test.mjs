import test from "node:test";
import assert from "node:assert/strict";
import { buildRelationshipRecommendation } from "../src/lib/agents/relationshipIntelligenceAgent.ts";
const prospect={id:"p1",name:"Referral",source:"verified",evidenceState:"VERIFIED",commercialFit:40,referralLeverage:95,accessibility:80,conversationRelevance:90,reason:"verified"};
const rec={prospectId:"p1",classification:"REFERRAL_NODE",score:80,priority:"HIGH",reason:"verified",founderAction:"approve"};
test("referral relationship can surface cross-division opportunities",()=>{const r=buildRelationshipRecommendation(prospect,rec);assert.ok(r.crossDivisionOpportunities.includes("LUXURY_ADVISORY"));assert.ok(r.crossDivisionOpportunities.includes("REALTY"));assert.ok(r.crossDivisionOpportunities.includes("CAPITAL_ADVISORY"));});
test("unverified relationship is held",()=>{const r=buildRelationshipRecommendation({...prospect,evidenceState:"REQUIRES_VERIFICATION"},{...rec,priority:"VERIFY",score:null});assert.deepEqual(r.crossDivisionOpportunities,[]);});
