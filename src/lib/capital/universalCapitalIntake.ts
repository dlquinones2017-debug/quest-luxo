/**
 * Quest Luxo Capital Advisory — universal, self-reported intake review.
 *
 * No credit bureau calls, lender submissions, sensitive identifiers, document
 * uploads, or approval decisions. A separate authenticated/secure system must
 * handle regulated data collection after legal and security review.
 */
import type { CreditPathway } from "./creditReportingPlan";

export type FinancingProgram =
  | "BUSINESS_STARTUP"
  | "WORKING_CAPITAL"
  | "BUSINESS_LINE_OF_CREDIT"
  | "EQUIPMENT_FINANCING"
  | "SBA_FINANCING"
  | "INVESTMENT_PROPERTY_PURCHASE"
  | "INVESTMENT_PROPERTY_REHAB"
  | "INVESTMENT_PROPERTY_REFINANCE"
  | "OTHER_BUSINESS_PURPOSE";

export type RevenueBand =
  | "NONE"
  | "UNDER_100K"
  | "100K_TO_499K"
  | "500K_TO_999K"
  | "1M_TO_4_99M"
  | "5M_PLUS"
  | "UNKNOWN";

export interface UniversalCapitalIntake {
  /** Opaque, non-sensitive system-generated reference; not a personal identifier. */
  intakeId: string;
  pathway: CreditPathway;
  program: FinancingProgram;
  requestedAmount?: number;
  /** Zero explicitly means a startup. Not a proxy for underwriting. */
  timeInBusinessMonths?: number;
  revenueBand?: RevenueBand;
  /** Two-letter state is sufficient for initial real-estate routing. */
  propertyState?: string;
  /** Whether the applicant indicates an investment (not owner-occupied) property. */
  investmentUseConfirmed?: boolean;
}

export interface IntakeReview {
  intakeId: string;
  pathway: CreditPathway | "UNKNOWN";
  program: FinancingProgram | "UNKNOWN";
  status: "NEEDS_INFORMATION" | "READY_FOR_INTERNAL_REVIEW";
  missingFields: readonly string[];
  warnings: readonly string[];
  /** All external actions remain blocked, regardless of status. */
  creditPullPermitted: false;
  lenderSubmissionPermitted: false;
  approvalOrPrequalificationGranted: false;
}

const PATHWAYS = new Set<CreditPathway>([
  "BUSINESS_ONLY", "PERSONAL_AND_BUSINESS", "REAL_ESTATE_GUARANTOR",
]);
const PROGRAMS = new Set<FinancingProgram>([
  "BUSINESS_STARTUP", "WORKING_CAPITAL", "BUSINESS_LINE_OF_CREDIT",
  "EQUIPMENT_FINANCING", "SBA_FINANCING", "INVESTMENT_PROPERTY_PURCHASE",
  "INVESTMENT_PROPERTY_REHAB", "INVESTMENT_PROPERTY_REFINANCE",
  "OTHER_BUSINESS_PURPOSE",
]);
const REVENUE_BANDS = new Set<RevenueBand>([
  "NONE", "UNDER_100K", "100K_TO_499K", "500K_TO_999K",
  "1M_TO_4_99M", "5M_PLUS", "UNKNOWN",
]);
const PROPERTY_PROGRAMS = new Set<FinancingProgram>([
  "INVESTMENT_PROPERTY_PURCHASE", "INVESTMENT_PROPERTY_REHAB",
  "INVESTMENT_PROPERTY_REFINANCE",
]);
const STATE_CODE = /^(A[LKZR]|C[AOT]|D[EC]|F[LM]|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEHINOST]|N[CDEHJMVY]|O[HKR]|P[ARW]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])$/;

/** Pure validation/routing only; does not retain or send the applicant payload. */
export function reviewUniversalCapitalIntake(input: UniversalCapitalIntake): IntakeReview {
  const missing: string[] = [];
  const warnings: string[] = [];
  const pathway = PATHWAYS.has(input.pathway) ? input.pathway : "UNKNOWN";
  const program = PROGRAMS.has(input.program) ? input.program : "UNKNOWN";
  if (!input.intakeId || !input.intakeId.trim()) missing.push("intakeId");
  if (pathway === "UNKNOWN") missing.push("pathway");
  if (program === "UNKNOWN") missing.push("program");
  if (typeof input.requestedAmount !== "number" ||
      !Number.isFinite(input.requestedAmount) || input.requestedAmount <= 0)
    missing.push("requestedAmount");
  if (typeof input.timeInBusinessMonths !== "number" ||
      !Number.isInteger(input.timeInBusinessMonths) || input.timeInBusinessMonths < 0)
    missing.push("timeInBusinessMonths");
  if (!input.revenueBand || !REVENUE_BANDS.has(input.revenueBand))
    missing.push("revenueBand");
  if (program !== "UNKNOWN" && PROPERTY_PROGRAMS.has(program)) {
    if (!input.propertyState || !STATE_CODE.test(input.propertyState))
      missing.push("propertyState");
    if (input.investmentUseConfirmed !== true)
      missing.push("investmentUseConfirmed");
  }
  if (pathway === "REAL_ESTATE_GUARANTOR" &&
      (program === "UNKNOWN" || !PROPERTY_PROGRAMS.has(program)))
    missing.push("realEstateProgram");
  if (pathway === "BUSINESS_ONLY")
    warnings.push("Business-only routing does not authorize consumer reports or establish no-PG eligibility.");
  if (input.revenueBand === "NONE")
    warnings.push("No-revenue applicant: consider verified startup-eligible lender programs.");
  warnings.push("Self-reported intake is not verified underwriting evidence or a financing decision.");
  return Object.freeze({
    intakeId: input.intakeId,
    pathway,
    program,
    status: missing.length ? "NEEDS_INFORMATION" as const : "READY_FOR_INTERNAL_REVIEW" as const,
    missingFields: Object.freeze(missing),
    warnings: Object.freeze(warnings),
    creditPullPermitted: false as const,
    lenderSubmissionPermitted: false as const,
    approvalOrPrequalificationGranted: false as const,
  });
}
