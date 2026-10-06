import test from "node:test";
import assert from "node:assert/strict";
import { qualifyBorrower, rankSources, documentationReadiness, complianceDecision, compareOffers, recordOutcome, prohibitExternalAction } from "../src/lib/capital/fundingAgents.ts";

const startup={borrowerId:"B1",businessId:"Q1",purpose:"working capital",requestedAmount:50000,timeInBusinessMonths:0,revenueEvidence:"UNKNOWN",identityEvidence:"VERIFIED"};
const soft={sourceId:"S1",product:"business line",minAmount:10000,maxAmount:100000,startupEligible:true,revenueRequired:false,taxReturnsRequired:false,pullType:"SOFT",requirementsVerified:"VERIFIED"};
const hard={...soft,sourceId:"S2",pullType:"HARD"};

test("startup/no-revenue borrower can qualify without invented revenue",()=>assert.equal(qualifyBorrower(startup).stage,"FUNDABILITY"));
test("source fit preserves startup path and prioritizes soft pull",()=>assert.deepEqual(rankSources(startup,[hard,soft]).map(x=>x.sourceId),["S1","S2"]));
test("revenue-required source is excluded without verified revenue",()=>assert.equal(rankSources(startup,[{...soft,sourceId:"S3",revenueRequired:true}]).length,0));
test("documentation does not convert unknown revenue into verified revenue",()=>assert.match(documentationReadiness(startup).reason,/no-revenue/i));
test("compliance uncertainty blocks external action",()=>assert.equal(complianceDecision("B1",soft,{jurisdictionVerified:"UNKNOWN",productComplianceVerified:"VERIFIED",disclosuresReady:"VERIFIED"}).status,"BLOCKED"));
test("hard pull requires evidence-backed consent",()=>assert.equal(complianceDecision("B1",hard,{jurisdictionVerified:"VERIFIED",productComplianceVerified:"VERIFIED",disclosuresReady:"VERIFIED"}).status,"BLOCKED"));
test("compliant soft-pull path still requires founder approval",()=>assert.equal(complianceDecision("B1",soft,{jurisdictionVerified:"VERIFIED",productComplianceVerified:"VERIFIED",disclosuresReady:"VERIFIED"}).status,"REQUIRES_FOUNDER"));
test("offers require evidence and sort by known APR",()=>assert.deepEqual(compareOffers([{sourceId:"A",amount:50000,apr:15,evidenceId:"E1",status:"VERIFIED"},{sourceId:"B",amount:50000,apr:10,evidenceId:"E2",status:"VERIFIED"},{sourceId:"C",amount:60000,apr:5,status:"VERIFIED"}]).map(x=>x.sourceId),["B","A"]));
test("funding outcome requires evidence",()=>assert.equal(recordOutcome("B1","FUNDED").status,"BLOCKED"));
test("agents cannot autonomously submit applications",()=>assert.equal(prohibitExternalAction("B1","APPLICATION").status,"REQUIRES_FOUNDER"));
