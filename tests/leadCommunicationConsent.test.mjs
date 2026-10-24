import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  COMMUNICATION_DISCLOSURE_VERSION, communicationDisclosures,
  normalizeCommunicationPreferences, readCommunicationPreferences,
  communicationPreferenceError, withServerCommunicationConsent,
} from "../src/lib/leads/leadCommunicationConsent.ts";
import { createLeadCapturePayload } from "../src/lib/leads/leadCapture.ts";
import { createJsonlLeadStorageAdapter } from "../src/lib/leads/leadStorage.ts";
import { processLeadSubmission } from "../src/lib/leads/leadSubmission.ts";
import { POST, ALL } from "../src/pages/api/leads/submit.ts";

const choices = (changes = {}) => ({ disclosureVersion: COMMUNICATION_DISCLOSURE_VERSION, emailNewsletter: false, smsMarketing: false, smsInquiry: false, ...changes });
const fixture = { name: "Consent fixture", email: "consent@example.test", source: "begin-your-quest", createdAt: "2000-01-01T00:00:00.000Z" };

test("legacy inquiries and phone numbers do not imply any communication subscription", () => {
  const legacy = createLeadCapturePayload({ ...fixture, phone: "+1 202 555 0100" });
  assert.equal(Object.hasOwn(legacy, "communicationPreferences"), false);
  assert.deepEqual(withServerCommunicationConsent(legacy, "2026-10-24T06:00:00.000Z"), legacy);
  assert.equal(communicationPreferenceError(undefined, null), null);
});

test("empty form choices stay independently false without requiring phone", () => {
  const data = new FormData(); data.set("communicationDisclosureVersion", COMMUNICATION_DISCLOSURE_VERSION);
  assert.deepEqual(readCommunicationPreferences(data), choices());
  assert.equal(communicationPreferenceError(readCommunicationPreferences(data), ""), null);
  data.set("newsletterConsent", "yes");
  assert.deepEqual(readCommunicationPreferences(data), choices({ emailNewsletter: true }));
  data.set("smsInquiryConsent", "yes");
  assert.deepEqual(readCommunicationPreferences(data), choices({ emailNewsletter: true, smsInquiry: true }));
});

test("only current explicit booleans can authorize individual categories", () => {
  for (const value of [true, [], "yes", {}, choices({ disclosureVersion: "old" }), choices({ smsMarketing: "false" }), choices({ smsInquiry: 1 }), { disclosureVersion: COMMUNICATION_DISCLOSURE_VERSION, emailNewsletter: true }]) {
    assert.equal(normalizeCommunicationPreferences(value), undefined);
    assert.ok(communicationPreferenceError(value, "+1 202 555 0100"));
  }
  for (const channel of ["emailNewsletter", "smsMarketing", "smsInquiry"]) {
    assert.deepEqual(normalizeCommunicationPreferences(choices({ [channel]: true })), choices({ [channel]: true }));
  }
});

test("text choices require a plausible supplied phone while email-only remains optional", () => {
  for (const channel of ["smsMarketing", "smsInquiry"]) {
    for (const number of [null, "", "123", "call me", "1".repeat(16)]) assert.ok(communicationPreferenceError(choices({ [channel]: true }), number));
    assert.equal(communicationPreferenceError(choices({ [channel]: true }), "+1 (202) 555-0100"), null);
  }
  assert.equal(communicationPreferenceError(choices({ emailNewsletter: true }), null), null);
});

test("server evidence snapshots the shown wording and ignores forged browser evidence", () => {
  const payload = createLeadCapturePayload({ ...fixture, communicationPreferences: choices({ smsInquiry: true }), phone: "+1 202 555 0100" });
  const saved = withServerCommunicationConsent({ ...payload, communicationConsentEvidence: { affirmativeAt: "forged", brand: "forged" } }, "2026-10-24T06:00:00.000Z");
  assert.equal(saved.communicationConsentEvidence.recordedAt, "2026-10-24T06:00:00.000Z");
  assert.equal(saved.communicationConsentEvidence.affirmativeAt, saved.communicationConsentEvidence.recordedAt);
  assert.notEqual(saved.createdAt, saved.communicationConsentEvidence.recordedAt);
  assert.deepEqual(saved.communicationConsentEvidence.disclosures, communicationDisclosures);
  assert.equal(saved.communicationConsentEvidence.sourceUrl, "https://questluxo.com/begin-your-quest");
  assert.equal(saved.communicationConsentEvidence.sourceBasis, "submitted-form-source");
  assert.equal(saved.communicationConsentEvidence.brand, "Quest Luxo Luxury Advisory");
  assert.equal(saved.communicationConsentEvidence.selections.smsMarketing, false);
  const none = withServerCommunicationConsent(createLeadCapturePayload({ ...fixture, communicationPreferences: choices() }), "2026-10-24T06:00:00.000Z");
  assert.equal(none.communicationConsentEvidence.affirmativeAt, null);
  const unknown = withServerCommunicationConsent(createLeadCapturePayload({ ...fixture, source: "unknown", communicationPreferences: choices({ emailNewsletter: true }) }), "2026-10-24T06:00:00.000Z");
  assert.equal(unknown.communicationConsentEvidence, undefined);
});

test("API rejects stale/ambiguous consent and missing SMS phone before any persistence", async () => {
  for (const prefs of [choices({ disclosureVersion: "old" }), choices({ smsMarketing: "yes" }), choices({ smsMarketing: true })]) {
    const response = await POST({ request: new Request("https://example.test/api/leads/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...fixture, communicationPreferences: prefs }) }) });
    assert.equal(response.status, 400); assert.equal((await response.json()).success, false);
  }
  assert.equal(ALL().status, 405);
});

test("temporary storage retains trusted evidence through delivery/status updates without campaign actions", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qlux-consent-"));
  try {
    const adapter = createJsonlLeadStorageAdapter(directory);
    let notifications = 0;
    const payload = createLeadCapturePayload({ ...fixture, source: "contact", communicationPreferences: choices({ emailNewsletter: true }) });
    const result = await processLeadSubmission({ ...payload, communicationConsentEvidence: { recordedAt: "forged" } }, {
      ensureReady: async () => {}, persist: adapter.saveLeadSubmission,
      notify: async () => { notifications++; return { status: "skipped", configured: false }; },
      recordDelivery: adapter.updateLeadSubmissionEmailDelivery,
    });
    assert.equal(result.success, true); assert.equal(notifications, 1);
    await adapter.updateLeadSubmissionStatus(result.storage.id, "contacted");
    await adapter.updateLeadSubmissionNotes(result.storage.id, "fixture review");
    const [record] = await adapter.readLeadSubmissions();
    assert.equal(record.payload.communicationConsentEvidence.recordedAt, record.savedAt);
    assert.equal(record.payload.communicationConsentEvidence.sourceUrl, "https://questluxo.com/contact");
    assert.deepEqual(record.payload.communicationConsentEvidence.selections, choices({ emailNewsletter: true }));
    assert.equal(record.status, "contacted");
    const raw = await readFile(join(directory, "leads.jsonl"), "utf8");
    assert.doesNotMatch(raw, /forged/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("both public forms share optional unchecked controls and preserve inquiry endpoints", async () => {
  const component = await readFile(new URL("../src/components/CommunicationPreferences.astro", import.meta.url), "utf8");
  assert.equal((component.match(/<input\b[^>]*type="checkbox"/g) ?? []).length, 3);
  assert.doesNotMatch(component, /\b(?:checked|required)\s*(?:=|\/>|>)/);
  for (const page of ["begin-your-quest", "contact"]) {
    const source = await readFile(new URL(`../src/pages/${page}.astro`, import.meta.url), "utf8");
    assert.match(source, /<CommunicationPreferences\s*\/>/);
    assert.match(source, /readCommunicationPreferences\(formData\)/);
    assert.match(source, /fetch\("\/api\/leads\/submit"/);
  }
});
