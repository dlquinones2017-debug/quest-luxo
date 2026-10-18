/**
 * Quest Luxo enterprise-wide claim publication gate.
 *
 * Intended for all customer-facing Quest Luxo divisions/sites. This is a pure
 * validation component: it DOES NOT fetch webpages, reverify official facts,
 * write to CMS/Airtable, or publish content automatically.
 *
 * The content owner is responsible for independent source review, versioned
 * evidence, source-change alerts, legal review when applicable, and deployment.
 * A result of PUBLICATION_ELIGIBLE is NOT itself authorization to publish.
 */
export type ClaimDivision =
  | "LUXURY_ADVISORY" | "REALTY" | "CAPITAL_ADVISORY"
  | "BUSINESS_ACQUISITIONS" | "ENTERPRISE";
export type ClaimCategory =
  | "INSTITUTION_ELIGIBILITY" | "CREDIT_BUREAU_POLICY"
  | "PERSONAL_GUARANTEE_POLICY" | "INQUIRY_BUREAU"
  | "PRODUCT_PRICE_OR_FEES" | "PROGRAM_AVAILABILITY"
  | "LEGAL_OR_REGULATORY" | "MARKET_FACT" | "OTHER_FACT";
export type ClaimSourceKind =
  | "ISSUER_OFFICIAL" | "REGULATOR_OFFICIAL"
  | "BUREAU_OFFICIAL" | "FIRST_PARTY_PRIMARY"
  | "DIRECT_VERIFIED_CONFIRMATION";
export type ClaimEvidenceState = "VERIFIED" | "UNVERIFIED" | "CONFLICT" | "RETRACTED";

export interface VerifiedClaimCandidate {
  id: string;
  division: ClaimDivision;
  category: ClaimCategory;
  /** Exact narrowly-scoped factual claim, not a whole unreviewed article. */
  text: string;
  sourceKind: ClaimSourceKind;
  /** Publicly linkable primary source where possible; no private attachments. */
  sourceUrl: string;
  sourceEvidenceId: string;
  evidenceState: ClaimEvidenceState;
  humanReviewerId: string;
  verifiedOn: string; // UTC date YYYY-MM-DD
  reviewDueOn: string; // UTC date YYYY-MM-DD
  /** An alert or human finding of source change immediately blocks display. */
  sourceChangedAfterVerification: boolean;
  /** Publication requires separate editorial approval, never automated inference. */
  editorialApproved: boolean;
  /** Regulation and service-scope statements require counsel clearance. */
  counselApproved?: boolean;
  /** No private lender confirmation is exposed without an authorized public citation. */
  approvedForPublicDisclosure: boolean;
}

export interface ClaimPublicationReview {
  claimId: string;
  status: "PUBLICATION_ELIGIBLE" | "HOLD_FOR_REVIEW";
  reasons: readonly string[];
  /** Permanent invariant: code cannot publish content autonomously. */
  autonomousPublishAllowed: false;
}

const DIVISIONS: ReadonlySet<string> = new Set([
  "LUXURY_ADVISORY", "REALTY", "CAPITAL_ADVISORY",
  "BUSINESS_ACQUISITIONS", "ENTERPRISE",
]);
const CATEGORIES: ReadonlySet<string> = new Set([
  "INSTITUTION_ELIGIBILITY", "CREDIT_BUREAU_POLICY", "PERSONAL_GUARANTEE_POLICY",
  "INQUIRY_BUREAU", "PRODUCT_PRICE_OR_FEES", "PROGRAM_AVAILABILITY",
  "LEGAL_OR_REGULATORY", "MARKET_FACT", "OTHER_FACT",
]);
const SOURCES: ReadonlySet<string> = new Set([
  "ISSUER_OFFICIAL", "REGULATOR_OFFICIAL", "BUREAU_OFFICIAL",
  "FIRST_PARTY_PRIMARY", "DIRECT_VERIFIED_CONFIRMATION",
]);
/**
 * Upper bound between documented human source verification and required
 * re-review. A shorter date is allowed; an overdue claim is suppressed.
 * These are internal conservative engineering defaults, NOT legal deadlines.
 */
const MAX_REVIEW_DAYS: Readonly<Record<ClaimCategory, number>> = Object.freeze({
  INSTITUTION_ELIGIBILITY: 7,
  CREDIT_BUREAU_POLICY: 14,
  PERSONAL_GUARANTEE_POLICY: 7,
  INQUIRY_BUREAU: 7,
  PRODUCT_PRICE_OR_FEES: 1,
  PROGRAM_AVAILABILITY: 7,
  LEGAL_OR_REGULATORY: 14,
  MARKET_FACT: 7,
  OTHER_FACT: 30,
});

function utcDay(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const n = Date.parse(value + "T00:00:00.000Z");
  if (!Number.isFinite(n) || new Date(n).toISOString().slice(0, 10) !== value) return null;
  return n;
}

export function reviewClaimForPublication(
  claim: VerifiedClaimCandidate,
  asOfUTCDate: string,
): ClaimPublicationReview {
  const reasons: string[] = [];
  const now = utcDay(asOfUTCDate);
  const verified = utcDay(claim.verifiedOn);
  const due = utcDay(claim.reviewDueOn);
  if (now === null) reasons.push("An actual current UTC date is required; do not substitute a build-time date.");
  if (!claim.id?.trim() || !claim.text?.trim()) reasons.push("Claim ID and exact factual wording required.");
  if (!DIVISIONS.has(claim.division) || !CATEGORIES.has(claim.category))
    reasons.push("Unknown enterprise division or claim category.");
  if (!SOURCES.has(claim.sourceKind)) reasons.push("Unapproved source classification.");
  if (!/^https:\/\/[^\s/]+\.[^\s/]+(?:\/[^\s]*)?$/.test(claim.sourceUrl ?? ""))
    reasons.push("Linkable HTTPS primary source required.");
  if (!claim.sourceEvidenceId?.trim() || !claim.humanReviewerId?.trim())
    reasons.push("Evidence ID and named human reviewer required.");
  if (claim.evidenceState !== "VERIFIED") reasons.push("Evidence is not verified and unconflicted.");
  if (!claim.editorialApproved || !claim.approvedForPublicDisclosure)
    reasons.push("Editorial and authorized public disclosure approvals required.");
  if (claim.category === "LEGAL_OR_REGULATORY" && claim.counselApproved !== true)
    reasons.push("Counsel approval is required for legal or regulatory claims.");
  if (claim.sourceChangedAfterVerification)
    reasons.push("An observed source change requires fresh evidence and review.");
  if (verified === null || due === null) reasons.push("Valid verified and review-by dates required.");
  if (verified !== null && due !== null) {
    if (due < verified) reasons.push("Review due date cannot precede verification.");
    const limit = CATEGORIES.has(claim.category) ? MAX_REVIEW_DAYS[claim.category] : 0;
    if ((due - verified) / 86400000 > limit)
      reasons.push("Review interval exceeds the internal freshness maximum.");
  }
  if (now !== null && verified !== null && verified > now)
    reasons.push("Cannot verify in the future.");
  if (now !== null && due !== null && due < now)
    reasons.push("Source verification is overdue; remove or hide the claim.");
  return Object.freeze({
    claimId: claim.id,
    status: reasons.length ? "HOLD_FOR_REVIEW" as const : "PUBLICATION_ELIGIBLE" as const,
    reasons: Object.freeze(reasons),
    autonomousPublishAllowed: false as const,
  });
}

export interface PublicClaim {
  id: string;
  division: ClaimDivision;
  category: ClaimCategory;
  text: string;
  sourceUrl: string;
  lastVerifiedOn: string;
  reviewDueOn: string;
  /** Published editorial content must never imply an approval guarantee. */
  isFinancingApprovalOrCreditOffer: false;
}

/** Fail closed: missing, changed, conflicting, or expired claims are omitted. */
export function selectPublicClaims(
  candidates: readonly VerifiedClaimCandidate[],
  asOfUTCDate: string,
): readonly PublicClaim[] {
  const result: PublicClaim[] = [];
  // Duplicate IDs can mean inconsistent versions or conflicting facts. Fail
  // closed for the *entire* ID until a human reconciles source history.
  const counts = new Map<string, number>();
  for (const item of candidates) counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  for (const claim of candidates) {
    if (counts.get(claim.id) !== 1) continue;
    if (reviewClaimForPublication(claim, asOfUTCDate).status !== "PUBLICATION_ELIGIBLE") continue;
    result.push(Object.freeze({
      id: claim.id,
      division: claim.division,
      category: claim.category,
      text: claim.text,
      sourceUrl: claim.sourceUrl,
      lastVerifiedOn: claim.verifiedOn,
      reviewDueOn: claim.reviewDueOn,
      isFinancingApprovalOrCreditOffer: false as const,
    }));
  }
  return Object.freeze(result);
}
