import test from "node:test";
import assert from "node:assert/strict";
import { qualifyClient, sourceCandidates, evaluateCondition, evaluateTradeIn, createAftercareEvent } from "../src/lib/broker/brokerageAgents.ts";

const mandate={mandateId:"M1",clientId:"C1",reference:"126610LN",configuration:"steel black",budgetMax:20000,timing:"30 days",conditionRequirement:"excellent",paymentReadiness:"VERIFIED"};

test("qualified mandate advances to sourcing",()=>assert.equal(qualifyClient(mandate).stage,"SOURCING"));
test("unverified payment blocks qualification",()=>assert.equal(qualifyClient({...mandate,paymentReadiness:"UNKNOWN"}).status,"BLOCKED"));
test("sourcing rejects mismatched or unevidenced inventory",()=>{
 const rows=[
  {candidateId:"A",dealerId:"D1",reference:"126610LN",configuration:"steel black",ask:15000,availability:"VERIFIED",sourceEvidenceId:"E1"},
  {candidateId:"B",dealerId:"D2",reference:"126610LV",configuration:"steel green",ask:14000,availability:"VERIFIED",sourceEvidenceId:"E2"},
  {candidateId:"C",dealerId:"D3",reference:"126610LN",configuration:"steel black",ask:14500,availability:"VERIFIED"}
 ];
 assert.deepEqual(sourceCandidates(mandate,rows).map(x=>x.candidateId),["A"]);
});
test("condition diligence blocks without authenticity evidence",()=>assert.equal(evaluateCondition({candidateId:"A",authenticity:"UNKNOWN",condition:"VERIFIED",serviceHistory:"UNKNOWN",provenance:"UNKNOWN",evidenceIds:[]}).status,"BLOCKED"));
test("trade-in requires verified bid",()=>assert.equal(evaluateTradeIn({reference:"x",configuration:"y",clientExpectation:10000}).status,"REQUIRES_VERIFICATION"));
test("aftercare cannot begin before transaction evidence",()=>assert.equal(createAftercareEvent("M1").status,"BLOCKED"));
