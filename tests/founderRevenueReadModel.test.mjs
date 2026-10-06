import test from "node:test";
import assert from "node:assert/strict";
import { founderRevenueReadModel } from "../src/lib/command/founderRevenueReadModel.ts";

const now=new Date("2026-10-06T23:50:00Z");

test("founder read model projects stored revenue state without adding actions",async()=>{
 const model=await founderRevenueReadModel(now,{
  readBrokerage:async()=>[],
  readCapital:()=>[{borrowerId:"c1",stage:"SOURCE_MATCH",status:"READY",reason:"Verified",updatedAt:"2026-10-06T23:40:00Z",evidenceIds:["c-ev"],evidenceState:"VERIFIED",estimatedRevenue:2000,probability:.5}],
  readRealty:()=>[{leadId:"r1",stage:"UNDERWRITING",status:"REQUIRES_FOUNDER",reason:"Review",updatedAt:"2026-10-06T23:45:00Z",evidenceIds:["r-ev"],evidenceState:"VERIFIED",estimatedRevenue:3000,probability:.5,requiredHumanAction:"Approve terms"}],
 });
 assert.equal(model.generatedAt,now.toISOString());
 assert.equal(model.totalRecords,2);
 assert.equal(model.verifiedEstimatedRevenue,5000);
 assert.equal(model.verifiedExpectedRevenue,2500);
 assert.equal(model.founderActions.length,1);
 assert.deepEqual(model.founderActions[0],{division:"REALTY",recordId:"r1",action:"Approve terms",expectedRevenue:1500,revenueScore:1500});
 assert.equal(model.queue[0].recordId,"r1");
});

test("founder read model preserves honest zero state",async()=>{
 const model=await founderRevenueReadModel(now,{readBrokerage:async()=>[],readCapital:()=>[],readRealty:()=>[]});
 assert.equal(model.totalRecords,0);
 assert.equal(model.unknownRecords,0);
 assert.equal(model.verifiedEstimatedRevenue,0);
 assert.equal(model.verifiedExpectedRevenue,0);
 assert.deepEqual(model.queue,[]);
 assert.deepEqual(model.founderActions,[]);
});
