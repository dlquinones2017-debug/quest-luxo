import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readdir, readFile, writeFile, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { maintainPilotStorage, createPilotMonitor } from "../scripts/pilot-storage-maintenance.mjs";
import { runPersistentSyntheticPilot, createPilotHealthServer } from "../scripts/start-agent-pilot.mjs";
import { exportPipelineBackup } from "../src/lib/command/enterprisePipelineBackup.ts";

async function fixture(fn) {
  const root = await mkdtemp(join(tmpdir(), "quest-maintenance-")), key = randomBytes(32);
  try { await runPersistentSyntheticPilot(root, key); await fn(root, key); }
  finally { key.fill(0); await rm(root, { recursive: true, force: true }); }
}
test("retention authenticates and restores ciphertext, deduplicates an unchanged snapshot, and never asserts offsite readiness", () => fixture(async (root, key) => {
  const first = await maintainPilotStorage(root, key), second = await maintainPilotStorage(root, key);
  assert.deepEqual(first, second);
  assert.equal(first.localBackupVerified, true);
  assert.equal(first.independentBackupVerified, false);
  assert.equal(first.businessDataReady, false);
  assert.equal((await readdir(join(root, "retained"))).length, 1);
  const backup = await readFile(join(root, "retained", (await readdir(join(root, "retained")))[0]), "utf8");
  assert.equal(backup.includes("borrowerId"), false);
  assert.equal(backup.includes(key.toString("hex")), false);
}));
test("rotation retains seven recognized backups and preserves unrelated files", () => fixture(async (root, key) => {
  await maintainPilotStorage(root, key);
  const retained = join(root, "retained");
  for (let i = 0; i < 9; i++) await exportPipelineBackup(join(root, "synthetic"), join(retained, `snapshot-${randomBytes(32).toString("hex")}.backup.json`), key);
  await writeFile(join(retained, "operator-note.txt"), "keep", { mode: 0o600 });
  const result = await maintainPilotStorage(root, key);
  assert.equal(result.retainedSnapshots, 7);
  assert.equal((await readdir(retained)).length, 8);
  assert.equal(await readFile(join(retained, "operator-note.txt"), "utf8"), "keep");
}));
test("missing primary is held and not recreated by maintenance", () => fixture(async (root, key) => {
  await maintainPilotStorage(root, key);
  await rm(join(root, "synthetic"), { recursive: true });
  await assert.rejects(() => maintainPilotStorage(root, key), /conflicts/);
  await assert.rejects(() => runPersistentSyntheticPilot(root, key), /recovery/);
  assert.equal((await readdir(root)).includes("synthetic"), false);
}));
test("tampered retained ciphertext blocks rotation; wrong keys also fail", () => fixture(async (root, key) => {
  await maintainPilotStorage(root, key);
  const retained = join(root, "retained"), name = (await readdir(retained))[0];
  await writeFile(join(retained, name), "corrupt");
  await assert.rejects(() => maintainPilotStorage(root, key));
  assert.deepEqual(await readdir(retained), [name]);
  await assert.rejects(() => maintainPilotStorage(root, randomBytes(32)));
}));
test("symlinked retention entries hold rather than following or pruning their target", () => fixture(async (root, key) => {
  await maintainPilotStorage(root, key);
  const outside = join(root, "operator-file");
  await writeFile(outside, "keep", { mode: 0o600 });
  await symlink(outside, join(root, "retained", `snapshot-${"a".repeat(64)}.backup.json`));
  await assert.rejects(() => maintainPilotStorage(root, key), /Unsafe/);
  assert.equal(await readFile(outside, "utf8"), "keep");
}));
test("monitor coalesces overlapping checks and expires stale success", async () => {
  let finish, calls = 0, clock = 0;
  const monitor = createPilotMonitor(() => { calls++; return new Promise(resolve => { finish = resolve; }); }, { now: () => clock, maxAgeMs: 100 });
  assert.equal(monitor.healthy(), false);
  const first = monitor.run(), second = monitor.run();
  assert.equal(calls, 1); finish();
  assert.deepEqual(await Promise.all([first, second]), [true, true]);
  assert.equal(monitor.healthy(), true);
  clock = 101; assert.equal(monitor.healthy(), false);
});
test("monitor can recover after a synchronous check failure", async () => {
  let fails = true;
  const monitor = createPilotMonitor(() => { if (fails) throw Error("hold"); });
  assert.equal(await monitor.run(), false);
  fails = false;
  assert.equal(await monitor.run(), true);
  assert.equal(monitor.healthy(), true);
});
test("health becomes 503 when actual primary disappears; backup and mutation paths remain absent", () => fixture(async (root, key) => {
  const monitor = createPilotMonitor(() => maintainPilotStorage(root, key));
  await monitor.run();
  const server = createPilotHealthServer(monitor);
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${base}/healthz`)).status, 200);
    await rm(join(root, "synthetic"), { recursive: true }); await monitor.run();
    const response = await fetch(`${base}/healthz`);
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.storageVerified, false);
    assert.equal(body.businessDataReady, false);
    assert.equal(body.gmail, false); assert.equal(body.crm, false);
    assert.equal((await fetch(`${base}/backup`)).status, 404);
    assert.equal((await fetch(`${base}/healthz`, { method: "POST" })).status, 404);
  } finally { server.close(); await once(server, "close"); }
}));
