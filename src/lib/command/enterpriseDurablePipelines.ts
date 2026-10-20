import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { mkdir, lstat, open, rename, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { withLeadStorageLock } from "../leads/leadStorageLock.ts";
import type { CapitalPipelineRecord } from "../capital/capitalPipelineStore.ts";
import type { RealtyPipelineRecord } from "../realty/realtyPipelineStore.ts";

/** Opt-in encrypted canonical pipeline snapshot. Not connected to live readers or writers. */
type Records = { readonly capital: readonly CapitalPipelineRecord[]; readonly realty: readonly RealtyPipelineRecord[] };
type Stored = { version: 1; sequence: number; records: Records };
export type DurablePipelineSnapshot = Stored & { readonly revision: string };
const NAME = "enterprise-pipelines-v1.enc.json";
const AAD = Buffer.from("QUEST_LUXO_ENTERPRISE_PIPELINE_V1");
const ID = /^[A-Za-z0-9._:-]{1,160}$/;
const SHA = /^[0-9a-f]{64}$/;
const EMPTY = "EMPTY";
const MAX = 10000;
const err = (error: unknown, code: string) => error instanceof Error && "code" in error && error.code === code;
const digest = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const blank = (): Stored => ({ version: 1, sequence: 0, records: { capital: [], realty: [] } });
function keyCheck(key: Buffer) {
  if (!Buffer.isBuffer(key) || key.length !== 32) throw new Error("Approved 256-bit pipeline key required.");
}
function validate(records: Records) {
  if (!records || !Array.isArray(records.capital) || !Array.isArray(records.realty) ||
      records.capital.length + records.realty.length > MAX) throw new Error("Invalid pipeline payload.");
  for (const [division, items, identity] of [
    ["capital", records.capital, "borrowerId"], ["realty", records.realty, "leadId"],
  ] as const) {
    const seen = new Set<string>();
    for (const item of items) {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("Invalid pipeline record.");
      const value = (item as unknown as Record<string, unknown>)[identity];
      if (typeof value !== "string" || !ID.test(value) || seen.has(value)) throw new Error("Duplicate or invalid pipeline identity.");
      seen.add(value);
      if (!["READY", "BLOCKED", "REQUIRES_FOUNDER"].includes(item.status) ||
          !["VERIFIED", "UNKNOWN", "REQUIRES_VERIFICATION"].includes(item.evidenceState) ||
          typeof item.stage !== "string" || typeof item.reason !== "string" ||
          typeof item.updatedAt !== "string" || !Number.isFinite(Date.parse(item.updatedAt)) ||
          !Array.isArray(item.evidenceIds) || item.evidenceIds.length > 100 ||
          !item.evidenceIds.every(e => typeof e === "string" && ID.test(e)))
        throw new Error("Invalid pipeline evidence or state.");
      const allowed = new Set([identity, "stage", "status", "reason", "updatedAt",
        "evidenceIds", "evidenceState", "estimatedRevenue", "probability", "urgency", "requiredHumanAction"]);
      if (Object.keys(item).some(k => !allowed.has(k))) throw new Error("Unexpected pipeline record field.");
      for (const numberField of ["estimatedRevenue", "probability", "urgency"] as const) {
        const numberValue = item[numberField];
        if (numberValue !== undefined && (typeof numberValue !== "number" || !Number.isFinite(numberValue) || numberValue < 0))
          throw new Error("Invalid pipeline numeric value.");
      }
      if (item.requiredHumanAction !== undefined && typeof item.requiredHumanAction !== "string")
        throw new Error("Invalid action.");
    }
    void division;
  }
}
function verify(stored: Stored) {
  if (!stored || stored.version !== 1 || !Number.isSafeInteger(stored.sequence) || stored.sequence < 0)
    throw new Error("Unsupported pipeline snapshot.");
  validate(stored.records);
}
function freeze(stored: Stored, revision: string): DurablePipelineSnapshot {
  const copy = structuredClone(stored);
  return Object.freeze({ ...copy, records: Object.freeze({
    capital: Object.freeze(copy.records.capital.map(r => Object.freeze({...r, evidenceIds:Object.freeze([...r.evidenceIds])}))),
    realty: Object.freeze(copy.records.realty.map(r => Object.freeze({...r, evidenceIds:Object.freeze([...r.evidenceIds])}))),
  }), revision });
}
function encrypt(data: Stored, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data)), cipher.final()]);
  return Buffer.from(JSON.stringify({ version: 1, iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"), ciphertext: ciphertext.toString("base64") }));
}
function decrypt(bytes: Buffer, key: Buffer): Stored {
  try {
    const wrapped = JSON.parse(bytes.toString()) as Record<string, unknown>;
    if (wrapped.version !== 1 || typeof wrapped.iv !== "string" || !/^[a-f0-9]{24}$/.test(wrapped.iv) ||
        typeof wrapped.tag !== "string" || !/^[a-f0-9]{32}$/.test(wrapped.tag) ||
        typeof wrapped.ciphertext !== "string" || wrapped.ciphertext.length > 10000000) throw new Error();
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(wrapped.iv, "hex"));
    decipher.setAAD(AAD);
    decipher.setAuthTag(Buffer.from(wrapped.tag, "hex"));
    const stored = JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(wrapped.ciphertext, "base64")), decipher.final(),
    ]).toString()) as Stored;
    verify(stored);
    return stored;
  } catch {
    throw new Error("Pipeline integrity/authentication failed; operator recovery required.");
  }
}
async function directoryCheck(path: string, create: boolean) {
  if (create) await mkdir(path, { recursive: true, mode: 0o700 });
  let state;
  try { state = await lstat(path); }
  catch (e) { if (!create && err(e, "ENOENT")) return false; throw e; }
  if (!state.isDirectory() || state.isSymbolicLink() ||
      (process.platform !== "win32" && (state.mode & 0o077) !== 0))
    throw new Error("Pipeline directory must be private and not a symlink.");
  return true;
}
async function load(path: string, key: Buffer): Promise<DurablePipelineSnapshot> {
  let fd;
  try { fd = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); }
  catch (e) { if (err(e, "ENOENT")) return freeze(blank(), EMPTY); throw e; }
  try {
    const stat = await fd.stat();
    if (!stat.isFile() || stat.size <= 0 || stat.size > 7500000 ||
        (process.platform !== "win32" && (stat.mode & 0o077) !== 0))
      throw new Error("Unsafe pipeline file.");
    const bytes = await fd.readFile();
    return freeze(decrypt(bytes, key), digest(bytes));
  } finally { await fd.close(); }
}
export async function readDurablePipelines(directory: string, key: Buffer): Promise<DurablePipelineSnapshot> {
  keyCheck(key);
  const dir = resolve(directory);
  if (!await directoryCheck(dir, false)) return freeze(blank(), EMPTY);
  return load(join(dir, NAME), key);
}
export async function commitDurablePipelines(
  directory: string, key: Buffer, expectedRevision: string, records: Records,
): Promise<DurablePipelineSnapshot> {
  keyCheck(key);
  if (expectedRevision !== EMPTY && !SHA.test(expectedRevision)) throw new Error("Invalid expected revision.");
  validate(records);
  const dir = resolve(directory);
  await directoryCheck(dir, true);
  const path = join(dir, NAME);
  return withLeadStorageLock(path, async () => {
    const prior = await load(path, key);
    if (prior.revision !== expectedRevision) throw new Error("Pipeline revision conflict; reload before retry.");
    const next: Stored = { version: 1, sequence: prior.sequence + 1, records: structuredClone(records) };
    verify(next);
    const bytes = encrypt(next, key);
    const tmp = join(dir, ".pipeline-" + randomUUID() + ".tmp");
    const handle = await open(tmp, "wx", 0o600);
    try {
      try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
      await rename(tmp, path);
      if (process.platform !== "win32") {
        const folder = await open(dir, "r");
        try { await folder.sync(); } finally { await folder.close(); }
      }
    } finally { await unlink(tmp).catch(e => { if (!err(e, "ENOENT")) throw e; }); }
    return freeze(next, digest(bytes));
  });
}
