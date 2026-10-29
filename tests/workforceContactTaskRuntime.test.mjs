import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, unlink } from 'node:fs/promises';
import { join, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { WorkforcePhaseJournal } from '../src/lib/command/workforcePhaseJournal.ts';
import { WorkforceContactTaskDelivery, workforceTaskMetadata } from '../src/lib/command/workforceContactTaskDelivery.ts';
import { createLuxuryWorkforceEvent, parseLuxuryCanonicalBlock, isApprovedWorkforceFixture, APPROVED_VALIDATION_FIXTURE } from '../src/lib/command/luxuryWorkforceEvent.ts';
import { workforceValidationReadiness, queueWorkforceValidationRecord } from '../src/lib/command/workforceValidationRuntime.ts';
import { createLeadCapturePayload } from '../src/lib/leads/leadCapture.ts';
import { createLeadNotificationText, getLeadNotificationPayloadFields } from '../src/lib/leads/leadNotification.ts';
import { createHubspotWorkforceAdapter } from '../src/lib/command/hubspotWorkforceAdapter.ts';

const record = (id = 'lead_unit-event-1', overrides = {}) => ({
  id, savedAt: '2026-10-29T00:58:39.757Z', payload: createLeadCapturePayload({
    name: APPROVED_VALIDATION_FIXTURE.name, email: APPROVED_VALIDATION_FIXTURE.email,
    source: APPROVED_VALIDATION_FIXTURE.source, message: APPROVED_VALIDATION_FIXTURE.marker,
    intent: 'request-this-watch', createdAt: '2026-10-29T00:58:39.748Z', ...overrides,
  }),
});
async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'ql-workforce-test-'));
  const key = randomBytes(32), directory = join(root, 'journal');
  const opened = [];
  const open = async path => { const j = await WorkforcePhaseJournal.open(path ?? directory, key, {initialize:true}); opened.push(j); return j; };
  const journal = await open();
  t.after(async () => {
    for (const j of opened) { try { j.close(); } catch {} }
    key.fill(0);
    const inside = relative(tmpdir(), root);
    assert.ok(!isAbsolute(inside) && !inside.startsWith('..') && inside.startsWith('ql-workforce-test-'));
    await rm(root, { recursive: true, force: true });
  });
  let now = Date.parse('2026-10-29T10:00:00Z');
  const contacts = [], tasks = [], notifications = [];
  const flags = { hideContact: false, hideTask: false, loseContact: false, loseTask: false, failTaskRead: false, failBeforeTask: false, loseNotification: false, wrongOwner: false };
  const counts = { contactCreates: 0, taskCreates: 0, notifications: 0 };
  const adapter = {
    findContact: async email => flags.hideContact ? null : contacts.find(c => c.email === email) ?? null,
    getContact: async id => contacts.find(c => c.id === id) ?? null,
    createContact: async event => {
      counts.contactCreates++; const c = { id: String(5000 + counts.contactCreates), email: event.payload.email, archived: false }; contacts.push(c);
      if (flags.loseContact) throw Error('response lost'); return c;
    },
    findTask: async event => { if (flags.failBeforeTask) throw Error('simulated crash after persisted contact'); return flags.hideTask ? null : tasks.find(t => t.body === workforceTaskMetadata(event)) ?? null; },
    getTask: async id => { if (flags.failTaskRead) throw Error('read failed'); const task = tasks.find(t => t.id === id); return task ? { ...task, ownerId: flags.wrongOwner ? '999' : task.ownerId } : null; },
    createTask: async (event, contactId) => {
      counts.taskCreates++;
      const task = { id: String(9000 + counts.taskCreates), body: workforceTaskMetadata(event), ownerId: '101804786', contactIds: [contactId], archived: false,
        dueAt: new Date(Date.parse(event.savedAt) + 86400000).toISOString(), status: 'NOT_STARTED', type: 'TODO' };
      tasks.push(task); if (flags.loseTask) throw Error('task response lost'); return task;
    },
    notifyOwner: async event => { counts.notifications++; notifications.push(event.eventKey); if (flags.loseNotification) throw Error('notification response lost'); return { accepted: true, providerId: 'email-receipt-1' }; },
    getNotification: async (providerId, event) => providerId === 'email-receipt-1' && notifications.includes(event.eventKey),
  };
  const engine = new WorkforceContactTaskDelivery(journal, adapter, () => now);
  return { root, directory, key, journal, open, track: j => opened.push(j), adapter, engine, flags, counts, contacts, tasks, clock: () => now, advance: ms => { now += ms; }, event: (r = record()) => createLuxuryWorkforceEvent(r, key) };
}

test('parses only the first bounded canonical block and preserves safe legacy IDs/ISO variants', () => {
  const r = record('lead_abcdef0123456789abcdef01'); r.savedAt = '2026-10-28T20:58:39.757-04:00';
  const text = createLeadNotificationText(r.payload, { version: 1, sourceSystem: 'luxury-canonical-jsonl', leadId: r.id, savedAt: r.savedAt });
  const parsed = parseLuxuryCanonicalBlock(text + '\nLead-ID: malicious\nSaved-At: 1900-01-01');
  assert.equal(parsed.leadId, r.id); assert.equal(parsed.savedAt, r.savedAt);
  assert.throws(() => parseLuxuryCanonicalBlock('Untrusted preface\n' + text));
  assert.throws(() => parseLuxuryCanonicalBlock(text.replace('Contract-Version: 1', 'Contract-Version: 2')));
});

test('uses the approved fingerprint-v1 display rows and normalizes only the event timestamp', () => {
  const r = record(APPROVED_VALIDATION_FIXTURE.leadId), key = randomBytes(32), event = createLuxuryWorkforceEvent(r, key);
  const rows = getLeadNotificationPayloadFields(r.payload).map(([k,v]) => [k,v.replace(/\r\n/g,'\n').trim()]);
  const expected = createHash('sha256').update(JSON.stringify(['ql-intake-fingerprint-v1',1,'luxury-canonical-jsonl',r.id,new Date(r.savedAt).toISOString(),rows])).digest('hex');
  assert.equal(event.fingerprint, expected);
  assert.equal(event.fingerprint, createLuxuryWorkforceEvent({ ...r, savedAt: '2026-10-28T20:58:39.757-04:00' }, key).fingerprint);
  assert.equal(isApprovedWorkforceFixture(event), true);
  for (const email of ['tia.thealbert@gmail.com','sean@example.com','other@questluxo.com']) assert.equal(isApprovedWorkforceFixture(createLuxuryWorkforceEvent(record(r.id,{email}),key)),false);
  assert.equal(isApprovedWorkforceFixture(createLuxuryWorkforceEvent(record('different-persisted-id'),key)),false);
});

test('approved existing internal receipt matches the independently verified golden fingerprint', () => {
  const fixture=record(APPROVED_VALIDATION_FIXTURE.leadId,{intent:null,message:'SYNTHETIC controlled inquiry QL-E2E-20261028-2102. Founder-authorized integration verification only. No real watch request, customer, consent, marketing enrollment, lead, deal or revenue.'});
  assert.equal(createLuxuryWorkforceEvent(fixture,randomBytes(32)).fingerprint,'b586e7941e71d04681acc35d042417ca0a0d0e4d94e89e5ee2642035be565742');
});

test('the existing operator-created fixture is reconciliation-only and never creates or sends', async t => {
  const s=await setup(t),event=s.event(record(APPROVED_VALIDATION_FIXTURE.leadId));
  s.contacts.push({id:APPROVED_VALIDATION_FIXTURE.contactId,email:event.payload.email,archived:false});
  s.tasks.push({id:APPROVED_VALIDATION_FIXTURE.taskId,body:workforceTaskMetadata(event),ownerId:'101804786',contactIds:[APPROVED_VALIDATION_FIXTURE.contactId],archived:false,dueAt:new Date(Date.parse(event.savedAt)+86400000).toISOString(),status:'NOT_STARTED',type:'TODO'});
  const result=await s.engine.deliver(event);assert.equal(result.status,'BASELINE_RECONCILED');assert.equal(result.contactOrigin,'OPERATOR_BASELINE');assert.equal(result.taskOrigin,'OPERATOR_BASELINE');assert.equal(result.notification,'NOT_ATTEMPTED');assert.deepEqual(s.counts,{contactCreates:0,taskCreates:0,notifications:0});
});

test('same-event replay and concurrent duplicates return one contact/task pair without outreach duplication', async t => {
  const s = await setup(t), event = s.event();
  const results = await Promise.all(Array.from({length:8},()=>s.engine.deliver(event)));
  assert.ok(results.every(x=>x.status==='COMPLETE' && x.contactId==='5001' && x.taskId==='9001'));
  assert.deepEqual(s.counts,{contactCreates:1,taskCreates:1,notifications:1});
  const again = await s.engine.deliver(event); assert.equal(again.taskId,'9001'); assert.equal(again.inboxReceipt,'UNKNOWN'); assert.equal(again.humanAction,'UNKNOWN');
  const bytes = await readFile(join(s.directory,'crm-contact-task-journal-v2.sqlite'));
  assert.ok(!bytes.includes(Buffer.from('denzel@questluxo.com'))); assert.ok(!bytes.includes(Buffer.from(event.eventKey)));
});

test('separate events sharing one email reuse the contact but retain distinct inquiry tasks', async t => {
  const s=await setup(t), a=s.event(), b=s.event(record('lead_second-event'));
  const [first,second]=await Promise.all([s.engine.deliver(a),s.engine.deliver(b)]);
  assert.equal(first.status,'COMPLETE'); assert.equal(second.status,'COMPLETE'); assert.equal(first.contactId,second.contactId); assert.notEqual(first.taskId,second.taskId);
  assert.deepEqual(s.counts,{contactCreates:1,taskCreates:2,notifications:2});
});

test('changed content for the same canonical event holds without another CRM write', async t => {
  const s=await setup(t), event=s.event(); await s.engine.deliver(event);
  const changed=s.event(record(event.leadId,{message:'changed '+APPROVED_VALIDATION_FIXTURE.marker}));
  const result=await s.engine.deliver(changed); assert.equal(result.status,'HOLD'); assert.equal(result.taskId,'9001'); assert.equal(s.counts.taskCreates,1);
});

test('lost contact response blocks same-email writes until positive contact recovery', async t => {
  const s=await setup(t); s.flags.loseContact=true; s.flags.hideContact=true;
  assert.equal((await s.engine.deliver(s.event())).status,'UNCERTAIN');
  s.advance(121000); const sibling=s.event(record('lead_same-email-sibling'));
  assert.equal((await s.engine.deliver(sibling)).status,'UNCERTAIN'); assert.equal(s.counts.contactCreates,1);
  s.flags.loseContact=false; s.flags.hideContact=false;
  assert.equal((await s.engine.deliver(s.event())).status,'COMPLETE'); assert.equal(s.counts.contactCreates,1);
});

test('lost task response survives reopening and empty search never recreates it', async t => {
  const s=await setup(t), event=s.event(); s.flags.loseTask=true; s.flags.hideTask=true;
  assert.equal((await s.engine.deliver(event)).status,'UNCERTAIN'); s.advance(121000);
  const reopened=await s.open(); const resumed=new WorkforceContactTaskDelivery(reopened,s.adapter,s.clock);
  assert.equal((await resumed.deliver(event)).status,'UNCERTAIN'); assert.deepEqual(s.counts,{contactCreates:1,taskCreates:1,notifications:0});
  s.flags.hideTask=false; s.flags.loseTask=false;
  const recovered=await resumed.deliver(event); assert.equal(recovered.status,'COMPLETE'); assert.equal(recovered.taskId,'9001'); assert.equal(s.counts.taskCreates,1);
});

test('contact-success failure resumes from its native ID without another contact create', async t => {
  const s=await setup(t), event=s.event(); s.flags.failBeforeTask=true;
  const failed=await s.engine.deliver(event); assert.equal(failed.contactId,'5001'); assert.equal(failed.taskId,null);
  s.advance(121000); s.flags.failBeforeTask=false;
  const recovered=await new WorkforceContactTaskDelivery(await s.open(),s.adapter,s.clock).deliver(event);
  assert.equal(recovered.status,'COMPLETE'); assert.equal(s.counts.contactCreates,1); assert.equal(s.counts.taskCreates,1);
});

test('association/owner readback failure retains the task ID and cannot create a replacement', async t => {
  const s=await setup(t), event=s.event(); s.flags.wrongOwner=true;
  const result=await s.engine.deliver(event); assert.equal(result.status,'UNCERTAIN'); assert.equal(result.taskId,'9001'); assert.equal(s.counts.notifications,0);
  s.flags.wrongOwner=false; s.advance(121000);
  assert.equal((await s.engine.deliver(event)).status,'COMPLETE'); assert.equal(s.counts.taskCreates,1);
});

test('notification timeout stays uncertain until explicit positive provider-ID reconciliation', async t => {
  const s=await setup(t), event=s.event(); s.flags.loseNotification=true;
  assert.equal((await s.engine.deliver(event)).status,'UNCERTAIN'); s.advance(121000);
  assert.equal((await s.engine.deliver(event)).status,'UNCERTAIN'); assert.equal(s.counts.notifications,1);
  assert.equal((await s.engine.reconcileNotification(event,'wrong-receipt')).status,'UNCERTAIN');
  const verified=await s.engine.reconcileNotification(event,'email-receipt-1'); assert.equal(verified.status,'COMPLETE'); assert.equal(verified.inboxReceipt,'UNKNOWN'); assert.equal(verified.humanAction,'UNKNOWN');
});

test('encrypted backup restore preserves uncertain bindings and dispatches nothing from stale pending snapshots', async t => {
  const s=await setup(t), event=s.event(); s.engine.enqueue(event);
  const backup=join(s.root,'phase-backup.json'); await s.journal.exportBackup(backup);
  await s.engine.deliver(event);
  const restored=await WorkforcePhaseJournal.restoreBackup(backup,join(s.root,'restored'),s.key); s.track(restored);
  assert.equal(restored.read().state.recoveryHold,true);
  const before={...s.counts}; const replay=await new WorkforceContactTaskDelivery(restored,s.adapter,s.clock).deliver(event);
  assert.equal(replay.recoveryHold,true); assert.equal(replay.status,'RESTORE_RECONCILIATION_REQUIRED'); assert.deepEqual(s.counts,before);
  await assert.rejects(()=>WorkforcePhaseJournal.restoreBackup(backup,s.directory,s.key));
});

test('fresh process reads the exact persisted native IDs and phase; deletion and wrong keys fail closed', async t => {
  const s=await setup(t), event=s.event(); await s.engine.deliver(event);
  const moduleUrl=new URL('../src/lib/command/workforcePhaseJournal.ts',import.meta.url).href;
  const script=`import {WorkforcePhaseJournal} from ${JSON.stringify(moduleUrl)};const j=await WorkforcePhaseJournal.open(process.argv[1],Buffer.from(process.argv[2],'hex'));const s=j.read();console.log(JSON.stringify({revision:s.revision,entries:s.state.entries}));j.close();`;
  const child=await promisify(execFile)(process.execPath,['--experimental-strip-types','--input-type=module','-e',script,s.directory,s.key.toString('hex')]);
  const snapshot=JSON.parse(child.stdout); assert.equal(snapshot.entries[0].contactId,'5001'); assert.equal(snapshot.entries[0].taskId,'9001'); assert.equal(snapshot.entries[0].state,'COMPLETE');
  await assert.rejects(()=>WorkforcePhaseJournal.open(s.directory,randomBytes(32)));
  s.journal.close(); await unlink(join(s.directory,'crm-contact-task-journal-v2.sqlite'));
  await assert.rejects(()=>WorkforcePhaseJournal.open(s.directory,s.key));
});

test('loss of both DB and initialization marker cannot reset an existing journal directory', async t => {
  const s=await setup(t); s.engine.enqueue(s.event()); s.journal.close();
  await unlink(join(s.directory,'crm-contact-task-journal-v2.sqlite'));
  await unlink(join(s.directory,'crm-contact-task-journal-v2.initialized'));
  await assert.rejects(()=>WorkforcePhaseJournal.open(s.directory,s.key));
  const existingEmpty=join(s.root,'pre-existing-empty'); await mkdir(existingEmpty,{mode:0o700});
  await assert.rejects(()=>WorkforcePhaseJournal.open(existingEmpty,s.key));
  await assert.rejects(()=>WorkforcePhaseJournal.open(join(s.root,'startup-must-not-initialize'),s.key));
});

test('backup of an uncertain task write retains its operation and known contact after restore', async t => {
  const s=await setup(t),event=s.event();s.flags.loseTask=true;s.flags.hideTask=true;
  await s.engine.deliver(event); const before=s.journal.read().state.entries[0];
  const backup=join(s.root,'uncertain-backup.json');await s.journal.exportBackup(backup);
  const restored=await WorkforcePhaseJournal.restoreBackup(backup,join(s.root,'uncertain-restore'),s.key);s.track(restored);
  const recovered=restored.read();assert.equal(recovered.state.entries[0].contactId,before.contactId);assert.equal(recovered.state.entries[0].operation,'TASK_CREATE');assert.equal(recovered.state.entries[0].state,'UNCERTAIN');assert.equal(recovered.state.recoveryHold,true);
  const counts={...s.counts};s.advance(121000);await new WorkforceContactTaskDelivery(restored,s.adapter,s.clock).deliver(event);assert.deepEqual(s.counts,counts);
});

test('disabled/misconfigured runtime excludes all records and requires explicitly named secure settings', async () => {
  const disabled=workforceValidationReadiness({}); assert.equal(disabled.enabled,false); assert.equal(disabled.businessHold,true);
  assert.deepEqual(disabled.missing,['WORKFORCE_HUBSPOT_ACCESS_TOKEN','WORKFORCE_JOURNAL_KEY_HEX','WORKFORCE_VALIDATION_LEAD_IDS']);
  assert.equal(workforceValidationReadiness({QUEST_WORKFORCE_VALIDATION_ENABLED:'false'}).enabled,false);
  assert.equal(await queueWorkforceValidationRecord(record()),'DISABLED_OR_EXCLUDED');
});

test('HubSpot adapter rejects wrong portal/scope before any CONTACT/TASK request', async () => {
  const urls=[];
  await assert.rejects(()=>createHubspotWorkforceAdapter('test-token',async (url,init)=>{urls.push(url);assert.equal(init.method,'POST');assert.equal(JSON.parse(init.body).tokenKey,'test-token');return new Response(JSON.stringify({hubId:123,scopes:['crm.objects.contacts.read','crm.objects.contacts.write']}));}));
  assert.deepEqual(urls,['https://api.hubapi.com/oauth/v2/private-apps/get/access-token-info']);
});

test('native API adapter pins portal, association direction, exact string IDs and one approved Luxury owner signature', async t => {
  const s=await setup(t),event=s.event(),contactId='9007199254740993123',taskId='9007199254740993456';
  const contact={id:contactId,archived:false,properties:{email:'denzel@questluxo.com'}};
  const task={id:taskId,archived:false,properties:{hs_task_body:workforceTaskMetadata(event),hubspot_owner_id:'101804786',hs_timestamp:new Date(Date.parse(event.savedAt)+86400000).toISOString(),hs_task_status:'NOT_STARTED',hs_task_type:'TODO'},associations:{contacts:{results:[{id:contactId,type:'task_to_contact'}]}}};
  let emailPayload;const mutations=[];
  const request=async (url,init)=>{
    assert.equal(init.redirect,'error');assert.ok(!url.includes('test-token'));
    if(url.endsWith('/oauth/v2/private-apps/get/access-token-info'))return new Response(JSON.stringify({hubId:247778505,scopes:['crm.objects.contacts.read','crm.objects.contacts.write']}));
    if(url==='https://api.hubapi.com/crm/v3/objects/contacts'&&init.method==='POST'){mutations.push('contact');return new Response(JSON.stringify(contact),{status:201});}
    if(url==='https://api.hubapi.com/crm/v3/objects/tasks'&&init.method==='POST'){
      const body=JSON.parse(init.body);assert.equal(body.associations[0].types[0].associationTypeId,204);assert.equal(body.associations[0].to.id,contactId);assert.equal(body.properties.hs_task_status,'NOT_STARTED');assert.equal(body.properties.hs_timestamp,task.properties.hs_timestamp);mutations.push('task');return new Response(JSON.stringify({id:taskId}),{status:201});
    }
    if(url.startsWith('https://api.hubapi.com/crm/v3/objects/contacts/'))return new Response(JSON.stringify(contact));
    if(url.startsWith('https://api.hubapi.com/crm/v3/objects/tasks/'))return new Response(JSON.stringify(task));
    if(url==='https://api.resend.com/emails'&&init.method==='POST'){
      emailPayload=JSON.parse(init.body);assert.deepEqual(emailPayload.to,['denzel@questluxo.com']);assert.match(init.headers['Idempotency-Key'],/^[a-f0-9]{64}$/);assert.equal(emailPayload.text.split('Founder | Quest Luxo Luxury Advisory').length-1,1);assert.equal(emailPayload.html.split('data-quest-luxo-signature="luxury"').length-1,1);assert.ok(emailPayload.text.includes(taskId));mutations.push('notification');return new Response(JSON.stringify({id:'provider-email-1'}));
    }
    if(url==='https://api.resend.com/emails/provider-email-1')return new Response(JSON.stringify({id:'provider-email-1',to:emailPayload.to,subject:emailPayload.subject,text:emailPayload.text}));
    throw Error('Unexpected endpoint');
  };
  const adapter=await createHubspotWorkforceAdapter('test-token',request,()=>({from:'info@questluxo.com',providerApiKey:'test-email-key',providerApiUrl:'https://api.resend.com/emails'}));
  assert.equal((await adapter.createContact(event)).id,contactId);assert.equal((await adapter.getContact(contactId)).id,contactId);
  assert.equal((await adapter.createTask(event,contactId)).id,taskId);assert.deepEqual((await adapter.getTask(taskId)).contactIds,[contactId]);
  assert.equal((await adapter.notifyOwner(event,contactId,taskId)).accepted,true);assert.equal(await adapter.getNotification('provider-email-1',event),true);
  assert.deepEqual(mutations,['contact','task','notification']);
});
