import { lstat, mkdir, mkdtemp, readdir, realpath, rm, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { exportPipelineBackup, restorePipelineBackup } from "../src/lib/command/enterprisePipelineBackup.ts";
import { syntheticRecords } from "./factory-agent-runtime.mjs";
import { buildManualPipelineReport } from "./manual-pipeline-agent-report.mjs";

export const LOCAL_BACKUP_LIMIT = 7;
const backupName = /^snapshot-[a-f0-9]{64}\.backup\.json$/;

/** Read-only after initialization: a missing or changed snapshot must never be reseeded. */
export async function inspectPersistentSyntheticSnapshot(directory, key) {
  if (await realpath(directory) !== resolve(directory)) throw Error("Symlinked pilot ancestry rejected.");
  const snapshot = await readDurablePipelines(join(directory, "synthetic"), key);
  if (snapshot.sequence !== 1 || JSON.stringify(snapshot.records) !== JSON.stringify(syntheticRecords()))
    throw Error("Synthetic snapshot conflicts with reviewed fixture; hold for operator review.");
  const report = buildManualPipelineReport(snapshot);
  if (JSON.stringify(report.divisions.map(r => [r.total, r.blocked, r.founderReview])) !== "[[1,1,0],[1,0,1]]")
    throw Error("Pilot aggregate acceptance failed.");
  return { snapshot, report };
}

/** Local encrypted retention only; this is never evidence of independent/offsite recovery. */
export async function maintainPilotStorage(directory, key) {
  const { snapshot } = await inspectPersistentSyntheticSnapshot(directory, key);
  const retained = join(directory, "retained");
  await mkdir(retained, { recursive: true, mode: 0o700 });
  const folder = await lstat(retained);
  if (!folder.isDirectory() || folder.isSymbolicLink() || (folder.mode & 0o077) || await realpath(retained) !== resolve(retained))
    throw Error("Private real retention directory required.");
  const currentName = `snapshot-${snapshot.revision}.backup.json`;
  const current = join(retained, currentName);
  try { await lstat(current); }
  catch (error) {
    if (error?.code !== "ENOENT") throw error;
    await exportPipelineBackup(join(directory, "synthetic"), current, key);
  }
  const recovery = await mkdtemp(join(tmpdir(), "quest-pilot-retention-check-"));
  try {
    const restored = await restorePipelineBackup(current, recovery, key);
    if (restored.revision !== snapshot.revision || restored.sequence !== snapshot.sequence)
      throw Error("Retained checkpoint did not recover the current snapshot.");
    await inspectPersistentSyntheticSnapshotFromRestore(recovery, key);
  } finally { await rm(recovery, { recursive: true, force: true }); }

  // Rotate only recognized, private regular files, and only after current recovery succeeds.
  const candidates = [];
  for (const name of await readdir(retained)) {
    if (!backupName.test(name)) continue;
    const stat = await lstat(join(retained, name));
    if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o077) || stat.nlink !== 1)
      throw Error("Unsafe retention entry; operator review required.");
    candidates.push({ name, modified: stat.mtimeMs });
  }
  const previous = candidates.filter(file => file.name !== currentName).sort((a, b) => b.modified - a.modified || a.name.localeCompare(b.name));
  for (const file of previous.slice(LOCAL_BACKUP_LIMIT - 1)) await unlink(join(retained, file.name));
  return { storageVerified: true, localBackupVerified: true,
    retainedSnapshots: Math.min(candidates.length, LOCAL_BACKUP_LIMIT), independentBackupVerified: false, businessDataReady: false };
}

async function inspectPersistentSyntheticSnapshotFromRestore(directory, key) {
  const recovered = await readDurablePipelines(directory, key);
  if (recovered.sequence !== 1 || JSON.stringify(recovered.records) !== JSON.stringify(syntheticRecords()))
    throw Error("Restored checkpoint fixture mismatch.");
}

/** Single-flight checks and monotonic freshness prevent a stale startup result claiming health. */
export function createPilotMonitor(check, { now = () => performance.now(), maxAgeMs = 120_000 } = {}) {
  let lastSuccess = null, passed = false, pending;
  return {
    async run() {
      if (pending) return pending;
      pending = (async () => {
        try { await check(); lastSuccess = now(); passed = true; return true; }
        catch { passed = false; return false; }
      })().finally(() => { pending = undefined; });
      return pending;
    },
    healthy() { return passed && lastSuccess !== null && now() - lastSuccess <= maxAgeMs; },
  };
}
