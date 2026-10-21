import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile, rm, stat, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { exportPipelineBackup, restorePipelineBackup } from "../src/lib/command/enterprisePipelineBackup.ts";
import { commitDurablePipelines, readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { syntheticRecords } from "../scripts/factory-agent-runtime.mjs";

async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), "quest-recovery-"));
  const key = randomBytes(32), primary = join(root, "primary"), backup = join(root, "retained", "backup.json");
  try {
    await mkdir(join(root, "retained"), { mode: 0o700 });
    const saved = await commitDurablePipelines(primary, key, "EMPTY", syntheticRecords());
    await run({ root, key, primary, backup, saved });
  } finally { key.fill(0); await rm(root, { recursive: true, force: true }); }
}
test("recover from retained ciphertext in a fresh process after complete primary loss", async () => fixture(async ({ root, key, primary, backup, saved }) => {
  const exported = await exportPipelineBackup(primary, backup, key);
  assert.equal(exported.independentRetentionVerified, false);
  const content = await readFile(backup, "utf8");
  assert.doesNotMatch(content, /synthetic-capital|synthetic-realty|borrowerId|leadId/);
  assert.ok(!content.includes(key.toString("hex")));
  assert.equal((await stat(backup)).mode & 0o077, 0);
  await rm(primary, { recursive: true });
  const target = join(root, "recovery");
  const result = spawnSync(process.execPath, ["scripts/pipeline-backup.mjs", "restore", backup, target], {
    env: { ...process.env, QUEST_PIPELINE_KEY_HEX: key.toString("hex") }, encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).authenticated, true);
  const recovered = await readDurablePipelines(target, key);
  assert.equal(recovered.revision, saved.revision);
  assert.deepEqual(recovered.records, saved.records);
}));
test("wrong recovery key cannot publish a snapshot", async () => fixture(async ({ root, key, primary, backup }) => {
  await exportPipelineBackup(primary, backup, key);
  const target = join(root, "recovery");
  await assert.rejects(() => restorePipelineBackup(backup, target, randomBytes(32)), /authentication/);
  assert.equal((await readDurablePipelines(target, key)).revision, "EMPTY");
}));
test("manifest tampering fails against authenticated sequence", async () => fixture(async ({ root, key, primary, backup }) => {
  await exportPipelineBackup(primary, backup, key);
  const bundle = JSON.parse(await readFile(backup, "utf8"));
  bundle.sequence += 1;
  await writeFile(backup, JSON.stringify(bundle));
  await assert.rejects(() => restorePipelineBackup(backup, join(root, "restore"), key), /manifest conflicts/);
}));
test("ciphertext tampering and non-private backup are rejected", async () => fixture(async ({ root, key, primary, backup }) => {
  await exportPipelineBackup(primary, backup, key);
  const bundle = JSON.parse(await readFile(backup, "utf8"));
  bundle.encrypted = Buffer.from("corrupt").toString("base64");
  await writeFile(backup, JSON.stringify(bundle));
  await assert.rejects(() => restorePipelineBackup(backup, join(root, "restore"), key), /checksum/);
  const { chmod } = await import("node:fs/promises");
  await chmod(backup, 0o644);
  await assert.rejects(() => restorePipelineBackup(backup, join(root, "restore"), key), /Unsafe/);
}));
test("backup cannot reside under primary, overwrite another backup, or restore over live state", async () => fixture(async ({ key, primary, backup }) => {
  await assert.rejects(() => exportPipelineBackup(primary, join(primary, "backup.json"), key), /outside/);
  await exportPipelineBackup(primary, backup, key);
  await assert.rejects(() => exportPipelineBackup(primary, backup, key), /EEXIST/);
  await assert.rejects(() => restorePipelineBackup(backup, primary, key), /no overwrite/);
}));
test("symlinked backup destination is rejected", async () => fixture(async ({ root, key, primary }) => {
  await symlink(join(root, "retained"), join(root, "link"));
  await assert.rejects(() => exportPipelineBackup(primary, join(root, "link", "backup.json"), key), /Private|Symlinked/);
}));
test("missing snapshot is a failure, not an empty backup", async () => fixture(async ({ root, key, backup }) => {
  await assert.rejects(() => exportPipelineBackup(join(root, "absent"), backup, key), /Missing/);
}));
