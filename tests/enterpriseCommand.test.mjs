import test from "node:test";import assert from "node:assert/strict";
import {normalizeEvent,founderQueue,preserveVerification,prohibitEnterpriseAction} from "../src/lib/command/enterpriseCommand.ts";
const base={recordId:"1",stage:"X",reason:"r",evidenceIds:[],sourceSystem:"source",updatedAt:"2026-10-06T22:00:00Z"};
test("normalizes all Wave 1 divisions",()=>{for(const division of ["WATCH_BROKERAGE","CAPITAL_ADVISORY","REALTY","GROWTH_ENGINE"])assert.equal(normalizeEvent({...base,division,status:"READY"}).division,division)});
test("verification uncertainty never upgrades to ready",()=>assert.equal(preserveVerification("REQUIRES_VERIFICATION"),"UNKNOWN"));
test("blocked work precedes founder and ready work",()=>assert.deepEqual(founderQueue([{...base,division:"REALTY",recordId:"r",status:"READY"},{...base,division:"CAPITAL_ADVISORY",recordId:"c",status:"REQUIRES_FOUNDER"},{...base,division:"WATCH_BROKERAGE",recordId:"w",status:"BLOCKED"}]).map(x=>x.status),["BLOCKED","REQUIRES_FOUNDER","READY"]));
test("dedup keeps newest event for same division record stage",()=>assert.equal(founderQueue([{...base,division:"REALTY",status:"BLOCKED"},{...base,division:"REALTY",status:"READY",updatedAt:"2026-10-06T23:00:00Z"}]).length,1));
test("enterprise command cannot autonomously act",()=>assert.equal(prohibitEnterpriseAction("CAPITAL_ADVISORY","1","CREDIT_PULL").status,"REQUIRES_FOUNDER"));
