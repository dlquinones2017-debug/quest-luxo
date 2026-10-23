/**
 * Quest Luxo Business Credit DIY Blueprint — planning and education only.
 *
 * NEVER orders bureau reports, applies for credit, manufactures trade lines,
 * promises no-PG financing, or decides creditworthiness. Data are non-sensitive
 * descriptors supplied by the applicant. Advice on consumer credit/guarantees
 * requires a separately approved compliance scope.
 */
export type BusinessCreditStage =
  | "NEW_BUSINESS"
  | "EARLY_CREDIT_BUILDING"
  | "SCALING_WITH_CREDIT"
  | "ESTABLISHED_CASH_FUNDED";
export type GuaranteePreference = "WILL_CONSIDER_PG" | "PREFER_NO_PG" | "UNDECIDED";
export type CreditProductKind =
  | "SUPPLIER_TRADE_CREDIT"
  | "BUSINESS_CHARGE_CARD"
  | "BUSINESS_CREDIT_CARD"
  | "BUSINESS_LINE_OF_CREDIT"
  | "EQUIPMENT_FINANCING"
  | "WORKING_CAPITAL";
export type BureauName =
  | "DUN_BRADSTREET"
  | "EXPERIAN_BUSINESS"
  | "EQUIFAX_COMMERCIAL"
  | "EXPERIAN_CONSUMER"
  | "EQUIFAX_CONSUMER"
  | "TRANSUNION_CONSUMER";
export type EvidenceStatus = "VERIFIED" | "UNVERIFIED" | "STALE";

export interface BusinessCreditDIYProfile {
  /** Opaque session / readiness identifier; never an EIN, D-U-N-S or SSN. */
  profileId: string;
  stage: BusinessCreditStage;
  guaranteePreference: GuaranteePreference;
  businessRegistered: boolean;
  einObtained: boolean;
  businessBankAccount: boolean;
  dunsFileLocated: boolean;
  /** Indicates at least one legitimate provider confirmed business-bureau reporting. */
  hasVerifiedReportingTradeline: boolean;
  /** True means the business has reviewed documented cash-flow capacity. */
  capacityToRepayReviewed: boolean;
}

export interface BusinessCreditProductIntelligence {
  productId: string;
  issuerName: string;
  productName: string;
  kind: CreditProductKind;
  /** Unconfirmed inquiries cannot be treated as reported bureau facts. */
  consumerBureaus: readonly BureauName[];
  commercialBureaus: readonly BureauName[];
  /** "UNKNOWN" is never silently converted to "NONE". */
  guaranteeRequirement: "REQUIRED" | "MAY_BE_REQUIRED" | "NOT_REQUIRED" | "UNKNOWN";
  /** Verified criteria must cite issuer/distributor requirements, not marketing rumors. */
  eligibilitySummary: string;
  evidenceStatus: EvidenceStatus;
  /**
   * Explicit issuer/source review for consumer-bureau inquiry behavior and
   * commercial reporting, including verified absence. Empty bureau lists
   * alone are never proof that no inquiry/reporting occurs.
   */
  consumerInquiryEvidenceConfirmed?: boolean;
  commercialReportingEvidenceConfirmed?: boolean;
  evidenceUrl?: string;
  verifiedAt?: string;
  /** Per-product review expiry (ISO date). */
  reviewDueAt?: string;
}

export interface DIYBlueprintStep {
  id: string;
  title: string;
  guidance: string;
}

export interface BusinessCreditDIYBlueprint {
  profileId: string;
  stage: BusinessCreditStage;
  guaranteePreference: GuaranteePreference;
  steps: readonly DIYBlueprintStep[];
  disclaimer: string;
  creditPullPermitted: false;
  automatedApplicationPermitted: false;
  guaranteedApproval: false;
}

const STAGES = new Set<BusinessCreditStage>([
  "NEW_BUSINESS", "EARLY_CREDIT_BUILDING", "SCALING_WITH_CREDIT", "ESTABLISHED_CASH_FUNDED",
]);
const GUARANTEES = new Set<GuaranteePreference>(["WILL_CONSIDER_PG", "PREFER_NO_PG", "UNDECIDED"]);
const KINDS = new Set<CreditProductKind>([
  "SUPPLIER_TRADE_CREDIT", "BUSINESS_CHARGE_CARD", "BUSINESS_CREDIT_CARD",
  "BUSINESS_LINE_OF_CREDIT", "EQUIPMENT_FINANCING", "WORKING_CAPITAL",
]);
const BUREAUS = new Set<BureauName>([
  "DUN_BRADSTREET", "EXPERIAN_BUSINESS", "EQUIFAX_COMMERCIAL",
  "EXPERIAN_CONSUMER", "EQUIFAX_CONSUMER", "TRANSUNION_CONSUMER",
]);
const step = (id: string, title: string, guidance: string): DIYBlueprintStep =>
  Object.freeze({ id, title, guidance });

/**
 * Route four starting points without collecting scores, credentials or credit
 * reports. Each route remains informational; individual applications are
 * client-initiated with issuer disclosures and eligibility review.
 */
export function buildBusinessCreditDIYBlueprint(input: BusinessCreditDIYProfile): BusinessCreditDIYBlueprint {
  if (!input.profileId.trim() || !STAGES.has(input.stage) || !GUARANTEES.has(input.guaranteePreference))
    throw new Error("Valid non-sensitive profile ID, stage, and preference are required.");

  const steps: DIYBlueprintStep[] = [];
  if (!input.businessRegistered)
    steps.push(step("BUSINESS_IDENTITY", "Set up a legitimate business identity", "Confirm lawful formation, licensing, accurate records and appropriate separation from personal activity."));
  if (!input.einObtained)
    steps.push(step("EIN", "Obtain an EIN if appropriate", "Review the IRS rules and request your business EIN at IRS.gov; an EIN does not itself create credit or remove personal-guarantee obligations."));
  if (!input.businessBankAccount)
    steps.push(step("BANK_ACCOUNT", "Establish separate business banking", "Use a business account and accurate bookkeeping to document genuine revenue, expenses and debt payments."));
  if (!input.dunsFileLocated)
    steps.push(step("DUNS", "Check your D&B business profile", "Look up or request the free D-U-N-S identifier and correct business identification details through official D&B channels."));
  if (!input.hasVerifiedReportingTradeline)
    steps.push(step("REPORTING_TRADES", "Identify legitimate reporting trade relationships", "Consider suppliers the business truly needs. Verify actual bureau reporting, commercial terms, fees and obligation to pay before opening accounts; never purchase fabricated or rented tradelines."));

  if (input.stage === "NEW_BUSINESS")
    steps.push(step("STARTUP_ROUTE", "Build fundamentals before seeking limits", "Review startup-eligible products, realistic cash flow and whether a personal guarantee is required; avoid opening credit solely to create a score."));
  if (input.stage === "EARLY_CREDIT_BUILDING")
    steps.push(step("BUILD_ROUTE", "Strengthen authentic payment history", "Make payments on time, monitor legitimate reported trade lines and review the reporting bureaus for errors using their normal channels."));
  if (input.stage === "SCALING_WITH_CREDIT")
    steps.push(step("SCALING_ROUTE", "Evaluate exposure and capacity", "Review existing borrowing, available limits, cash-flow coverage, utilization, fees, maturities, and credit-inquiry impact before considering another product."));
  if (input.stage === "ESTABLISHED_CASH_FUNDED")
    steps.push(step("CASH_FUNDED_ROUTE", "Translate existing business strength into lender evidence", "Organize historical cash flow, tax returns, statements, contracts and payment history; consider business credit only when it supports a specific operational need."));

  steps.push(step("BUREAU_EDUCATION", "Understand commercial credit scores", "D&B PAYDEX reflects reported vendor payments; Experian Business uses commercial risk models including Intelliscore Plus; Equifax Commercial offers multiple models. Scores differ and do not guarantee approval."));
  if (input.guaranteePreference === "PREFER_NO_PG")
    steps.push(step("NO_PG", "Review no-personal-guarantee product possibilities", "Filter only verified no-PG terms; many products require established cash flow or reserves. An EIN, D-U-N-S number, or bureau score alone does not remove a personal guarantee."));
  else if (input.guaranteePreference === "WILL_CONSIDER_PG")
    steps.push(step("PG", "Understand owner guarantee exposure", "Before agreeing, review any owner credit inquiries, guarantee liability, repayment terms and the effects of default on personal finances."));
  else
    steps.push(step("PG_DECISION", "Compare PG and non-PG options", "Review lender terms, legal exposure, required records and costs; neither option is inherently appropriate for every business."));

  if (!input.capacityToRepayReviewed)
    steps.push(step("REPAYMENT_CAPACITY", "Review debt repayment capacity", "List expected cash flows, existing obligations, fees, variable rates and repayment timelines before choosing whether to apply for new credit."));
  steps.push(step("STACKING_SAFETY", "Plan responsible credit sequencing", "Avoid simultaneous speculative applications, false statements, manufactured trade histories and unsustainable debt. Product ordering must be based on verified terms, inquiry impact and affordability."));
  steps.push(step("NEXT_STEPS", "Reassess milestones and lender fit", "Use self-reported progress to revisit the optional Capital Readiness assessment. This blueprint never orders reports, files an application or represents lender preapproval."));

  return Object.freeze({
    profileId: input.profileId,
    stage: input.stage,
    guaranteePreference: input.guaranteePreference,
    steps: Object.freeze(steps),
    disclaimer: "Educational self-service only. No issuer endorsement, personalized credit-repair work, guarantee of PAYDEX or other score, or promise of financing.",
    creditPullPermitted: false as const,
    automatedApplicationPermitted: false as const,
    guaranteedApproval: false as const,
  });
}

/**
 * A product can appear in an evidence-backed educational comparison ONLY when
 * its issuer/product-specific credit inquiry, PG terms, review date, and source
 * are verified. Unknown/stale product profiles are not quietly shown as facts.
 *
 * Duplicate product IDs or conflicting issuer/product records are entirely
 * suppressed until reconciled by a reviewer, including when one duplicate is
 * expired or unverified.
 */
function validISOCalendarDay(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(value + "T00:00:00.000Z");
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value)
    return null;
  return timestamp;
}

function canonicalValue(value: unknown): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";
}

export function listVerifiedBusinessCreditProducts(
  products: readonly BusinessCreditProductIntelligence[],
  currentDateISO: string,
  kind?: CreditProductKind,
  guaranteePreference?: GuaranteePreference,
): readonly BusinessCreditProductIntelligence[] {
  const currentDay = validISOCalendarDay(currentDateISO);
  if (currentDay === null) throw new Error("Valid ISO calendar review date required.");

  const idCount = new Map<string, number>();
  const identityCount = new Map<string, number>();
  for (const product of products) {
    if (!product) continue;
    const id = canonicalValue(product.productId);
    const issuer = canonicalValue(product.issuerName);
    const name = canonicalValue(product.productName);
    if (id) idCount.set(id, (idCount.get(id) ?? 0) + 1);
    if (issuer && name && KINDS.has(product.kind)) {
      const identity = JSON.stringify([issuer, name, product.kind]);
      identityCount.set(identity, (identityCount.get(identity) ?? 0) + 1);
    }
  }

  return Object.freeze(products.filter(p => {
    if (!p) return false;
    const id = canonicalValue(p.productId);
    const issuer = canonicalValue(p.issuerName);
    const name = canonicalValue(p.productName);
    if (!id || !issuer || !name || idCount.get(id) !== 1 ||
        identityCount.get(JSON.stringify([issuer, name, p.kind])) !== 1)
      return false;

    const verifiedDay = validISOCalendarDay(p.verifiedAt);
    const reviewDueDay = validISOCalendarDay(p.reviewDueAt);
    if (verifiedDay === null || reviewDueDay === null || verifiedDay > currentDay ||
        reviewDueDay < currentDay || reviewDueDay < verifiedDay)
      return false;

    if (p.evidenceStatus !== "VERIFIED" ||
        p.consumerInquiryEvidenceConfirmed !== true ||
        p.commercialReportingEvidenceConfirmed !== true ||
        !p.eligibilitySummary?.trim() ||
        typeof p.evidenceUrl !== "string" ||
        !/^https:\/\/[^\s/]+\.[^\s/]+(?:\/[^\s]*)?$/.test(p.evidenceUrl) ||
        !KINDS.has(p.kind) ||
        !["REQUIRED", "MAY_BE_REQUIRED", "NOT_REQUIRED"].includes(p.guaranteeRequirement))
      return false;

    if (!Array.isArray(p.consumerBureaus) || !Array.isArray(p.commercialBureaus) ||
        !p.consumerBureaus.every(b => BUREAUS.has(b) && b.endsWith("_CONSUMER")) ||
        !p.commercialBureaus.every(b => BUREAUS.has(b) && !b.endsWith("_CONSUMER")))
      return false;

    return (!kind || p.kind === kind) &&
      (guaranteePreference !== "PREFER_NO_PG" || p.guaranteeRequirement === "NOT_REQUIRED");
  }));
}
