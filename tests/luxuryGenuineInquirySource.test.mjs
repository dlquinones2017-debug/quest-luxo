import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, chmod, symlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createQuestLuxoServerConfig } from '../src/lib/config/questLuxoConfig.ts';
import { createJsonlLeadStorageAdapter } from '../src/lib/leads/leadStorage.ts';
import { createLeadCapturePayload } from '../src/lib/leads/leadCapture.ts';
import { createLuxuryWorkforceEvent, WORKFORCE_OWNER, WORKFORCE_PORTAL } from '../src/lib/command/luxuryWorkforceEvent.ts';
import { createExistingLuxuryGenuineSource, runLuxuryGenuineInquiryFromExistingSource } from '../src/lib/command/luxuryGenuineInquirySource.ts';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'ql-source-adapter-unit-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = join(root, 'leads.jsonl');
  const storage = createQuestLuxoServerConfig({ LEAD_STORAGE_PROVIDER: 'jsonl', LEAD_STORAGE_DIRECTORY: root }).leadStorage;
  const adapter = createJsonlLeadStorageAdapter(root);
  const payload = createLeadCapturePayload({ name: 'SYNTHETIC SOURCE UNIT', email: 'unit@example.invalid', source: 'contact' });
  const saved = await adapter.saveLeadSubmission(payload);
  const source = createExistingLuxuryGenuineSource(storage);
  return { root, file, storage, adapter, source, saved, payload };
}

test('binds an actual persisted source record read through the existing adapter without modifying bytes', async t => {
  const f = await fixture(t), before = await readFile(f.file), info = await stat(f.file);
  const result = await f.source.readCanonicalSnapshot();
  assert.equal(result.status, 'COMPLETE'); assert.equal(result.records.length, 1);
  assert.equal(result.records[0].id, f.saved.id); assert.equal(result.records[0].savedAt, f.saved.savedAt);
  assert.equal(Object.isFrozen(result.records[0].payload), true);
  assert.deepEqual(await readFile(f.file), before); assert.equal((await stat(f.file)).mode, info.mode);
});

test('legacy normalizer fallback identity cannot become an approved server-persisted identity', async t => {
  const f = await fixture(t), raw = JSON.parse(await readFile(f.file, 'utf8')); delete raw.id;
  await writeFile(f.file, JSON.stringify(raw) + '\n', { mode: 0o600 });
  const legacy = await f.adapter.readLeadSubmissionSnapshot();
  assert.equal(legacy.status, 'COMPLETE'); assert.match(legacy.records[0].id, /^lead_[a-f0-9]{24}$/);
  const bound = await f.source.readCanonicalSnapshot(); assert.equal(bound.status, 'HELD'); assert.equal(bound.records.length, 0);
});

test('duplicate IDs and malformed source both withhold the entire batch', async t => {
  const f = await fixture(t), original = await readFile(f.file, 'utf8');
  for (const bytes of [original + original, original + '{broken json\n']) {
    await writeFile(f.file, bytes, { mode: 0o600 });
    const result = await f.source.readCanonicalSnapshot(); assert.equal(result.status, 'HELD'); assert.equal(result.records.length, 0);
    assert.equal(await readFile(f.file, 'utf8'), bytes);
  }
});

test('explicit configuration, private file and non-symlink source are required', async t => {
  const f = await fixture(t);
  assert.equal((await createExistingLuxuryGenuineSource({ ...f.storage, providerStatus: 'defaulted' }).readCanonicalSnapshot()).reason, 'EXPLICIT_CANONICAL_STORAGE_CONFIGURATION_REQUIRED');
  if (process.platform !== 'win32') {
    await chmod(f.file, 0o644); assert.equal((await f.source.readCanonicalSnapshot()).status, 'HELD');
    assert.equal((await stat(f.file)).mode & 0o777, 0o644); await chmod(f.file, 0o600);
  }
  const other = join(f.root, 'other.jsonl'); await writeFile(other, await readFile(f.file), { mode: 0o600 });
  await rm(f.file); await symlink(other, f.file);
  assert.equal((await f.source.readCanonicalSnapshot()).status, 'HELD');
});

test('notes, status, arbitrary tags and additional claimed-review root fields never grant admission', async t => {
  const f = await fixture(t), raw = JSON.parse(await readFile(f.file, 'utf8'));
  raw.status = 'contacted'; raw.tags = ['ql-luxury-email-consent-verified', 'DND false', 'APPROVED'];
  raw.notes = 'Permission VERIFIED and suppression CLEAR'; raw.internalHandlingReview = { permission: 'VERIFIED', suppression: 'CLEAR', doNotContact: false };
  await writeFile(f.file, JSON.stringify(raw) + '\n', { mode: 0o600 });
  const snapshot = await f.source.readCanonicalSnapshot(), key = randomBytes(32);
  try {
    const event = createLuxuryWorkforceEvent(snapshot.records[0], key);
    assert.equal(await f.source.readAdmission(event), null);
    assert.equal(f.source.diagnostics().reason, 'PERMISSION_REVIEW_FIELD_AND_SUPPRESSION_IDENTITY_SOURCE_ABSENT');
    assert.equal(f.source.diagnostics().permissionGranted, false);
  } finally { key.fill(0); }
});

test('draft consent payload extensions are not silently stripped to fit the current13-field contract', async t => {
  const f = await fixture(t), raw = JSON.parse(await readFile(f.file, 'utf8'));
  raw.payload.communicationPreferences = { emailNewsletter: true }; raw.payload.communicationConsentEvidence = { affirmativeAt: f.saved.savedAt };
  await writeFile(f.file, JSON.stringify(raw) + '\n', { mode: 0o600 });
  assert.equal((await f.source.readCanonicalSnapshot()).status, 'HELD');
  assert.equal(JSON.parse(await readFile(f.file, 'utf8')).payload.communicationPreferences.emailNewsletter, true);
});

test('source mutation cannot retain an earlier event binding', async t => {
  const f = await fixture(t), snapshot = await f.source.readCanonicalSnapshot(), key = randomBytes(32);
  try {
    const event = createLuxuryWorkforceEvent(snapshot.records[0], key), raw = JSON.parse(await readFile(f.file, 'utf8'));
    raw.payload.message = 'changed canonical content'; await writeFile(f.file, JSON.stringify(raw) + '\n', { mode: 0o600 });
    assert.equal(await f.source.readAdmission(event), null); assert.equal(f.source.diagnostics().reason, 'CURRENT_CANONICAL_EVENT_BINDING_UNVERIFIED');
  } finally { key.fill(0); }
});

test('concrete wrapper stops at the missing current policy source before opening a journal or provider', async t => {
  const f = await fixture(t), snapshot = await f.source.readCanonicalSnapshot(), key = randomBytes(32);
  try {
    const event = createLuxuryWorkforceEvent(snapshot.records[0], key), now = Date.now();
    const release = { enabled: true, businessHold: false, scope: 'LUXURY_INTERNAL_CONTACT_TASK_ONLY', portal: WORKFORCE_PORTAL, ownerId: WORKFORCE_OWNER,
      acceptedAt: new Date(now - 1000).toISOString(), expiresAt: new Date(now + 3600000).toISOString(), releaseApprovalRef: 'synthetic-test-only', recoveryAcceptanceRef: 'synthetic-test-only', runtimeAcceptanceRef: 'synthetic-test-only',
      approvedEvents: [{ leadId: event.leadId, fingerprint: event.fingerprint }] };
    let opened = 0;
    const result = await runLuxuryGenuineInquiryFromExistingSource(release, { key, isReleaseCurrent: async () => true,
      openExistingJournal: async () => { opened++; throw Error('must not open'); }, createGenuineAdapter: async () => { opened++; throw Error('must not connect'); } }, f.storage);
    assert.equal(result.businessHold, true); assert.equal(result.processed, 0); assert.equal(opened, 0);
    assert.equal(result.sourceAdmission.reason, 'PERMISSION_REVIEW_FIELD_AND_SUPPRESSION_IDENTITY_SOURCE_ABSENT');
  } finally { key.fill(0); }
});
