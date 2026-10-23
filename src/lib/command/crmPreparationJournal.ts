import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { lstat, mkdir, open, realpath, rename, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { withLeadStorageLock } from "../leads/leadStorageLock.ts";
import { crmHandoffIdempotencyKey, crmHandoffMetadataFingerprint, type CRMHandoffEvent } from "./crmReconciliationPlan.ts";

const FILE = "crm-preparation-v1.enc.json", AAD = Buffer.from("QUEST_LUXO_CRM_INTERNAL_PREPARATION_V1");
const SHA = /^[a-f0-9]{64}$/, MAX_BYTES = 2_000_000, MAX_ENTRIES = 1000;
interface Entry { division: CRMHandoffEvent["division"]; sourceId: string; sourceRecordId: string; sourceRevision: number; idempotencyKey: string; metadataFingerprint: string }
interface Stored { version: 1; scope: "INTERNAL_PREPARATION_ONLY"; sequence: number; entries: Entry[] }
const failure = (): never => { throw Error("CRM preparation journal held; verify metadata, private storage, key and revision."); };
const errorCode = (e: unknown, code: string) => e instanceof Error && "code" in e && e.code === code;
const digest = (b: Buffer) => createHash("sha256").update(b).digest("hex");
function exact(v: unknown, keys: string[]): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join() === keys.sort().join();
}
function validate(v: unknown): asserts v is Stored {
  if (!exact(v,["version","scope","sequence","entries"]) || v.version !== 1 || v.scope !== "INTERNAL_PREPARATION_ONLY" ||
    !Number.isSafeInteger(v.sequence) || (v.sequence as number) < 0 || !Array.isArray(v.entries) || v.entries.length > MAX_ENTRIES) return failure();
  const seen = new Set<string>();
  for (const e of v.entries) {
    if (!exact(e,["division","sourceId","sourceRecordId","sourceRevision","idempotencyKey","metadataFingerprint"]) ||
      typeof e.metadataFingerprint !== "string" || !SHA.test(e.metadataFingerprint) || typeof e.idempotencyKey !== "string" ||
      seen.has(e.idempotencyKey) || crmHandoffIdempotencyKey(e as unknown as CRMHandoffEvent) !== e.idempotencyKey) return failure();
    seen.add(e.idempotencyKey);
  }
}
function snapshot(s: Stored, revision: string) {
  return Object.freeze({ ...s, entries: Object.freeze(s.entries.map(e => Object.freeze({...e}))), revision,
    writesCRM: false, advancesCRMCheckpoint: false, businessDataExecutionAllowed: false, independentRecoveryVerified: false });
}
function keyCheck(key: Buffer) { if (!Buffer.isBuffer(key) || key.length !== 32) return failure(); }
async function directory(path: string, create: boolean) {
  if (create) {
    try { await lstat(path); }
    catch (e) {
      if (!errorCode(e,"ENOENT")) throw e;
      // Only create one leaf beneath an existing canonical private parent; never traverse a symlink while creating ancestors.
      const parent = dirname(path), stat = await lstat(parent);
      if (!stat.isDirectory() || stat.isSymbolicLink() || await realpath(parent) !== parent ||
        process.platform !== "win32" && (stat.mode & 0o077) !== 0) return failure();
      try { await mkdir(path, {mode:0o700}); } catch(e) {if(!errorCode(e,"EEXIST"))throw e;}
    }
  }
  try {
    const stat = await lstat(path);
    if (!stat.isDirectory() || stat.isSymbolicLink() || await realpath(path) !== path ||
      process.platform !== "win32" && (stat.mode & 0o077) !== 0) return failure();
    return true;
  } catch(e) { if (!create && errorCode(e,"ENOENT")) return false; throw e; }
}
function encrypt(s: Stored, key: Buffer) {
  const iv = randomBytes(12), c = createCipheriv("aes-256-gcm",key,iv); c.setAAD(AAD);
  const plain = Buffer.from(JSON.stringify(s));
  try { const encrypted = Buffer.concat([c.update(plain),c.final()]);
    return Buffer.from(JSON.stringify({version:1,iv:iv.toString("hex"),tag:c.getAuthTag().toString("hex"),ciphertext:encrypted.toString("base64")}));
  } finally { plain.fill(0); }
}
function decrypt(bytes: Buffer, key: Buffer): Stored {
  let plain: Buffer | undefined;
  try {
    const v: unknown = JSON.parse(bytes.toString());
    if (!exact(v,["version","iv","tag","ciphertext"]) || v.version !== 1 || typeof v.iv !== "string" || !/^[a-f0-9]{24}$/.test(v.iv) ||
      typeof v.tag !== "string" || !/^[a-f0-9]{32}$/.test(v.tag) || typeof v.ciphertext !== "string" || v.ciphertext.length > MAX_BYTES) return failure();
    const encrypted = Buffer.from(v.ciphertext,"base64"); if (encrypted.toString("base64") !== v.ciphertext) return failure();
    const d = createDecipheriv("aes-256-gcm",key,Buffer.from(v.iv,"hex")); d.setAAD(AAD); d.setAuthTag(Buffer.from(v.tag,"hex"));
    plain = Buffer.concat([d.update(encrypted),d.final()]); const result: unknown = JSON.parse(plain.toString()); validate(result); return result;
  } catch { return failure(); } finally { plain?.fill(0); }
}
async function load(file: string, key: Buffer) {
  let fd;
  try { fd = await open(file,constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); }
  catch(e) { if (errorCode(e,"ENOENT")) return snapshot({version:1,scope:"INTERNAL_PREPARATION_ONLY",sequence:0,entries:[]},"EMPTY"); throw e; }
  try {
    const s = await fd.stat();
    if (!s.isFile() || s.nlink !== 1 || s.size < 1 || s.size > MAX_BYTES || process.platform !== "win32" && (s.mode & 0o077) !== 0) return failure();
    const bytes = await fd.readFile(); if (bytes.length > MAX_BYTES) return failure(); return snapshot(decrypt(bytes,key),digest(bytes));
  } finally { await fd.close(); }
}
/** Reads only this internal preparation ledger. EMPTY means absent, never proof of an empty source pipeline. */
export async function readCRMPreparationJournal(path: string, key: Buffer) {
  keyCheck(key); const dir = resolve(path);
  if (!await directory(dir,false)) return snapshot({version:1,scope:"INTERNAL_PREPARATION_ONLY",sequence:0,entries:[]},"EMPTY");
  return load(join(dir,FILE),key);
}
/** Append-only preparation evidence; no acknowledgement of external writes or CRM checkpoint advancement. */
export async function retainCRMPreparation(path: string, key: Buffer, expectedRevision: string, events: readonly CRMHandoffEvent[]) {
  keyCheck(key);
  if (expectedRevision !== "EMPTY" && !SHA.test(expectedRevision) || !Array.isArray(events) || events.length > 100) return failure();
  // Reuse the reviewed metadata validator. Never retain event payloads, timestamps, consent claims or customer details.
  const proposed: Entry[] = events.map(e => ({division:e.division,sourceId:e.sourceId,sourceRecordId:e.sourceRecordId,sourceRevision:e.sourceRevision,
    idempotencyKey:crmHandoffIdempotencyKey(e),metadataFingerprint:crmHandoffMetadataFingerprint(e)}));
  const dir = resolve(path); await directory(dir,true); const file = join(dir,FILE);
  return withLeadStorageLock(file,async () => {
    await directory(dir,false); const prior = await load(file,key); if (prior.revision !== expectedRevision) return failure();
    const entries: Entry[] = prior.entries.map(e=>({...e})), known = new Map(entries.map(e=>[e.idempotencyKey,e]));
    for (const e of proposed) {
      const old = known.get(e.idempotencyKey);
      if (old) { if (old.metadataFingerprint !== e.metadataFingerprint) return failure(); continue; }
      const history = entries.filter(x=>x.division===e.division && x.sourceId===e.sourceId && x.sourceRecordId===e.sourceRecordId);
      if (e.sourceRevision !== Math.max(0,...history.map(x=>x.sourceRevision))+1 || entries.some(x=>x.sourceId===e.sourceId && x.sourceRecordId===e.sourceRecordId && x.division!==e.division)) return failure();
      entries.push(e); known.set(e.idempotencyKey,e);
    }
    if (entries.length === prior.entries.length) return prior;
    const next: Stored = {version:1,scope:"INTERNAL_PREPARATION_ONLY",sequence:prior.sequence+1,entries}; validate(next);
    const bytes = encrypt(next,key); if (bytes.length > MAX_BYTES) return failure();
    const tmp = join(dir,".crm-preparation-"+randomUUID()+".tmp"), fd = await open(tmp,"wx",0o600);
    try {
      try { await fd.writeFile(bytes); await fd.sync(); } finally { await fd.close(); }
      await rename(tmp,file);
      if (process.platform !== "win32") { const folder=await open(dir,"r");try {await folder.sync();}finally {await folder.close();} }
    } finally { await unlink(tmp).catch(e=>{if(!errorCode(e,"ENOENT"))throw e;}); }
    return snapshot(next,digest(bytes));
  });
}
