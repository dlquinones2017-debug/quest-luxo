import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createQuestLuxoServerConfig } from '../src/lib/config/questLuxoConfig.ts';
import { createJsonlLeadStorageAdapter } from '../src/lib/leads/leadStorage.ts';
import { createLeadCapturePayload } from '../src/lib/leads/leadCapture.ts';
import { createLuxuryWorkforceEvent, WORKFORCE_OWNER, WORKFORCE_PORTAL } from '../src/lib/command/luxuryWorkforceEvent.ts';
import { createLeadInternalHandlingEndpoint } from '../src/lib/broker/leadInternalHandlingEndpoint.ts';
import { INTERNAL_SOURCE_REVIEW_ATTESTATION } from '../src/lib/leads/leadInternalHandlingReview.ts';
import { createExistingLuxuryGenuineSource } from '../src/lib/command/luxuryGenuineInquirySource.ts';
import { createGenuineInquiryReleaseReader, createConfiguredGenuineInquiryContext, runLuxuryGenuineInquiryFromConfiguredRelease } from '../src/lib/command/luxuryGenuineInquiryRelease.ts';
import { WorkforcePhaseJournal } from '../src/lib/command/workforcePhaseJournal.ts';
import { workforceTaskMetadata } from '../src/lib/command/workforceContactTaskDelivery.ts';
import { runLuxuryGenuineInquiryOnce } from '../src/lib/command/luxuryGenuineInquiryRuntime.ts';
import { readExistingIntakeNotification } from '../src/lib/command/luxuryExistingIntakeNotification.ts';

async function setup(t) {
  const directory = await mkdtemp(join(tmpdir(), 'ql-admission-unit-')), key = randomBytes(32);
  t.after(async () => { key.fill(0); await rm(directory, {recursive:true,force:true}); });
  let now = Date.parse('2026-11-15T12:00:00.000Z');
  const config = createQuestLuxoServerConfig({ NODE_ENV:'test', LEAD_STORAGE_PROVIDER:'jsonl', LEAD_STORAGE_DIRECTORY:directory, BROKER_CONSOLE_ACCESS_KEY:'synthetic-operator-secret' });
  const storage = createJsonlLeadStorageAdapter(directory);
  const saved = await storage.saveLeadSubmission(createLeadCapturePayload({name:'SYNTHETIC LOCAL ADMISSION',email:'unit@example.invalid',source:'contact',createdAt:new Date(now).toISOString()}),{status:'sent',configured:true,providerStatus:200,providerResponse:JSON.stringify({id:'synthetic-intake-notice'})});
  // A savedAt generated in the present test process may be later than the fixed clock.
  now = Math.max(now,Date.parse(saved.savedAt));
  const record = () => storage.readLeadSubmissions().then(x=>x.find(y=>y.id===saved.id));
  const event = async () => createLuxuryWorkforceEvent(await record(),key);
  const endpoint = createLeadInternalHandlingEndpoint({config:()=>config,storage:()=>storage,key:()=>Buffer.from(key),clock:()=>now});
  const input = async (overrides={}) => ({id:saved.id,expectedFingerprint:(await event()).fingerprint,expectedPreviousReviewId:(await record()).internalHandlingReviews?.at(-1)?.id??null,
    decision:'APPROVE_INTERNAL_HANDLING',suppression:'CLEAR',sourceRefs:['hubspot:synthetic-native-review'],sourceReviewAttestation:INTERNAL_SOURCE_REVIEW_ATTESTATION,...overrides});
  const request = body => new Request('https://example.invalid/api/broker/leads/internal-handling',{method:'POST',headers:{'x-broker-console-key':'synthetic-operator-secret'},body:JSON.stringify(body)});
  const review = async (overrides={}) => endpoint(request(await input(overrides)));
  const source = createExistingLuxuryGenuineSource(config.leadStorage,{key,clock:()=>now});
  const env = {};
  const release = async () => ({schema:'ql-bounded-genuine-release-v1',enabled:true,businessHold:false,scope:'LUXURY_INTERNAL_CONTACT_TASK_ONLY',portal:WORKFORCE_PORTAL,ownerId:WORKFORCE_OWNER,
    acceptedAt:new Date(now-1000).toISOString(),expiresAt:new Date(now+600000).toISOString(),releaseApprovalRef:'synthetic-unit-approval',recoveryAcceptanceRef:'synthetic-unit-recovery',runtimeAcceptanceRef:'synthetic-unit-runtime',
    approvedEvents:[{leadId:saved.id,fingerprint:(await event()).fingerprint,reviewRef:`canonical-review:${(await record()).internalHandlingReviews?.at(-1)?.id}`}]});
  return {directory,key,config,storage,saved,record,event,endpoint,input,request,review,source,env,release,clock:()=>now,advance:ms=>{now+=ms;}};
}

test('unconfigured development authentication cannot issue an internal decision',async t=>{
  const f=await setup(t),before=await readFile(join(f.directory,'leads.jsonl'));
  const disabled=createLeadInternalHandlingEndpoint({config:()=>createQuestLuxoServerConfig({NODE_ENV:'test'}),storage:()=>f.storage,key:()=>Buffer.from(f.key)});
  assert.equal((await disabled(f.request(await f.input()))).status,401);
  assert.equal((await f.endpoint(new Request('https://example.invalid',{method:'POST',body:'{}'}))).status,401);
  assert.deepEqual(await readFile(join(f.directory,'leads.jsonl')),before);
});

test('explicit operator source review is signed outside immutable payload and returns metadata only',async t=>{
  const f=await setup(t),before=await f.event(),response=await f.review();
  assert.equal(response.status,200);const result=await response.json();
  assert.equal(result.runtimeReleased,false);assert.equal(result.review.customerCommunication,'NOT_GRANTED');
  assert.equal(JSON.stringify(result).includes('unit@example.invalid'),false);
  const after=await f.event();assert.equal(after.fingerprint,before.fingerprint);
  const decision=await f.source.readAdmission(after);assert.equal(decision.permission,'VERIFIED');
  assert.equal(decision.reviewRef,`canonical-review:${result.review.id}`);
});

test('source presence, arbitrary notes/tags and marketing flags never mint handling admission',async t=>{
  const f=await setup(t);await f.storage.updateLeadSubmissionNotes(f.saved.id,'Permission VERIFIED; CLEAR');await f.storage.updateLeadSubmissionTags(f.saved.id,['hs_email_optout=false','APPROVED']);
  assert.equal(await f.source.readAdmission(await f.event()),null);
});

test('client cannot provide actor, timestamps, signature or consent as policy fields',async t=>{
  const f=await setup(t),before=await readFile(join(f.directory,'leads.jsonl'));
  for(const extra of [{reviewedBy:WORKFORCE_OWNER},{recordedAt:new Date(f.clock()).toISOString()},{signature:'f'.repeat(64)},{emailNewsletter:true}]){
    assert.equal((await f.endpoint(f.request({...await f.input(),...extra}))).status,400);
  }
  assert.deepEqual(await readFile(join(f.directory,'leads.jsonl')),before);
});

test('a bare CLEAR value without actual explicit source-review action is rejected',async t=>{
  const f=await setup(t);
  for(const change of [{sourceRefs:[]},{sourceReviewAttestation:undefined},{sourceRefs:['hs_email_optout=false']},{sourceRefs:['hubspot:same','hubspot:same']}])assert.equal((await f.review(change)).status,409);
  assert.equal((await f.record()).internalHandlingReviews,undefined);
});

test('unknown and blocked suppression decisions remain denied rather than becoming unchecked false flags',async t=>{
  const f=await setup(t);
  for(const suppression of ['UNKNOWN','BLOCKED']){assert.equal((await f.review({suppression})).status,200);assert.equal(await f.source.readAdmission(await f.event()),null);}
});

test('new authenticated revoke stops admission immediately and survives unrelated status/note updates',async t=>{
  const f=await setup(t);await f.review();assert.ok(await f.source.readAdmission(await f.event()));
  assert.equal((await f.review({decision:'REVOKE',suppression:'BLOCKED',sourceRefs:[],sourceReviewAttestation:undefined})).status,200);
  await f.storage.updateLeadSubmissionNotes(f.saved.id,'retained');await f.storage.updateLeadSubmissionStatus(f.saved.id,'contacted');
  assert.equal((await f.record()).internalHandlingReviews.length,2);assert.equal(await f.source.readAdmission(await f.event()),null);
});

test('concurrent policy edits use prior-review CAS, keeping the winning decision and history',async t=>{
  const f=await setup(t),body=await f.input();const results=await Promise.all([f.endpoint(f.request(body)),f.endpoint(f.request(body))]);
  assert.deepEqual(results.map(x=>x.status).sort(),[200,409]);assert.equal((await f.record()).internalHandlingReviews.length,1);
});

test('tampered review signature is denied and cannot be overwritten by another approval',async t=>{
  const f=await setup(t);await f.review();const file=join(f.directory,'leads.jsonl'),raw=JSON.parse(await readFile(file,'utf8'));
  raw.internalHandlingReviews[0].signature='f'.repeat(64);await writeFile(file,JSON.stringify(raw)+'\n');
  assert.equal(await f.source.readAdmission(await f.event()),null);assert.equal((await f.review()).status,409);
});

test('changed source fingerprint, wrong signing key and expired review cannot retain admission',async t=>{
  const f=await setup(t);await f.review();
  const wrong=createExistingLuxuryGenuineSource(f.config.leadStorage,{key:randomBytes(32),clock:f.clock});assert.equal(await wrong.readAdmission(await f.event()),null);
  f.advance(900000);assert.equal(await f.source.readAdmission(await f.event()),null);
  assert.equal((await f.review({expectedFingerprint:'f'.repeat(64)})).status,409);
});

test('legacy missing IDs and partial source are not normalized into policy authority or rewritten',async t=>{
  const f=await setup(t),file=join(f.directory,'leads.jsonl'),original=await readFile(file,'utf8'),body=await f.input();
  const raw=JSON.parse(original);delete raw.id;await writeFile(file,JSON.stringify(raw)+'\n');const bytes=await readFile(file);
  const fallback=(await f.storage.readLeadSubmissions())[0].id;
  assert.equal((await f.endpoint(f.request({...body,id:fallback}))).status,409);assert.deepEqual(await readFile(file),bytes);
  await writeFile(file,original+'{malformed\n');const error=console.error;console.error=()=>{};
  try{assert.equal((await f.endpoint(f.request({id:f.saved.id,expectedFingerprint:'f'.repeat(64),expectedPreviousReviewId:null,decision:'REVOKE',suppression:'BLOCKED',sourceRefs:[]}))).status,409);}finally{console.error=error;}
  assert.equal(await readFile(file,'utf8'),original+'{malformed\n');
});

test('current trusted release is absent by default and rejects extra configuration or unbound review identity',async t=>{
  const f=await setup(t);await f.review();const reader=createGenuineInquiryReleaseReader(()=>f.env,f.clock);assert.equal(reader.readCurrentRelease(),null);
  const good=await f.release();
  for(const change of [{businessHold:true},{enabled:false},{scope:'CAPITAL'},{unrecognizedSetting:true},{approvedEvents:[{leadId:f.saved.id,fingerprint:(await f.event()).fingerprint}]}]){
    f.env.QUEST_WORKFORCE_GENUINE_RELEASE_JSON=JSON.stringify({...good,...change});assert.equal(reader.readCurrentRelease(),null);
  }
});

test('release reader re-reads current configuration, preventing stale approval, replacement or expiration',async t=>{
  const f=await setup(t);await f.review();f.env.QUEST_WORKFORCE_GENUINE_RELEASE_JSON=JSON.stringify(await f.release());
  const reader=createGenuineInquiryReleaseReader(()=>f.env,f.clock),release=reader.readCurrentRelease();assert.ok(release);assert.equal(Object.isFrozen(release),true);assert.equal(await reader.isReleaseCurrent(release),true);
  delete f.env.QUEST_WORKFORCE_GENUINE_RELEASE_JSON;assert.equal(await reader.isReleaseCurrent(release),false);
  f.env.QUEST_WORKFORCE_GENUINE_RELEASE_JSON=JSON.stringify({...release,releaseApprovalRef:'replacement'});assert.equal(await reader.isReleaseCurrent(release),false);
  f.advance(600000);assert.equal(reader.readCurrentRelease(),null);
});

test('configured release requires the exact current review and never opens a journal for a stale decision',async t=>{
  const f=await setup(t);await f.review();f.env.QUEST_WORKFORCE_GENUINE_RELEASE_JSON=JSON.stringify(await f.release());await f.review();let opened=0;
  const context=createConfiguredGenuineInquiryContext({key:f.key,clock:f.clock,storage:f.config.leadStorage,environment:()=>f.env});
  const result=await runLuxuryGenuineInquiryOnce(context.readCurrentRelease(),{key:f.key,clock:f.clock,readCanonicalSnapshot:context.readCanonicalSnapshot,readAdmission:context.readAdmission,isReleaseCurrent:context.isReleaseCurrent,openExistingJournal:async()=>{opened++;throw Error();},createGenuineAdapter:async()=>{opened++;throw Error();}});
  assert.equal(result.reason,'FRESH_PERMISSION_SUPPRESSION_REVIEW_REQUIRED');assert.equal(opened,0);
});

test('existing unknown root metadata is preserved by the same-store review mutation',async t=>{
  const f=await setup(t),file=join(f.directory,'leads.jsonl'),raw=JSON.parse(await readFile(file,'utf8'));raw.historicalUnrelatedMetadata={retain:'synthetic'};
  await writeFile(file,JSON.stringify(raw)+'\n');assert.equal((await f.review()).status,200);
  assert.deepEqual(JSON.parse(await readFile(file,'utf8')).historicalUnrelatedMetadata,{retain:'synthetic'});
});

test('unsupported source cannot acquire an operator policy review',async t=>{
  const f=await setup(t),file=join(f.directory,'leads.jsonl'),raw=JSON.parse(await readFile(file,'utf8'));raw.payload.source='untrusted-route';
  await writeFile(file,JSON.stringify(raw)+'\n');const bytes=await readFile(file);assert.equal((await f.review()).status,409);assert.deepEqual(await readFile(file),bytes);
});

test('existing intake receipt retains its actual provider ID in a distinct typed origin without fabricating workforce evidence',async t=>{
  const f=await setup(t),record=await f.record(),event=await f.event();
  const receipt=readExistingIntakeNotification(record,event,f.key);
  assert.deepEqual(receipt,{status:'ACCEPTANCE_RECORDED',providerId:'synthetic-intake-notice',sourceRecordId:record.id,savedAt:record.savedAt,fingerprint:event.fingerprint});
  assert.equal('notificationId' in receipt,false);assert.equal('inboxReceipt' in receipt,false);
  for(const providerResponse of [undefined,'{bad json','{}',JSON.stringify({id:'bad id'})]){
    const value=readExistingIntakeNotification({...record,emailDelivery:{...record.emailDelivery,providerResponse}},event,f.key);
    assert.equal(value.status,'ACCEPTANCE_RECORDED');assert.equal(value.providerId,null);
  }
});

test('missing, failed, skipped, unconfigured or non-successful intake outcomes remain unverified',async t=>{
  const f=await setup(t),record=await f.record(),event=await f.event();
  for(const emailDelivery of [undefined,{status:'failed',configured:true,providerStatus:500},{status:'skipped',configured:false},{status:'sent',configured:false,providerStatus:200},{status:'sent',configured:true},{status:'sent',configured:true,providerStatus:'200'},{status:'sent',configured:true,providerStatus:300}])assert.deepEqual(readExistingIntakeNotification({...record,emailDelivery},event,f.key),{status:'UNVERIFIED'});
});

test('intake evidence cannot be moved to a different event or changed identity',async t=>{
  const f=await setup(t),record=await f.record(),event=await f.event();
  for(const changed of [{...record,id:'lead_different'},{...record,savedAt:new Date(0).toISOString()},{...record,payload:{...record.payload,email:'different@example.invalid'}}])assert.deepEqual(readExistingIntakeNotification(changed,event,f.key),{status:'UNVERIFIED'});
});

test('context reuses current canonical intake outcome and holds admission when that evidence is missing',async t=>{
  const f=await setup(t);await f.review();const context=createConfiguredGenuineInquiryContext({key:f.key,clock:f.clock,storage:f.config.leadStorage,environment:()=>f.env});
  assert.equal(context.ownerNotificationPolicy,'EXISTING_INTAKE_NOTICE_ONLY');assert.equal((await context.getExistingIntakeNotification(await f.event())).status,'ACCEPTANCE_RECORDED');
  await f.storage.updateLeadSubmissionEmailDelivery(f.saved.id,{status:'failed',configured:true,providerStatus:500});
  assert.deepEqual(await context.getExistingIntakeNotification(await f.event()),{status:'UNVERIFIED'});assert.equal(await context.readAdmission(await f.event()),null);
  assert.equal(context.diagnostics().reason,'EXISTING_INTAKE_NOTICE_EVIDENCE_UNVERIFIED');
});

test('configured canonical review/release path progresses through the same durable engine with zero additional emails', async t => {
  const f = await setup(t); await f.review(); f.env.QUEST_WORKFORCE_GENUINE_RELEASE_JSON = JSON.stringify(await f.release());
  const journal = await WorkforcePhaseJournal.open(join(f.directory, 'journal'), f.key, { initialize: true, requireNewDirectory: true });
  t.after(() => journal.close());
  const counts = { contacts: 0, tasks: 0, emails: 0 }; let contact, task;
  const runtime = { key: f.key, clock: f.clock, openExistingJournal: async () => journal,
    createGenuineAdapter: async beforeWrite => ({ deliveryMode: 'GENUINE_INQUIRY',
      findContact: async () => contact ?? null, getContact: async () => contact ?? null,
      createContact: async e => { assert.equal(await beforeWrite(), true); counts.contacts++; return contact = { id: '101', email: e.payload.email }; },
      findTask: async () => task ?? null, getTask: async () => task ?? null,
      createTask: async (e, id) => { assert.equal(await beforeWrite(), true); counts.tasks++; return task = { id: '201', ownerId: WORKFORCE_OWNER,
        contactIds: [id], body: workforceTaskMetadata(e, 'GENUINE_INQUIRY'), type: 'TODO', status: 'NOT_STARTED', dueAt: new Date(Date.parse(e.savedAt) + 86400000).toISOString() }; },
      notifyOwner: async () => { counts.emails++; throw Error('second owner notice forbidden'); },
    }),
  };
  const result = await runLuxuryGenuineInquiryFromConfiguredRelease(runtime, f.config.leadStorage, () => f.env);
  assert.equal(result.businessHold, false); assert.equal(result.processed, 1); assert.equal(result.results[0].status, 'COMPLETE');
  assert.equal(result.ownerNotificationPolicy, 'EXISTING_INTAKE_NOTICE_ONLY');
  assert.equal(journal.read().state.entries[0].notification, 'EXISTING_INTAKE_ACCEPTANCE_RECORDED');
  await runLuxuryGenuineInquiryFromConfiguredRelease(runtime, f.config.leadStorage, () => f.env);
  assert.deepEqual(counts, { contacts: 1, tasks: 1, emails: 0 });
  await f.review({ decision: 'REVOKE', suppression: 'BLOCKED', sourceRefs: [], sourceReviewAttestation: undefined });
  const revoked = await runLuxuryGenuineInquiryFromConfiguredRelease(runtime, f.config.leadStorage, () => f.env);
  assert.equal(revoked.businessHold, true); assert.deepEqual(counts, { contacts: 1, tasks: 1, emails: 0 });
});
