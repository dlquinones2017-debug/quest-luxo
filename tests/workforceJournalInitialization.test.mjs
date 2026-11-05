import assert from 'node:assert/strict';
import test from 'node:test';
import fs, { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile } from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
import { randomBytes } from 'node:crypto';
import { join, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { WorkforcePhaseJournal } from '../src/lib/command/workforcePhaseJournal.ts';

const posix = process.platform !== 'win32';
const linux = process.platform === 'linux';
const files = ['crm-contact-task-journal-v2.sqlite', 'crm-contact-task-journal-v2.initialized'];
const initialize = (path, key) => WorkforcePhaseJournal.open(path, key, { initialize: true, requireNewDirectory: true });
const identity = s => [s.dev, s.ino, s.uid, s.gid, s.mode];
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'ql-init-synthetic-'));
  const key = randomBytes(32);
  t.after(async () => {
    key.fill(0);
    const inside = relative(tmpdir(), root);
    assert.ok(!isAbsolute(inside) && !inside.startsWith('..') && inside.startsWith('ql-init-synthetic-'));
    await rm(root, { recursive: true, force: true });
  });
  return { root, key, target: join(root, 'workforce-validation-v2') };
}
function mockOpen(t, intercept) {
  const original = fs.open;
  t.mock.method(fs, 'open', async (...args) => intercept(original, ...args));
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
}

test('exclusive empty initialization is readable and a second initialization cannot alter it', async t => {
  const { root, target, key } = await fixture(t), parent = identity(await lstat(root));
  const journal = await initialize(target, key);
  try {
    const state = journal.read().state;
    assert.equal(state.sequence, 0); assert.deepEqual(state.entries, []); assert.deepEqual(state.contacts, []);
  } finally { journal.close(); }
  const before = await Promise.all(files.map(name => readFile(join(target, name))));
  const directory = identity(await lstat(target));
  await assert.rejects(() => initialize(target, key));
  assert.deepEqual(identity(await lstat(target)), directory);
  assert.deepEqual(await Promise.all(files.map(name => readFile(join(target, name)))), before);
  assert.deepEqual(identity(await lstat(root)), parent);
  const reopened = await WorkforcePhaseJournal.open(target, key);
  reopened.close();
});

test('Linux setgid inheritance is reproduced and only the new child becomes exact0700', { skip: !linux }, async t => {
  const { root, target, key } = await fixture(t);
  await chmod(root, 0o2775);
  const parent = identity(await lstat(root)), control = join(root, 'inheritance-control');
  await mkdir(control, { mode: 0o700 });
  assert.equal((await lstat(control)).mode & 0o7777, 0o2700);
  const journal = await initialize(target, key); journal.close();
  assert.equal((await lstat(target)).mode & 0o7777, 0o700);
  for (const name of [target, ...files.map(name => join(target, name))]) {
    const s = await lstat(name);
    assert.equal(s.uid, process.geteuid()); assert.equal(s.gid, process.getegid());
    if (s.isFile()) assert.equal(s.mode & 0o7777, 0o600);
  }
  assert.deepEqual(identity(await lstat(root)), parent);
  assert.equal((await lstat(control)).mode & 0o7777, 0o2700);
});

test('pre-existing empty directories, files and incomplete journals are never repaired', async t => {
  const { root, target, key } = await fixture(t);
  await mkdir(target, { mode: 0o755 });
  const before = identity(await lstat(target));
  await assert.rejects(() => initialize(target, key));
  assert.deepEqual(identity(await lstat(target)), before); assert.deepEqual(await readdir(target), []);
  const file = join(root, 'existing-file'); await writeFile(file, 'SYNTHETIC sentinel');
  await assert.rejects(() => initialize(file, key)); assert.equal(await readFile(file, 'utf8'), 'SYNTHETIC sentinel');
  await writeFile(join(target, files[1]), 'SYNTHETIC incomplete marker');
  await assert.rejects(() => initialize(target, key));
  assert.equal(await readFile(join(target, files[1]), 'utf8'), 'SYNTHETIC incomplete marker');
  assert.deepEqual(await readdir(target), [files[1]]);
});

test('invalid key and invalid exclusive options cannot create a target', async t => {
  const { root, target, key } = await fixture(t);
  await assert.rejects(() => initialize(target, Buffer.alloc(1)));
  await assert.rejects(() => WorkforcePhaseJournal.open(target, key, { requireNewDirectory: true }));
  assert.deepEqual(await readdir(root), []);
});

test('pre-existing target symlink and symlink parent cannot redirect initialization', { skip: !posix }, async t => {
  const { root, target, key } = await fixture(t), other = join(root, 'other');
  await mkdir(other, { mode: 0o755 }); const before = identity(await lstat(other));
  await symlink(other, target, 'dir');
  await assert.rejects(() => initialize(target, key));
  await assert.rejects(() => initialize(join(target, 'nested'), key));
  assert.deepEqual(identity(await lstat(other)), before); assert.deepEqual(await readdir(other), []);
});

test('a directory replacement between lstat and open is rejected before chmod or files', { skip: !posix }, async t => {
  const { root, target, key } = await fixture(t), moved = join(root, 'moved'); let swapped = false;
  mockOpen(t, async (original, path, ...args) => {
    if (path === target && !swapped) { swapped = true; await rename(target, moved); await mkdir(target, { mode: 0o755 }); }
    return original(path, ...args);
  });
  await assert.rejects(() => initialize(target, key)); assert.equal(swapped, true);
  assert.equal((await lstat(target)).mode & 0o7777, 0o755);
  assert.deepEqual(await readdir(target), []); assert.deepEqual(await readdir(moved), []);
});

test('a symlink replacement before open is rejected without changing its destination', { skip: !posix }, async t => {
  const { root, target, key } = await fixture(t), moved = join(root, 'moved'), other = join(root, 'other');
  await mkdir(other, { mode: 0o755 }); const before = identity(await lstat(other)); let swapped = false;
  mockOpen(t, async (original, path, ...args) => {
    if (path === target && !swapped) { swapped = true; await rename(target, moved); await symlink(other, target, 'dir'); }
    return original(path, ...args);
  });
  await assert.rejects(() => initialize(target, key)); assert.equal(swapped, true);
  assert.deepEqual(identity(await lstat(other)), before); assert.deepEqual(await readdir(other), []);
  assert.deepEqual(await readdir(moved), []);
});

test('ownership mismatch stops before normalization or marker/database creation', { skip: !posix }, async t => {
  const { target, key } = await fixture(t); let checked = false, chmodCalls = 0;
  mockOpen(t, async (original, path, ...args) => {
    const handle = await original(path, ...args);
    if (path !== target) return handle;
    return { stat: async () => { checked = true; const s = await handle.stat(); s.uid += 1; return s; },
      chmod: async () => { chmodCalls++; }, close: () => handle.close() };
  });
  await assert.rejects(() => initialize(target, key)); assert.equal(checked, true); assert.equal(chmodCalls, 0);
  assert.deepEqual(await readdir(target), []);
});

test('a changed parent identity stops before opening or protecting the new child', async t => {
  const { root, target, key } = await fixture(t), original = fs.lstat; let parentReads = 0;
  t.mock.method(fs, 'lstat', async (...args) => {
    const s = await original(...args);
    if (args[0] === root && ++parentReads > 1) s.ino = -1;
    return s;
  });
  syncBuiltinESMExports();
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  await assert.rejects(() => initialize(target, key));
  assert.ok(parentReads > 1); assert.deepEqual(await readdir(target), []);
});

test('failed normalization retains the new directory, writes no files and cannot be retried as fresh', { skip: !linux }, async t => {
  const { root, target, key } = await fixture(t); await chmod(root, 0o2775); let attempted = 0;
  mockOpen(t, async (original, path, ...args) => {
    const handle = await original(path, ...args);
    if (path !== target) return handle;
    return { stat: () => handle.stat(), chmod: async () => { attempted++; throw Error('SYNTHETIC fchmod failure'); }, close: () => handle.close() };
  });
  await assert.rejects(() => initialize(target, key)); assert.equal(attempted, 1);
  assert.equal((await lstat(target)).mode & 0o7777, 0o2700); assert.deepEqual(await readdir(target), []);
  await assert.rejects(() => initialize(target, key)); assert.equal(attempted, 1);
  assert.equal((await lstat(root)).mode & 0o7777, 0o2775);
});

test('replacement during descriptor chmod cannot redirect chmod or receive journal files', { skip: !linux }, async t => {
  const { root, target, key } = await fixture(t), moved = join(root, 'moved'); await chmod(root, 0o2775); let attempted = 0;
  mockOpen(t, async (original, path, ...args) => {
    const handle = await original(path, ...args);
    if (path !== target) return handle;
    return { stat: () => handle.stat(), chmod: async mode => {
      attempted++; await rename(target, moved); await mkdir(target, { mode: 0o700 }); await handle.chmod(mode);
    }, close: () => handle.close() };
  });
  await assert.rejects(() => initialize(target, key)); assert.equal(attempted, 1);
  assert.equal((await lstat(moved)).mode & 0o7777, 0o700);
  assert.equal((await lstat(target)).mode & 0o7777, 0o2700);
  assert.deepEqual(await readdir(moved), []); assert.deepEqual(await readdir(target), []);
});

test('explicit command binds its target to configured storage and refuses a second initialization', async t => {
  const { root, key } = await fixture(t), script = new URL('../scripts/workforce-validation.mjs', import.meta.url);
  const env = { ...process.env, LEAD_STORAGE_DIRECTORY: root, WORKFORCE_JOURNAL_KEY_HEX: key.toString('hex'), QUEST_WORKFORCE_VALIDATION_ENABLED: 'false' };
  delete env.WORKFORCE_VALIDATION_LEAD_IDS; delete env.WORKFORCE_HUBSPOT_ACCESS_TOKEN;
  // fileURLToPath below avoids Windows drive-letter/space URL encoding in the child invocation.
  const { fileURLToPath } = await import('node:url');
  const args = [fileURLToPath(script), 'initialize'];
  const first = await promisify(execFile)(process.execPath, args, { env });
  const result = JSON.parse(first.stdout); assert.equal(result.sequence, 0); assert.equal(result.entries, 0); assert.equal(result.businessHold, true);
  const target = join(root, 'workforce-validation-v2'), before = await Promise.all(files.map(name => readFile(join(target, name))));
  await assert.rejects(() => promisify(execFile)(process.execPath, args, { env }));
  assert.deepEqual(await Promise.all(files.map(name => readFile(join(target, name)))), before);
  assert.deepEqual(await readdir(root), ['workforce-validation-v2']);
});
