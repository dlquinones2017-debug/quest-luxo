import { APPROVED_VALIDATION_FIXTURE, WORKFORCE_OWNER, type LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";
import type { WorkforceContact, WorkforceTask } from "./workforceContactTaskDelivery.ts";

// Read-only operator evidence confirmed by the workforce owner on 2026-10-29.
// This historical body is deliberately not backfilled with runtime metadata.
const legacyBody = [
  "QUEST LUXO INTERNAL TEST / SYNTHETIC — not a customer, genuine lead, qualified opportunity, or revenue.",
  "Controlled integration receipt: QL-E2E-20261028-2102.",
  "Division: Luxury Advisory. Category: Other / needs review (test).",
  "Canonical origin: https://questluxo.com/.",
  "Contract-Version: 1",
  "Source-System: luxury-canonical-jsonl",
  "Lead-ID: lead_f77e95ab-e8a1-4cac-9953-37ecaaba2945",
  "Saved-At: 2026-10-29T00:58:39.757Z",
  "Event-Key: luxury-inquiry-v1/lead_f77e95ab-e8a1-4cac-9953-37ecaaba2945",
  "Gmail message ID: 1a1852a8d798e628",
  "RFC Message-ID: &lt;010001a1852a8ac5-a9b7a853-fef9-4a59-b6db-999183d3e055-000000@email.amazonses.com&gt;",
  "Receipt timestamp: 2026-10-29T00:58:40Z. Aligned questluxo.com DKIM and DMARC PASS.",
  "Source receipt: https://mail.google.com/mail/u/?authuser=denzel%40questluxo.com#all/1a1852a8d798e628",
  "Provider-sharing consent: Not requested. Marketing consent: Not granted by this test.",
  "Next action: Denzel reviews this synthetic task/receipt linkage only. Do not contact customers, source a watch, enroll marketing, create deals, or submit to providers.",
  "Execution: controlled operator connector test; existing production Inquiry Intake synthetic exclusion preserved. Does not prove unattended workflow.",
].join("\n");

export function matchesLegacyOperatorBaseline(event: LuxuryWorkforceEvent, contact: WorkforceContact, task: WorkforceTask | null): boolean {
  return event.leadId === APPROVED_VALIDATION_FIXTURE.leadId &&
    event.eventKey === `luxury-inquiry-v1/${APPROVED_VALIDATION_FIXTURE.leadId}` &&
    event.source === "luxury-canonical-jsonl" && new Date(event.savedAt).toISOString() === "2026-10-29T00:58:39.757Z" &&
    event.fingerprint === "b586e7941e71d04681acc35d042417ca0a0d0e4d94e89e5ee2642035be565742" &&
    contact.id === APPROVED_VALIDATION_FIXTURE.contactId && contact.archived === false &&
    contact.email.trim().toLowerCase() === APPROVED_VALIDATION_FIXTURE.email && contact.ownerId === WORKFORCE_OWNER && contact.lifecycleStage === "other" &&
    !!task && task.id === APPROVED_VALIDATION_FIXTURE.taskId && task.archived === false &&
    task.subject === `QL INTERNAL TEST | Luxury | ${event.eventKey}` && task.body === legacyBody &&
    task.ownerId === WORKFORCE_OWNER && task.contactIds.length === 1 && task.contactIds[0] === contact.id &&
    task.type === "TODO" && task.status === "NOT_STARTED" && Date.parse(task.dueAt) === Date.parse("2026-10-30T01:01:31Z");
}
