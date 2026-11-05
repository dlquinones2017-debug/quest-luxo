import test from "node:test";import assert from "node:assert/strict";
import {intakeLead,underwrite,strategyFit,diligenceGate,prohibitRealtyAction,recordRealtyOutcome} from "../src/lib/realty/realtyAgents.ts";
const p={leadId:"P1",address:"100 Main St",askingPrice:100000,propertyType:"SFR",identity:"VERIFIED"};
test("verified identity advances",()=>assert.equal(intakeLead(p).stage,"EVIDENCE"));
test("missing identity blocks",()=>assert.equal(intakeLead({...p,identity:"UNKNOWN"}).status,"BLOCKED"));
test("unknown rehab remains explicit",()=>assert.match(underwrite(p,{leadId:"P1",compEvidenceIds:[],arvState:"UNKNOWN",rentState:"UNKNOWN",rehabState:"UNKNOWN"}).assumptions.join(" "),/Rehab UNKNOWN/));
test("no comp evidence prevents claimed ARV",()=>assert.equal(underwrite(p,{leadId:"P1",compEvidenceIds:[],arvState:"UNKNOWN",rentState:"UNKNOWN",rehabState:"VERIFIED",rehab:20000}).arv,null));
test("strategy fit requires verified inputs",()=>assert.deepEqual(strategyFit({leadId:"P1",compEvidenceIds:["C"],arv:160000,rent:1500,rehab:20000,arvState:"VERIFIED",rentState:"VERIFIED",rehabState:"VERIFIED"}),["FIX_FLIP","BRRRR","BUY_HOLD"]));
test("diligence uncertainty blocks",()=>assert.equal(diligenceGate("P1",{title:"VERIFIED",flood:"UNKNOWN",zoning:"VERIFIED",occupancy:"VERIFIED",evidenceIds:["T"]}).status,"BLOCKED"));
test("passed diligence still requires founder",()=>assert.equal(diligenceGate("P1",{title:"VERIFIED",flood:"VERIFIED",zoning:"VERIFIED",occupancy:"VERIFIED",evidenceIds:["T","F","Z","O"]}).status,"REQUIRES_FOUNDER"));
test("agent cannot autonomously offer",()=>assert.equal(prohibitRealtyAction("P1","OFFER").status,"REQUIRES_FOUNDER"));
test("outcome requires evidence",()=>assert.equal(recordRealtyOutcome("P1","ACQUIRED").status,"BLOCKED"));

const verifiedDeal = {leadId:"P1",compEvidenceIds:["COMP-1"],arv:160000,rehab:20000,arvState:"VERIFIED",rentState:"UNKNOWN",rehabState:"VERIFIED"};
function assertSuppressedArv(result) {
  assert.equal(result.arv, null);
  assert.equal(result.grossSpread, null);
  assert.match(result.assumptions.join(" "), /ARV\/comp evidence REQUIRES_VERIFICATION/);
}
test("a verified ARV label without comparable evidence cannot produce a spread", () => {
  assertSuppressedArv(underwrite(p, {...verifiedDeal, compEvidenceIds:[]}));
});
test("blank comparable IDs are not supporting evidence", () => {
  assertSuppressedArv(underwrite(p, {...verifiedDeal, compEvidenceIds:["", "  ", "\t"]}));
});
test("another property's evidence cannot support the requested property's ARV", () => {
  const result = underwrite(p, {...verifiedDeal, leadId:"OTHER-PROPERTY"});
  assertSuppressedArv(result);
  assert.match(result.assumptions.join(" "), /property.*identity.*REQUIRES_VERIFICATION/i);
});
test("matching blank property IDs do not establish identity", () => {
  const result = underwrite({...p, leadId:" "}, {...verifiedDeal, leadId:" "});
  assertSuppressedArv(result);
  assert.match(result.assumptions.join(" "), /identity.*REQUIRES_VERIFICATION/i);
});
for (const arv of [NaN, Infinity, -Infinity, 0, -1]) {
  test(`nonfinite or nonpositive ARV is suppressed: ${String(arv)}`, () => {
    assertSuppressedArv(underwrite(p, {...verifiedDeal, arv}));
  });
}
test("valid matched comparable evidence preserves economics, result contract and input immutability", () => {
  const property = Object.freeze({...p});
  const evidence = Object.freeze({...verifiedDeal, compEvidenceIds:Object.freeze(["  ", "COMP-1"])});
  const result = underwrite(property, evidence);
  assert.deepEqual(result, {basis:100000,rehab:20000,allIn:120000,arv:160000,grossSpread:40000,assumptions:[]});
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.assumptions));
  assert.deepEqual(evidence.compEvidenceIds, ["  ", "COMP-1"]);
  assert.equal(evidence.arv, 160000);
});
