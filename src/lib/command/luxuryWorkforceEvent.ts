import { createHash, createHmac } from "node:crypto";
import { createLeadNotificationContext, type LeadNotificationContext } from "../leads/leadNotificationContext.ts";
import type { LeadCapturePayload } from "../leads/leadCapture.ts";
import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import { getLeadNotificationPayloadFields } from "../leads/leadNotification.ts";

export const WORKFORCE_MAILBOX = "denzel@questluxo.com";
export const WORKFORCE_PORTAL = "247778505";
export const WORKFORCE_OWNER = "101804786";
export const APPROVED_VALIDATION_FIXTURE = Object.freeze({
  leadId: "lead_f77e95ab-e8a1-4cac-9953-37ecaaba2945",
  marker: "QL-E2E-20261028-2102",
  email: WORKFORCE_MAILBOX,
  name: "QUEST LUXO INTERNAL TEST QL-E2E-20261028-2102",
  source: "workforce-controlled-test-QL-E2E-20261028-2102",
  contactId: "580059137778",
  taskId: "412987647734",
});
const fields = ["name", "email", "phone", "intent", "brand", "collection", "reference", "desiredWatch", "budget", "timeline", "message", "source", "createdAt"] as const;
export interface LuxuryWorkforceEvent {
  readonly eventKey: string;
  readonly leadId: string;
  readonly savedAt: string;
  readonly fingerprint: string;
  readonly emailKey: string;
  readonly payload: LeadCapturePayload;
  readonly source: "luxury-canonical-jsonl";
}

/** Parses identity only. Authentication and mailbox binding belong to the calling source adapter. */
export function parseLuxuryCanonicalBlock(text: string): LeadNotificationContext {
  if (typeof text !== "string" || Buffer.byteLength(text) > 262144) throw Error("Invalid bounded inquiry text.");
  const lines = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n", 8);
  const labels = ["Contract-Version", "Source-System", "Lead-ID", "Saved-At", "Event-Key"];
  if (lines[0] !== "Quest Luxo canonical inquiry event" || lines[6] !== "End-Canonical-Event" ||
      Buffer.byteLength(lines.slice(0, 7).join("\n")) > 2048) throw Error("Initial canonical block required.");
  const values = labels.map((label, i) => {
    if (!lines[i + 1]?.startsWith(`${label}: `)) throw Error("Canonical field order or identity invalid.");
    return lines[i + 1].slice(label.length + 2);
  });
  if (values[0] !== "1" || values[1] !== "luxury-canonical-jsonl" || values[4] !== `luxury-inquiry-v1/${values[2]}`) throw Error("Unsupported canonical contract.");
  return createLeadNotificationContext({ id: values[2], savedAt: values[3] });
}

/** The server-owned saved record is authoritative; mutable status, notes and delivery outcomes are excluded. */
export function createLuxuryWorkforceEvent(record: Pick<LeadSubmissionRecord, "id" | "savedAt" | "payload">, key: Buffer): LuxuryWorkforceEvent {
  if (key.length !== 32) throw Error("Managed journal key required.");
  const context = createLeadNotificationContext(record);
  const payload = record.payload;
  if (!payload || Object.keys(payload).sort().join() !== [...fields].sort().join() || fields.some(field => {
    const value = payload[field];
    return value !== null && (typeof value !== "string" || value.length > 20000);
  }) || !payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw Error("Invalid canonical inquiry payload.");
  const payloadRows = getLeadNotificationPayloadFields(payload).map(([label, text]) => [label, text.replace(/\r\n/g, "\n").trim()]);
  const fingerprint = createHash("sha256").update(JSON.stringify(["ql-intake-fingerprint-v1", 1, context.sourceSystem, context.leadId, new Date(context.savedAt).toISOString(), payloadRows])).digest("hex");
  const emailKey = createHmac("sha256", key).update(JSON.stringify(["QUEST_CONTACT_EMAIL_V2", WORKFORCE_PORTAL, payload.email.trim().toLowerCase()])).digest("hex");
  return Object.freeze({ eventKey: `luxury-inquiry-v1/${context.leadId}`, leadId: context.leadId, savedAt: context.savedAt, fingerprint, emailKey, payload, source: context.sourceSystem });
}

export function isApprovedWorkforceFixture(event: LuxuryWorkforceEvent, allowedIds: readonly string[] = [APPROVED_VALIDATION_FIXTURE.leadId]): boolean {
  return allowedIds.includes(event.leadId) &&
    event.payload.email?.trim().toLowerCase() === APPROVED_VALIDATION_FIXTURE.email &&
    event.payload.name === APPROVED_VALIDATION_FIXTURE.name &&
    event.payload.source === APPROVED_VALIDATION_FIXTURE.source &&
    !!event.payload.message?.includes(APPROVED_VALIDATION_FIXTURE.marker);
}
