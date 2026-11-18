import test from "node:test";
import assert from "node:assert/strict";
import { coordinateEnterpriseWorkHandoffs } from "../src/lib/command/enterpriseWorkHandoff.ts";

const now = new Date("2026-10-19T23:00:00Z");
const base = {
  workId:"lead-001", division:"LUXURY_ADVISORY", ownerAgentId:"watch-revenue",
  sourceSystem:"trusted-intake", sourceRecordId:"opaque-1",
  evidenceState:"VERIFIED", evidenceIds:["source:e-1"],
  observedAt:"2026-10-19T22:00:00Z", authority:"INTERNAL_PREPARATION",
  lifecycle:"PENDING", priority:80, proposedInternalAction:"Prepare opportunity summary",
};
const run = (...items) => coordinateEnterpriseWorkHandoffs(items, now);

test("verified deployed agent returns a recommendation, not execution", () => {
  const [r] = run(base);
  assert.equal(r.state,"READY_INTERNAL");
  assert.equal(r.executionAllowed,false);
  assert.equal(r.requiresFounderApproval,false);
});
test("partial agent cannot claim autonomous execution", () => {
  const [r] = run({...base,ownerAgentId:"watch-sourcing"});
  assert.equal(r.state,"RECOMMENDATION_ONLY");
});
test("unknown proposed agent is held until registered", () => {
  const [r] = run({...base,ownerAgentId:"future-sniper"});
  assert.equal(r.state,"VERIFY");
});
test("missing evidence and future dates preserve VERIFY", () => {
  assert.equal(run({...base,evidenceIds:[]})[0].state,"VERIFY");
  assert.equal(run({...base,observedAt:"2026-10-20T00:00:00Z"})[0].state,"VERIFY");
  assert.equal(run({...base,evidenceState:"UNKNOWN"})[0].state,"VERIFY");
});
test("external publishing, credit, contract and payments all remain founder-gated", () => {
  for(const authority of ["EXTERNAL_MESSAGE","PUBLISH","CODE_DEPLOY","CONTRACT","CREDIT_ACTION","FUNDS_MOVEMENT"]){
    const [r] = run({...base,authority});
    assert.equal(r.state,"FOUNDER_APPROVAL");
    assert.equal(r.executionAllowed,false);
  }
});
test("internal work explicitly founder-gated stays founder-gated", () => {
  assert.equal(run({...base,founderApprovalRequired:true})[0].state,"FOUNDER_APPROVAL");
});
test("dependencies require evidenced internal completion", () => {
  const first = {...base,workId:"step1",lifecycle:"PENDING"};
  const second = {...base,workId:"step2",dependencyIds:["step1"]};
  assert.equal(run(first,second).find(r=>r.workId==="step2").state,"WAITING_DEPENDENCY");
  assert.equal(run({...first,lifecycle:"COMPLETE"},second).find(r=>r.workId==="step2").state,"READY_INTERNAL");
});
test("an absent upstream record blocks the downstream handoff", () => {
  assert.equal(run({...base,dependencyIds:["absent"]})[0].state,"WAITING_DEPENDENCY");
});
test("conflicting duplicate work records fail closed irrespective of order", () => {
  const conflict = {...base,sourceRecordId:"opaque-2"};
  assert.equal(run(base,conflict)[0].state,"CONFLICT");
  assert.equal(run(conflict,base)[0].state,"CONFLICT");
});
test("identical repeated work is deduplicated and input remains unchanged", () => {
  const before=JSON.stringify(base);
  assert.equal(run(base,base).length,1);
  assert.equal(JSON.stringify(base),before);
});
test("dependency cycles cannot advance", () => {
  const one={...base,workId:"one",dependencyIds:["two"]};
  const two={...base,workId:"two",dependencyIds:["one"]};
  const all=run(one,two);
  assert.ok(all.every(x=>x.state==="CONFLICT"||x.state==="WAITING_DEPENDENCY"));
  assert.ok(all.every(x=>x.executionAllowed===false));
});
test("unverified cross-division ownership is held", () => {
  assert.equal(run({...base,division:"REALTY"})[0].state,"VERIFY");
});
test("stable ordering and cleaned ID lists", () => {
  const x={...base,workId:"z",priority:5,evidenceIds:["a","a","b"]};
  const y={...base,workId:"a",priority:99};
  const [top, last]=run(x,y);
  assert.equal(top.workId,"a");
  assert.deepEqual(last.evidenceIds,["a","b"]);
});
test("invalid identifiers, priority and time frame fail closed", () => {
  assert.throws(()=>run({...base,workId:"person@example.com"}));
  assert.throws(()=>run({...base,priority:Infinity}));
  assert.throws(()=>coordinateEnterpriseWorkHandoffs([base],new Date(NaN)));
});
