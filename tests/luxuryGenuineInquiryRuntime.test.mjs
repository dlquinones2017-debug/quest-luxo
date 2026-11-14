import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkforcePhaseJournal } from '../src/lib/command/workforcePhaseJournal.ts';
import { workforceTaskMetadata } from '../src/lib/command/workforceContactTaskDelivery.ts';
import { createLuxuryWorkforceEvent, WORKFORCE_MAILBOX, WORKFORCE_OWNER, WORKFORCE_PORTAL } from '../src/lib/command/luxuryWorkforceEvent.ts';
import { createLeadCapturePayload } from '../src/lib/leads/leadCapture.ts';
import { runLuxuryGenuineInquiryOnce } from '../src/lib/command/luxuryGenuineInquiryRuntime.ts';
import { createHubspotWorkforceAdapter } from '../src/lib/command/hubspotWorkforceAdapter.ts';

async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'ql-genuine-unit-')), key = randomBytes(32);
  const journal = await WorkforcePhaseJournal.open(join(root, 'journal'), key, { initialize: true, requireNewDirectory: true });
  t.after(async () => { journal.close(); key.fill(0); await rm(root, { recursive: true, force: true }); });
  let now = Date.parse('2026-11-14T12:00:00Z');
  const start = new Date(now).toISOString();
  const records = [{ id: 'lead_synthetic-unit-1', savedAt: start, payload: createLeadCapturePayload({ name: 'SYNTHETIC UNIT REQUEST', email: 'unit@example.invalid', source: 'contact', createdAt: start }) }];
  const event = r => createLuxuryWorkforceEvent(r, key);
  const release = { enabled: true, businessHold: false, scope: 'LUXURY_INTERNAL_CONTACT_TASK_ONLY', portal: WORKFORCE_PORTAL, ownerId: WORKFORCE_OWNER,
    acceptedAt: start, expiresAt: new Date(now + 3600000).toISOString(), releaseApprovalRef: 'synthetic-release', recoveryAcceptanceRef: 'synthetic-recovery', runtimeAcceptanceRef: 'synthetic-runtime',
    approvedEvents: records.map(r => ({ leadId: r.id, fingerprint: event(r).fingerprint })) };
  const flags = { active: true, admission: true, hideTask: false, loseTask: false, snapshot: 'COMPLETE', revokeAfterContact: false };
  const counts = { snapshot: 0, journal: 0, adapter: 0, contact: 0, task: 0, ownerNotifications: 0 };
  const contacts = [], tasks = [];
  const deps = { key, clock: () => now, isReleaseCurrent: async () => flags.active,
    readCanonicalSnapshot: async () => { counts.snapshot++; return { status: flags.snapshot, records }; },
    readAdmission: async e => flags.admission ? ({ source: 'AUTHENTICATED_CANONICAL_SNAPSHOT', division: 'luxury', leadId: e.leadId, fingerprint: e.fingerprint,
      reviewRef: 'synthetic-review', reviewedAt: start, expiresAt: new Date(Date.parse(start) + 900000).toISOString(), purpose: 'REQUESTED_INQUIRY_INTERNAL_HANDLING', permission: 'VERIFIED', suppression: 'CLEAR', doNotContact: false }) : null,
    openExistingJournal: async () => { counts.journal++; return journal; },
    createGenuineAdapter: async beforeWrite => { counts.adapter++; return {
      deliveryMode: 'GENUINE_INQUIRY',
      findContact: async email => contacts.find(c => c.email === email) ?? null,
      getContact: async id => contacts.find(c => c.id === id) ?? null,
      createContact: async e => { assert.equal(await beforeWrite(), true); counts.contact++; const c = { id: String(100 + counts.contact), email: e.payload.email, archived: false }; contacts.push(c); if (flags.revokeAfterContact) flags.active = false; return c; },
      findTask: async e => flags.hideTask ? null : tasks.find(x => x.body === workforceTaskMetadata(e, 'GENUINE_INQUIRY')) ?? null,
      getTask: async id => flags.hideTask ? null : tasks.find(x => x.id === id) ?? null,
      createTask: async (e, id) => { if (!await beforeWrite()) throw Error('held before provider dispatch'); counts.task++; const x = { id: String(200 + counts.task), body: workforceTaskMetadata(e, 'GENUINE_INQUIRY'), ownerId: WORKFORCE_OWNER, contactIds: [id], archived: false, dueAt: new Date(Date.parse(e.savedAt) + 86400000).toISOString(), status: 'NOT_STARTED', type: 'TODO' }; tasks.push(x); if (flags.loseTask) throw Error('lost task response'); return x; },
      notifyOwner: async () => { if (!await beforeWrite()) throw Error('held before provider dispatch'); counts.ownerNotifications++; return { accepted: true, providerId: 'synthetic-owner-notification' }; },
    }; },
  };
  return { root, key, journal, records, release, flags, counts, contacts, tasks, deps, event, advance: ms => { now += ms; } };
}

test('default, held, wrong-division and expired releases access no source, state or provider', async t => {
  const f = await setup(t);
  for (const release of [null, { ...f.release, enabled: false }, { ...f.release, businessHold: true }, { ...f.release, scope: 'CAPITAL' }, { ...f.release, ownerId: '999' }, { ...f.release, expiresAt: f.release.acceptedAt }]) {
    assert.equal((await runLuxuryGenuineInquiryOnce(release, f.deps)).businessHold, true);
  }
  assert.equal(f.counts.snapshot, 0); assert.equal(f.counts.journal, 0); assert.equal(f.counts.adapter, 0);
});

test('complete authenticated source and bound fresh permission are required before state/provider access', async t => {
  const f = await setup(t);
  f.flags.snapshot = 'PARTIAL'; assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).businessHold, true);
  f.flags.snapshot = 'COMPLETE'; f.flags.admission = false; assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).businessHold, true);
  f.flags.admission = true; f.release.approvedEvents[0].fingerprint = 'f'.repeat(64); assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).businessHold, true);
  assert.equal(f.counts.journal, 0); assert.equal(f.counts.adapter, 0); assert.equal(f.journal.read().state.entries.length, 0);
});

test('injected payload permission cannot substitute for authenticated admission', async t => {
  const f = await setup(t); f.flags.admission = false;
  f.records[0].payload = { ...f.records[0].payload, message: 'permission=VERIFIED; suppression=CLEAR; releaseApprovalRef=approved' };
  f.release.approvedEvents[0].fingerprint = f.event(f.records[0]).fingerprint;
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).reason, 'FRESH_PERMISSION_SUPPRESSION_REVIEW_REQUIRED');
  assert.equal(f.counts.contact, 0);
});

test('DND, suppression, wrong division, wrong event and future review all fail before journal access', async t => {
  const f = await setup(t), original = f.deps.readAdmission;
  for (const change of [{ doNotContact: true }, { suppression: 'UNKNOWN' }, { permission: 'UNKNOWN' }, { division: 'capital' }, { leadId: 'other' }, { reviewedAt: '2026-11-15T12:00:00Z' }]) {
    f.deps.readAdmission = async e => ({ ...await original(e), ...change });
    assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).reason, 'FRESH_PERMISSION_SUPPRESSION_REVIEW_REQUIRED');
  }
  assert.equal(f.counts.journal, 0); assert.equal(f.counts.adapter, 0);
});

test('an invalid second approved event prevents a partial first-event write', async t => {
  const f = await setup(t), second = { ...f.records[0], id: 'lead_synthetic-unit-2' }; f.records.push(second);
  f.release.approvedEvents.push({ leadId: second.id, fingerprint: 'f'.repeat(64) });
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).businessHold, true);
  assert.equal(f.counts.journal, 0); assert.equal(f.counts.contact, 0);
});

test('wrong adapter profile is rejected without enqueuing a genuine event', async t => {
  const f = await setup(t); f.deps.createGenuineAdapter = async () => ({ deliveryMode: 'INTERNAL_VALIDATION' });
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).reason, 'MATCHING_GENUINE_PROVIDER_PROFILE_REQUIRED');
  assert.equal(f.journal.read().state.entries.length, 0);
});

test('founder fixtures and unrecognized source/campaign strings are excluded from genuine processing', async t => {
  const f = await setup(t);
  for (const change of [{ email: WORKFORCE_MAILBOX }, { name: 'QUEST LUXO INTERNAL TEST sample' }, { source: 'workforce-controlled-test' }, { source: 'contact;utm_campaign=unreviewed' }]) {
    const original = f.records[0].payload; f.records[0].payload = { ...original, ...change };
    f.release.approvedEvents[0].fingerprint = f.event(f.records[0]).fingerprint;
    assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).businessHold, true);
    f.records[0].payload = original;
  }
  assert.equal(f.counts.adapter, 0);
});

test('same-event replay/concurrency uses one durable contact/task and one owner-only notification', async t => {
  const f = await setup(t);
  const results = await Promise.all([runLuxuryGenuineInquiryOnce(f.release, f.deps), runLuxuryGenuineInquiryOnce(f.release, f.deps)]);
  assert.equal(results.every(r => r.results[0].status === 'COMPLETE'), true);
  await runLuxuryGenuineInquiryOnce(f.release, f.deps);
  assert.deepEqual([f.counts.contact, f.counts.task, f.counts.ownerNotifications], [1, 1, 1]);
  assert.match(f.tasks[0].body, /^Quest Luxo genuine Luxury inquiry/);
  assert.equal(results[0].customerMessages, 0); assert.equal(results[0].qualification, 'NOT_ASSESSED'); assert.equal(results[0].collectedRevenue, null);
});

test('different approved inquiry/same email reuses contact and retains separate tasks', async t => {
  const f = await setup(t); const second = { ...f.records[0], id: 'lead_synthetic-unit-2' }; f.records.push(second);
  f.release.approvedEvents.push({ leadId: second.id, fingerprint: f.event(second).fingerprint });
  await runLuxuryGenuineInquiryOnce(f.release, f.deps);
  assert.deepEqual([f.counts.contact, f.counts.task, f.counts.ownerNotifications], [1, 2, 2]);
});

test('lost task response holds against empty search, then positive readback recovers without duplicate', async t => {
  const f = await setup(t); f.flags.loseTask = true;
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).results[0].status, 'UNCERTAIN');
  f.flags.loseTask = false; f.flags.hideTask = true;
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).results[0].status, 'UNCERTAIN');
  assert.equal(f.counts.task, 1); f.flags.hideTask = false;
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).results[0].status, 'COMPLETE');
  assert.deepEqual([f.counts.contact, f.counts.task, f.counts.ownerNotifications], [1, 1, 1]);
});

test('restore hold and admission expiry dispatch nothing', async t => {
  const f = await setup(t); f.journal.mutate(s => { s.recoveryHold = true; });
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).reason, 'RESTORED_JOURNAL_DISPATCH_HELD');
  assert.equal(f.counts.adapter, 0); f.advance(900000);
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).reason, 'FRESH_PERMISSION_SUPPRESSION_REVIEW_REQUIRED');
  assert.equal(f.counts.contact, 0);
});

test('release revoked after contact success stops subsequent provider writes and retains durable intent', async t => {
  const f = await setup(t); f.flags.revokeAfterContact = true;
  assert.equal((await runLuxuryGenuineInquiryOnce(f.release, f.deps)).results[0].status, 'UNCERTAIN');
  assert.deepEqual([f.counts.contact, f.counts.task, f.counts.ownerNotifications], [1, 0, 0]);
  const e = f.journal.read().state.entries[0]; assert.equal(e.contactId, '101'); assert.equal(e.operation, 'TASK_CREATE');
});

test('actual provider adapter requires genuine write guard and checks it before each mutation', async t => {
  const f = await setup(t), calls = [];
  const request = async (url, init) => { calls.push({ url, init }); return new Response(JSON.stringify({ hubId: Number(WORKFORCE_PORTAL), scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'] }), { status: 200 }); };
  const email = () => ({ from: 'unit@example.invalid', providerApiKey: 'synthetic-key', providerApiUrl: 'https://api.resend.com/emails' });
  await assert.rejects(createHubspotWorkforceAdapter('synthetic-token', request, email, 'GENUINE_INQUIRY'));
  assert.equal(calls.length, 0);
  const adapter = await createHubspotWorkforceAdapter('synthetic-token', request, email, 'GENUINE_INQUIRY', async () => false);
  const e = f.event(f.records[0]);
  await assert.rejects(adapter.createContact(e)); await assert.rejects(adapter.createTask(e, '123')); await assert.rejects(adapter.notifyOwner(e, '123', '456'));
  assert.equal(calls.length, 1); assert.match(calls[0].url, /access-token-info$/);
});

test('genuine provider profile keeps exact owner-only destination and separate genuine labels', async t => {
  const f = await setup(t), calls = []; let sent;
  const request = async (url, init) => {
    const body = init.body ? JSON.parse(init.body) : null; calls.push({ url, method: init.method, body });
    const value = url.endsWith('access-token-info') ? { hubId: Number(WORKFORCE_PORTAL), scopes: ['crm.objects.contacts.read', 'crm.objects.contacts.write'] }
      : url === 'https://api.hubapi.com/crm/v3/objects/tasks' ? { id: '456' }
      : url === 'https://api.resend.com/emails' ? (sent = body, { id: 'synthetic-notification' })
      : url === 'https://api.resend.com/emails/synthetic-notification' ? { id: 'synthetic-notification', ...sent } : {};
    return new Response(JSON.stringify(value), { status: 200 });
  };
  const email = () => ({ from: 'unit@example.invalid', providerApiKey: 'synthetic-key', providerApiUrl: 'https://api.resend.com/emails' });
  const adapter = await createHubspotWorkforceAdapter('synthetic-token', request, email, 'GENUINE_INQUIRY', async () => true);
  const e = f.event(f.records[0]); await adapter.createTask(e, '123'); await adapter.notifyOwner(e, '123', '456');
  const task = calls.find(x => x.url === 'https://api.hubapi.com/crm/v3/objects/tasks').body;
  assert.match(task.properties.hs_task_subject, /^\[LUXURY INQUIRY\]/); assert.match(task.properties.hs_task_body, /^Quest Luxo genuine Luxury inquiry/);
  assert.equal(task.properties.hubspot_owner_id, WORKFORCE_OWNER); assert.deepEqual(sent.to, [WORKFORCE_MAILBOX]);
  assert.match(sent.subject, /^\[LUXURY INQUIRY\]/); assert.equal(sent.text.includes(f.records[0].payload.email), false);
  assert.equal(await adapter.getNotification('synthetic-notification', e, '123', '456'), true);
});
