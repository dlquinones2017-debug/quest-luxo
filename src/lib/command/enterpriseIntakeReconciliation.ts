import type { CapitalPipelineRecord } from "../capital/capitalPipelineStore.ts";
import type { RealtyPipelineRecord } from "../realty/realtyPipelineStore.ts";
import type { EnterpriseLeadFinding, LeadDivision } from "./enterpriseLeadIntelligence.ts";

/**
 * Metadata-only comparison between securely retained intake receipts and the
 * current Capital/Realty *in-memory* pipeline snapshots. Does not read customer
 * messages, modify commercial records, or equate an in-memory match with durable
 * CRM reconciliation. Output contains opaque receipt IDs only.
 */
export type IntakeReconciliationState =
  | "SOURCE_REVIEW_REQUIRED"
  | "CANONICAL_LINK_MISSING"
  | "CANONICAL_RECORD_MISSING"
  | "CANONICAL_EVIDENCE_MISSING"
  | "MATCHED_VOLATILE_ONLY";

export interface IntakeReconciliationFinding {
  readonly division: Exclude<LeadDivision, "WATCH_BROKERAGE">;
  readonly sourceRecordId: string;
  readonly state: IntakeReconciliationState;
  readonly requiredHumanAction: string;
  readonly founderApprovalRequired: true;
}

export interface IntakeReconciliationSummary {
  readonly division: Exclude<LeadDivision, "WATCH_BROKERAGE">;
  readonly retainedReceipts: number;
  readonly sourceReviewRequired: number;
  readonly missingCanonicalLinks: number;
  readonly missingCanonicalRecords: number;
  readonly missingEvidence: number;
  readonly matchedInMemoryOnly: number;
  readonly durableReconciliationVerified: false;
}

export interface IntakeReconciliationReport {
  readonly findings: readonly IntakeReconciliationFinding[];
  readonly divisions: readonly IntakeReconciliationSummary[];
  readonly externalActionsTaken: false;
}

type CommercialEntry = { readonly id: string; readonly evidenceIds: readonly string[] };
const divisions = ["CAPITAL_ADVISORY", "REALTY"] as const;
const actions: Record<IntakeReconciliationState, string> = {
  SOURCE_REVIEW_REQUIRED:
    "Review source identity and conflicting evidence before any CRM assignment.",
  CANONICAL_LINK_MISSING:
    "Link the retained receipt to an approved canonical case after verifying client consent and identity.",
  CANONICAL_RECORD_MISSING:
    "Investigate missing commercial pipeline record; preserve the receipt and verify restoration before advancing.",
  CANONICAL_EVIDENCE_MISSING:
    "Reconcile case evidence with the original receipt before treating the in-memory record as matched.",
  MATCHED_VOLATILE_ONLY:
    "Confirm evidence-linked pipeline record is durably persisted; an in-memory match is not recovery proof.",
};

function commercialEntries(
  division: typeof divisions[number],
  capital: readonly CapitalPipelineRecord[],
  realty: readonly RealtyPipelineRecord[],
): readonly CommercialEntry[] {
  return division === "CAPITAL_ADVISORY"
    ? capital.map(record => ({ id: record.borrowerId, evidenceIds: record.evidenceIds }))
    : realty.map(record => ({ id: record.leadId, evidenceIds: record.evidenceIds }));
}

export function enterpriseIntakeReconciliation(
  findings: readonly EnterpriseLeadFinding[],
  capital: readonly CapitalPipelineRecord[] = [],
  realty: readonly RealtyPipelineRecord[] = [],
): IntakeReconciliationReport {
  const items: IntakeReconciliationFinding[] = [];
  const summaries: IntakeReconciliationSummary[] = [];
  for (const division of divisions) {
    const existing = commercialEntries(division, capital, realty);
    const receipts = findings.filter(f => f.division === division && f.provider === "FORMSUBMIT");
    const counts: Record<IntakeReconciliationState, number> = {
      SOURCE_REVIEW_REQUIRED: 0,
      CANONICAL_LINK_MISSING: 0,
      CANONICAL_RECORD_MISSING: 0,
      CANONICAL_EVIDENCE_MISSING: 0,
      MATCHED_VOLATILE_ONLY: 0,
    };
    for (const receipt of receipts) {
      let state: IntakeReconciliationState;
      if (!receipt.timestampVerified || receipt.state === "EVIDENCE_CONFLICT" ||
          receipt.state === "VERIFY_SOURCE" || receipt.receiptVerification !== "VERIFIED") {
        state = "SOURCE_REVIEW_REQUIRED";
      } else if (!receipt.canonicalRecordId) {
        state = "CANONICAL_LINK_MISSING";
      } else {
        const records = existing.filter(record => record.id === receipt.canonicalRecordId);
        if (records.length === 0) {
          state = "CANONICAL_RECORD_MISSING";
        } else {
          const linkedEvidence = new Set([...receipt.evidenceIds, receipt.sourceRecordId]);
          state = records.some(record => Array.isArray(record.evidenceIds) &&
            record.evidenceIds.some(e => linkedEvidence.has(e)))
            ? "MATCHED_VOLATILE_ONLY" : "CANONICAL_EVIDENCE_MISSING";
        }
      }
      counts[state]++;
      items.push(Object.freeze({
        division, sourceRecordId: receipt.sourceRecordId, state,
        requiredHumanAction: actions[state], founderApprovalRequired: true as const,
      }));
    }
    summaries.push(Object.freeze({
      division, retainedReceipts: receipts.length,
      sourceReviewRequired: counts.SOURCE_REVIEW_REQUIRED,
      missingCanonicalLinks: counts.CANONICAL_LINK_MISSING,
      missingCanonicalRecords: counts.CANONICAL_RECORD_MISSING,
      missingEvidence: counts.CANONICAL_EVIDENCE_MISSING,
      matchedInMemoryOnly: counts.MATCHED_VOLATILE_ONLY,
      durableReconciliationVerified: false as const,
    }));
  }
  return Object.freeze({
    findings: Object.freeze(items.sort((a, b) =>
      a.division.localeCompare(b.division) || a.sourceRecordId.localeCompare(b.sourceRecordId))),
    divisions: Object.freeze(summaries),
    externalActionsTaken: false as const,
  });
}
