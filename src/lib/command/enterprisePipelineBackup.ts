import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, realpath, mkdtemp, rm, link } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { readDurablePipelines } from "./enterpriseDurablePipelines.ts";
import { readEncryptedIntakeJournal } from "./enterpriseIntakeJournal.ts";

const profiles = {
  pipeline: {
    filename: "enterprise-pipelines-v1.enc.json", kind: "QUEST_PIPELINE_ENCRYPTED_BACKUP",
    async read(directory: string, key: Buffer) {
      const snapshot = await readDurablePipelines(directory, key);
      return { revision: snapshot.revision, metadata: { sequence: snapshot.sequence } };
    },
    fields: ["sequence"],
  },
  intake: {
    filename: "formsubmit-intake-journal.enc.json", kind: "QUEST_INTAKE_ENCRYPTED_BACKUP",
    async read(directory: string, key: Buffer) {
      const snapshot = await readEncryptedIntakeJournal(directory, key);
      if (snapshot.revision !== "EMPTY" && !snapshot.observedAt) throw Error("Intake observation time required for backup.");
      return { revision: snapshot.revision, metadata: { retainedReceiptCount: snapshot.retainedReceiptCount, observedAt: snapshot.observedAt } };
    },
    fields: ["retainedReceiptCount", "observedAt"],
  },
} as const;
type Profile = typeof profiles[keyof typeof profiles];
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const missing = (error: unknown) => error instanceof Error && "code" in error && error.code === "ENOENT";
async function privateDirectory(path: string) {
  await mkdir(path, { recursive: true, mode: 0o700 });
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077)) throw Error("Private real directory required.");
  if (await realpath(path) !== resolve(path)) throw Error("Symlinked directory ancestry rejected.");
}
async function privateRead(path: string, limit: number) {
  if (await realpath(path) !== resolve(path)) throw Error("Symlinked backup input ancestry rejected.");
  const fd = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await fd.stat();
    if (!stat.isFile() || stat.size <= 0 || stat.size > limit || (stat.mode & 0o077) || stat.nlink !== 1)
      throw Error("Unsafe backup input.");
    const bytes = Buffer.alloc(stat.size + 1);
    let length = 0;
    while (length < bytes.length) {
      const { bytesRead } = await fd.read(bytes, length, bytes.length - length, null);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length !== stat.size) throw Error("Backup input changed during bounded read.");
    return bytes.subarray(0, length);
  } finally { await fd.close(); }
}
async function exclusiveWrite(path: string, bytes: Buffer) {
  const fd = await open(path, "wx", 0o600);
  try { await fd.writeFile(bytes); await fd.sync(); } finally { await fd.close(); }
  const folder = await open(dirname(path), "r");
  try { await folder.sync(); } finally { await folder.close(); }
}
async function exportSnapshot(primary: string, backupFile: string, key: Buffer, profile: Profile) {
  const source = resolve(primary), destination = resolve(backupFile);
  await privateDirectory(source);
  await privateDirectory(dirname(destination));
  if (destination.startsWith(source + sep) || source.startsWith(dirname(destination) + sep) || source === dirname(destination))
    throw Error("Backup must be outside the primary directory tree.");
  const snapshot = await profile.read(source, key);
  if (snapshot.revision === "EMPTY") throw Error("Missing source cannot be backed up.");
  const encrypted = await privateRead(join(source, profile.filename), 7_500_000);
  if (hash(encrypted) !== snapshot.revision) throw Error("Source changed during backup; retry from current revision.");
  const backup = { version: 1, kind: profile.kind, revision: snapshot.revision, ...snapshot.metadata,
    createdAt: new Date().toISOString(), encrypted: encrypted.toString("base64") };
  await exclusiveWrite(destination, Buffer.from(JSON.stringify(backup)));
  return { version: 1, revision: snapshot.revision, ...snapshot.metadata, independentRetentionVerified: false } as const;
}
async function restoreSnapshot(backupFile: string, target: string, key: Buffer, profile: Profile) {
  const bundle = JSON.parse((await privateRead(resolve(backupFile), 10_100_000)).toString());
  const fields = ["version", "kind", "revision", "createdAt", "encrypted", ...profile.fields];
  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle) || Object.keys(bundle).sort().join() !== fields.sort().join() ||
      bundle.version !== 1 || bundle.kind !== profile.kind ||
      typeof bundle.revision !== "string" || !/^[a-f0-9]{64}$/.test(bundle.revision) ||
      typeof bundle.createdAt !== "string" || !Number.isFinite(Date.parse(bundle.createdAt)) ||
      typeof bundle.encrypted !== "string" || !bundle.encrypted ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(bundle.encrypted))
    throw Error("Invalid backup manifest.");
  if ((profile.kind === "QUEST_PIPELINE_ENCRYPTED_BACKUP" && (!Number.isSafeInteger(bundle.sequence) || bundle.sequence < 1)) ||
      (profile.kind === "QUEST_INTAKE_ENCRYPTED_BACKUP" && (!Number.isSafeInteger(bundle.retainedReceiptCount) ||
       bundle.retainedReceiptCount < 0 || bundle.retainedReceiptCount > 10_000 ||
       typeof bundle.observedAt !== "string" || !Number.isFinite(Date.parse(bundle.observedAt)))))
    throw Error("Invalid backup manifest metadata.");
  const encrypted = Buffer.from(bundle.encrypted, "base64");
  if (encrypted.length > 7_500_000 || hash(encrypted) !== bundle.revision) throw Error("Backup checksum mismatch.");
  const directory = resolve(target);
  await privateDirectory(directory);
  const path = join(directory, profile.filename);
  try { await lstat(path); throw Error("Restore target already contains a snapshot; no overwrite allowed."); }
  catch (error) { if (!missing(error)) throw error; }
  const staging = await mkdtemp(join(directory, ".restore-"));
  try {
    await exclusiveWrite(join(staging, profile.filename), encrypted);
    const recovered = await profile.read(staging, key);
    const metadata = recovered.metadata as Record<string, unknown>;
    if (recovered.revision !== bundle.revision || profile.fields.some(field => bundle[field] !== metadata[field]))
      throw Error("Backup manifest conflicts with authenticated contents.");
    await link(join(staging, profile.filename), path);
    const folder = await open(directory, "r");
    try { await folder.sync(); } finally { await folder.close(); }
    return { version: 1, revision: recovered.revision, ...recovered.metadata,
      authenticated: true, independentRetentionVerified: false } as const;
  } finally { await rm(staging, { recursive: true, force: true }); }
}

/** Ciphertext only; a separate directory does not attest offsite storage or recoverable key custody. */
export const exportPipelineBackup = (primary: string, backupFile: string, key: Buffer) => exportSnapshot(primary, backupFile, key, profiles.pipeline);
export const restorePipelineBackup = (backupFile: string, target: string, key: Buffer) => restoreSnapshot(backupFile, target, key, profiles.pipeline);
export const exportIntakeJournalBackup = (primary: string, backupFile: string, key: Buffer) => exportSnapshot(primary, backupFile, key, profiles.intake);
export const restoreIntakeJournalBackup = (backupFile: string, target: string, key: Buffer) => restoreSnapshot(backupFile, target, key, profiles.intake);
