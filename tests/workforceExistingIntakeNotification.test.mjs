import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WorkforcePhaseJournal } from '../src/lib/command/workforcePhaseJournal.ts';
import { WorkforceContactTaskDelivery, workforceTaskMetadata } from '../src/lib/command/workforceContactTaskDelivery.ts';
import { createLuxuryWorkforceEvent, WORKFORCE_OWNER } from '../src/lib/command/luxuryWorkforceEvent.ts';
import { createLeadCapturePayload } from '../src/lib/leads/leadCapture.ts';

async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), 'ql-existing-intake-')), key = randomBytes(32);
  const journal = await WorkforcePhaseJournal.open(join(root, 'journal'), key, { initialize: true, requireNewDirectory: true });
  t.after(async () => { journal.close(); key.fill(0); await rm(root, { recursive: true, force: true }); });
  const now = Date.parse('2026-11-15T12:00:00Z'), savedAt = new Date(now).toISOString();
  const event = createLuxuryWorkforceEvent({ id: 'lead_synthetic-intake', savedAt,
    payload: createLeadCapturePayload({ name: 'SYNTHETIC UNIT', email: 'intake@example.invalid', source: 'contact', createdAt: savedAt }) }, key);
  const counts = { contacts: 0, tasks: 0, emails: 0, receiptReads: 0 };
  let contact, task;
  const flags = { verified: true, changeAfterTask: false, substitute: false };
  const adapter = { deliveryMode: 'GENUINE_INQUIRY',
    getExistingIntakeNotification: async e => { counts.receiptReads++; return flags.verified ? { status: 'ACCEPTANCE_RECORDED', providerId: null,
      sourceRecordId: e.leadId, savedAt: e.savedAt, fingerprint: flags.substitute ? 'f'.repeat(64) : e.fingerprint } : { status: 'UNVERIFIED' }; },
    findContact: async () => contact ?? null, getContact: async () => contact ?? null,
    createContact: async e => { counts.contacts++; return contact = { id: '101', email: e.payload.email }; },
    findTask: async () => task ?? null, getTask: async () => task ?? null,
    createTask: async (e, id) => { counts.tasks++; if (flags.changeAfterTask) flags.verified = false;
      return task = { id: '201', ownerId: WORKFORCE_OWNER, contactIds: [id], body: workforceTaskMetadata(e, 'GENUINE_INQUIRY'),
        dueAt: new Date(Date.parse(e.savedAt) + 86400000).toISOString(), type: 'TODO', status: 'NOT_STARTED' }; },
    notifyOwner: async () => { counts.emails++; throw Error('No second email allowed'); },
  };
  const worker = new WorkforceContactTaskDelivery(journal, adapter, () => now, 'GENUINE_INQUIRY');
  return { root, key, journal, event, counts, flags, adapter, worker };
}

test('genuine contact/task delivery reuses intake acceptance without a workforce notification ID or another email', async t => {
  const f = await setup(t);
  const results = await Promise.all([f.worker.deliver(f.event), f.worker.deliver(f.event)]);
  assert.equal(results.every(x => x.status === 'COMPLETE'), true);
  assert.deepEqual([f.counts.contacts, f.counts.tasks, f.counts.emails], [1, 1, 0]);
  await f.worker.deliver(f.event);
  assert.deepEqual([f.counts.contacts, f.counts.tasks, f.counts.emails], [1, 1, 0]);
  const entry = f.journal.read().state.entries[0];
  assert.equal(entry.notification, 'EXISTING_INTAKE_ACCEPTANCE_RECORDED');
  assert.equal(entry.notificationId, null); assert.equal(entry.inboxReceipt, 'UNKNOWN'); assert.equal(entry.humanAction, 'UNKNOWN');
  await assert.rejects(f.worker.reconcileOwnerInboxReceipt(f.event, 'deadbeef', { read: async () => { throw Error('must not read'); } }), /Bound notification/);
});

test('missing, changed, substituted or throwing intake evidence holds before journal enqueue and CRM writes', async t => {
  const f = await setup(t);
  f.flags.verified = false;
  assert.equal((await f.worker.deliver(f.event)).status, 'EXISTING_INTAKE_NOTICE_UNVERIFIED');
  f.flags.verified = true; f.flags.substitute = true;
  assert.equal((await f.worker.deliver(f.event)).status, 'EXISTING_INTAKE_NOTICE_UNVERIFIED');
  f.adapter.getExistingIntakeNotification = async () => { throw Error('source unavailable'); };
  assert.equal((await f.worker.deliver(f.event)).status, 'EXISTING_INTAKE_NOTICE_UNVERIFIED');
  assert.deepEqual([f.counts.contacts, f.counts.tasks, f.counts.emails], [0, 0, 0]);
  assert.equal(f.journal.read().state.entries.length, 0);
});

test('intake metadata disappearing after task creation holds and reconciles the same task with no send', async t => {
  const f = await setup(t); f.flags.changeAfterTask = true;
  const first = await f.worker.deliver(f.event);
  assert.equal(first.status, 'UNCERTAIN'); assert.equal(first.taskId, '201');
  assert.equal(f.journal.read().state.entries[0].notification, 'NOT_ATTEMPTED');
  f.flags.verified = true; f.flags.changeAfterTask = false;
  assert.equal((await f.worker.deliver(f.event)).status, 'COMPLETE');
  assert.deepEqual([f.counts.contacts, f.counts.tasks, f.counts.emails], [1, 1, 0]);
});

test('populated intake-mode backup retains the distinct notification state and restore HOLD', async t => {
  const f = await setup(t); await f.worker.deliver(f.event);
  const archive = join(f.root, 'synthetic-intake-backup.json'); await f.journal.exportBackup(archive);
  const restored = await WorkforcePhaseJournal.restoreBackup(archive, join(f.root, 'restored'), f.key);
  try {
    const snapshot = restored.read().state;
    assert.equal(snapshot.recoveryHold, true);
    assert.equal(snapshot.entries[0].notification, 'EXISTING_INTAKE_ACCEPTANCE_RECORDED');
    const worker = new WorkforceContactTaskDelivery(restored, f.adapter, () => Date.parse(f.event.savedAt), 'GENUINE_INQUIRY');
    assert.equal((await worker.deliver(f.event)).status, 'RESTORE_RECONCILIATION_REQUIRED');
    assert.deepEqual([f.counts.contacts, f.counts.tasks, f.counts.emails], [1, 1, 0]);
  } finally { restored.close(); }
});
