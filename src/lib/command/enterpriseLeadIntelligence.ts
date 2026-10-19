import { enterpriseRevenueFounderQueue } from "./enterpriseRevenueQueue.ts";
import type { RevenueRecord } from "./revenueActivation.ts";

export type LeadDivision = "WATCH_BROKERAGE" | "CAPITAL_ADVISORY" | "REALTY";
export type LeadProvider = "BEGIN_YOUR_QUEST" | "FORMSUBMIT";
export type LeadVerification = "VERIFIED" | "UNKNOWN" | "REQUIRES_VERIFICATION";
export type LeadNotification = "ACCEPTED_BY_PROVIDER" | "FAILED" | "UNKNOWN";
export type LeadReviewState =
  | "VERIFY_SOURCE"
  | "QUALIFICATION_NEEDED"
  | "READY_FOR_FOUNDER"
  | "NOTIFICATION_FAILURE"
  | "EVIDENCE_CONFLICT";

// Metadata from an authenticated source adapter, not a public form body.
// Neither names, email addresses, credit data nor customer messages belong here.
export interface EnterpriseLeadReceipt {
  readonly division: LeadDivision;
  readonly provider: LeadProvider;
  readonly sourceRecordId: string;
  readonly receivedAt?: string | null;
  readonly evidenceIds?: readonly string[];
  readonly receiptVerification: LeadVerification;
  readonly qualificationVerification?: LeadVerification;
  readonly qualificationEvidenceIds?: readonly string[];
  readonly notification?: LeadNotification;
}

export interface EnterpriseLeadFinding {
  readonly key: string;
  readonly division: LeadDivision;
  readonly provider: LeadProvider;
  readonly sourceRecordId: string;
  readonly receivedAt: string | null;
  readonly timestampVerified: boolean;
  readonly receiptVerification: LeadVerification;
  readonly qualificationVerification: LeadVerification;
  readonly notification: LeadNotification;
  readonly evidenceIds: readonly string[];
  readonly qualificationEvidenceIds: readonly string[];
  readonly state: LeadReviewState;
  readonly founderApprovalRequired: true;
  readonly recommendedInternalAction: string;
}

const acceptedProviders: Readonly<Record<LeadDivision, LeadProvider>> = Object.freeze({
  WATCH_BROKERAGE: "BEGIN_YOUR_QUEST",
  CAPITAL_ADVISORY: "FORMSUBMIT",
  REALTY: "FORMSUBMIT",
});
const safeId = /^[A-Za-z0-9._:-]{1,160}$/;
const isoTime = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/;

const evidence = (values: readonly string[] | undefined): readonly string[] =>
  Object.freeze([...new Set((values ?? []).filter((v) => typeof v === "string" && safeId.test(v)))].sort());

function receiptTime(value: string | null | undefined, now: Date): string | null {
  if (typeof value !== "string" || !isoTime.test(value)) return null;
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds) || milliseconds > now.getTime()) return null;
  return new Date(milliseconds).toISOString();
}

function makeFinding(receipt: EnterpriseLeadReceipt, now: Date): EnterpriseLeadFinding {
  if (acceptedProviders[receipt.division] !== receipt.provider) {
    throw new Error("Lead provider must match its authoritative division.");
  }
  if (!safeId.test(receipt.sourceRecordId)) {
    throw new Error("Lead sourceRecordId must be a stable opaque identifier without PII.");
  }
  const ids = evidence(receipt.evidenceIds);
  const qualificationIds = evidence(receipt.qualificationEvidenceIds);
  const receivedAt = receiptTime(receipt.receivedAt, now);
  const timestampVerified = receivedAt !== null;
  const receiptVerified = receipt.receiptVerification === "VERIFIED" && ids.length > 0 && timestampVerified;
  const qualificationVerification = receipt.qualificationVerification ?? "UNKNOWN";
  const qualified = qualificationVerification === "VERIFIED" && qualificationIds.length > 0;
  const notification = receipt.notification ?? "UNKNOWN";
  const state: LeadReviewState = !receiptVerified
    ? "VERIFY_SOURCE"
    : notification === "FAILED"
      ? "NOTIFICATION_FAILURE"
      : qualified
        ? "READY_FOR_FOUNDER"
        : "QUALIFICATION_NEEDED";
  const recommendedInternalAction = state === "VERIFY_SOURCE"
    ? "Verify receipt provenance and timestamp before qualifying or acting."
    : state === "NOTIFICATION_FAILURE"
      ? "Investigate notification delivery while preserving the original source receipt."
      : state === "READY_FOR_FOUNDER"
        ? "Founder reviews the qualified inquiry before any external action."
        : "Review qualification evidence and consent internally; do not contact automatically.";
  return Object.freeze({
    key: receipt.division + ":" + receipt.provider + ":" + receipt.sourceRecordId,
    division: receipt.division,
    provider: receipt.provider,
    sourceRecordId: receipt.sourceRecordId,
    receivedAt,
    timestampVerified,
    receiptVerification: receipt.receiptVerification,
    qualificationVerification,
    notification,
    evidenceIds: ids,
    qualificationEvidenceIds: qualificationIds,
    state,
    founderApprovalRequired: true,
    recommendedInternalAction,
  });
}

function conflict(a: EnterpriseLeadFinding, b: EnterpriseLeadFinding): EnterpriseLeadFinding {
  return Object.freeze({
    ...a,
    receivedAt: null,
    timestampVerified: false,
    receiptVerification: "REQUIRES_VERIFICATION" as const,
    qualificationVerification: "REQUIRES_VERIFICATION" as const,
    notification: "UNKNOWN" as const,
    evidenceIds: evidence([...a.evidenceIds, ...b.evidenceIds]),
    qualificationEvidenceIds: evidence([...a.qualificationEvidenceIds, ...b.qualificationEvidenceIds]),
    state: "EVIDENCE_CONFLICT" as const,
    recommendedInternalAction: "Reconcile conflicting evidence for this source record before routing.",
  });
}

export function enterpriseLeadIntelligence(
  receipts: readonly EnterpriseLeadReceipt[],
  now: Date = new Date(),
): readonly EnterpriseLeadFinding[] {
  if (!Number.isFinite(now.getTime())) throw new Error("A valid observation time is required.");
  const found = new Map<string, EnterpriseLeadFinding>();
  for (const receipt of receipts) {
    const item = makeFinding(receipt, now);
    const prior = found.get(item.key);
    if (!prior) {
      found.set(item.key, item);
    } else if (prior.state === "EVIDENCE_CONFLICT") {
      found.set(item.key, conflict(prior, item));
    } else if (JSON.stringify(prior) !== JSON.stringify(item)) {
      found.set(item.key, conflict(prior, item));
    }
  }
  return Object.freeze([...found.values()].sort((a, b) => a.key.localeCompare(b.key)));
}

// Reuses the existing Founder Revenue Queue rather than introducing another CRM.
// Invalid/unknown receipt timestamps are held for verification, not silently dated.
export function enterpriseLeadRevenueRecords(
  findings: readonly EnterpriseLeadFinding[],
): readonly RevenueRecord[] {
  return Object.freeze(findings.flatMap((item): RevenueRecord[] => {
    if (!item.timestampVerified || item.receivedAt === null || item.state === "EVIDENCE_CONFLICT") return [];
    const verified = item.state === "READY_FOR_FOUNDER" || item.state === "NOTIFICATION_FAILURE";
    const status = item.state === "READY_FOR_FOUNDER"
      ? "REQUIRES_FOUNDER" as const
      : item.state === "NOTIFICATION_FAILURE"
        ? "BLOCKED" as const
        : "UNKNOWN" as const;
    return [Object.freeze({
      division: item.division,
      recordId: item.provider + ":" + item.sourceRecordId,
      stage: "LEAD_INTAKE",
      status,
      reason: item.recommendedInternalAction,
      sourceSystem: item.provider,
      updatedAt: item.receivedAt,
      evidenceIds: item.evidenceIds,
      evidenceState: verified ? "VERIFIED" as const : "REQUIRES_VERIFICATION" as const,
      requiredHumanAction: item.recommendedInternalAction,
    })];
  }));
}

export function enterpriseLeadFounderQueue(
  findings: readonly EnterpriseLeadFinding[],
  now: Date = new Date(),
) {
  const records = enterpriseLeadRevenueRecords(findings);
  return enterpriseRevenueFounderQueue({
    brokerage: records.filter((r) => r.division === "WATCH_BROKERAGE"),
    capital: records.filter((r) => r.division === "CAPITAL_ADVISORY"),
    realty: records.filter((r) => r.division === "REALTY"),
  }, now);
}
