import test from "node:test";
import assert from "node:assert/strict";
import { qualifyBorrower, rankSources, complianceDecision, compareOffers, recordOutcome } from "../src/lib/capital/fundingAgents.ts";
test("capital lifecycle: intake to verified outcome retains founder gate",()=>{
 const borrower={borrowerId:"B-E2E",businessId:"QL",purpose:"equipment",requestedAmount:25000,timeInBusinessMonths:0,revenueEvidence:"UNKNOWN",identityEvidence:"VERIFIED"};
 assert.equal(qualifyBorrower(borrower).stage,"FUNDABILITY");
 const source={sourceId:"SRC",product:"startup equipment",minAmount:5000,maxAmount:50000,startupEligible:true,revenueRequired:false,taxReturnsRequired:false,pullType:"SOFT",requirementsVerified:"VERIFIED"};
 assert.equal(rankSources(borrower,[source]).length,1);
 const gate=complianceDecision(borrower.borrowerId,source,{jurisdictionVerified:"VERIFIED",productComplianceVerified:"VERIFIED",disclosuresReady:"VERIFIED"});
 assert.equal(gate.stage,"FOUNDER_APPROVAL"); assert.equal(gate.status,"REQUIRES_FOUNDER");
 const offers=compareOffers([{sourceId:"SRC",amount:25000,apr:12,termMonths:36,fees:500,evidenceId:"OFFER-1",status:"VERIFIED"}]);
 assert.equal(offers.length,1);
 assert.equal(recordOutcome(borrower.borrowerId,"FUNDED","FUNDING-1").stage,"FOLLOW_UP");
});
