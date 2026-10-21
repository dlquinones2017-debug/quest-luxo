import { createDecipheriv, createHash } from "node:crypto";
import { readFileSync, fstatSync, realpathSync, mkdirSync, openSync, writeFileSync, fsyncSync, closeSync, constants } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";

// Deliberately limited to the two known synthetic fixtures. No business-data activation.
const sha = value => createHash("sha256").update(value).digest("hex");
const profiles = {
  pipeline: { kind: "QUEST_PIPELINE_ENCRYPTED_BACKUP", aad: "QUEST_LUXO_ENTERPRISE_PIPELINE_V1", file: "enterprise-pipelines-v1.enc.json" },
  intake: { kind: "QUEST_INTAKE_ENCRYPTED_BACKUP", aad: "QUEST_LUXO_INTAKE_JOURNAL_V1", file: "formsubmit-intake-journal.enc.json" },
};
export function authenticateSyntheticRecovery(archiveBytes, key, kind) {
  const profile = profiles[kind];
  assert(profile && Buffer.isBuffer(key) && key.length === 32);
  assert(archiveBytes.length > 0 && archiveBytes.length <= 20_000);
  const bundle = JSON.parse(archiveBytes.toString("utf8"));
  const metadata = kind === "pipeline" ? ["sequence"] : ["retainedReceiptCount", "observedAt"];
  assert.deepEqual(Object.keys(bundle).sort(), ["version", "kind", "revision", "createdAt", "encrypted", ...metadata].sort());
  assert.equal(bundle.version, 1); assert.equal(bundle.kind, profile.kind);
  assert.match(bundle.revision, /^[a-f0-9]{64}$/);
  assert(Number.isFinite(Date.parse(bundle.createdAt)));
  assert.equal(typeof bundle.encrypted, "string");
  const encrypted = Buffer.from(bundle.encrypted, "base64");
  assert.equal(encrypted.toString("base64"), bundle.encrypted);
  assert.equal(sha(encrypted), bundle.revision);
  const wrapped = JSON.parse(encrypted.toString("utf8"));
  assert.equal(wrapped.version, 1); assert.match(wrapped.iv, /^[a-f0-9]{24}$/); assert.match(wrapped.tag, /^[a-f0-9]{32}$/);
  assert.deepEqual(Object.keys(wrapped).sort(), (kind === "intake" ? ["version", "alg", "iv", "tag", "ciphertext"] : ["version", "iv", "tag", "ciphertext"]).sort());
  if (kind === "intake") assert.equal(wrapped.alg, "aes-256-gcm");
  function decrypt(candidate, ciphertext = Buffer.from(wrapped.ciphertext, "base64")) {
    const decipher = createDecipheriv("aes-256-gcm", candidate, Buffer.from(wrapped.iv, "hex"));
    decipher.setAAD(Buffer.from(profile.aad)); decipher.setAuthTag(Buffer.from(wrapped.tag, "hex"));
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    try { return JSON.parse(plaintext.toString("utf8")); } finally { plaintext.fill(0); }
  }
  const recovered = decrypt(key);
  const wrongKey = Buffer.from(key); wrongKey[0] ^= 1;
  try { assert.throws(() => decrypt(wrongKey)); } finally { wrongKey.fill(0); }
  const damaged = Buffer.from(wrapped.ciphertext, "base64"); assert(damaged.length); damaged[0] ^= 1;
  assert.throws(() => decrypt(key, damaged));
  if (kind === "pipeline") {
    const record = (id, stage, status, evidenceState, proof) => ({ ...id, stage, status, reason: "Synthetic only", updatedAt: "2026-10-21T12:00:00Z", evidenceIds: [proof], evidenceState });
    assert.equal(bundle.sequence, 1);
    assert.deepEqual(recovered, { version: 1, sequence: 1, records: {
      capital: [record({ borrowerId: "synthetic-capital" }, "QUALIFY", "BLOCKED", "UNKNOWN", "synthetic-proof-capital")],
      realty: [record({ leadId: "synthetic-realty" }, "REVIEW", "REQUIRES_FOUNDER", "REQUIRES_VERIFICATION", "synthetic-proof-realty")],
    } });
  } else {
    const time = "2026-10-21T00:00:00.000Z";
    const receipts = ["CAPITAL_ADVISORY", "REALTY"].map(division => ({ division, provider: "FORMSUBMIT", sourceRecordId: "gmail:" + sha("synthetic-intake-" + division), receivedAt: time,
      evidenceIds: ["gmail:" + sha("synthetic-intake-" + division), "synthetic-mapping-" + division.toLowerCase()], receiptVerification: "VERIFIED", qualificationVerification: "UNKNOWN", notification: "UNKNOWN" })).sort((a,b) => a.sourceRecordId.localeCompare(b.sourceRecordId));
    assert.equal(bundle.retainedReceiptCount, 2); assert.equal(bundle.observedAt, time);
    assert.deepEqual(recovered, { version: 1, checkpoint: { seen: Object.fromEntries(receipts.map(r => [r.sourceRecordId, sha("synthetic-proof-" + r.sourceRecordId)])) }, receipts, observedAt: time });
  }
  return { encrypted, revision: bundle.revision, filename: profile.file, wrongKeyRejected: true, tamperRejected: true, exactSyntheticContentsVerified: true };
}
function privateRead(path) {
  assert.equal(realpathSync(path), resolve(path));
  const fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = fstatSync(fd);
    assert(stat.isFile() && stat.nlink === 1 && stat.size > 0 && stat.size <= 20_000);
    if (process.platform !== "win32") assert.equal(stat.mode & 0o077, 0);
    const bytes = readFileSync(fd); assert.equal(bytes.length, stat.size); return bytes;
  } finally { closeSync(fd); }
}
export function recoverSyntheticArchives(root, key, mode) {
  assert(["restore", "verify"].includes(mode));
  root = resolve(root); assert.equal(realpathSync(root), root);
  const transfer = JSON.parse(privateRead(join(root, "transfer-manifest.json")));
  assert(Array.isArray(transfer) && transfer.length === 2);
  assert.deepEqual(transfer.map(t => t.kind).sort(), ["intake", "pipeline"]);
  const reports = [];
  for (const item of transfer) {
    assert.deepEqual(Object.keys(item).sort(), ["kind", "filename", "sha256"].sort());
    assert.match(item.filename, /^(?:snapshot|intake)-[a-f0-9]{64}\.backup\.json$/);
    const archive = privateRead(join(root, item.filename)); assert.equal(sha(archive), item.sha256);
    const recovered = authenticateSyntheticRecovery(archive, key, item.kind);
    const target = join(root, "restored-" + item.kind);
    if (mode === "restore") {
      mkdirSync(target, { mode: 0o700 }); // Existing target is never replaced, including after partial failure.
      const fd = openSync(join(target, recovered.filename), "wx", 0o600);
      try { writeFileSync(fd, recovered.encrypted); fsyncSync(fd); } finally { closeSync(fd); }
    }
    const persisted = privateRead(join(target, recovered.filename));
    assert.equal(sha(persisted), recovered.revision);
    // Authenticate the restored bytes, independently of the retained archive bytes.
    const bundle = JSON.parse(archive); bundle.encrypted = persisted.toString("base64");
    authenticateSyntheticRecovery(Buffer.from(JSON.stringify(bundle)), key, item.kind);
    reports.push({ kind: item.kind, revision: recovered.revision, authenticated: true, exactSyntheticContentsVerified: true, wrongKeyRejected: true, tamperRejected: true });
  }
  return { status: "VERIFIED", mode, checkedAt: new Date().toISOString(), freshProcessKeyRequired: true, syntheticOnly: true, businessDataReady: false, restoredStores: reports };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  let key;
  try {
    const input = readFileSync(0); const hex = input.toString("ascii").trim(); input.fill(0);
    assert.match(hex, /^[a-f0-9]{64}$/); key = Buffer.from(hex, "hex");
    console.log(JSON.stringify(recoverSyntheticArchives(process.argv[2], key, process.argv[3])));
  } catch { console.error("Independent synthetic recovery failed; existing files preserved."); process.exitCode = 1; }
  finally { key?.fill(0); }
}
