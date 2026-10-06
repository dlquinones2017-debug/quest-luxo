import test from "node:test";
import assert from "node:assert/strict";
import { qualifyClient, sourceCandidates, evaluateCondition, createAftercareEvent } from "../src/lib/broker/brokerageAgents.ts";

test("brokerage lifecycle preserves evidence and founder boundary",()=>{
 const mandate={mandateId:"M-E2E",clientId:"C-E2E",reference:"4520V/210A-B128",configuration:"steel blue",budgetMax:30000,timing:"30 days",conditionRequirement:"excellent",paymentReadiness:"VERIFIED"};
 assert.equal(qualifyClient(mandate).stage,"SOURCING");
 const candidates=sourceCandidates(mandate,[{candidateId:"CAND-1",dealerId:"D-1",reference:"4520V/210A-B128",configuration:"steel blue",ask:25000,availability:"VERIFIED",sourceEvidenceId:"SRC-1"}]);
 assert.equal(candidates.length,1);
 const diligence=evaluateCondition({candidateId:"CAND-1",authenticity:"VERIFIED",condition:"VERIFIED",serviceHistory:"UNKNOWN",provenance:"UNKNOWN",evidenceIds:["AUTH-1","COND-1"]});
 assert.equal(diligence.stage,"ECONOMICS");
 assert.match(diligence.reason,/uncertainty/i);
 const aftercare=createAftercareEvent(mandate.mandateId);
 assert.equal(aftercare.status,"BLOCKED");
 const verifiedAftercare=createAftercareEvent(mandate.mandateId,"TX-1");
 assert.equal(verifiedAftercare.status,"READY");
});
