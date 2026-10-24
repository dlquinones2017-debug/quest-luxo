import test from 'node:test';
import assert from 'node:assert/strict';
import {crmHandoffIdempotencyKey} from '../src/lib/command/crmReconciliationPlan.ts';
import {reviewUncertainCRMDelivery} from '../src/lib/command/crmUncertainDeliveryReview.ts';
const now='2026-10-24T02:30:00.000Z';
function fixture(){
 const observation={division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),canonicalRecordId:'b'.repeat(64),payloadFingerprint:'c'.repeat(64),observedAt:'2026-10-24T02:20:00.000Z',sourceRevision:1};observation.idempotencyKey=crmHandoffIdempotencyKey(observation);
 return {schemaVersion:1,mode:'UNCERTAIN_REVIEW_ONLY',outboxRevision:'d'.repeat(64),observation,delivery:{idempotencyKey:observation.idempotencyKey,state:'UNCERTAIN',attempt:{tokenHash:'e'.repeat(64),claimedAt:'2026-10-24T02:21:00.000Z',expiresAt:'2026-10-24T02:23:00.000Z'},receipt:null},binding:{state:'REVIEWED',crmCaseId:'f'.repeat(64),evidenceRef:'1'.repeat(64),reviewedAt:now,expiresAt:'2026-10-24T03:00:00.000Z'},maxAgeSeconds:300,
 provider:{schemaVersion:1,provider:'HUBSPOT',state:'OBSERVED_METADATA',capturedAt:now,crmCaseId:'f'.repeat(64),providerRevision:'2'.repeat(64),responseFingerprint:'3'.repeat(64),createdAt:'2026-10-24T02:00:00.000Z',updatedAt:'2026-10-24T02:22:00.000Z',archived:false,properties:{ql_division:'luxury_advisory',ql_originating_website:'questluxo_com',ql_inquiry_category:'watch_sourcing',ql_provider_sharing_consent:'not_requested',ql_factoring_referral_stage:null},retryAfterSeconds:null,businessDataExecutionAllowed:false,writesCRM:false,deliveryOutcomeVerified:false}};
}
function errorProvider(p,state){return {...p,state,crmCaseId:null,providerRevision:null,responseFingerprint:null,createdAt:null,updatedAt:null,archived:null,properties:null};}
test('fresh matching case and changed update timestamp cannot settle a specific uncertain event',()=>{
 const input=fixture(),before=JSON.stringify(input),r=reviewUncertainCRMDelivery(input,now);assert.equal(r.state,'HOLD_OPERATION_EVIDENCE_REQUIRED');
 input.provider.updatedAt='2026-10-24T02:29:59.000Z';assert.equal(reviewUncertainCRMDelivery(input,now).state,r.state);input.provider.updatedAt=JSON.parse(before).provider.updatedAt;assert.equal(JSON.stringify(input),before);
 for(const key of ['deliveryOutcomeVerified','acknowledgementAllowed','retryAllowed','checkpointAdvancementAllowed','businessDataExecutionAllowed','writesCRM','sendsMessages','modelApiRequestsAllowed'])assert.equal(r[key],false);
 assert.equal(r.preservesUncertainState,true);assert(Object.isFrozen(r.requiredEvidence));
});
test('404, unavailable credentials, rate limits and invalid metadata preserve uncertainty',()=>{
 for(const [state,expected] of [['NOT_FOUND_NONDEFINITIVE','HOLD_ABSENCE_NONDEFINITIVE'],['AUTHORIZATION_UNAVAILABLE','HOLD_PROVIDER_AUTHORIZATION'],['RATE_LIMITED','HOLD_PROVIDER_RATE_LIMIT'],['INVALID_METADATA','HOLD_PROVIDER_UNAVAILABLE'],['PROVIDER_UNAVAILABLE','HOLD_PROVIDER_UNAVAILABLE']]){
  const input=fixture();input.provider=errorProvider(input.provider,state);if(state==='RATE_LIMITED')input.provider.retryAfterSeconds=60;const r=reviewUncertainCRMDelivery(input,now);assert.equal(r.state,expected);assert.equal(r.retryAllowed,false);
 }
});
test('stale observations, absent or expired binding, wrong case/division and archived cases remain held',()=>{
 for(const [mutate,expected] of [[x=>x.provider.capturedAt='2026-10-24T02:24:59.000Z','HOLD_STALE_PROVIDER_EVIDENCE'],[x=>x.binding={state:'UNREVIEWED',crmCaseId:null,evidenceRef:null,reviewedAt:null,expiresAt:null},'HOLD_CASE_BINDING_REVIEW'],[x=>{x.binding.reviewedAt='2026-10-24T02:29:00.000Z';x.binding.expiresAt=now;},'HOLD_CASE_BINDING_REVIEW'],[x=>x.provider.crmCaseId='4'.repeat(64),'HOLD_CASE_BINDING_CONFLICT'],[x=>x.provider.properties.ql_division='property_acquisitions','HOLD_DIVISION_CONFLICT'],[x=>x.provider.properties.ql_division=null,'HOLD_PROVIDER_DIVISION_UNKNOWN'],[x=>x.provider.archived=true,'HOLD_ARCHIVED_CASE']]){const x=fixture();mutate(x);assert.equal(reviewUncertainCRMDelivery(x,now).state,expected);}
});
test('malformed state, invented acknowledgement flags, PII fields and future or active attempts reject generically',()=>{
 for(const mutate of [x=>x.provider.deliveryOutcomeVerified=true,x=>x.delivery.state='ACTIVE',x=>x.delivery.attempt.expiresAt='2026-10-24T02:32:00.000Z',x=>x.provider.email='private@example.test',x=>x.observation.idempotencyKey='5'.repeat(64),x=>x.maxAgeSeconds=0,x=>x.provider.retryAfterSeconds=86401]){const x=fixture();mutate(x);assert.throws(()=>reviewUncertainCRMDelivery(x,now),/Uncertain delivery review held/);}
 const x=fixture();x.provider.capturedAt='2026-10-24T02:30:01.000Z';assert.equal(reviewUncertainCRMDelivery(x,now).state,'HOLD_STALE_PROVIDER_EVIDENCE');
});
