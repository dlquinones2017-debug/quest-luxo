import assert from "node:assert/strict";
import { enterpriseRelationshipIntelligence, resolveRelationshipPair, type RelationshipObservation } from "../src/lib/command/relationshipIntelligence";

const obs=(observationId:string, division:RelationshipObservation["division"], evidence:RelationshipObservation["evidence"]):RelationshipObservation=>({observationId,division,role:"PROSPECT",evidence});

const verifiedEmailA=obs("watch-1","WATCH_BROKERAGE",[
  {kind:"EMAIL",value:"Client@Example.com",verified:true,evidenceId:"watch-email"},
  {kind:"NAME",value:"Alex Smith",verified:true,evidenceId:"watch-name"}
]);
const verifiedEmailB=obs("realty-1","REALTY",[
  {kind:"EMAIL",value:" client@example.com ",verified:true,evidenceId:"realty-email"},
  {kind:"NAME",value:"Alex Smith",verified:true,evidenceId:"realty-name"}
]);

const linked=resolveRelationshipPair(verifiedEmailA,verifiedEmailB);
assert.equal(linked.state,"VERIFIED");
assert.equal(linked.canonicalRelationshipKey,"EMAIL:client@example.com");
assert.equal(linked.requiresHumanReview,false);
assert.deepEqual(linked.evidenceIds,["realty-email","watch-email"]);

const nameOnlyA=obs("name-a","WATCH_BROKERAGE",[{kind:"NAME",value:"Jordan Lee",verified:true,evidenceId:"name-a"}]);
const nameOnlyB=obs("name-b","CAPITAL_ADVISORY",[{kind:"NAME",value:"Jordan   Lee",verified:true,evidenceId:"name-b"}]);
const nameOnly=resolveRelationshipPair(nameOnlyA,nameOnlyB);
assert.equal(nameOnly.state,"POSSIBLE");
assert.equal(nameOnly.canonicalRelationshipKey,null);
assert.equal(nameOnly.requiresHumanReview,true);

const unverifiedContactA=obs("unverified-a","WATCH_BROKERAGE",[{kind:"PHONE",value:"404-555-0100",verified:false,evidenceId:"phone-a"}]);
const unverifiedContactB=obs("unverified-b","REALTY",[{kind:"PHONE",value:"4045550100",verified:false,evidenceId:"phone-b"}]);
assert.equal(resolveRelationshipPair(unverifiedContactA,unverifiedContactB).state,"UNKNOWN");

const conflictA=obs("conflict-a","WATCH_BROKERAGE",[
  {kind:"SOURCE_ID",value:"crm-42",verified:true,evidenceId:"source-a"},
  {kind:"EMAIL",value:"one@example.com",verified:true,evidenceId:"email-a"}
]);
const conflictB=obs("conflict-b","CAPITAL_ADVISORY",[
  {kind:"SOURCE_ID",value:"crm-42",verified:true,evidenceId:"source-b"},
  {kind:"EMAIL",value:"two@example.com",verified:true,evidenceId:"email-b"}
]);
const conflict=resolveRelationshipPair(conflictA,conflictB);
assert.equal(conflict.state,"CONFLICT");
assert.equal(conflict.canonicalRelationshipKey,null);
assert.equal(conflict.requiresHumanReview,true);

const empty=enterpriseRelationshipIntelligence([]);
assert.deepEqual(empty,[]);

const first=enterpriseRelationshipIntelligence([verifiedEmailB,nameOnlyA,verifiedEmailA]);
const second=enterpriseRelationshipIntelligence([verifiedEmailA,verifiedEmailB,nameOnlyA]);
assert.deepEqual(first,second);

console.log("W3-02 relationship intelligence acceptance: 6/6 passed");
