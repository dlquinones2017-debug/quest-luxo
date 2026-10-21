import { lstat, mkdir, mkdtemp, realpath, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { commitTrustedIntakeBatch, readEncryptedIntakeJournal } from "../src/lib/command/enterpriseIntakeJournal.ts";
import { exportIntakeJournalBackup, restoreIntakeJournalBackup } from "../src/lib/command/enterprisePipelineBackup.ts";
import { INTAKE_JOURNAL_SOURCE, previewIntakeJournalSource } from "../src/lib/agents/intakeJournalSource.ts";
import { syntheticIntakeBatch, SYNTHETIC_INTAKE_TIME } from "./synthetic-intake-fixture.mjs";

const primaryPath = directory => join(directory, "synthetic-intake");
async function requireRealPrivateDirectory(directory) {
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077) || await realpath(directory) !== resolve(directory))
    throw Error("Private real pilot intake directory required.");
}
export async function initializeSyntheticIntake(directory, key) {
  await requireRealPrivateDirectory(directory);
  const primary = primaryPath(directory);
  let exists = true;
  try { await lstat(primary); }
  catch (error) { if (error?.code !== "ENOENT") throw error; exists = false; }
  if (!exists) {
    // A retained checkpoint proves prior initialization. Missing primaries must not disappear behind reseeding.
    try { await lstat(join(directory, "retained-intake")); throw Error("Retained intake state requires operator recovery."); }
    catch (error) { if (error?.code !== "ENOENT") throw error; }
    // Creating the directory records initialization intent; an interrupted empty directory must hold on restart.
    await mkdir(primary, { mode: 0o700 });
    await commitTrustedIntakeBatch({ directory: primary, key, expectedRevision: "EMPTY",
      batch: syntheticIntakeBatch(), observedAt: SYNTHETIC_INTAKE_TIME });
  }
  await inspectSyntheticIntake(primary, key);
  return { recoveredExisting: exists, businessDataReady: false };
}
async function inspectSyntheticIntake(primary, key) {
  await requireRealPrivateDirectory(primary);
  const snapshot = await readEncryptedIntakeJournal(primary, key);
  const expected = syntheticIntakeBatch();
  const receipts = expected.receipts.sort((a,b) => a.sourceRecordId.localeCompare(b.sourceRecordId));
  if (snapshot.revision === "EMPTY" || snapshot.observedAt !== SYNTHETIC_INTAKE_TIME || snapshot.retainedReceiptCount !== 2 ||
      JSON.stringify(snapshot.receipts) !== JSON.stringify(receipts) || JSON.stringify(snapshot.checkpoint) !== JSON.stringify(expected.checkpoint))
    throw Error("Synthetic intake fixture mismatch; no reseeding allowed.");
  // This is an evaluation clock for a fixed fixture, never evidence of current live-source freshness.
  const now = "2026-10-21T00:05:00.000Z";
  const report = await previewIntakeJournalSource(primary, key, { schemaVersion: 1, sourceId: INTAKE_JOURNAL_SOURCE,
    mode: "PREVIEW_ONLY", divisions: ["CAPITAL_ADVISORY", "REALTY"], maxRecords: 2, maxAgeSeconds: 3600,
    expiresAt: "2026-10-21T01:00:00.000Z" }, [], now);
  if (JSON.stringify(report.divisions.map(d => [d.total, d.blocked, d.unverifiedEvidence])) !== "[[1,1,1],[1,1,1]]" ||
      report.status !== "HOLD" || report.businessDataExecutionAllowed !== false || report.sourceCompletenessVerified !== false || report.collectsMailbox !== false)
    throw Error("Intake adapter acceptance failed.");
  return snapshot;
}
export async function maintainSyntheticIntake(directory, key) {
  await requireRealPrivateDirectory(directory);
  const snapshot = await inspectSyntheticIntake(primaryPath(directory), key);
  const retained = join(directory, "retained-intake");
  await mkdir(retained, { recursive: true, mode: 0o700 });
  await requireRealPrivateDirectory(retained);
  const backup = join(retained, `intake-${snapshot.revision}.backup.json`);
  try { await lstat(backup); }
  catch (error) { if (error?.code !== "ENOENT") throw error; await exportIntakeJournalBackup(primaryPath(directory), backup, key); }
  const recovery = await mkdtemp(join(tmpdir(), "quest-intake-recovery-check-"));
  try {
    const restored = await restoreIntakeJournalBackup(backup, recovery, key);
    if (restored.revision !== snapshot.revision) throw Error("Retained intake did not recover the current revision.");
    await inspectSyntheticIntake(recovery, key);
  } finally { await rm(recovery, { recursive: true, force: true }); }
  return { intakeStorageVerified: true, intakeLocalRecoveryVerified: true, independentBackupVerified: false, businessDataReady: false };
}
