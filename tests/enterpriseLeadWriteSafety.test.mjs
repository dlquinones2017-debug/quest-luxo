import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fork } from "node:child_process";
import { once } from "node:events";
import { createJsonlLeadStorageAdapter } from "../src/lib/leads/leadStorage.ts";
import { withLeadStorageLock } from "../src/lib/leads/leadStorageLock.ts";
import { createLeadStorageBackup, removeExactLabeledSmokeTestLead } from "../src/lib/leads/leadStorageOperations.ts";
import { processLeadSubmission } from "../src/lib/leads/leadSubmission.ts";

const fixture = { name: "Internal fixture", email: "fixture@example.test", message: "WRITE_SAFETY_FIXTURE" };
async function temporary(run) {
  const directory = await mkdtemp(join(tmpdir(), "qlux-write-"));
  try { return await run(directory); } finally { await rm(directory, { recursive: true, force: true }); }
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test("independent adapters retain simultaneous submissions and delivery updates", async () => temporary(async directory => {
  const a = createJsonlLeadStorageAdapter(directory), b = createJsonlLeadStorageAdapter(directory);
  const seed = await a.saveLeadSubmission(fixture);
  await Promise.all([
    ...Array.from({ length: 12 }, (_, i) => (i % 2 ? a : b).saveLeadSubmission({ ...fixture, name: `Fixture ${i}` })),
    a.updateLeadSubmissionNotes(seed.id, "reviewed"),
    b.updateLeadSubmissionTags(seed.id, ["review"]),
    a.updateLeadSubmissionStatus(seed.id, "contacted"),
    b.updateLeadSubmissionEmailDelivery(seed.id, { status: "failed", configured: true }),
    a.addLeadSubmissionEconomicsSnapshot(seed.id, { reference: "fixture", purchasePrice: 100, estimatedMarketValue: 200 }),
  ]);
  const records = await a.readLeadSubmissions();
  assert.equal(records.length, 13); assert.equal(new Set(records.map(r => r.id)).size, 13);
  const record = records.find(r => r.id === seed.id);
  assert.equal(record.notes, "reviewed"); assert.deepEqual(record.tags, ["review"]);
  assert.equal(record.status, "contacted"); assert.equal(record.emailDelivery.status, "failed");
  assert.equal(record.economicsSnapshots.length, 1);
  assert.deepEqual((await readdir(directory)).sort(), ["leads.jsonl"]);
}));

test("separate Node processes share the same lock and preserve every acknowledged record", { timeout: 20_000 }, async () => temporary(async directory => {
  const adapter = createJsonlLeadStorageAdapter(directory), seed = await adapter.saveLeadSubmission(fixture);
  const workers = Array.from({ length: 4 }, () => fork(new URL("./fixtures/leadStorageWriter.mjs", import.meta.url), [], { stdio: ["ignore", "ignore", "ignore", "ipc"] }));
  try {
    await Promise.all(workers.map(async worker => { const [message] = await once(worker, "message"); assert.equal(message, "ready"); }));
    const finished = workers.map(worker => once(worker, "exit"));
    workers.forEach((worker, index) => worker.send({ directory, id: seed.id, worker: index }));
    for (const [code] of await Promise.all(finished)) assert.equal(code, 0);
    const records = await adapter.readLeadSubmissions();
    assert.equal(records.length, 17); assert.equal(new Set(records.map(r => r.id)).size, 17);
    const record = records.find(r => r.id === seed.id);
    assert.equal(record.notes, "reviewed fixture"); assert.deepEqual(record.tags, ["review"]);
    assert.equal(record.status, "contacted"); assert.equal(record.emailDelivery.status, "sent");
    assert.deepEqual(await readdir(directory), ["leads.jsonl"]);
  } finally { for (const worker of workers) worker.kill(); }
}));

test("writer waits for the current owner while source snapshots remain read only", async () => temporary(async directory => {
  const adapter = createJsonlLeadStorageAdapter(directory); await adapter.saveLeadSubmission(fixture);
  const entered = deferred(), release = deferred();
  const owner = withLeadStorageLock(join(directory, "leads.jsonl"), async () => { entered.resolve(); await release.promise; });
  await entered.promise;
  let written = false;
  const writer = adapter.saveLeadSubmission(fixture).then(() => { written = true; });
  assert.equal((await adapter.readLeadSubmissionSnapshot()).records.length, 1); assert.equal(written, false);
  release.resolve(); await owner; await writer;
  assert.equal((await adapter.readLeadSubmissions()).length, 2);
}));

test("an existing lock times out without entering the transaction or deleting its owner's lock", async () => temporary(async directory => {
  const file = join(directory, "leads.jsonl"), lock = `${file}.lock`;
  await writeFile(lock, "existing-owner", { flag: "wx" });
  let entered = false;
  await assert.rejects(withLeadStorageLock(file, async () => { entered = true; }, { timeoutMs: 0 }), /busy/);
  assert.equal(entered, false); assert.equal(await readFile(lock, "utf8"), "existing-owner");
  for (const timeoutMs of [-1, NaN, Infinity, 10_001]) await assert.rejects(withLeadStorageLock(file, async () => {}, { timeoutMs }));
}));

test("a failed operation releases only its own lock and allows a later writer", async () => temporary(async directory => {
  const file = join(directory, "leads.jsonl");
  await assert.rejects(withLeadStorageLock(file, async () => { throw Error("fixture failure"); }), /fixture failure/);
  await createJsonlLeadStorageAdapter(directory).saveLeadSubmission(fixture);
  assert.deepEqual(await readdir(directory), ["leads.jsonl"]);
}));

test("every application mutation refuses malformed source without dropping or changing any bytes", async () => temporary(async directory => {
  const adapter = createJsonlLeadStorageAdapter(directory), seed = await adapter.saveLeadSubmission(fixture);
  const file = join(directory, "leads.jsonl"), bytes = `${await readFile(file, "utf8")}INVALID_PRIVATE_FIXTURE\n`;
  await writeFile(file, bytes);
  const error = console.error; const logs = []; console.error = (...args) => logs.push(args);
  try {
    for (const operation of [
      () => adapter.saveLeadSubmission(fixture), () => adapter.updateLeadSubmissionStatus(seed.id, "contacted"),
      () => adapter.updateLeadSubmissionNotes(seed.id, "review"), () => adapter.updateLeadSubmissionTags(seed.id, ["review"]),
      () => adapter.updateLeadSubmissionEmailDelivery(seed.id, { status: "sent" }),
      () => adapter.addLeadSubmissionEconomicsSnapshot(seed.id, { reference: "fixture" }),
    ]) { await assert.rejects(operation(), /integrity/); assert.equal(await readFile(file, "utf8"), bytes); }
    assert.doesNotMatch(JSON.stringify(logs), /INVALID_PRIVATE_FIXTURE|fixture@example/);
  } finally { console.error = error; }
  assert.deepEqual(await readdir(directory), ["leads.jsonl"]);
}));

test("append preserves a valid legacy final line without a newline", async () => temporary(async directory => {
  const adapter = createJsonlLeadStorageAdapter(directory), file = join(directory, "leads.jsonl");
  await adapter.saveLeadSubmission(fixture);
  const original = (await readFile(file, "utf8")).trimEnd(); await writeFile(file, original);
  await adapter.saveLeadSubmission(fixture);
  assert.ok((await readFile(file, "utf8")).startsWith(`${original}\n`));
  assert.equal((await adapter.readLeadSubmissionSnapshot()).status, "COMPLETE");
  assert.equal((await adapter.readLeadSubmissions()).length, 2);
}));

test("storage failure prevents notification and does not acknowledge a lost inquiry", async () => temporary(async directory => {
  const adapter = createJsonlLeadStorageAdapter(directory), file = join(directory, "leads.jsonl");
  await writeFile(file, "malformed\n"); let notified = false;
  const error = console.error; console.error = () => {};
  try {
    const result = await processLeadSubmission(fixture, { ensureReady: async () => {}, persist: payload => adapter.saveLeadSubmission(payload), notify: async () => { notified = true; }, recordDelivery: async () => {} });
    assert.equal(result.success, false); assert.equal(result.failureStage, "persistence"); assert.equal(result.statusCode, 503); assert.equal(notified, false);
    assert.equal(await readFile(file, "utf8"), "malformed\n");
  } finally { console.error = error; }
}));

test("exact smoke cleanup and backup coordinate with application writers", async () => temporary(async directory => {
  const adapter = createJsonlLeadStorageAdapter(directory), file = join(directory, "leads.jsonl");
  const seed = await adapter.saveLeadSubmission(fixture);
  await adapter.saveLeadSubmission({ ...fixture, message: "UNRELATED_FIXTURE" });
  const [backup] = await Promise.all([
    createLeadStorageBackup({ sourceFile: file, backupDirectory: join(directory, "backup") }),
    removeExactLabeledSmokeTestLead({ storageFile: file, leadId: seed.id, label: "WRITE_SAFETY_FIXTURE" }),
    ...Array.from({ length: 6 }, () => adapter.saveLeadSubmission({ ...fixture, message: "UNRELATED_FIXTURE" })),
  ]);
  const records = await adapter.readLeadSubmissions(); assert.equal(records.length, 7);
  assert.ok(records.every(r => r.payload.message === "UNRELATED_FIXTURE"));
  assert.ok(backup.records >= 1); assert.equal(backup.sha256.length, 64);
  assert.equal((await readdir(directory)).filter(name => /lock|tmp/.test(name)).length, 0);
}));

test("new source, lock and rewritten files use private POSIX modes", { skip: process.platform === "win32" }, async () => temporary(async directory => {
  const adapter = createJsonlLeadStorageAdapter(directory), file = join(directory, "leads.jsonl");
  const seed = await adapter.saveLeadSubmission(fixture);
  assert.equal((await stat(file)).mode & 0o777, 0o600);
  await withLeadStorageLock(file, async () => { assert.equal((await stat(`${file}.lock`)).mode & 0o777, 0o600); });
  await adapter.updateLeadSubmissionNotes(seed.id, "reviewed");
  assert.equal((await stat(file)).mode & 0o777, 0o600);
}));
