import test from "node:test";
import assert from "node:assert/strict";
import {evaluateWatchSniperOpportunity} from "../src/lib/agents/watchDealSnipingPolicy.ts";

const comps=[0,1].map(n=>({
 id:"dealer-"+n, reference:"1234", configuration:"blue dial steel bracelet", lowDealerValue:16000+n*1000, valid:true,
}));
const input={
 opportunityId:"snipe-1",
 intake:{reference:"1234",configuration:"blue dial steel bracelet",comparables:comps,liquidityPolicy:"LIQUID",liquidValueConclusion:16000,founderApproval:"PENDING",sellerAsk:14500},
 provenanceEvidenceState:"VERIFIED", resalePriceEvidenceState:"VERIFIED",capitalEvidenceState:"VERIFIED",
 evidenceIds:["photo-1","sold-comp-1"], conservativeResalePrice:17500,
 directCosts:750,serviceAndRiskReserve:1000,minimumProfit:2500,
 availableAcquisitionCapital:13000,openingBidRatio:0.8
};
const check=x=>evaluateWatchSniperOpportunity({...input,...x});
test("reuses existing acquisition target and caps exposure",()=>{
 const r=check({});
 assert.equal(r.recommendation,"NEGOTIATION_DRAFT");
 assert.equal(r.targetAcquisition,10720);
 assert.equal(r.hardWalkAwayMaximum,10720);
 assert.equal(r.openingBid,8576);
 assert.equal(r.estimatedMinimumProfitAtCeiling,5030);
 assert.equal(r.canSendMessage,false);
});
test("hard ceiling uses net resale less all costs and minimum profit",()=>{
 const r=check({minimumProfit:9500});
 assert.equal(r.hardWalkAwayMaximum,6250);
 assert.equal(r.openingBid,5000);
 assert.equal(r.estimatedMinimumProfitAtCeiling,9500);
});
test("founder-provided available capital may be more restrictive",()=>{
 const r=check({availableAcquisitionCapital:4500});
 assert.equal(r.hardWalkAwayMaximum,4500);
});
test("unverified resale, capital, provenance and missing evidence fail closed",()=>{
 assert.equal(check({resalePriceEvidenceState:"UNKNOWN"}).recommendation,"VERIFY");
 assert.equal(check({capitalEvidenceState:"CONFLICT"}).recommendation,"VERIFY");
 assert.equal(check({provenanceEvidenceState:"REQUIRES_VERIFICATION"}).recommendation,"VERIFY");
 assert.equal(check({evidenceIds:[]}).recommendation,"VERIFY");
});
test("missing costs, profit, ratios and negative offers fail closed",()=>{
 assert.equal(check({directCosts:null}).recommendation,"VERIFY");
 assert.equal(check({minimumProfit:0}).recommendation,"VERIFY");
 assert.equal(check({openingBidRatio:1.2}).recommendation,"VERIFY");
 assert.equal(check({currentOffer:-1}).recommendation,"VERIFY");
});
test("missing exact reference comps or liquidity policy cannot promote",()=>{
 assert.equal(check({intake:{...input.intake,comparables:[comps[0]]}}).recommendation,"VERIFY");
 assert.equal(check({intake:{...input.intake,liquidityPolicy:undefined}}).recommendation,"VERIFY");
});
test("risk blocker and unsustainable reserves trigger walk",()=>{
 assert.equal(check({verifiedRiskBlocker:true}).recommendation,"WALK_AWAY");
 assert.equal(check({serviceAndRiskReserve:20000}).recommendation,"WALK_AWAY");
});
test("final seller demand above ceiling is hard walk away",()=>{
 const r=check({currentOffer:12000,sellerFinal:true});
 assert.equal(r.recommendation,"WALK_AWAY");
 assert.equal(r.canMakeBindingOffer,false);
});
test("non-final demand above ceiling only creates draft within ceiling",()=>{
 const r=check({currentOffer:12000,sellerFinal:false});
 assert.equal(r.recommendation,"NEGOTIATION_DRAFT");
 assert.ok(r.openingBid<=r.hardWalkAwayMaximum);
});
test("an offer inside the hard ceiling is recommendation-only",()=>{
 const r=check({currentOffer:10000});
 assert.equal(r.recommendation,"WITHIN_POLICY");
 assert.equal(r.founderApprovalRequired,true);
 assert.equal(r.canMoveFunds,false);
});
test("unverified leverage prevents negotiation",()=>{
 const r=check({proposedLeverage:[{claim:"seller is desperate",verified:false}]});
 assert.equal(r.recommendation,"VERIFY");
 assert.deepEqual(r.rejectedLeverage,["seller is desperate"]);
});
test("invalid evidence IDs are rejected",()=>{
 assert.throws(()=>check({opportunityId:"client@example.com"}));
 assert.throws(()=>check({evidenceIds:["unsafe id"]}));
});
test("input remains immutable and results stable",()=>{
 const json=JSON.stringify(input);
 const a=check({}),b=check({});
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify(input),json);
});
