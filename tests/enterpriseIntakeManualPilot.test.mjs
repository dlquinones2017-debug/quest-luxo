import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  GMAIL_METADATA_SCOPE, gmailReceiptKey,
} from "../src/lib/command/enterpriseLeadIntakeAdapter.ts";
import { readEncryptedIntakeJournal } from "../src/lib/command/enterpriseIntakeJournal.ts";
import { runApprovedFormSubmitPilot } from "../src/lib/command/enterpriseIntakeManualPilot.ts";

const now = new Date("2026-10-19T23:30:00.000Z");
const mailbox = "denzel@questluxo.com"; // Existing documented corporate mailbox, never contacted by tests
const sha = value => createHash("sha256").update(value).digest("hex");
const metadataTime = String(Date.parse("2026-10-19T23:15:00.000Z"));

async function temporary(fn) {
  const root = await mkdtemp(join(tmpdir(), "qlux-manual-pilot-"));
  try { return await fn(join(root, "private")); }
  finally { await rm(root, { recursive: true, force: true }); }
}

// Synthetic, test-only Gmail metadata. Never opens a Google connection.
function message(id, number, opts = {}) {
  const headers = [
    { name: "From", value: "submissions@formsubmit.co" },
    { name: "To", value: mailbox },
    { name: "Delivered-To", value: mailbox },
    { name: "Message-ID", value: `<synthetic-${number}@formsubmit.co>` },
    { name: "Authentication-Results", value:
      "mx.google.com; dkim=pass header.d=formsubmit.co; " +
      "spf=pass smtp.mailfrom=submissions@formsubmit.co; " +
      "dmarc=pass header.from=formsubmit.co" },
    { name: "Received", value: `by mx.google.com with ESMTPS for <${mailbox}>` },
  ];
  return { id, internalDate: metadataTime, payload: { headers },
    labelIds: opts.labels ?? [] };
}
function mapping(m, number, division) {
  return { receiptKey: gmailReceiptKey(m.id),
    messageIdSha256: sha(`<synthetic-${number}@formsubmit.co>`),
    division, approvalEvidenceId: `approval:synthetic-${number}`,
    kind: "SUBMISSION" };
}
const approved = mappings => ({
  founderApproved: true, scopes: [GMAIL_METADATA_SCOPE], mappings,
});
function fakeReader(messages, pages, opts = {}) {
  const byId = new Map(messages.map(m => [m.id, m]));
  const history = [];
  const reader = {
    history,
    async profile() {
      history.push("profile");
      if (opts.profileError) throw new Error("Synthetic profile read failure");
      return { emailAddress: opts.mailbox ?? mailbox };
    },
    async list(token) {
      history.push(`list:${token ?? ""}`);
      if (opts.listError) throw new Error("Synthetic transient read failure");
      const found = pages[token ?? ""];
      if (!found) throw new Error("Unexpected synthetic page cursor");
      return found;
    },
    async get(id) {
      history.push(`get:${id}`);
      if (opts.getError) throw new Error("Synthetic message read failure");
      return byId.get(id);
    },
  };
  return reader;
}
function input(directory, encryptionKey, reader, policy, overrides = {}) {
  return { manualPilotApproved: true, journalDirectory: directory,
    encryptionKey, reader, policy, maxPages: 2, now, ...overrides };
}
const singlePage = id => ({ "": { messages: [{ id }] } });

test("disabled pilot never touches mailbox or provisions a journal", async () =>
  temporary(async directory => {
    const m = message("a1", 1);
    const reader = fakeReader([m], singlePage(m.id));
    const result = await runApprovedFormSubmitPilot(input(
      directory, randomBytes(32), reader, approved([mapping(m, 1, "REALTY")]),
      { manualPilotApproved: false }));
    assert.equal(result.state, "DISABLED");
    assert.equal(result.processedPages, 0);
    assert.deepEqual(reader.history, []);
  }));

test("two approved pages persist both divisions atomically, with replay-safe restart", async () =>
  temporary(async directory => {
    const key = randomBytes(32);
    const a = message("a1", 1), b = message("b2", 2);
    const pages = {
      "": { messages: [{ id: a.id }], nextPageToken: "synthetic-next" },
      "synthetic-next": { messages: [{ id: b.id }] },
    };
    const reader = fakeReader([a, b], pages);
    const policy = approved([
      mapping(a, 1, "CAPITAL_ADVISORY"), mapping(b, 2, "REALTY"),
    ]);
    const first = await runApprovedFormSubmitPilot(input(directory, key, reader, policy));
    assert.equal(first.state, "COMPLETE");
    assert.equal(first.processedPages, 2);
    assert.equal(first.receivedOnPages, 2);
    assert.equal(first.newlyRetained, 2);
    assert.equal(first.retainedTotal, 2);
    assert.equal(first.externalActionsTaken, false);
    assert.equal(first.founderApprovalRequired, true);
    const saved = await readEncryptedIntakeJournal(directory, key, now);
    assert.equal(saved.retainedReceiptCount, 2);
    assert.deepEqual(new Set(saved.receipts.map(r => r.division)),
      new Set(["CAPITAL_ADVISORY", "REALTY"]));
    assert.equal(Object.keys(saved.checkpoint.seen).length, 4);
    const encrypted = await readFile(join(directory, "formsubmit-intake-journal.enc.json"), "utf8");
    assert.doesNotMatch(encrypted, /synthetic-1|synthetic-2|CAPITAL_ADVISORY|REALTY/);
    const repeated = await runApprovedFormSubmitPilot(input(directory, key, reader, policy));
    assert.equal(repeated.state, "COMPLETE");
    assert.equal(repeated.newlyRetained, 0);
    assert.equal(repeated.retainedTotal, 2);
    const after = await readEncryptedIntakeJournal(directory, key, now);
    assert.equal(after.retainedReceiptCount, 2);
  }));

test("unmapped second page holds its cursor without losing committed first page", async () =>
  temporary(async directory => {
    const key = randomBytes(32), a = message("a1", 1), unknown = message("b2", 2);
    const reader = fakeReader([a, unknown], {
      "": { messages: [{ id: a.id }], nextPageToken: "synthetic-next" },
      "synthetic-next": { messages: [{ id: unknown.id }] },
    });
    const result = await runApprovedFormSubmitPilot(input(
      directory, key, reader, approved([mapping(a, 1, "CAPITAL_ADVISORY")])));
    assert.equal(result.state, "SOURCE_REVIEW_REQUIRED");
    assert.equal(result.processedPages, 1);
    assert.equal(result.newlyRetained, 1);
    assert.equal(result.sourceMessagesHeld, 1);
    const retained = await readEncryptedIntakeJournal(directory, key, now);
    assert.equal(retained.retainedReceiptCount, 1);
    assert.equal(retained.checkpoint.pageToken, "synthetic-next");
  }));

test("spam or unauthenticated metadata is held, not checkpointed", async () =>
  temporary(async directory => {
    const key = randomBytes(32);
    for (const problematic of [
      message("a1", 1, { labels: ["SPAM"] }),
      { ...message("a1", 1), payload: { headers: [] } },
    ]) {
      const reader = fakeReader([problematic], singlePage(problematic.id));
      const result = await runApprovedFormSubmitPilot(input(
        directory, key, reader, approved([mapping(problematic, 1, "REALTY")])));
      assert.equal(result.state, "SOURCE_REVIEW_REQUIRED");
      assert.equal(result.processedPages, 0);
      assert.equal(result.sourceMessagesHeld, 1);
      assert.equal((await readEncryptedIntakeJournal(directory, key, now)).revision, "EMPTY");
    }
  }));

test("reader errors and wrong mailbox fail closed before any persistence", async () =>
  temporary(async directory => {
    const key = randomBytes(32), a = message("a1", 1);
    const policy = approved([mapping(a, 1, "CAPITAL_ADVISORY")]);
    for (const reader of [
      fakeReader([a], singlePage(a.id), { mailbox: "not-corporate@example.invalid" }),
      fakeReader([a], singlePage(a.id), { profileError: true }),
      fakeReader([a], singlePage(a.id), { listError: true }),
      fakeReader([a], singlePage(a.id), { getError: true }),
    ]) {
      const outcome = await runApprovedFormSubmitPilot(input(directory, key, reader, policy));
      assert.equal(outcome.state, "READ_ERROR");
      assert.equal(outcome.processedPages, 0);
      assert.equal((await readEncryptedIntakeJournal(directory, key, now)).revision, "EMPTY");
    }
    const recovered = await runApprovedFormSubmitPilot(input(
      directory, key, fakeReader([a], singlePage(a.id)), policy));
    assert.equal(recovered.state, "COMPLETE");
    assert.equal(recovered.newlyRetained, 1);
  }));

test("at most five bounded pages and explicit source approvals are required", async () =>
  temporary(async directory => {
    const key = randomBytes(32), a = message("a1", 1);
    const reader = fakeReader([a], singlePage(a.id));
    const policy = approved([mapping(a, 1, "REALTY")]);
    for (const maxPages of [0, 6, -1, 1.5]) {
      await assert.rejects(runApprovedFormSubmitPilot(input(
        directory, key, reader, policy, { maxPages })), /1 to 5 approved metadata pages/);
    }
    for (const invalidPolicy of [
      { ...policy, founderApproved: false },
      { ...policy, scopes: ["https://mail.google.com/"] },
      { ...policy, mappings: [] },
    ]) {
      const result = await runApprovedFormSubmitPilot(input(
        directory, key, reader, invalidPolicy));
      assert.equal(result.state, "DISABLED");
    }
    assert.deepEqual(reader.history, []);
  }));

test("wrong journal encryption key fails instead of pretending intake is empty", async () =>
  temporary(async directory => {
    const key = randomBytes(32), a = message("a1", 1);
    const policy = approved([mapping(a, 1, "REALTY")]);
    const reader = fakeReader([a], singlePage(a.id));
    const first = await runApprovedFormSubmitPilot(input(directory, key, reader, policy));
    assert.equal(first.state, "COMPLETE");
    const previously = await readFile(join(directory, "formsubmit-intake-journal.enc.json"));
    await assert.rejects(runApprovedFormSubmitPilot(input(
      directory, randomBytes(32), reader, policy)), /authentication\/integrity/);
    const afterwards = await readFile(join(directory, "formsubmit-intake-journal.enc.json"));
    assert.deepEqual(afterwards, previously);
  }));
