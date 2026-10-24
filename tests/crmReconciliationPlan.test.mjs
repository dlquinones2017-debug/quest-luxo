import test from 'node:test';
import assert from 'node:assert/strict';
import { crmHandoffIdempotencyKey, crmHandoffMetadataFingerprint, planCRMReconciliation, CRM_MAPPING_FIELDS, CRM_HANDOFF_STAGES } from '../src/lib/command/crmReconciliationPlan.ts';
const now='2026-10-23T22:00:00.000Z';
const hash=letter=>letter.repeat(64);
function event(division='LUXURY_ADVISORY',sourceId='luxury-canonical',sourceRecordId=hash('a')) {
  return {division,sourceId,sourceRecordId,sourceRevision:1,canonicalRecordId:hash('b'),payloadFingerprint:hash('c'),observedAt:now,
    provenanceState:'VERIFIED',evidenceRef:hash('d'),qualificationState:'VERIFIED',processingConsent:'VERIFIED'};
}
function fixture() {
  const e=event();
  return {schemaVersion:1,mode:'INTERNAL_METADATA_PLAN_ONLY',maxAgeSeconds:3600,sources:[{division:e.division,sourceId:e.sourceId,connection:'CONNECTED',capturedAt:now,
    mapping:{state:'REVIEWED',evidenceRef:hash('e'),verifiedFields:[...CRM_MAPPING_FIELDS],reviewedAt:now,expiresAt:'2026-10-24T22:00:00.000Z'}}],events:[e],
    crm:{connection:'CONNECTED',capturedAt:now,cases:[{division:e.division,sourceId:e.sourceId,sourceRecordId:e.sourceRecordId,canonicalRecordId:e.canonicalRecordId,
      crmCaseId:hash('f'),crmRevision:hash('1'),sourceRevision:1,metadataFingerprint:crmHandoffMetadataFingerprint(e)}]},
    checkpoint:{revision:hash('2'),capturedAt:now,entries:[]},
    readiness:{verifiedAt:now,durableCheckpointVerified:true,independentRecoveryVerified:true,keyRecoveryVerified:true}};
}
const state=input=>planCRMReconciliation(input,now).findings[0].state;
function checkpoint(e) {return {division:e.division,sourceId:e.sourceId,sourceRecordId:e.sourceRecordId,sourceRevision:e.sourceRevision,
  idempotencyKey:crmHandoffIdempotencyKey(e),metadataFingerprint:crmHandoffMetadataFingerprint(e)};}

test('matched metadata yields internal preparation only, preserves canonical ownership and cannot advance a checkpoint',()=>{
  const input=fixture(),before=JSON.stringify(input),r=planCRMReconciliation(input,now);
  assert.equal(r.findings[0].state,'MATCHED_METADATA_ONLY');assert.equal(r.findings[0].ownerTeamId,'technology-luxury');assert.equal(r.findings[0].stage,'ROUTE');
  assert.equal(r.findings[0].recommendation,'PREPARE_INTERNAL_FOLLOW_UP_REVIEW');assert.equal(r.status,'HOLD');
  assert.deepEqual(r.stageSequence,['CAPTURE','VERIFY','QUALIFY','ROUTE','FOLLOW_UP','ADVANCE','MEASURE','REPORT']);
  for(const flag of ['checkpointAdvancementAllowed','replacesCanonicalStores','durableReconciliationVerified','businessDataExecutionAllowed','writesCRM','sendsMessages','activatesGmail','submitsApplications','makesOffers','modelApiRequestsAllowed'])assert.equal(r[flag],false);
  assert.equal(r.evidenceAttestation,'CALLER_SUPPLIED_UNVERIFIED');assert.equal(JSON.stringify(input),before);
  assert.equal(r.divisions[0].businessPipelineCount,null);assert.equal(r.divisions[0].sourceCompletenessVerified,false);
  assert.throws(()=>r.stageSequence.pop());assert.throws(()=>CRM_MAPPING_FIELDS.pop());assert.equal(CRM_HANDOFF_STAGES.length,8);
});
test('idempotency is division/version bound; identical deliveries coalesce and changed content at the same revision conflicts',()=>{
  const input=fixture(),e=input.events[0];input.events.push(structuredClone(e));
  let r=planCRMReconciliation(input,now);assert.equal(r.findings.length,1);assert.equal(r.findings[0].duplicateReceipts,1);
  const oldKey=crmHandoffIdempotencyKey(e);input.events[1].processingConsent='DENIED';
  assert.equal(crmHandoffIdempotencyKey(input.events[1]),oldKey);assert.equal(state(input),'HOLD_REVISION_CONFLICT');
  assert.notEqual(crmHandoffIdempotencyKey({...e,sourceRevision:2}),oldKey);
  assert.notEqual(crmHandoffIdempotencyKey({...e,division:'REALTY'}),oldKey);
});
test('restored checkpoint causes exact replay no-op and changed replay conflict, without checkpoint mutation',()=>{
  const input=fixture();input.checkpoint.entries=[checkpoint(input.events[0])];const restored=JSON.parse(JSON.stringify(input));
  assert.equal(state(restored),'REPLAY_NOOP');assert.equal(planCRMReconciliation(restored,now).findings[0].recommendation,'NO_ACTION');
  restored.events[0].qualificationState='UNKNOWN';assert.equal(state(restored),'HOLD_REVISION_CONFLICT');
  assert.deepEqual(restored.checkpoint,input.checkpoint);
});
test('unacknowledged batch revisions cannot bridge gaps; old deliveries cannot overwrite later checkpoint history',()=>{
  const input=fixture(),first=input.events[0],second={...first,sourceRevision:2,payloadFingerprint:hash('3')};
  input.events=[second,first];let states=planCRMReconciliation(input,now).findings.map(f=>[f.sourceRevision,f.state]);
  assert.deepEqual(states.sort((a,b)=>a[0]-b[0]),[[1,'MATCHED_METADATA_ONLY'],[2,'HOLD_SOURCE_REVISION_GAP']]);
  input.events=[second];input.checkpoint.entries=[checkpoint(first)];assert.equal(state(input),'REVIEW_CRM_REVISION');
  input.events=[first];input.checkpoint.entries=[checkpoint(second)];assert.equal(state(input),'HOLD_OUT_OF_ORDER');
  const ahead=fixture();ahead.crm.cases[0].sourceRevision=2;assert.equal(state(ahead),'HOLD_OUT_OF_ORDER');
  const conflict=fixture();conflict.crm.cases[0].metadataFingerprint=hash('9');assert.equal(state(conflict),'HOLD_REVISION_CONFLICT');
});
test('all three divisions route to their own team and foreign checkpoint scope cannot be silently reassigned',()=>{
  for(const [division,team]of [['LUXURY_ADVISORY','technology-luxury'],['CAPITAL_ADVISORY','capital-advisory'],['REALTY','property-acquisitions']]){
    const input=fixture();input.events[0].division=division;input.sources[0].division=division;input.crm.cases[0].division=division;
    assert.equal(state(input),'MATCHED_METADATA_ONLY');assert.equal(planCRMReconciliation(input,now).findings[0].ownerTeamId,team);
  }
  const input=fixture();input.checkpoint.entries=[checkpoint({...input.events[0],division:'REALTY'})];
  assert.equal(state(input),'HOLD_CROSS_DIVISION_CONFLICT');
});
test('missing and ambiguous CRM cases, missing canonical links and cross-division case reuse remain held',()=>{
  const input=fixture();input.crm.cases=[];assert.equal(state(input),'HOLD_CRM_LINK_MISSING');
  const ambiguous=fixture();ambiguous.crm.cases.push({...ambiguous.crm.cases[0],crmCaseId:hash('4')});assert.equal(state(ambiguous),'HOLD_CRM_LINK_AMBIGUOUS');
  const unlinked=fixture();unlinked.events[0].canonicalRecordId=null;assert.equal(state(unlinked),'HOLD_CANONICAL_LINK_MISSING');
  const wrong=fixture();wrong.crm.cases[0].canonicalRecordId=hash('5');assert.equal(state(wrong),'HOLD_CANONICAL_LINK_CONFLICT');
  const crossed=fixture();crossed.crm.cases.push({...crossed.crm.cases[0],division:'REALTY',sourceId:'realty-form'});
  const r=planCRMReconciliation(crossed,now);assert.equal(r.findings[0].state,'HOLD_CROSS_DIVISION_CONFLICT');assert.equal(r.findings[0].crmCaseId,null);
});
test('connection gaps produce unknown aggregates rather than clean zeros; mappings and recovery claims never infer readiness',()=>{
  const disconnected=fixture();disconnected.sources[0].connection='UNCONNECTED';disconnected.sources[0].capturedAt=null;
  let r=planCRMReconciliation(disconnected,now);assert.equal(r.findings[0].state,'UNKNOWN_SOURCE_UNAVAILABLE');assert.equal(r.divisions[0].observedEvents,null);
  assert.equal(r.divisions[1].observationState,'UNKNOWN');assert.equal(r.divisions[1].matchedMetadata,null);
  const crm=fixture();crm.crm.connection='UNCONNECTED';crm.crm.capturedAt=null;assert.equal(state(crm),'UNKNOWN_CRM_UNAVAILABLE');
  for(const patch of [m=>m.state='UNREVIEWED',m=>m.evidenceRef=null,m=>m.verifiedFields.pop(),m=>m.reviewedAt=null,m=>m.expiresAt=now]){
    const input=fixture();patch(input.sources[0].mapping);assert.equal(state(input),'HOLD_MAPPING_REVIEW_REQUIRED');
  }
  for(const key of ['durableCheckpointVerified','independentRecoveryVerified','keyRecoveryVerified']){const input=fixture();input.readiness[key]=false;assert.equal(state(input),'HOLD_DURABLE_RECOVERY_REQUIRED');}
});
test('source evidence, qualification and processing-consent gaps are separate from permission to contact anyone',()=>{
  for(const [patch,expected]of [[e=>e.provenanceState='UNKNOWN','HOLD_SOURCE_EVIDENCE_REQUIRED'],[e=>e.evidenceRef=null,'HOLD_SOURCE_EVIDENCE_REQUIRED'],
    [e=>e.qualificationState='UNKNOWN','HOLD_QUALIFICATION_REVIEW_REQUIRED'],[e=>e.processingConsent='UNKNOWN','HOLD_PROCESSING_CONSENT_REQUIRED'],[e=>e.processingConsent='DENIED','SUPPRESSED_CONSENT_DENIED']]){
    const input=fixture();patch(input.events[0]);assert.equal(state(input),expected);assert.equal(planCRMReconciliation(input,now).sendsMessages,false);
  }
});
test('freshness is checked on source, CRM, event, checkpoint and recovery snapshots; future and raw inputs reject',()=>{
  const stale='2026-10-23T20:00:00.000Z';
  for(const edit of [i=>i.sources[0].capturedAt=stale,i=>i.crm.capturedAt=stale,i=>i.events[0].observedAt=stale,i=>i.checkpoint.capturedAt=stale,i=>i.readiness.verifiedAt=stale,i=>i.sources[0].mapping.reviewedAt=stale]){
    const input=fixture();edit(input);if(input.sources[0].capturedAt===stale)input.events[0].observedAt=stale;assert.equal(state(input),'HOLD_STALE_EVIDENCE');
  }
  for(const edit of [i=>i.events[0].email='private@example.test',i=>i.crm.cases[0].name='private',i=>i.events[0].sourceRecordId='raw-record-id',
    i=>i.sources[0].mapping.reviewedAt='2026-10-24T22:00:00.000Z',i=>i.events[0].observedAt='2026-10-24T22:00:00.000Z',
    i=>i.checkpoint.entries=[checkpoint(i.events[0]),checkpoint(i.events[0])],i=>i.events[0].division='REALTY']){
    const input=fixture();edit(input);assert.throws(()=>planCRMReconciliation(input,now));
  }
});
