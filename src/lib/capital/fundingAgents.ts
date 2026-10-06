export type VerificationState = "VERIFIED" | "UNKNOWN" | "REQUIRES_VERIFICATION";
export type FundingStage = "INTAKE" | "FUNDABILITY" | "SOURCE_FIT" | "DOCUMENTATION" | "COMPLIANCE" | "FOUNDER_APPROVAL" | "OFFER_REVIEW" | "OUTCOME" | "FOLLOW_UP" | "BLOCKED";

export interface BorrowerIntake {
  borrowerId: string; businessId: string; purpose: string; requestedAmount: number;
  timeInBusinessMonths?: number; annualRevenue?: number; personalCreditBand?: string;
  revenueEvidence: VerificationState; identityEvidence: VerificationState;
}
export interface CapitalSource {
  sourceId: string; product: string; minAmount: number; maxAmount: number;
  startupEligible: boolean; revenueRequired: boolean; taxReturnsRequired: boolean;
  pullType: "SOFT" | "HARD" | "UNKNOWN"; requirementsVerified: VerificationState;
}
export interface FundingEvent {
  borrowerId: string; stage: FundingStage;
  status: "READY" | "BLOCKED" | "REQUIRES_FOUNDER";
  reason: string; evidenceIds: readonly string[];
}
export interface ComplianceGate {
  jurisdictionVerified: VerificationState;
  productComplianceVerified: VerificationState;
  disclosuresReady: VerificationState;
  hardPullConsentEvidenceId?: string;
}
export interface FundingOffer {
  sourceId: string; amount: number; apr?: number; termMonths?: number;
  fees?: number; evidenceId?: string; status: VerificationState;
}

export function qualifyBorrower(i: BorrowerIntake): FundingEvent {
  if (!i.borrowerId || !i.businessId || !i.purpose || i.requestedAmount <= 0 || i.identityEvidence !== "VERIFIED")
    return event(i.borrowerId,"INTAKE","BLOCKED","Borrower identity, business, purpose, and positive requested amount are required.");
  return event(i.borrowerId,"FUNDABILITY","READY","Intake complete; evaluate fundability without assuming revenue history.");
}
export function rankSources(i: BorrowerIntake, sources: readonly CapitalSource[]): readonly CapitalSource[] {
  return Object.freeze(sources.filter(s =>
    s.requirementsVerified === "VERIFIED" &&
    i.requestedAmount >= s.minAmount && i.requestedAmount <= s.maxAmount &&
    (!s.revenueRequired || i.revenueEvidence === "VERIFIED") &&
    ((i.timeInBusinessMonths ?? 0) > 0 || s.startupEligible)
  ).sort((a,b) => pullRank(a.pullType)-pullRank(b.pullType)));
}
export function documentationReadiness(i: BorrowerIntake): FundingEvent {
  if (i.identityEvidence !== "VERIFIED") return event(i.borrowerId,"DOCUMENTATION","BLOCKED","Identity evidence is not verified.");
  if (i.revenueEvidence !== "VERIFIED") return event(i.borrowerId,"DOCUMENTATION","READY","Startup/no-revenue path only; do not represent revenue as verified.");
  return event(i.borrowerId,"DOCUMENTATION","READY","Core intake evidence is verified.");
}
export function complianceDecision(borrowerId:string, source:CapitalSource, gate:ComplianceGate): FundingEvent {
  if (gate.jurisdictionVerified !== "VERIFIED" || gate.productComplianceVerified !== "VERIFIED" || gate.disclosuresReady !== "VERIFIED")
    return event(borrowerId,"COMPLIANCE","BLOCKED","Compliance or disclosure status requires verification.");
  if (source.pullType === "HARD" && !gate.hardPullConsentEvidenceId)
    return event(borrowerId,"COMPLIANCE","BLOCKED","Explicit evidence-backed hard-pull consent is required.");
  return event(borrowerId,"FOUNDER_APPROVAL","REQUIRES_FOUNDER","Compliance gate passed; founder approval is required before any external application or submission.", gate.hardPullConsentEvidenceId ? [gate.hardPullConsentEvidenceId] : []);
}
export function compareOffers(offers: readonly FundingOffer[]): readonly FundingOffer[] {
  return Object.freeze(offers.filter(o=>o.status==="VERIFIED" && o.amount>0 && Boolean(o.evidenceId)).sort((a,b)=>(a.apr ?? Number.MAX_SAFE_INTEGER)-(b.apr ?? Number.MAX_SAFE_INTEGER)));
}
export function recordOutcome(borrowerId:string, outcome:"FUNDED"|"DECLINED"|"WITHDRAWN", evidenceId?:string): FundingEvent {
  if (!evidenceId) return event(borrowerId,"OUTCOME","BLOCKED","Outcome cannot be attributed without evidence.");
  return event(borrowerId,"FOLLOW_UP","READY",`Verified funding outcome: ${outcome}.`,[evidenceId]);
}
export function prohibitExternalAction(borrowerId:string, action:"APPLICATION"|"LENDER_SUBMISSION"|"CREDIT_PULL"|"ACCEPT_TERMS"|"MONEY_MOVEMENT"): FundingEvent {
  return event(borrowerId,"FOUNDER_APPROVAL","REQUIRES_FOUNDER",`${action} requires explicit human execution/approval; agent autonomy is prohibited.`);
}
function pullRank(v:CapitalSource["pullType"]){ return v==="SOFT"?0:v==="UNKNOWN"?1:2; }
function event(borrowerId:string,stage:FundingStage,status:FundingEvent["status"],reason:string,evidenceIds:readonly string[]=[]):FundingEvent {
 return Object.freeze({borrowerId,stage,status,reason,evidenceIds:Object.freeze([...evidenceIds])});
}