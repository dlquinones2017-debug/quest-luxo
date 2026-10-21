import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, realpath } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { readDurablePipelines } from "./enterpriseDurablePipelines.ts";

const SNAPSHOT = "enterprise-pipelines-v1.enc.json";
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const missing = (error: unknown) => error instanceof Error && "code" in error && error.code === "ENOENT";
async function privateDirectory(path: string) {
  await mkdir(path, { recursive: true, mode: 0o700 });
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077)) throw Error("Private real directory required.");
  // Do not traverse symlinked parents, even if the final component is private.
  if (await realpath(path) !== resolve(path)) throw Error("Symlinked directory ancestry rejected.");
}
async function privateRead(path: string, limit: number) {
  const fd = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const stat = await fd.stat();
    if (!stat.isFile() || stat.size <= 0 || stat.size > limit || (stat.mode & 0o077)) throw Error("Unsafe backup input.");
    return await fd.readFile();
  } finally { await fd.close(); }
}
async function exclusiveWrite(path: string, bytes: Buffer) {
  const fd = await open(path, "wx", 0o600);
  try { await fd.writeFile(bytes); await fd.sync(); } finally { await fd.close(); }
  const folder = await open(dirname(path), "r");
  try { await folder.sync(); } finally { await folder.close(); }
}

/** Export only authenticated ciphertext; never export a key or plaintext records. */
export async function exportPipelineBackup(primary: string, backupFile: string, key: Buffer) {
  const source = resolve(primary), destination = resolve(backupFile);
  // A separate directory is necessary but does not prove an independent storage provider.
  await privateDirectory(source);
  await privateDirectory(dirname(destination));
  if (destination.startsWith(source + sep) || source.startsWith(dirname(destination) + sep) || source === dirname(destination))
    throw Error("Backup must be outside the primary directory tree.");
  const snapshot = await readDurablePipelines(source, key);
  if (snapshot.revision === "EMPTY") throw Error("Missing source cannot be backed up.");
  const encrypted = await privateRead(join(source, SNAPSHOT), 7_500_000);
  if (hash(encrypted) !== snapshot.revision) throw Error("Source changed during backup; retry from current revision.");
  const backup = { version: 1, kind: "QUEST_PIPELINE_ENCRYPTED_BACKUP", revision: snapshot.revision,
    sequence: snapshot.sequence, createdAt: new Date().toISOString(), encrypted: encrypted.toString("base64") };
  await exclusiveWrite(destination, Buffer.from(JSON.stringify(backup)));
  return { version: 1, revision: snapshot.revision, sequence: snapshot.sequence, independentRetentionVerified: false } as const;
}

/** Recovery never overwrites a primary. Caller supplies an empty, private restore directory. */
export async function restorePipelineBackup(backupFile: string, target: string, key: Buffer) {
  const bytes = await privateRead(resolve(backupFile), 10_100_000);
  const bundle = JSON.parse(bytes.toString());
  if (bundle.version !== 1 || bundle.kind !== "QUEST_PIPELINE_ENCRYPTED_BACKUP" ||
      typeof bundle.revision !== "string" || !/^[a-f0-9]{64}$/.test(bundle.revision) ||
      !Number.isSafeInteger(bundle.sequence) || bundle.sequence < 1 ||
      typeof bundle.createdAt !== "string" || !Number.isFinite(Date.parse(bundle.createdAt)) ||
      typeof bundle.encrypted !== "string" || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(bundle.encrypted))
    throw Error("Invalid backup manifest.");
  const encrypted = Buffer.from(bundle.encrypted, "base64");
  if (hash(encrypted) !== bundle.revision) throw Error("Backup checksum mismatch.");
  const directory = resolve(target);
  await privateDirectory(directory);
  const path = join(directory, SNAPSHOT);
  try { await lstat(path); throw Error("Restore target already contains a snapshot; no overwrite allowed."); }
  catch (error) { if (!missing(error)) throw error; }
  // A candidate file is only committed after authentication succeeds. Never clobber another writer.
  const { mkdtemp, rm, link } = await import("node:fs/promises");
  const staging = await mkdtemp(join(directory, ".restore-"));
  try {
    await exclusiveWrite(join(staging, SNAPSHOT), encrypted);
    const recovered = await readDurablePipelines(staging, key);
    if (recovered.revision !== bundle.revision || recovered.sequence !== bundle.sequence) throw Error("Backup manifest conflicts with authenticated contents.");
    await link(join(staging, SNAPSHOT), path);
    const folder = await open(directory, "r");
    try { await folder.sync(); } finally { await folder.close(); }
    return { version: 1, revision: recovered.revision, sequence: recovered.sequence,
      authenticated: true, independentRetentionVerified: false } as const;
  } finally { await rm(staging, { recursive: true, force: true }); }
}
