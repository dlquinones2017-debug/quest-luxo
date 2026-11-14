import { createLuxuryWorkforceEvent, WORKFORCE_MAILBOX, WORKFORCE_OWNER, WORKFORCE_PORTAL, type LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";
import { WorkforceContactTaskDelivery, type WorkforceCRMAdapter } from "./workforceContactTaskDelivery.ts";
import type { WorkforcePhaseJournal } from "./workforcePhaseJournal.ts";
import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import { createCampaignLeadSource } from "../leads/campaignAttribution.ts";

// No startup import, schedule, environment flag, new store or customer send.
// The existing owner must supply authenticated source/admission adapters and a
// specifically accepted first-batch release. Form fields cannot grant access.
type SavedRecord = Pick<LeadSubmissionRecord, "id" | "savedAt" | "payload">;
export interface GenuineInquiryRelease {
  enabled: boolean; businessHold: boolean; scope: "LUXURY_INTERNAL_CONTACT_TASK_ONLY";
  portal: string; ownerId: string; acceptedAt: string; expiresAt: string;
  releaseApprovalRef: string; recoveryAcceptanceRef: string; runtimeAcceptanceRef: string;
  approvedEvents: readonly { leadId: string; fingerprint: string }[];
}
export interface GenuineInquiryAdmission {
  source: "AUTHENTICATED_CANONICAL_SNAPSHOT"; division: "luxury";
  leadId: string; fingerprint: string; reviewRef: string; reviewedAt: string; expiresAt: string;
  purpose: "REQUESTED_INQUIRY_INTERNAL_HANDLING";
  permission: "VERIFIED"; suppression: "CLEAR"; doNotContact: false;
}
export interface GenuineInquiryDependencies {
  clock?: () => number;
  key: Buffer;
  readCanonicalSnapshot: () => Promise<{ status: string; records: readonly SavedRecord[] }>;
  readAdmission: (event: LuxuryWorkforceEvent) => Promise<GenuineInquiryAdmission | null>;
  isReleaseCurrent: (release: GenuineInquiryRelease) => Promise<boolean>;
  openExistingJournal: () => Promise<WorkforcePhaseJournal>;
  createGenuineAdapter: (beforeWrite: () => Promise<boolean>) => Promise<WorkforceCRMAdapter>;
}
const ref = (v: unknown) => typeof v === "string" && /^[a-zA-Z0-9_:/#.-]{1,200}$/.test(v);
const hash = (v: unknown) => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const leadId = (v: unknown) => typeof v === "string" && /^[a-z0-9][a-z0-9_-]{0,127}$/i.test(v);
function currentWindow(start: string, end: string, now: number, maxAge: number, maxWindow: number) {
  if (typeof start !== "string" || typeof end !== "string" || !Number.isFinite(now)) return false;
  const a = Date.parse(start), b = Date.parse(end);
  return Number.isFinite(a) && Number.isFinite(b) && a <= now && now < b && now - a <= maxAge && b > a && b - a <= maxWindow;
}
function releaseValid(r: GenuineInquiryRelease | null | undefined, now: number): r is GenuineInquiryRelease {
  return !!r && r.enabled === true && r.businessHold === false && r.scope === "LUXURY_INTERNAL_CONTACT_TASK_ONLY" &&
    r.portal === WORKFORCE_PORTAL && r.ownerId === WORKFORCE_OWNER &&
    currentWindow(r.acceptedAt, r.expiresAt, now, 86_400_000, 86_400_000) &&
    [r.releaseApprovalRef, r.recoveryAcceptanceRef, r.runtimeAcceptanceRef].every(ref) &&
    Array.isArray(r.approvedEvents) && r.approvedEvents.length > 0 && r.approvedEvents.length <= 5 &&
    r.approvedEvents.every(e => e && leadId(e.leadId) && hash(e.fingerprint)) &&
    new Set(r.approvedEvents.map(e => e.leadId)).size === r.approvedEvents.length;
}
function genuineSource(event: LuxuryWorkforceEvent, now: number) {
  const p = event.payload;
  const [route, ...query] = (p.source ?? "").split(";");
  if (route !== "begin-your-quest" && route !== "contact" || query.length > 1 ||
      createCampaignLeadSource(route, query.length ? "?" + query[0] : "") !== p.source) return false;
  return p.email?.trim().toLowerCase() !== WORKFORCE_MAILBOX && !/^QUEST LUXO INTERNAL TEST(?:\s|$)/.test(p.name ?? "") &&
    Number.isFinite(Date.parse(event.savedAt)) && Date.parse(event.savedAt) <= now;
}
function admitted(a: GenuineInquiryAdmission | null, event: LuxuryWorkforceEvent, now: number) {
  return !!a && a.source === "AUTHENTICATED_CANONICAL_SNAPSHOT" && a.division === "luxury" &&
    a.leadId === event.leadId && a.fingerprint === event.fingerprint && ref(a.reviewRef) &&
    currentWindow(a.reviewedAt, a.expiresAt, now, 900_000, 900_000) &&
    a.purpose === "REQUESTED_INQUIRY_INTERNAL_HANDLING" && a.permission === "VERIFIED" &&
    a.suppression === "CLEAR" && a.doNotContact === false;
}
const hold = (reason: string) => ({ mode: "GENUINE_INQUIRY", businessHold: true, processed: 0, reason, customerMessages: 0 });

/** One explicitly accepted bounded batch through the EXISTING journal/delivery engine.
 * Dependency objects are trusted server code, never request/form input. This does
 * not authenticate a receipt by itself or establish the referenced acceptance.
 */
export async function runLuxuryGenuineInquiryOnce(release: GenuineInquiryRelease | null | undefined, deps: GenuineInquiryDependencies) {
  const clock = deps.clock ?? Date.now;
  if (!releaseValid(release, clock())) return hold("EXACT_ACCEPTED_RELEASE_REQUIRED");
  if (!Buffer.isBuffer(deps.key) || deps.key.length !== 32 || !await deps.isReleaseCurrent(release)) return hold("RELEASE_OR_MANAGED_KEY_UNVERIFIED");
  const snapshot = await deps.readCanonicalSnapshot();
  if (snapshot.status !== "COMPLETE" || !Array.isArray(snapshot.records)) return hold("CANONICAL_SNAPSHOT_INCOMPLETE");
  const rows = snapshot.records.filter(r => release.approvedEvents.some(e => e.leadId === r.id));
  if (rows.length !== release.approvedEvents.length || new Set(rows.map(r => r.id)).size !== rows.length) return hold("APPROVED_SOURCE_RECORD_MISSING_OR_DUPLICATED");
  const events: LuxuryWorkforceEvent[] = [];
  for (const record of rows) {
    let event: LuxuryWorkforceEvent;
    try { event = createLuxuryWorkforceEvent({ ...record, payload: Object.freeze({ ...record.payload }) }, deps.key); } catch { return hold("CANONICAL_EVENT_INVALID"); }
    if (release.approvedEvents.find(e => e.leadId === event.leadId)?.fingerprint !== event.fingerprint || !genuineSource(event, clock())) return hold("SOURCE_IDENTITY_OR_FINGERPRINT_UNVERIFIED");
    if (!admitted(await deps.readAdmission(event), event, clock())) return hold("FRESH_PERMISSION_SUPPRESSION_REVIEW_REQUIRED");
    events.push(event);
  }
  // All source and admission checks complete before opening state or building a
  // provider adapter. A held or malformed batch cannot make a partial CRM write.
  const journal = await deps.openExistingJournal();
  if (journal.read().state.recoveryHold) return hold("RESTORED_JOURNAL_DISPATCH_HELD");
  const results = [];
  for (const event of events) {
    const beforeWrite = async () => releaseValid(release, clock()) && release.approvedEvents.some(e => e.leadId === event.leadId && e.fingerprint === event.fingerprint) && await deps.isReleaseCurrent(release) &&
      !journal.read().state.recoveryHold && admitted(await deps.readAdmission(event), event, clock());
    if (!await beforeWrite()) return { ...hold("RELEASE_OR_ADMISSION_CHANGED"), processed: results.length, results };
    const adapter = await deps.createGenuineAdapter(beforeWrite);
    if (adapter.deliveryMode !== "GENUINE_INQUIRY") return { ...hold("MATCHING_GENUINE_PROVIDER_PROFILE_REQUIRED"), processed: results.length, results };
    const worker = new WorkforceContactTaskDelivery(journal, adapter, clock, "GENUINE_INQUIRY");
    results.push(await worker.deliver(event));
  }
  return { mode: "GENUINE_INQUIRY", division: "luxury", businessHold: results.some(r => r.status !== "COMPLETE"), processed: results.length, results, customerMessages: 0,
    releaseApprovalRef: release.releaseApprovalRef, qualification: "NOT_ASSESSED", collectedRevenue: null };
}
