import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createLuxuryWorkforceEvent, WORKFORCE_OWNER, type LuxuryWorkforceEvent } from "../command/luxuryWorkforceEvent.ts";
import type { LeadSubmissionRecord } from "./leadStorageTypes.ts";

export const INTERNAL_SOURCE_REVIEW_ATTESTATION = "I_REVIEWED_THE_REFERENCED_EXISTING_SOURCES_FOR_THIS_IDENTITY_AND_INTERNAL_PURPOSE";
export interface InternalHandlingReview {
  readonly schema: "ql-internal-handling-review-v1";
  readonly id: string;
  readonly previousReviewId: string | null;
  readonly leadId: string;
  readonly fingerprint: string;
  readonly emailKey: string;
  readonly reviewedBy: string;
  readonly recordedAt: string;
  readonly expiresAt: string;
  readonly decision: "APPROVE_INTERNAL_HANDLING" | "REVOKE";
  readonly suppression: "CLEAR" | "BLOCKED" | "UNKNOWN";
  readonly sourceRefs: readonly string[];
  readonly scope: "LUXURY_INTERNAL_CONTACT_TASK_ONLY";
  readonly customerCommunication: "NOT_GRANTED";
  readonly signature: string;
}
export interface InternalHandlingDecision {
  readonly expectedFingerprint: string;
  readonly decision: InternalHandlingReview["decision"];
  readonly suppression: InternalHandlingReview["suppression"];
  readonly sourceRefs: readonly string[];
  readonly sourceReviewAttestation?: string;
}
const fields = ["schema", "id", "previousReviewId", "leadId", "fingerprint", "emailKey", "reviewedBy", "recordedAt", "expiresAt", "decision", "suppression", "sourceRefs", "scope", "customerCommunication", "signature"].sort().join();
const hash = (v: unknown): v is string => typeof v === "string" && /^[a-f0-9]{64}$/.test(v);
const reviewId = (v: unknown): v is string => typeof v === "string" && /^review_[a-f0-9-]{36}$/.test(v);
const nativeRef = (v: unknown): v is string => typeof v === "string" && /^(?:hubspot|wts|owner-instruction):[a-zA-Z0-9_:/#.-]{1,180}$/.test(v);
const validTime = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;

// Shape validation never establishes approval. Authentication requires the seal,
// exact event identity, fresh timestamp and the latest explicit operator action.
export function normalizeInternalHandlingReviews(value: unknown): readonly InternalHandlingReview[] | null {
  if (value === undefined) return Object.freeze([]);
  if (!Array.isArray(value)) return null;
  const rows: InternalHandlingReview[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Object.keys(item).sort().join() !== fields ||
        item.schema !== "ql-internal-handling-review-v1" || !reviewId(item.id) ||
        item.previousReviewId !== (rows.at(-1)?.id ?? null) || typeof item.leadId !== "string" ||
        !hash(item.fingerprint) || !hash(item.emailKey) || item.reviewedBy !== WORKFORCE_OWNER ||
        !validTime(item.recordedAt) || !validTime(item.expiresAt) ||
        !["APPROVE_INTERNAL_HANDLING", "REVOKE"].includes(item.decision) || !["CLEAR", "BLOCKED", "UNKNOWN"].includes(item.suppression) ||
        !Array.isArray(item.sourceRefs) || item.sourceRefs.length > 8 || item.sourceRefs.some((x: unknown) => !nativeRef(x)) ||
        new Set(item.sourceRefs).size !== item.sourceRefs.length || item.scope !== "LUXURY_INTERNAL_CONTACT_TASK_ONLY" || item.customerCommunication !== "NOT_GRANTED" || !hash(item.signature)) return null;
    rows.push(Object.freeze({ ...item, sourceRefs: Object.freeze([...item.sourceRefs]) }));
  }
  return Object.freeze(rows);
}
function seal(review: Omit<InternalHandlingReview, "signature">, key: Buffer): string {
  return createHmac("sha256", key).update(JSON.stringify(["QL_INTERNAL_HANDLING_REVIEW_V1", review.schema, review.id, review.previousReviewId,
    review.leadId, review.fingerprint, review.emailKey, review.reviewedBy, review.recordedAt, review.expiresAt,
    review.decision, review.suppression, review.sourceRefs, review.scope, review.customerCommunication])).digest("hex");
}
export function createInternalHandlingReview(record: LeadSubmissionRecord, input: InternalHandlingDecision, key: Buffer, now = Date.now()): InternalHandlingReview {
  if (!Buffer.isBuffer(key) || key.length !== 32 || !Number.isFinite(now)) throw Error("Managed review signing context required.");
  const event = createLuxuryWorkforceEvent(record, key);
  if (input.expectedFingerprint !== event.fingerprint || !["APPROVE_INTERNAL_HANDLING", "REVOKE"].includes(input.decision) ||
      !["CLEAR", "BLOCKED", "UNKNOWN"].includes(input.suppression) || !Array.isArray(input.sourceRefs) || input.sourceRefs.length > 8 ||
      input.sourceRefs.some(x => !nativeRef(x)) || new Set(input.sourceRefs).size !== input.sourceRefs.length ||
      input.decision === "APPROVE_INTERNAL_HANDLING" && (input.sourceReviewAttestation !== INTERNAL_SOURCE_REVIEW_ATTESTATION || !input.sourceRefs.length)) {
    throw Error("Exact event and explicit reviewed-source decision required.");
  }
  const rows = normalizeInternalHandlingReviews(record.internalHandlingReviews);
  if (!rows) throw Error("Existing review chain is invalid.");
  for (const row of rows) {
    const { signature, ...unsigned } = row;
    if (row.leadId !== event.leadId || !timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(seal(unsigned, key), "hex"))) throw Error("Existing review seal is invalid.");
  }
  const review: Omit<InternalHandlingReview, "signature"> = {
    schema: "ql-internal-handling-review-v1", id: `review_${randomUUID()}`, previousReviewId: rows.at(-1)?.id ?? null,
    leadId: event.leadId, fingerprint: event.fingerprint, emailKey: event.emailKey, reviewedBy: WORKFORCE_OWNER,
    recordedAt: new Date(now).toISOString(), expiresAt: new Date(now + 900_000).toISOString(), decision: input.decision,
    suppression: input.suppression, sourceRefs: Object.freeze([...input.sourceRefs]), scope: "LUXURY_INTERNAL_CONTACT_TASK_ONLY", customerCommunication: "NOT_GRANTED",
  };
  return Object.freeze({ ...review, signature: seal(review, key) });
}
export function readCurrentInternalHandlingReview(record: LeadSubmissionRecord, event: LuxuryWorkforceEvent, key: Buffer, now = Date.now()): InternalHandlingReview | null {
  if (!Buffer.isBuffer(key) || key.length !== 32 || !Number.isFinite(now)) return null;
  const rows = normalizeInternalHandlingReviews(record.internalHandlingReviews);
  if (!rows?.length) return null;
  for (const row of rows) {
    const { signature, ...unsigned } = row;
    const actual = Buffer.from(signature, "hex"), expected = Buffer.from(seal(unsigned, key), "hex");
    if (!timingSafeEqual(actual, expected) || row.leadId !== event.leadId) return null;
  }
  const latest = rows.at(-1)!;
  const recorded = Date.parse(latest.recordedAt), expires = Date.parse(latest.expiresAt);
  return latest.decision === "APPROVE_INTERNAL_HANDLING" && latest.suppression === "CLEAR" && latest.sourceRefs.length > 0 &&
    latest.fingerprint === event.fingerprint && latest.emailKey === event.emailKey && recorded <= now && now < expires &&
    expires - recorded === 900_000 ? latest : null;
}
