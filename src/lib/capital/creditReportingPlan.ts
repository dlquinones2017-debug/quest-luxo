/**
 * Vendor-neutral planning boundary for Quest Luxo Capital Advisory.
 *
 * This module intentionally DOES NOT connect to credit bureaus, fetch reports,
 * persist sensitive information, or authorize automated external actions.
 * Input contains only non-sensitive assessment identifiers and evidence IDs.
 */
export type CreditPathway = "BUSINESS_ONLY" | "PERSONAL_AND_BUSINESS" | "REAL_ESTATE_GUARANTOR";
export type ConsumerBureau = "EXPERIAN" | "EQUIFAX" | "TRANSUNION";
export type CommercialBureau = "EXPERIAN_BUSINESS" | "DUN_BRADSTREET" | "EQUIFAX_COMMERCIAL";
export type CreditPlanStatus = "SELF_ASSESSMENT_ONLY" | "BLOCKED" | "REQUIRES_FOUNDER";

export interface CreditReportingPlanInput {
  assessmentId: string;
  pathway: CreditPathway;
  /** Free snapshots use only user-supplied information, never a credit report. */
  freeReadinessSnapshot: boolean;
  consumerBureaus?: readonly ConsumerBureau[];
  commercialBureaus?: readonly CommercialBureau[];
  /** Evidence of a plausible product match BEFORE incurring reporting costs. */
  lenderFitEvidenceId?: string;
  /** Evidence a specific lender/product actually requires the selected report(s). */
  reportNeedEvidenceId?: string;
  /** Executed reporting-vendor contract authorizing this particular use/product. */
  providerContractEvidenceId?: string;
  /** Provider-authorized purpose (applies to commercial and consumer reporting). */
  authorizedUseEvidenceId?: string;
  /** Independent FCRA permissible-purpose determination for consumer reports. */
  consumerPermissiblePurposeEvidenceId?: string;
  /** Appropriate applicant authorization; never sufficient by itself. */
  applicantAuthorizationEvidenceId?: string;
  /** Security, disclosure, retention, and jurisdiction controls reviewed. */
  complianceClearanceEvidenceId?: string;
}

export interface CreditReportingPlan {
  assessmentId: string;
  pathway: CreditPathway;
  status: CreditPlanStatus;
  consumerBureaus: readonly ConsumerBureau[];
  commercialBureaus: readonly CommercialBureau[];
  reason: string;
  /** Always false: execution is outside this planning module. */
  apiCallsPermitted: false;
}

const consumerSet = new Set<ConsumerBureau>(["EXPERIAN", "EQUIFAX", "TRANSUNION"]);
const commercialSet = new Set<CommercialBureau>(["EXPERIAN_BUSINESS", "DUN_BRADSTREET", "EQUIFAX_COMMERCIAL"]);

function hasEvidence(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function outcome(
  input: CreditReportingPlanInput,
  status: CreditPlanStatus,
  reason: string,
  consumer: readonly ConsumerBureau[] = [],
  commercial: readonly CommercialBureau[] = [],
): CreditReportingPlan {
  return Object.freeze({
    assessmentId: input.assessmentId,
    pathway: input.pathway,
    status,
    reason,
    consumerBureaus: Object.freeze([...consumer]),
    commercialBureaus: Object.freeze([...commercial]),
    apiCallsPermitted: false as const,
  });
}

/**
 * Produce a review plan only. Even REQUIRES_FOUNDER does not authorize a pull;
 * a separate, legally reviewed execution service must enforce approvals again.
 */
export function planCreditReporting(input: CreditReportingPlanInput): CreditReportingPlan {
  if (!hasEvidence(input.assessmentId))
    return outcome(input, "BLOCKED", "A non-sensitive assessment identifier is required.");

  // Free education and financial advancement must never initiate paid reporting.
  if (input.freeReadinessSnapshot)
    return outcome(input, "SELF_ASSESSMENT_ONLY", "Free snapshot: use applicant-reported data and educational resources only.");

  const consumer = input.consumerBureaus ?? [];
  const commercial = input.commercialBureaus ?? [];
  if (input.pathway !== "BUSINESS_ONLY" && input.pathway !== "PERSONAL_AND_BUSINESS" && input.pathway !== "REAL_ESTATE_GUARANTOR")
    return outcome(input, "BLOCKED", "Unknown financing pathway.");
  if (input.pathway === "BUSINESS_ONLY" && consumer.length > 0)
    return outcome(input, "BLOCKED", "Business-credit-only pathway cannot request personal reports.");
  if (consumer.length + commercial.length === 0)
    return outcome(input, "BLOCKED", "No credit report type selected; use the free self-assessment pathway.");
  if (consumer.some(b => !consumerSet.has(b)) || commercial.some(b => !commercialSet.has(b)))
    return outcome(input, "BLOCKED", "Unknown bureau requested.");
  if (new Set(consumer).size !== consumer.length || new Set(commercial).size !== commercial.length)
    return outcome(input, "BLOCKED", "Duplicate bureau selection must be corrected before costing.");
  if (!hasEvidence(input.lenderFitEvidenceId) || !hasEvidence(input.reportNeedEvidenceId))
    return outcome(input, "BLOCKED", "Document lender fit and report necessity before ordering paid reports.");
  if (!hasEvidence(input.providerContractEvidenceId) || !hasEvidence(input.authorizedUseEvidenceId))
    return outcome(input, "BLOCKED", "Reporting provider contract and authorized use are not verified.");
  if (consumer.length > 0 && !hasEvidence(input.consumerPermissiblePurposeEvidenceId))
    return outcome(input, "BLOCKED", "An independently verified FCRA permissible purpose is required for consumer reporting.");
  if (!hasEvidence(input.applicantAuthorizationEvidenceId) || !hasEvidence(input.complianceClearanceEvidenceId))
    return outcome(input, "BLOCKED", "Applicant authorization and reviewed compliance/security controls are required.");

  return outcome(input, "REQUIRES_FOUNDER",
    "Evidence is documented for human review only. No report may be pulled by this module.",
    consumer, commercial);
}
