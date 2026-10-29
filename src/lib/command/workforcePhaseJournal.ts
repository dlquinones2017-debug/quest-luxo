import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { chmod, lstat, mkdir, open, readFile, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";

// Versioned successor to the pilot AES-GCM/CAS metadata journal. Old v1 files and backups are untouched.
const AAD = Buffer.from("QUEST_LUXO_CONTACT_TASK_PHASE_JOURNAL_V2");
const FILE = "crm-contact-task-journal-v2.sqlite";
const MARKER = "crm-contact-task-journal-v2.initialized";
const MARKER_TEXT = "QUEST_LUXO_CONTACT_TASK_PHASE_JOURNAL_V2\n";
const SHA = /^[a-f0-9]{64}$/;
export type WorkforceOperation = "CONTACT_CREATE" | "TASK_CREATE" | "ASSOCIATE" | "NOTIFY";
export interface WorkforceJournalEntry {
  eventKey: string; fingerprint: string; emailKey: string; sourceRecordId: string; savedAt: string;
  state: "PENDING" | "ACTIVE" | "UNCERTAIN" | "COMPLETE" | "HOLD";
  phase: "CONTACT" | "TASK" | "VERIFY" | "NOTIFY" | "DONE";
  contactId: string | null; taskId: string | null; ownerId: string; associationVerified: boolean;
  contactOrigin: "CREATED_BY_RUNTIME" | "RECONCILED_EXISTING" | "RECONCILED_AFTER_UNCERTAIN" | "REUSED_BOUND_CONTACT" | "OPERATOR_BASELINE" | null;
  taskOrigin: "CREATED_BY_RUNTIME" | "RECONCILED_EXISTING" | "RECONCILED_AFTER_UNCERTAIN" | "OPERATOR_BASELINE" | null;
  operation: WorkforceOperation | null; attempt: string | null; leaseUntil: number; runId: string | null;
  notification: "NOT_ATTEMPTED" | "ACCEPTED_BY_PROVIDER" | "UNCERTAIN";
  notificationId: string | null;
  inboxReceipt: "UNKNOWN" | "VERIFIED"; humanAction: "UNKNOWN" | "ACKNOWLEDGED" | "COMPLETED";
  reason: string | null; updatedAt: string;
}
export interface WorkforceContactBinding {
  emailKey: string; contactId: string | null; state: "UNCLAIMED" | "CREATING" | "UNCERTAIN" | "KNOWN";
  eventKey: string | null; attempt: string | null; leaseUntil: number;
}
export interface WorkforceJournalState {
  version: 2; sequence: number; recoveryHold: boolean; restoredFromRevision: string | null;
  entries: WorkforceJournalEntry[]; contacts: WorkforceContactBinding[];
}
const digest = (value: Uint8Array | string) => createHash("sha256").update(value).digest("hex");
const empty = (): WorkforceJournalState => ({ version: 2, sequence: 0, recoveryHold: false, restoredFromRevision: null, entries: [], contacts: [] });
const fail = (): never => { throw Error("Workforce journal held; verify private storage, key, schema and recovery evidence."); };
const nativeId = (v: unknown) => v === null || typeof v === "string" && /^[1-9]\d{0,30}$/.test(v);
function validate(s: WorkforceJournalState): void {
  if (!s || s.version !== 2 || !Number.isSafeInteger(s.sequence) || s.sequence < 0 || typeof s.recoveryHold !== "boolean" ||
      !(s.restoredFromRevision === null || SHA.test(s.restoredFromRevision)) || !Array.isArray(s.entries) || s.entries.length > 1000 || !Array.isArray(s.contacts) || s.contacts.length > 1000) fail();
  const keys = new Set<string>();
  for (const e of s.entries) {
    if (!e || !/^luxury-inquiry-v1\/[a-z0-9][a-z0-9_-]{0,127}$/i.test(e.eventKey) || keys.has(e.eventKey) || !SHA.test(e.fingerprint) || !SHA.test(e.emailKey) ||
        e.eventKey !== `luxury-inquiry-v1/${e.sourceRecordId}` || !Number.isFinite(Date.parse(e.savedAt)) || !Number.isFinite(Date.parse(e.updatedAt)) ||
        !["PENDING", "ACTIVE", "UNCERTAIN", "COMPLETE", "HOLD"].includes(e.state) || !["CONTACT", "TASK", "VERIFY", "NOTIFY", "DONE"].includes(e.phase) ||
        !nativeId(e.contactId) || !nativeId(e.taskId) || !nativeId(e.ownerId) || e.ownerId === null || typeof e.associationVerified !== "boolean" ||
        ![null, "CREATED_BY_RUNTIME", "RECONCILED_EXISTING", "RECONCILED_AFTER_UNCERTAIN", "REUSED_BOUND_CONTACT", "OPERATOR_BASELINE"].includes(e.contactOrigin) ||
        ![null, "CREATED_BY_RUNTIME", "RECONCILED_EXISTING", "RECONCILED_AFTER_UNCERTAIN", "OPERATOR_BASELINE"].includes(e.taskOrigin) ||
        !(e.operation === null || ["CONTACT_CREATE", "TASK_CREATE", "ASSOCIATE", "NOTIFY"].includes(e.operation)) ||
        !(e.attempt === null || SHA.test(e.attempt)) || !Number.isSafeInteger(e.leaseUntil) || e.leaseUntil < 0 ||
        !(e.runId === null || /^[a-zA-Z0-9_-]{1,128}$/.test(e.runId)) ||
        !["NOT_ATTEMPTED", "ACCEPTED_BY_PROVIDER", "UNCERTAIN"].includes(e.notification) || !(e.notificationId === null || /^[a-zA-Z0-9_-]{1,128}$/.test(e.notificationId)) || !["UNKNOWN", "VERIFIED"].includes(e.inboxReceipt) ||
        !["UNKNOWN", "ACKNOWLEDGED", "COMPLETED"].includes(e.humanAction) || !(e.reason === null || /^[A-Z0-9_]{1,100}$/.test(e.reason))) fail();
    if (e.state === "COMPLETE" && (!e.contactId || !e.taskId || !e.associationVerified || e.phase !== "DONE" || e.notification !== "ACCEPTED_BY_PROVIDER" || !e.notificationId)) fail();
    keys.add(e.eventKey);
  }
  const emails = new Set<string>();
  for (const c of s.contacts) {
    if (!c || !SHA.test(c.emailKey) || emails.has(c.emailKey) || !nativeId(c.contactId) || !["UNCLAIMED", "CREATING", "UNCERTAIN", "KNOWN"].includes(c.state) ||
        !(c.eventKey === null || keys.has(c.eventKey)) || !(c.attempt === null || SHA.test(c.attempt)) || !Number.isSafeInteger(c.leaseUntil) || c.leaseUntil < 0 || c.state === "KNOWN" && !c.contactId) fail();
    emails.add(c.emailKey);
  }
  if (s.entries.some(e => !emails.has(e.emailKey))) fail();
  const taskIds = s.entries.map(e => e.taskId).filter(Boolean);
  if (new Set(taskIds).size !== taskIds.length || s.entries.some(e => e.contactId && s.contacts.find(c => c.emailKey === e.emailKey)?.contactId !== e.contactId)) fail();
}
function encode(s: WorkforceJournalState, key: Buffer): Buffer {
  validate(s);
  const plain = Buffer.from(JSON.stringify(s));
  try {
    if (plain.length > 2_000_000) fail();
    const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key, iv);
    cipher.setAAD(AAD);
    return Buffer.from(JSON.stringify({ version: 2, iv: iv.toString("hex"), tag: (() => {
      const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
      return [cipher.getAuthTag().toString("hex"), ciphertext.toString("base64")];
    })() }));
  } finally { plain.fill(0); }
}
function decode(bytes: Uint8Array, key: Buffer): WorkforceJournalState {
  let plain: Buffer | undefined;
  try {
    if (bytes.byteLength > 3_000_000) fail();
    const v = JSON.parse(Buffer.from(bytes).toString("utf8"));
    if (v.version !== 2 || !/^[a-f0-9]{24}$/.test(v.iv) || !Array.isArray(v.tag) || v.tag.length !== 2 || !/^[a-f0-9]{32}$/.test(v.tag[0]) || typeof v.tag[1] !== "string") fail();
    const encrypted = Buffer.from(v.tag[1], "base64");
    if (encrypted.toString("base64") !== v.tag[1]) fail();
    const cipher = createDecipheriv("aes-256-gcm", key, Buffer.from(v.iv, "hex"));
    cipher.setAAD(AAD); cipher.setAuthTag(Buffer.from(v.tag[0], "hex"));
    plain = Buffer.concat([cipher.update(encrypted), cipher.final()]);
    const result = JSON.parse(plain.toString("utf8")); validate(result); return result;
  } catch { return fail(); } finally { plain?.fill(0); }
}
async function privateDirectory(path: string): Promise<void> {
  const stat = await lstat(path);
  const actual = await realpath(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (process.platform === "win32" ? actual.toLowerCase() !== path.toLowerCase() : actual !== path || (stat.mode & 0o077) !== 0)) fail();
}
async function privateFile(path: string): Promise<void> {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || process.platform !== "win32" && (stat.mode & 0o077) !== 0) fail();
}
async function syncDirectory(path: string): Promise<void> {
  if (process.platform === "win32") return;
  const fd = await open(path, "r");
  try { await fd.sync(); } finally { await fd.close(); }
}

export class WorkforcePhaseJournal {
  private readonly key: Buffer;
  private readonly db: DatabaseSync;
  readonly directory: string;
  private constructor(db: DatabaseSync, key: Buffer, directory: string) { this.db = db; this.key = Buffer.from(key); this.directory = directory; }
  static async open(directory: string, key: Buffer, options: { initialize?: boolean } = {}): Promise<WorkforcePhaseJournal> {
    if (!Buffer.isBuffer(key) || key.length !== 32) return fail();
    const dir = resolve(directory), file = join(dir, FILE), marker = join(dir, MARKER);
    const parent = await lstat(dirname(dir));
    if (!parent.isDirectory() || parent.isSymbolicLink()) return fail();
    let createdDirectory = false;
    if (options.initialize) await mkdir(dir, { mode: 0o700 }).then(() => { createdDirectory = true; }).catch(e => { if (e.code !== "EEXIST") throw e; });
    await privateDirectory(dir);
    let fresh = false;
    try { await privateFile(marker); if ((await lstat(marker)).size !== Buffer.byteLength(MARKER_TEXT) || await readFile(marker, "utf8") !== MARKER_TEXT) return fail(); await privateFile(file); }
    catch (e) {
      if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e;
      if (!options.initialize || !createdDirectory) return fail();
      // Missing an initialized DB must not silently reset claims. Initialization intent precedes DB creation.
      try { await lstat(marker); return fail(); } catch (missing) { if (!(missing instanceof Error && "code" in missing && missing.code === "ENOENT")) throw missing; }
      try { await lstat(file); return fail(); } catch (missing) { if (!(missing instanceof Error && "code" in missing && missing.code === "ENOENT")) throw missing; }
      const handle = await open(marker, "wx", 0o600);
      try { await handle.writeFile(MARKER_TEXT); await handle.sync(); } finally { await handle.close(); }
      await syncDirectory(dir); await syncDirectory(dirname(dir));
      fresh = true;
    }
    const { DatabaseSync: Database } = await import("node:sqlite");
    const db = new Database(file);
    await chmod(file, 0o600);
    try {
      db.exec("PRAGMA busy_timeout=100; PRAGMA journal_mode=DELETE; PRAGMA synchronous=EXTRA;");
      if (db.prepare("PRAGMA journal_mode").get()?.journal_mode !== "delete" || db.prepare("PRAGMA synchronous").get()?.synchronous !== 3 || db.prepare("PRAGMA busy_timeout").get()?.timeout !== 100) return fail();
      const journal = new WorkforcePhaseJournal(db, key, dir);
      if (fresh) {
        db.exec("BEGIN IMMEDIATE; CREATE TABLE state(id INTEGER PRIMARY KEY CHECK(id=1), revision TEXT NOT NULL, envelope BLOB NOT NULL) STRICT;");
        const bytes = encode(empty(), key);
        db.prepare("INSERT INTO state VALUES(1,?,?)").run(digest(bytes), bytes); db.exec("COMMIT");
      }
      journal.read(); return journal;
    } catch (e) { db.close(); throw e; }
  }
  private row(): { revision: string; envelope: Uint8Array } {
    const row = this.db.prepare("SELECT revision,envelope FROM state WHERE id=1").get();
    if (!row || typeof row.revision !== "string" || !(row.envelope instanceof Uint8Array) || digest(row.envelope) !== row.revision) return fail();
    return { revision: row.revision, envelope: row.envelope };
  }
  read(): { state: WorkforceJournalState; revision: string } {
    const row = this.row(); return { state: decode(row.envelope, this.key), revision: row.revision };
  }
  /** Synchronous, bounded transaction only. Never await provider I/O inside this callback. */
  mutate<T>(change: (s: WorkforceJournalState) => T): { result: T; state: WorkforceJournalState; revision: string } {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const prior = this.row(), state = decode(prior.envelope, this.key);
      const result = change(state);
      if (result && typeof result === "object" && "then" in result) return fail();
      state.sequence++;
      const bytes = encode(state, this.key), revision = digest(bytes);
      const written = this.db.prepare("UPDATE state SET revision=?,envelope=? WHERE id=1 AND revision=?").run(revision, bytes, prior.revision);
      if (Number(written.changes) !== 1) return fail();
      this.db.exec("COMMIT"); return { result, state, revision };
    } catch (e) { this.db.exec("ROLLBACK"); throw e; }
  }
  async exportBackup(archive: string): Promise<{ revision: string }> {
    const target = resolve(archive);
    if (target.startsWith(this.directory + "/") || target.startsWith(this.directory + "\\")) return fail();
    await privateDirectory(dirname(target));
    const row = this.row(); decode(row.envelope, this.key);
    const bytes = JSON.stringify({ kind: "QUEST_LUXO_CONTACT_TASK_BACKUP_V2", version: 2, revision: row.revision, envelope: Buffer.from(row.envelope).toString("base64") });
    const fd = await open(target, "wx", 0o600);
    try { await fd.writeFile(bytes); await fd.sync(); } finally { await fd.close(); }
    await syncDirectory(dirname(target));
    return { revision: row.revision };
  }
  static async restoreBackup(archive: string, target: string, key: Buffer): Promise<WorkforcePhaseJournal> {
    await privateDirectory(dirname(resolve(archive))); await privateFile(resolve(archive));
    const stat = await lstat(archive); if (stat.size > 4_100_000) return fail();
    const b = JSON.parse(await readFile(archive, "utf8"));
    if (b.kind !== "QUEST_LUXO_CONTACT_TASK_BACKUP_V2" || b.version !== 2 || !SHA.test(b.revision) || typeof b.envelope !== "string") return fail();
    const bytes = Buffer.from(b.envelope, "base64");
    if (bytes.toString("base64") !== b.envelope || digest(bytes) !== b.revision) return fail();
    const restored = decode(bytes, key);
    try { await lstat(resolve(target)); return fail(); } catch (e) { if (!(e instanceof Error && "code" in e && e.code === "ENOENT")) throw e; }
    const journal = await WorkforcePhaseJournal.open(target, key, { initialize: true });
    journal.mutate(s => { Object.assign(s, restored, { recoveryHold: true, restoredFromRevision: b.revision }); });
    return journal;
  }
  close(): void { this.db.close(); this.key.fill(0); }
}
