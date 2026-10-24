import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {enqueueCRMDeliveryObservations,claimCRMDeliveryAttempt,readCRMDeliveryOutbox} from '../src/lib/command/crmDeliveryOutbox.ts';
import {createHubSpotDealMetadataReader,deriveHubSpotCRMCaseId} from '../src/lib/command/hubspotDealMetadataReader.ts';
import {reviewUncertainCRMDelivery} from '../src/lib/command/crmUncertainDeliveryReview.ts';

/** Fixture transport only; no runtime credential, customer source or external service is opened. */
export async function demonstrateCRMProviderReview(){
 const root=await mkdtemp(join(tmpdir(),'quest-provider-review-')),key=randomBytes(32);
 try{
  const directory=join(root,'outbox'),clock=new Date(),now=clock.toISOString(),observedAt=new Date(clock.getTime()-180000).toISOString();
  let state=await enqueueCRMDeliveryObservations(directory,key,'EMPTY',[{division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),canonicalRecordId:'b'.repeat(64),payloadFingerprint:'c'.repeat(64),observedAt}]);
  state=await claimCRMDeliveryAttempt(directory,key,state.revision,state.observations[0].idempotencyKey,observedAt);
  state=await claimCRMDeliveryAttempt(directory,key,state.revision,state.observations[0].idempotencyKey,now);
  assert.equal(state.outcome,'HELD_UNCERTAIN');assert.equal(state.deliveries[0].state,'UNCERTAIN');
  const prior=await readFile(join(directory,'crm-delivery-outbox-v1.enc.json'));
  const binding={state:'REVIEWED',crmCaseId:deriveHubSpotCRMCaseId(key,'9001','12345'),evidenceRef:'d'.repeat(64),reviewedAt:now,expiresAt:new Date(clock.getTime()+300000).toISOString()};
  let requests=0;
  const reader=createHubSpotDealMetadataReader({key,portalId:'12345',token:async()=>'SYNTHETIC_TOKEN',clock:()=>clock,request:async(url,options)=>{
   requests++;assert.equal(options.method,'GET');assert.equal(new URL(url).hostname,'api.hubapi.com');
   if(requests===2)return new Response('{}',{status:404});
   return new Response(JSON.stringify({id:'9001',createdAt:observedAt,updatedAt:new Date(clock.getTime()-30000).toISOString(),archived:false,properties:{hs_object_id:'9001',ql_division:'luxury_advisory',ql_originating_website:'questluxo_com',ql_inquiry_category:'watch_sourcing',ql_provider_sharing_consent:'not_requested',ql_factoring_referral_stage:null,dealname:'Synthetic discarded freeform'}}));
  }});
  const input=provider=>({schemaVersion:1,mode:'UNCERTAIN_REVIEW_ONLY',outboxRevision:state.revision,observation:state.observations[0],delivery:state.deliveries[0],binding,provider,maxAgeSeconds:300});
  const found=reviewUncertainCRMDelivery(input(await reader.read('9001')),now),notFound=reviewUncertainCRMDelivery(input(await reader.read('9001')),now);
  assert.equal(found.state,'HOLD_OPERATION_EVIDENCE_REQUIRED');assert.equal(notFound.state,'HOLD_ABSENCE_NONDEFINITIVE');assert.equal(found.acknowledgementAllowed,false);assert.equal(notFound.retryAllowed,false);
  const after=await readCRMDeliveryOutbox(directory,key);assert.equal(after.revision,state.revision);assert.equal(after.deliveries[0].state,'UNCERTAIN');assert.deepEqual(await readFile(join(directory,'crm-delivery-outbox-v1.enc.json')),prior);
  return Object.freeze({status:'SYNTHETIC_PROVIDER_REVIEW_PASSED',mockRequests:requests,realProviderRequests:0,uncertainStatePreserved:true,outboxRevisionUnchanged:true,successfulReadPermitsAcknowledgement:false,notFoundPermitsRetry:false,businessDataExecutionAllowed:false,writesCRM:false,modelApiRequestsAllowed:false});
 }finally{key.fill(0);await rm(root,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{assert.equal(process.argv.length,2);console.log(JSON.stringify(await demonstrateCRMProviderReview()));}
 catch{console.error('Synthetic provider review held; no runtime credential or business operation performed.');process.exitCode=1;}
}
