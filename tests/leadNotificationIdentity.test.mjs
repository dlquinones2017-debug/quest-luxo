import assert from "node:assert/strict";
import test from "node:test";
import { createLeadCapturePayload } from "../src/lib/leads/leadCapture.ts";
import { processLeadSubmission, notifySavedLead } from "../src/lib/leads/leadSubmission.ts";
import { createLeadNotificationContext, getLeadNotificationContextFields } from "../src/lib/leads/leadNotificationContext.ts";
import { createLeadNotificationText, createLeadNotificationHtml, createLeadNotificationSubject } from "../src/lib/leads/leadNotification.ts";
import { luxurySignatureText, luxurySignatureHtml } from "../src/lib/config/luxuryEmailSignature.ts";

const stored = Object.freeze({ saved: true, id: "lead_658a2092-e45c-4f6d-990d-c6c619aa9e11", savedAt: "2026-10-28T18:00:00.000Z", path: "synthetic-only" });
const payload = createLeadCapturePayload({ name: "Synthetic <Client>", email: "test@example.com", intent: "request-this-watch", brand: "Omega", reference: "310.32.42.50.01.002", message: "No outreach. <script>bad</script>", leadId: "spoof", savedAt: "spoof" });
const sent = { status: "sent", configured: true };
const dependencies = overrides => ({ ensureReady: async () => {}, persist: async () => stored, notify: async () => sent, recordDelivery: async () => ({}), ...overrides });

test("persisted identity and time, not client fields, reach notification after saving", async () => {
  const order = [];
  let observed;
  const result = await processLeadSubmission(payload, dependencies({
    persist: async () => { order.push("persist"); return stored; },
    notify: async (body, context) => { order.push("notify"); observed = context; assert.equal(body, payload); return sent; },
    recordDelivery: async id => { assert.equal(id, stored.id); return {}; },
  }));
  assert.deepEqual(order, ["persist", "notify"]);
  assert.deepEqual(observed, { version: 1, sourceSystem: "luxury-canonical-jsonl", leadId: stored.id, savedAt: stored.savedAt });
  assert.equal(result.success, true);
  assert.equal(payload.leadId, undefined);
});

test("persistence failure sends nothing; notification failure preserves saved success", async () => {
  let notices = 0;
  const failed = await processLeadSubmission(payload, dependencies({ persist: async () => { throw Error("synthetic"); }, notify: async () => { notices++; return sent; } }));
  assert.equal(failed.success, false);
  assert.equal(notices, 0);
  const saved = await processLeadSubmission(payload, dependencies({ notify: async () => { throw Error("synthetic notification failure"); } }));
  assert.equal(saved.success, true);
  assert.equal(saved.storage.id, stored.id);
  assert.equal(saved.delivery.status, "failed");
});

test("retry sends from the same saved record and emits one stable event key", async () => {
  const keys = [];
  const notify = async (body, context) => { keys.push(Object.fromEntries(getLeadNotificationContextFields(context))["Event-Key"]); return sent; };
  const record = { ...stored, payload };
  await notifySavedLead(record, notify);
  await notifySavedLead(record, notify);
  assert.deepEqual(keys, [`luxury-inquiry-v1/${stored.id}`, `luxury-inquiry-v1/${stored.id}`]);
});

test("malformed IDs, timestamps and contracts fail before notification", async () => {
  for (const altered of [{ ...stored, id: "lead\nspoof" }, { ...stored, savedAt: "not-a-date" }, { ...stored, savedAt: "2026-02-30T18:00:00.000Z" }]) {
    assert.throws(() => createLeadNotificationContext(altered), /Invalid persisted/);
  }
  assert.throws(() => getLeadNotificationContextFields({ version: 2, sourceSystem: "other", leadId: stored.id, savedAt: stored.savedAt }), /Unsupported/);
  let notified = false;
  const result = await processLeadSubmission(payload, dependencies({ persist: async () => ({ ...stored, id: "bad\nidentity" }), notify: async () => { notified = true; return sent; } }));
  assert.equal(notified, false);
  assert.equal(result.success, true);
  assert.equal(result.delivery.status, "failed");
});

test("saved legacy hash IDs and valid ISO timestamp variants survive retry unchanged", async () => {
  for (const savedAt of ["2026-10-28T18:00:00Z", "2026-10-28T14:00:00-04:00"]) {
    const legacy = { ...stored, id: "lead_a0123456789bcdef01234567", savedAt, payload };
    let observed;
    await notifySavedLead(legacy, async (body, context) => { observed = context; return sent; });
    assert.equal(observed.leadId, legacy.id);
    assert.equal(observed.savedAt, savedAt);
    assert.equal(Object.fromEntries(getLeadNotificationContextFields(observed))["Event-Key"], `luxury-inquiry-v1/${legacy.id}`);
  }
});

test("event block preserves subject and fields, escapes HTML and includes the Luxury signature once", () => {
  const context = createLeadNotificationContext(stored);
  const subject = createLeadNotificationSubject(payload);
  const text = createLeadNotificationText(payload, context);
  const html = createLeadNotificationHtml(payload, context);
  assert.ok(text.startsWith("Quest Luxo canonical inquiry event\nContract-Version: 1\nSource-System: luxury-canonical-jsonl\nLead-ID: " + stored.id));
  assert.ok(text.includes(`Saved-At: ${stored.savedAt}`));
  assert.ok(text.includes(`Event-Key: luxury-inquiry-v1/${stored.id}\nEnd-Canonical-Event`));
  assert.ok(text.includes(subject));
  assert.ok(text.includes("Reference: 310.32.42.50.01.002"));
  assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;"));
  assert.ok(!html.includes("<script>bad</script>"));
  assert.equal(text.split(luxurySignatureText).length - 1, 1);
  assert.equal(html.split(luxurySignatureHtml).length - 1, 1);
  assert.ok(html.includes('href="https://questluxo.com/begin-your-quest"'));
  assert.equal(createLeadNotificationSubject(payload), subject);
  assert.ok(!createLeadNotificationText(payload).includes("Lead-ID:"), "legacy callers have no invented persisted identity");
});
