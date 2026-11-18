import {
  createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID,
} from "node:crypto";
import { constants } from "node:fs";
import { mkdir, lstat, open, rename, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { withLeadStorageLock } from "../leads/leadStorageLock.ts";
import { enterpriseLeadIntelligence, type EnterpriseLeadReceipt } from "./enterpriseLeadIntelligence.ts";
import type { IntakeBatch, IntakeCheckpoint } from "./enterpriseLeadIntakeAdapter.ts";

const FILE_NAME = "formsubmit-intake-journal.enc.json";
const CONTEXT = Buffer.from("QUEST_LUXO_INTAKE_JOURNAL_V1", "utf8");
const SAFE_ID = /^[A-Za-z0-9._:-]{1,160}$/;
const GMAIL_ID = /^gmail:[0-9a-f]{64}$/;
const TIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/;
const MAX_SEEN = 20_000;
const MAX_RECEIPTS = 10_000;
const EMPTY_REVISION = "EMPTY";
const allowedReceiptFields = new Set([
  "division", "provider", "sourceRecordId", "canonicalRecordId", "receivedAt",
  "evidenceIds", "receiptVerification", "qualificationVerification", "notification",
  "qualificationEvidenceIds",
]);

interface StoredJournal {
  readonly version: 1;
  readonly checkpoint: IntakeCheckpoint;
  readonly receipts: readonly EnterpriseLeadReceipt[];
  readonly observedAt: string | null;
}
export interface IntakeJournalSnapshot {
  readonly revision: string;
  readonly checkpoint: IntakeCheckpoint;
  readonly receipts: readonly EnterpriseLeadReceipt[];
  readonly observedAt: string | null;
  readonly retainedReceiptCount: number;
}
export interface IntakeJournalInput {
  readonly directory: string;
  readonly key: Buffer; // 32 bytes from an approved secret manager, never hardcoded
  readonly expectedRevision: string;
  readonly batch: IntakeBatch; // from the existing trusted metadata adapter only
  readonly observedAt: string;
}
const hash = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const validTime = (value: string, now: Date) =>
  typeof value === "string" && TIME.test(value) &&
  Number.isFinite(Date.parse(value)) && Date.parse(value) <= now.getTime();
const errorCode = (error: unknown, code: string) =>
  error instanceof Error && "code" in error && error.code === code;
function requireKey(key: Buffer) {
  if (!Buffer.isBuffer(key) || key.length !== 32)
    throw new Error("An approved 256-bit intake journal encryption key is required.");
}
const blank = (): StoredJournal => ({ version: 1, checkpoint: {seen: {}}, receipts: [], observedAt: null });
function snap(journal: StoredJournal, revision: string): IntakeJournalSnapshot {
  return Object.freeze({
    revision,
    checkpoint: Object.freeze({
      ...(journal.checkpoint.pageToken ? {pageToken:journal.checkpoint.pageToken} : {}),
      seen:Object.freeze({...journal.checkpoint.seen}),
    }),
    receipts:Object.freeze(journal.receipts.map(receipt=>Object.freeze({
      ...receipt, evidenceIds:Object.freeze([...(receipt.evidenceIds ?? [])]),
    }))),
    observedAt:journal.observedAt,
    retainedReceiptCount:journal.receipts.length,
  });
}
function checkCheckpoint(next: IntakeCheckpoint, previous: IntakeCheckpoint) {
  if (!next || typeof next !== "object" || !next.seen || typeof next.seen !== "object" ||
      Array.isArray(next.seen)) throw new Error("Invalid intake checkpoint.");
  const entries = Object.entries(next.seen);
  if (entries.length > MAX_SEEN || entries.some(([id,proof])=>
    !/^(gmail:[0-9a-f]{64}|rfc:[0-9a-f]{64})$/.test(id) ||
    typeof proof !== "string" || !/^[0-9a-f]{64}$/.test(proof))) {
    throw new Error("Intake checkpoint requires verified opaque bounded entries.");
  }
  if (next.pageToken !== undefined &&
      (typeof next.pageToken !== "string" || !next.pageToken ||
       next.pageToken.length > 512)) throw new Error("Invalid intake page cursor.");
  for (const [id, fingerprint] of Object.entries(previous.seen)) {
    if (next.seen[id] !== fingerprint) throw new Error("Intake checkpoint cannot discard or alter replay evidence.");
  }
}
function validateReceipt(receipt: EnterpriseLeadReceipt, checkpoint: IntakeCheckpoint, now: Date) {
  if (typeof receipt !== "object" || receipt === null ||
      Object.keys(receipt).some(k=>!allowedReceiptFields.has(k)) ||
      receipt.provider !== "FORMSUBMIT" ||
      (receipt.division !== "REALTY" && receipt.division !== "CAPITAL_ADVISORY") ||
      !GMAIL_ID.test(receipt.sourceRecordId) ||
      receipt.receiptVerification !== "VERIFIED" ||
      receipt.qualificationVerification !== "UNKNOWN" ||
      receipt.notification !== "UNKNOWN" ||
      !receipt.receivedAt || !validTime(receipt.receivedAt,now) ||
      !receipt.evidenceIds || !Array.isArray(receipt.evidenceIds) ||
      receipt.evidenceIds.length < 2 ||
      !receipt.evidenceIds.includes(receipt.sourceRecordId) ||
      !receipt.evidenceIds.every(e=>typeof e==="string" && SAFE_ID.test(e)) ||
      (receipt.canonicalRecordId!==undefined && !SAFE_ID.test(receipt.canonicalRecordId)) ||
      !checkpoint.seen[receipt.sourceRecordId]) {
    throw new Error("Intake journal accepts only mapped verified opaque FormSubmit receipt metadata.");
  }
}
function validateJournal(j: StoredJournal, now: Date) {
  if (!j || j.version !== 1 || !Array.isArray(j.receipts) || j.receipts.length > MAX_RECEIPTS ||
      (j.observedAt !== null && !validTime(j.observedAt,now))) throw new Error("Invalid intake journal state.");
  checkCheckpoint(j.checkpoint,{seen:{}});
  for (const receipt of j.receipts) validateReceipt(receipt,j.checkpoint,now);
  if (enterpriseLeadIntelligence(j.receipts, now).some(f=>f.state==="EVIDENCE_CONFLICT"))
    throw new Error("Conflicting retained source identities require operator review.");
}
function seal(journal: StoredJournal, key: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm",key,iv);
  cipher.setAAD(CONTEXT);
  const bytes = Buffer.concat([cipher.update(JSON.stringify(journal),"utf8"),cipher.final()]);
  return Buffer.from(JSON.stringify({
    version:1,alg:"aes-256-gcm",
    iv:iv.toString("hex"),tag:cipher.getAuthTag().toString("hex"),
    ciphertext:bytes.toString("base64"),
  }),"utf8");
}
function unseal(bytes: Buffer,key: Buffer): StoredJournal {
  try {
    const wrapped = JSON.parse(bytes.toString("utf8")) as Record<string,unknown>;
    if (wrapped.version!==1 || wrapped.alg!=="aes-256-gcm" ||
        typeof wrapped.iv!=="string" || !/^[0-9a-f]{24}$/.test(wrapped.iv) ||
        typeof wrapped.tag!=="string" || !/^[0-9a-f]{32}$/.test(wrapped.tag) ||
        typeof wrapped.ciphertext!=="string" || wrapped.ciphertext.length > 10_000_000)
      throw new Error();
    const decipher = createDecipheriv("aes-256-gcm",key,Buffer.from(wrapped.iv,"hex"));
    decipher.setAAD(CONTEXT);
    decipher.setAuthTag(Buffer.from(wrapped.tag,"hex"));
    return JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(wrapped.ciphertext,"base64")),decipher.final(),
    ]).toString("utf8")) as StoredJournal;
  } catch {
    // Never copy cryptographic exceptions, provider data or decrypted payloads to logs.
    throw new Error("Intake journal authentication/integrity failed; operator review required.");
  }
}
async function privateDirectory(directory: string, create: boolean) {
  if (create) await mkdir(directory,{recursive:true,mode:0o700});
  let status;
  try { status=await lstat(directory); }
  catch(error) { if (!create && errorCode(error,"ENOENT")) return false; throw error; }
  if (!status.isDirectory() || status.isSymbolicLink() ||
      (process.platform!=="win32" && (status.mode & 0o077)!==0))
    throw new Error("Intake journal directory requires a private, nonsymlink path.");
  return true;
}
async function readAt(file: string,key: Buffer,now: Date): Promise<IntakeJournalSnapshot> {
  let handle;
  try { handle=await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); }
  catch(error) { if (errorCode(error,"ENOENT")) return snap(blank(),EMPTY_REVISION); throw error; }
  try {
    const stats=await handle.stat();
    if (!stats.isFile() || stats.size > 7_500_000 || !stats.size ||
        (process.platform!=="win32" && (stats.mode & 0o077)!==0))
      throw new Error("Intake journal has unsafe permissions or contents.");
    const bytes=await handle.readFile();
    const journal=unseal(bytes,key);
    validateJournal(journal,now);
    return snap(journal,hash(bytes));
  } finally { await handle.close(); }
}
export async function readEncryptedIntakeJournal(directory:string,key:Buffer,now=new Date()):Promise<IntakeJournalSnapshot> {
  requireKey(key);
  if (!Number.isFinite(now.getTime())) throw new Error("Valid read time required.");
  const dir=resolve(directory);
  if (!await privateDirectory(dir,false)) return snap(blank(),EMPTY_REVISION);
  return readAt(join(dir,FILE_NAME),key,now);
}
/** Durable encrypted operational metadata; not a CRM, message archive or sender. */
export async function commitTrustedIntakeBatch(input:IntakeJournalInput,now=new Date()):Promise<IntakeJournalSnapshot> {
  requireKey(input.key);
  if (!Number.isFinite(now.getTime()) || !validTime(input.observedAt,now))
    throw new Error("Verified nonfuture observation time required.");
  if (input.batch.status!=="COMPLETE" && input.batch.status!=="PARTIAL")
    throw new Error("Disabled, failed or unverified intake cannot advance a journal.");
  if (input.batch.receipts.length > 100)
    throw new Error("Only one bounded metadata page may be committed at once.");
  const dir=resolve(input.directory);
  await privateDirectory(dir,true);
  const file=join(dir,FILE_NAME);
  return withLeadStorageLock(file,async()=>{
    const current=await readAt(file,input.key,now);
    if (current.revision!==input.expectedRevision)
      throw new Error("Intake journal changed; reload checkpoint before retrying.");
    checkCheckpoint(input.batch.checkpoint,current.checkpoint);
    const prior=new Map(current.receipts.map(r=>[r.sourceRecordId,r]));
    for(const receipt of input.batch.receipts) {
      validateReceipt(receipt,input.batch.checkpoint,now);
      const older=prior.get(receipt.sourceRecordId);
      if(older && JSON.stringify(older)!==JSON.stringify(receipt))
        throw new Error("Conflicting intake receipt requires human reconciliation.");
      prior.set(receipt.sourceRecordId,receipt);
    }
    const next:StoredJournal={
      version:1,
      checkpoint:input.batch.checkpoint,
      receipts:[...prior.values()].sort((a,b)=>a.sourceRecordId.localeCompare(b.sourceRecordId)),
      observedAt:input.observedAt,
    };
    validateJournal(next,now);
    if(next.receipts.length>MAX_RECEIPTS)throw new Error("Retention limit reached; approve archival before continuation.");
    if(JSON.stringify({...next,checkpoint:next.checkpoint})===
       JSON.stringify({version:1,checkpoint:current.checkpoint,receipts:current.receipts,observedAt:current.observedAt}))
      return current;
    const temp=join(dir,".intake-journal-"+randomUUID()+".tmp");
    const encrypted=seal(next,input.key);
    const handle=await open(temp,"wx",0o600);
    try {
      try { await handle.writeFile(encrypted); await handle.sync(); }
      finally { await handle.close(); }
      await rename(temp,file);
      // Flush the directory entry after rename on POSIX file systems.
      if (process.platform!=="win32") {
        const parent=await open(dir,"r");
        try { await parent.sync(); } finally { await parent.close(); }
      }
    } finally { await unlink(temp).catch(error=>{if(!errorCode(error,"ENOENT"))throw error;}); }
    return snap(next,hash(encrypted));
  });
}
