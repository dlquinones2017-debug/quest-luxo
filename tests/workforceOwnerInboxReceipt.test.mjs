import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { WorkforcePhaseJournal } from '../src/lib/command/workforcePhaseJournal.ts';
import { WorkforceContactTaskDelivery, workforceTaskMetadata } from '../src/lib/command/workforceContactTaskDelivery.ts';
import { createLuxuryWorkforceEvent } from '../src/lib/command/luxuryWorkforceEvent.ts';
import { createLeadCapturePayload } from '../src/lib/leads/leadCapture.ts';
import { workforceOwnerNotification } from '../src/lib/command/workforceOwnerNotification.ts';
import { createWorkforceOwnerInboxReceiptReader, WorkforceNotificationReadUnavailable } from '../src/lib/command/workforceOwnerInboxReceipt.ts';
import { createHubspotWorkforceAdapter } from '../src/lib/command/hubspotWorkforceAdapter.ts';

// In-memory synthetic unit data only; no saved inquiry fixture, mailbox or provider request.
const now = Date.parse('2026-11-15T12:00:00Z'), messageId = 'abcdef1234567890';
const event = createLuxuryWorkforceEvent({id:'lead_receipt-unit',savedAt:'2026-11-15T11:59:00.000Z',payload:createLeadCapturePayload({name:'UNIT TEST',email:'unit@example.com',source:'/begin-your-quest',message:'synthetic test only'})},randomBytes(32));
const request = {messageId,event,contactId:'5001',taskId:'9001',mode:'INTERNAL_VALIDATION'};
const accountBinding = Object.freeze({accountId:'111111111111111111111',mailbox:'denzel@questluxo.com'}); // Synthetic account identity.
const profile = () => ({id:accountBinding.accountId,email:accountBinding.mailbox});
function message(r=request) {
  const expected = workforceOwnerNotification(r.event,r.contactId,r.taskId,r.mode);
  return {id:messageId,label_ids:['INBOX','UNREAD'],internal_date:String(now-30_000),payload:{mime_type:'multipart/alternative',filename:'',headers:[
    {name:'From',value:'info@questluxo.com'},{name:'To',value:expected.to},{name:'Delivered-To',value:expected.to},
    {name:'Subject',value:expected.subject},{name:'Message-ID',value:'<native-unit-message@email.amazonses.com>'},
    {name:'Date',value:new Date(now-30_000).toUTCString()},
    {name:'Authentication-Results',value:'mx.google.com; dkim=pass header.i=@questluxo.com header.s=resend; spf=pass smtp.mailfrom=unit@send.questluxo.com; dmarc=pass header.from=questluxo.com'},
    {name:'Received',value:'from unit.example by mx.google.com with ESMTPS for <denzel@questluxo.com>'},
  ],parts:[{mime_type:'text/plain',filename:'',body:{content:expected.text.replace(/\n/g,'\r\n'),attachment_id:null}},{mime_type:'text/html',filename:'',body:{content:expected.html,attachment_id:null}}]}};
}
const reader = (m=message(), getProfile=async()=>profile()) => createWorkforceOwnerInboxReceiptReader({getProfile,readFullMessage:async id=>{assert.equal(id,messageId);return m;}},accountBinding,()=>now);

test('unbound transport is unavailable; copied headers and delivery assertions are not an authenticated binding', async()=>{
  assert.deepEqual(await createWorkforceOwnerInboxReceiptReader().read(request),{status:'UNAVAILABLE',reason:'AUTHENTICATED_OWNER_GMAIL_TRANSPORT_NOT_BOUND'});
  assert.equal((await reader(message(),async()=>({id:'different-account',email:'denzel@questluxo.com'})).read(request)).status,'UNVERIFIED');
  assert.equal((await reader(message(),async()=>({...profile(),email:'other@example.com'})).read(request)).status,'UNVERIFIED');
  let reads=0;assert.equal((await reader(message(),async()=>++reads===1?profile():{...profile(),id:'switched'}).read(request)).status,'UNVERIFIED');
});
test('missing or invalid trusted account binding is unavailable before any native source read',async()=>{
  let reads=0;const transport={getProfile:async()=>{reads++;return profile()},readFullMessage:async()=>{reads++;return message()}};
  for(const binding of [undefined,{accountId:'',mailbox:'denzel@questluxo.com'},{accountId:accountBinding.accountId,mailbox:'wrong@example.com'}]){
    assert.deepEqual(await createWorkforceOwnerInboxReceiptReader(transport,binding,()=>now).read(request),{status:'UNAVAILABLE',reason:'AUTHENTICATED_OWNER_GMAIL_ACCOUNT_BINDING_NOT_CONFIGURED'});
  }
  assert.equal(reads,0);
  const mutable={...accountBinding},bound=createWorkforceOwnerInboxReceiptReader(transport,mutable,()=>now);mutable.accountId='222222222222222222222';
  assert.equal((await bound.read(request)).status,'VERIFIED');
});
test('exact native full-message comparison yields narrow owner-inbox proof, never Resend ID or human action',async()=>{
  const receipt=await reader().read(request);assert.equal(receipt.status,'VERIFIED');assert.equal(receipt.providerId,null);assert.equal(receipt.humanAction,'UNKNOWN');
  assert.equal(receipt.source,'AUTHENTICATED_OWNER_GMAIL');assert.equal(receipt.rfcMessageId,'<native-unit-message@email.amazonses.com>');assert.ok(Object.isFrozen(receipt));
  const text=JSON.stringify(receipt);assert.ok(!text.includes(event.payload.email));assert.ok(!text.includes(event.fingerprint));assert.ok(!text.includes('Authorization'));
});
test('adversarial receipt variants fail closed: account, inbox, header duplicates, auth, body, native links and time',async()=>{
  const header=(m,n)=>m.payload.headers.find(h=>h.name===n);
  const changes=[m=>m.id='different',m=>m.label_ids=['SENT'],m=>m.label_ids.push('SPAM'),m=>m.label_ids.push('TRASH'),
    m=>header(m,'From').value='info@attacker.example',m=>header(m,'To').value+=' ,other@example.com',m=>header(m,'Delivered-To').value='other@example.com',
    m=>header(m,'Subject').value+=' changed',m=>m.payload.headers.push({...header(m,'Subject')}),m=>m.payload.headers.push({...header(m,'Authentication-Results')}),
    m=>header(m,'Authentication-Results').value=header(m,'Authentication-Results').value.replace('mx.google.com','untrusted.example'),
    m=>header(m,'Authentication-Results').value=header(m,'Authentication-Results').value.replace('header.i=@questluxo.com','header.i=@questluxo.com.attacker'),
    m=>header(m,'Authentication-Results').value=header(m,'Authentication-Results').value.replace('dmarc=pass','dmarc=fail'),
    m=>header(m,'Received').value='by attacker.example',m=>m.payload.parts[0].body.content+='\r\nforwarded body',
    m=>m.payload.parts[0].body.content=m.payload.parts[0].body.content.replace(event.fingerprint,'f'.repeat(64)),
    m=>m.payload.parts[1].body.content=m.payload.parts[1].body.content.replace('/task/9001','/task/9002'),
    m=>m.payload.parts.push(structuredClone(m.payload.parts[0])),m=>m.payload.parts[0].body.attachment_id='unread-part',
    m=>m.payload.parts[0].filename='forwarded.eml',m=>m.payload.parts[0].body.content='x'.repeat(100001),
    m=>m.internal_date=String(now+300001),m=>m.internal_date=String(Date.parse(event.savedAt)-5001),
    m=>header(m,'Date').value='invalid',m=>header(m,'Message-ID').value='not-a-message-id'];
  for(const change of changes){const m=message();change(m);assert.equal((await reader(m).read(request)).status,'UNVERIFIED',change.toString());}
  assert.equal((await reader().read({...request,mode:'GENUINE_INQUIRY'})).status,'UNVERIFIED');
  assert.equal((await reader({type:'email.delivered',data:{email_id:'claimed-provider-id',to:['denzel@questluxo.com']}}).read(request)).status,'UNVERIFIED');
  const unavailable=createWorkforceOwnerInboxReceiptReader({getProfile:async()=>{throw Error('secret-token-never-output')},readFullMessage:async()=>null},accountBinding);
  assert.ok(!JSON.stringify(await unavailable.read(request)).includes('secret-token'));
});
async function setup(t,{uncertain=false}={}){
  const root=await mkdtemp(join(tmpdir(),'ql-owner-receipt-unit-')),key=randomBytes(32);
  const journal=await WorkforcePhaseJournal.open(join(root,'journal'),key,{initialize:true});
  t.after(async()=>{journal.close();key.fill(0);await rm(root,{recursive:true,force:true});});
  const counts={contact:0,task:0,notification:0,providerGet:0};
  const contact={id:'5001',email:event.payload.email,archived:false};
  const task={id:'9001',body:workforceTaskMetadata(event),ownerId:'101804786',contactIds:['5001'],archived:false,dueAt:new Date(Date.parse(event.savedAt)+86400000).toISOString(),type:'TODO',status:'NOT_STARTED'};
  const adapter={findContact:async()=>contact,getContact:async()=>contact,createContact:async()=>{counts.contact++;throw Error()},
    findTask:async()=>task,getTask:async()=>task,createTask:async()=>{counts.task++;throw Error()},
    notifyOwner:async()=>{counts.notification++;if(uncertain)throw Error('ambiguous response');return{accepted:true,providerId:'unit-provider-id'}},
    getNotification:async()=>{counts.providerGet++;throw new WorkforceNotificationReadUnavailable('RESTRICTED_SEND_ONLY_KEY')}};
  const engine=new WorkforceContactTaskDelivery(journal,adapter,()=>now);await engine.deliver(event);counts.notification=0;
  return {journal,engine,adapter,task,contact,counts};
}
test('complete entry can separately record authenticated inbox proof; replay is no-op and provider GET remains unavailable',async t=>{
  const s=await setup(t),before=s.journal.read(),entry=structuredClone(before.state.entries[0]);
  const result=await s.engine.reconcileOwnerInboxReceipt(event,messageId,reader());
  assert.equal(result.status,'COMPLETE');assert.equal(result.inboxReceipt,'VERIFIED');assert.equal(result.humanAction,'UNKNOWN');assert.equal(result.providerGetReceipt,'NOT_USED');
  assert.deepEqual(s.journal.read().state.entries[0],{...entry,inboxReceipt:'VERIFIED'});assert.equal(s.journal.read().state.sequence,before.state.sequence+1);
  const revision=s.journal.read().revision;await s.engine.reconcileOwnerInboxReceipt(event,messageId,reader());assert.equal(s.journal.read().revision,revision);
  assert.deepEqual(s.counts,{contact:0,task:0,notification:0,providerGet:0});
  await assert.rejects(s.adapter.getNotification(),e=>e.reason==='RESTRICTED_SEND_ONLY_KEY');
});
test('ambiguous unknown-ID send gains inbox proof but remains UNCERTAIN without invented provider acceptance or resend',async t=>{
  const s=await setup(t,{uncertain:true}),before=structuredClone(s.journal.read().state.entries[0]);
  const result=await s.engine.reconcileOwnerInboxReceipt(event,messageId,reader());assert.equal(result.inboxReceipt,'VERIFIED');assert.equal(result.status,'UNCERTAIN');
  assert.equal(result.notificationRecovery,'PROVIDER_ID_OR_PROVIDER_RECEIPT_UNRESOLVED');assert.deepEqual(s.journal.read().state.entries[0],{...before,inboxReceipt:'VERIFIED'});assert.equal(s.journal.read().state.entries[0].notificationId,null);
  await s.engine.deliver(event);assert.deepEqual(s.counts,{contact:0,task:0,notification:0,providerGet:0});
});
test('native association/owner changes, restored holds, copied proofs and receipt-event substitution cannot mutate receipt state',async t=>{
  for(const change of [s=>s.task.contactIds.push('5002'),s=>s.task.ownerId='999',s=>s.task.body+=' altered prefix',s=>s.contact.email='other@example.com']){
    const s=await setup(t);change(s);const before=s.journal.read();assert.equal((await s.engine.reconcileOwnerInboxReceipt(event,messageId,reader())).receiptStatus,'UNVERIFIED');assert.equal(s.journal.read().revision,before.revision);
  }
  const s=await setup(t),proof=await reader().read(request),before=s.journal.read();
  for(const receipt of [JSON.parse(JSON.stringify(proof)),{status:'VERIFIED',source:'AUTHENTICATED_OWNER_GMAIL',providerId:null,humanAction:'UNKNOWN',messageId}]){
    assert.equal((await s.engine.reconcileOwnerInboxReceipt(event,messageId,{read:async()=>receipt})).receiptStatus,'UNVERIFIED');assert.equal(s.journal.read().revision,before.revision);
  }
  const substituted=await reader(message({...request,taskId:'9002'})).read({...request,taskId:'9002'});
  assert.equal((await s.engine.reconcileOwnerInboxReceipt(event,messageId,{read:async()=>substituted})).receiptStatus,'UNVERIFIED');
  s.journal.mutate(state=>{state.recoveryHold=true;});const hold=s.journal.read();let accessed=false;
  assert.equal((await s.engine.reconcileOwnerInboxReceipt(event,messageId,{read:async()=>{accessed=true;throw Error()}})).receiptStatus,'UNAVAILABLE');assert.equal(accessed,false);assert.equal(s.journal.read().revision,hold.revision);
});
test('changed journal binding during receipt read fails CAS without receipt write',async t=>{
  const s=await setup(t),nativeReader=reader();let changed;
  const result=await s.engine.reconcileOwnerInboxReceipt(event,messageId,{read:async r=>{const receipt=await nativeReader.read(r);s.journal.mutate(st=>{st.entries[0].humanAction='ACKNOWLEDGED';});changed=s.journal.read();return receipt;}});
  assert.equal(result.receiptStatus,'UNVERIFIED');assert.equal(s.journal.read().revision,changed.revision);assert.equal(s.journal.read().state.entries[0].inboxReceipt,'UNKNOWN');
});
test('association changed while native mailbox read is in flight is rechecked before any receipt mutation',async t=>{
  const s=await setup(t),nativeReader=reader(),before=s.journal.read();
  const result=await s.engine.reconcileOwnerInboxReceipt(event,messageId,{read:async r=>{const receipt=await nativeReader.read(r);s.task.contactIds=['5002'];return receipt;}});
  assert.equal(result.receiptStatus,'UNVERIFIED');assert.equal(s.journal.read().revision,before.revision);assert.deepEqual(s.counts,{contact:0,task:0,notification:0,providerGet:0});
});
test('previously issued receipt cannot be reused after its observation window expires',async t=>{
  const s=await setup(t),before=s.journal.read();
  const expired=await createWorkforceOwnerInboxReceiptReader({getProfile:async()=>profile(),readFullMessage:async()=>message()},accountBinding,()=>now-300001).read(request);
  assert.equal((await s.engine.reconcileOwnerInboxReceipt(event,messageId,{read:async()=>expired})).receiptStatus,'UNVERIFIED');assert.equal(s.journal.read().revision,before.revision);
});
test('actual adapter classifies GET restricted-key, missing, timeout and malformed read as unavailable; never sends as fallback',async()=>{
  for(const kind of ['restricted','missing','timeout','malformed']){
    const calls=[];const fetcher=async(url,options)=>{calls.push([url,options.method]);if(url.includes('access-token-info'))return Response.json({hubId:'247778505',scopes:['crm.objects.contacts.read','crm.objects.contacts.write']});
      assert.equal(options.method,'GET');if(kind==='timeout')throw Error('private-key-do-not-output');if(kind==='malformed')return new Response('not-json');return Response.json({name:kind==='restricted'?'restricted_api_key':'not_found'},{status:kind==='restricted'?401:404});};
    const adapter=await createHubspotWorkforceAdapter('synthetic-unit-token',fetcher,()=>({from:'info@questluxo.com',providerApiKey:'synthetic-send-only-key',providerApiUrl:'https://api.resend.com/emails'}));
    await assert.rejects(adapter.getNotification('unit-provider-id',event,'5001','9001'),e=>e instanceof WorkforceNotificationReadUnavailable&&e.reason===(kind==='restricted'?'RESTRICTED_SEND_ONLY_KEY':'PROVIDER_READ_UNAVAILABLE')&&!e.message.includes('private-key'));
    assert.equal(calls.filter(([url,method])=>url.includes('api.resend.com')&&method==='POST').length,0);
  }
});
