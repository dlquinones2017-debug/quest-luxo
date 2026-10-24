import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile, rm, stat, readdir, chmod, symlink, link } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { commitTrustedIntakeBatch, readEncryptedIntakeJournal } from "../src/lib/command/enterpriseIntakeJournal.ts";
import { exportIntakeJournalBackup, restoreIntakeJournalBackup, restorePipelineBackup } from "../src/lib/command/enterprisePipelineBackup.ts";
import { INTAKE_JOURNAL_SOURCE, previewIntakeJournalSource } from "../src/lib/agents/intakeJournalSource.ts";
import { syntheticIntakeBatch, SYNTHETIC_INTAKE_TIME } from "../scripts/synthetic-intake-fixture.mjs";
import { initializeSyntheticIntake, maintainSyntheticIntake } from "../scripts/pilot-intake-maintenance.mjs";
const now = "2026-10-21T00:05:00.000Z";
const filename = "formsubmit-intake-journal.enc.json";
const contract = () => ({ schemaVersion: 1, sourceId: INTAKE_JOURNAL_SOURCE, mode: "PREVIEW_ONLY", divisions: ["CAPITAL_ADVISORY", "REALTY"],
  maxRecords: 2, maxAgeSeconds: 3600, expiresAt: "2026-10-21T01:00:00.000Z" });
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), "quest-intake-recovery-")), key = randomBytes(32);
  const primary = join(root, "primary"), backup = join(root, "retained", "intake.backup.json");
  try {
    const saved = await commitTrustedIntakeBatch({ directory: primary, key, expectedRevision: "EMPTY", batch: syntheticIntakeBatch(), observedAt: SYNTHETIC_INTAKE_TIME });
    await run({ root, key, primary, backup, saved });
  } finally { key.fill(0); await rm(root, { recursive: true, force: true }); }
}
test("intake recovery after total primary loss preserves receipts and replay checkpoint in a fresh process", async () => fixture(async ({ root, key, primary, backup, saved }) => {
  await exportIntakeJournalBackup(primary, backup, key);
  const ciphertext = await readFile(backup, "utf8");
  assert.doesNotMatch(ciphertext, /gmail:|CAPITAL_ADVISORY|synthetic-mapping|pageToken|checkpoint/);
  assert.ok(!ciphertext.includes(key.toString("hex")));
  assert.equal((await stat(backup)).mode & 0o777, 0o600);
  await rm(primary, { recursive: true });
  const target = join(root, "recovered");
  const child = spawnSync(process.execPath, ["scripts/intake-backup.mjs", "restore", backup, target], {
    env: { ...process.env, QUEST_INTAKE_KEY_HEX: key.toString("hex") }, encoding: "utf8" });
  assert.equal(child.status, 0, child.stderr);
  const result = JSON.parse(child.stdout);
  assert.equal(result.authenticated, true); assert.equal(result.independentRetentionVerified, false);
  assert.deepEqual(await readEncryptedIntakeJournal(target, key), saved);
  const replay = await commitTrustedIntakeBatch({ directory: target, key, expectedRevision: saved.revision, batch: syntheticIntakeBatch(), observedAt: SYNTHETIC_INTAKE_TIME });
  assert.equal(replay.revision, saved.revision); assert.equal(replay.retainedReceiptCount, 2);
}));
test("wrong key, tampered count, altered checkpoint metadata and injected extra fields never publish recovered journal", async () => fixture(async ({ root, key, primary, backup }) => {
  await exportIntakeJournalBackup(primary, backup, key);
  const original = JSON.parse(await readFile(backup, "utf8"));
  await assert.rejects(() => restoreIntakeJournalBackup(backup, join(root,"wrong-key"), randomBytes(32)));
  for (const patch of [{ retainedReceiptCount: 3 }, { observedAt: "2026-10-20T00:00:00.000Z" }, { plaintext: "never-retain" }, { encrypted: "AAAA" }]) {
    await writeFile(backup, JSON.stringify({ ...original, ...patch }));
    const target = join(root, "attempt-" + randomBytes(4).toString("hex"));
    await assert.rejects(() => restoreIntakeJournalBackup(backup, target, key));
    assert.equal((await readEncryptedIntakeJournal(target, key)).revision, "EMPTY");
  }
}));
test("journal and pipeline archive kinds cannot be confused or relabeled to bypass authentication", async () => fixture(async ({ root, key, primary, backup }) => {
  await exportIntakeJournalBackup(primary, backup, key);
  await assert.rejects(() => restorePipelineBackup(backup, join(root, "pipeline"), key), /manifest/);
  const bundle = JSON.parse(await readFile(backup, "utf8"));
  bundle.kind = "QUEST_PIPELINE_ENCRYPTED_BACKUP"; bundle.sequence = 1;
  delete bundle.retainedReceiptCount; delete bundle.observedAt;
  await writeFile(backup, JSON.stringify(bundle));
  await assert.rejects(() => restorePipelineBackup(backup, join(root,"relabeled"), key), /authentication/);
}));
test("intake backup refuses missing source, overwrite, nested destination and unsafe filesystem entries", async () => fixture(async ({ root, key, primary, backup }) => {
  await assert.rejects(() => exportIntakeJournalBackup(join(root,"missing"), backup, key), /Missing/);
  await assert.rejects(() => exportIntakeJournalBackup(primary, join(primary,"nested.json"), key), /outside/);
  await exportIntakeJournalBackup(primary, backup, key);
  await assert.rejects(() => exportIntakeJournalBackup(primary, backup, key), /EEXIST/);
  await assert.rejects(() => restoreIntakeJournalBackup(backup, primary, key), /no overwrite/);
  await chmod(backup,0o644); await assert.rejects(() => restoreIntakeJournalBackup(backup,join(root,"unsafe"),key),/Unsafe/); await chmod(backup,0o600);
  await link(backup, join(root,"hardlink.json")); await assert.rejects(() => restoreIntakeJournalBackup(backup,join(root,"hardlinked"),key),/Unsafe/);
  await rm(join(root,"hardlink.json"));
  await symlink(join(root,"retained"),join(root,"alias"));
  await assert.rejects(() => exportIntakeJournalBackup(primary,join(root,"alias","other.json"),key), /Private|Symlinked/);
  await assert.rejects(() => restoreIntakeJournalBackup(join(root,"alias","intake.backup.json"),join(root,"alias-restore"),key), /Symlinked/);
}));
test("source adapter exposes aggregate qualification holds without claiming mailbox completeness or changing source", async () => fixture(async ({ key, primary }) => {
  const before = await readFile(join(primary,filename));
  const report = await previewIntakeJournalSource(primary,key,contract(),[],now);
  assert.equal(report.sourceCoverage,"RETAINED_RECEIPTS_ONLY"); assert.equal(report.status,"HOLD");
  assert.deepEqual(report.divisions.map(d=>[d.total,d.blocked,d.unverifiedEvidence]),[[1,1,1],[1,1,1]]);
  for(const flag of ["collectsMailbox","qualificationEstablished","sourceCompletenessVerified","businessDataExecutionAllowed","persistsRecords","writesCRM","activatesGmail"])
    assert.equal(report[flag],false);
  assert.doesNotMatch(JSON.stringify(report),/gmail:|synthetic-mapping/);
  assert.deepEqual(await readFile(join(primary,filename)),before);
}));
test("source adapter fails closed on absent, stale, oversize, mismatched and unauthorized exports", async () => fixture(async ({ root,key,primary }) => {
  await assert.rejects(()=>previewIntakeJournalSource(join(root,"absent"),key,contract(),[],now),/missing/);
  for (const patch of [{sourceId:"another-source"},{maxRecords:1},{divisions:["REALTY"]},{maxAgeSeconds:1}])
    await assert.rejects(()=>previewIntakeJournalSource(primary,key,{...contract(),...patch},[],now));
  await assert.rejects(()=>previewIntakeJournalSource(primary,key,{...contract(),expiresAt:"2026-10-23T00:00:00.000Z"},[],"2026-10-22T00:05:00.000Z"));
  await assert.rejects(()=>previewIntakeJournalSource(primary,key,contract(),[],"2026-02-30T00:05:00.000Z"));
  await assert.rejects(()=>previewIntakeJournalSource(primary,randomBytes(32),contract(),[],now));
}));
test("intake pilot initializes once, retains one authenticated backup and recovers unchanged on restart", async () => {
  const directory=await mkdtemp(join(tmpdir(),"quest-intake-pilot-")),key=randomBytes(32);
  try {
    assert.equal((await initializeSyntheticIntake(directory,key)).recoveredExisting,false);
    assert.equal((await initializeSyntheticIntake(directory,key)).recoveredExisting,true);
    const a=await maintainSyntheticIntake(directory,key); await maintainSyntheticIntake(directory,key);
    assert.equal(a.intakeLocalRecoveryVerified,true); assert.equal(a.independentBackupVerified,false);
    assert.equal((await readdir(join(directory,"retained-intake"))).length,1);
    await rm(join(directory,"synthetic-intake"),{recursive:true});
    await assert.rejects(()=>initializeSyntheticIntake(directory,key),/operator recovery/);
    await assert.rejects(()=>maintainSyntheticIntake(directory,key));
  } finally {key.fill(0);await rm(directory,{recursive:true,force:true});}
});
test("interrupted initialization and missing or altered journal fail without reseeding", async () => {
  const directory=await mkdtemp(join(tmpdir(),"quest-intake-hold-")),key=randomBytes(32);
  try {
    await mkdir(join(directory,"synthetic-intake"),{mode:0o700});
    await assert.rejects(()=>initializeSyntheticIntake(directory,key),/fixture mismatch/);
    await rm(join(directory,"synthetic-intake"),{recursive:true});
    await initializeSyntheticIntake(directory,key); await maintainSyntheticIntake(directory,key);
    const file=join(directory,"synthetic-intake",filename);
    const original=await readFile(file);
    await writeFile(file,'{"invalid":true}');
    await assert.rejects(()=>initializeSyntheticIntake(directory,key)); await assert.rejects(()=>maintainSyntheticIntake(directory,key));
    await writeFile(file,original); await rm(file);
    await assert.rejects(()=>initializeSyntheticIntake(directory,key),/fixture mismatch/);
    assert.equal((await readEncryptedIntakeJournal(join(directory,"synthetic-intake"),key)).revision,"EMPTY");
  } finally {key.fill(0);await rm(directory,{recursive:true,force:true});}
});
test("corrupt retained journal holds maintenance and cannot be overwritten as a fresh backup", async () => {
  const directory=await mkdtemp(join(tmpdir(),"quest-intake-retained-hold-")),key=randomBytes(32);
  try {
    await initializeSyntheticIntake(directory,key);await maintainSyntheticIntake(directory,key);
    const retained=join(directory,"retained-intake"),[name]=await readdir(retained);
    await writeFile(join(retained,name),'{}');
    await assert.rejects(()=>maintainSyntheticIntake(directory,key));
    assert.equal(await readFile(join(retained,name),"utf8"),'{}');
  } finally {key.fill(0);await rm(directory,{recursive:true,force:true});}
});
test("backup command rejects bad configuration without leaking source paths or key values", () => {
  const child=spawnSync(process.execPath,["scripts/intake-backup.mjs","export","private-marker","other"],{env:{...process.env,QUEST_INTAKE_KEY_HEX:"private-key-marker"},encoding:"utf8"});
  assert.equal(child.status,1); assert.equal(child.stdout,""); assert.doesNotMatch(child.stderr,/private-marker|private-key-marker/);
});
test("partial-page cursor and replay fingerprints survive backup recovery together", async () => fixture(async ({root,key,primary,backup,saved}) => {
  const batch=syntheticIntakeBatch(); batch.status="PARTIAL"; batch.checkpoint.pageToken="synthetic-next-page";
  const partial=await commitTrustedIntakeBatch({directory:primary,key,expectedRevision:saved.revision,batch,observedAt:SYNTHETIC_INTAKE_TIME});
  await exportIntakeJournalBackup(primary,backup,key);
  const target=join(root,"partial-recovery");await restoreIntakeJournalBackup(backup,target,key);
  assert.deepEqual((await readEncryptedIntakeJournal(target,key)).checkpoint,partial.checkpoint);
  assert.equal(partial.checkpoint.pageToken,"synthetic-next-page");
}));
test("qualification evidence is bounded opaque metadata and returned arrays cannot be mutated", async () => fixture(async ({key,primary,saved}) => {
  for(const value of ["private text",["private@example.test"],Array(101).fill("evidence:1"),[null]]) {
    const batch=syntheticIntakeBatch();batch.receipts[0].qualificationEvidenceIds=value;
    await assert.rejects(()=>commitTrustedIntakeBatch({directory:primary,key,expectedRevision:saved.revision,batch,observedAt:SYNTHETIC_INTAKE_TIME}));
  }
  const root=await mkdtemp(join(tmpdir(),"quest-evidence-freeze-"));
  try {
    const batch=syntheticIntakeBatch();batch.receipts[0].qualificationEvidenceIds=["synthetic-proof"];
    const result=await commitTrustedIntakeBatch({directory:root,key,expectedRevision:"EMPTY",batch,observedAt:SYNTHETIC_INTAKE_TIME});
    const receipt=result.receipts.find(r=>r.qualificationEvidenceIds);
    assert.ok(Object.isFrozen(receipt.qualificationEvidenceIds));
    batch.receipts[0].qualificationEvidenceIds.push("later");
    assert.equal(receipt.qualificationEvidenceIds.length,1);
  } finally {await rm(root,{recursive:true,force:true});}
}));
