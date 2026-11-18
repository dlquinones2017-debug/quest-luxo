import {
  runWatchDealAgent,
  type WatchDealIntake,
} from "../broker/dealCalculator.ts";

export type SniperEvidenceState = "VERIFIED" | "UNKNOWN" | "REQUIRES_VERIFICATION" | "CONFLICT";
export type SniperRecommendation = "VERIFY" | "WALK_AWAY" | "NEGOTIATION_DRAFT" | "WITHIN_POLICY";

export interface WatchSniperOpportunity {
  readonly opportunityId: string;
  readonly intake: WatchDealIntake;
  readonly provenanceEvidenceState: SniperEvidenceState;
  readonly resalePriceEvidenceState: SniperEvidenceState;
  readonly capitalEvidenceState: SniperEvidenceState;
  readonly evidenceIds: readonly string[];
  readonly conservativeResalePrice: number | null;
  readonly directCosts: number | null; // acquisition-side and selling fees, freight, taxes, etc.
  readonly serviceAndRiskReserve: number | null;
  readonly minimumProfit: number | null;
  readonly availableAcquisitionCapital: number | null;
  readonly openingBidRatio: number | null; // explicit founder-configured fraction
  readonly currentOffer?: number | null;
  readonly sellerFinal?: boolean;
  readonly verifiedRiskBlocker?: boolean;
  readonly proposedLeverage?: readonly { readonly claim: string; readonly verified: boolean }[];
}
export interface WatchSniperDecision {
  readonly opportunityId: string;
  readonly recommendation: SniperRecommendation;
  readonly conservativeResalePrice: number | null;
  readonly targetAcquisition: number | null;
  readonly openingBid: number | null;
  readonly hardWalkAwayMaximum: number | null;
  readonly estimatedMinimumProfitAtCeiling: number | null;
  readonly evidenceIds: readonly string[];
  readonly rejectedLeverage: readonly string[];
  readonly rationale: string;
  readonly negotiationGuidance: readonly string[];
  readonly founderApprovalRequired: true;
  readonly canSendMessage: false;
  readonly canMakeBindingOffer: false;
  readonly canMoveFunds: false;
}
const idPattern = /^[A-Za-z0-9._:-]{1,160}$/;
const roundCent = (v: number) => Math.floor(v * 100) / 100;
const finitePositive = (n: number | null | undefined) => typeof n === "number" && Number.isFinite(n) && n > 0;
const finiteNonnegative = (n: number | null | undefined) => typeof n === "number" && Number.isFinite(n) && n >= 0;
const SAFE_GUIDANCE = Object.freeze([
  "Review the exact reference, seller identity and verified comparable evidence before any outreach.",
  "Draft a truthful opening with a neutral label or calibrated question; listen for seller needs.",
  "Use mirroring and calibrated questions respectfully, without impersonation or false leverage.",
  "Document every counteroffer against the hard ceiling; do not exceed it.",
  "A qualified human must approve communication, proposed terms, payment and closing.",
]);
function decision(
  opp: WatchSniperOpportunity, recommendation: SniperRecommendation, rationale: string,
  amounts: { target?: number | null; open?: number | null; ceiling?: number | null; profit?: number | null } = {},
  rejectedLeverage: readonly string[] = [],
): WatchSniperDecision {
  return Object.freeze({
    opportunityId: opp.opportunityId,
    recommendation,
    conservativeResalePrice: recommendation === "VERIFY" ? null : opp.conservativeResalePrice,
    targetAcquisition: amounts.target ?? null,
    openingBid: amounts.open ?? null,
    hardWalkAwayMaximum: amounts.ceiling ?? null,
    estimatedMinimumProfitAtCeiling: amounts.profit ?? null,
    evidenceIds: Object.freeze([...new Set(opp.evidenceIds)].sort()),
    rejectedLeverage: Object.freeze([...rejectedLeverage]),
    rationale,
    negotiationGuidance: SAFE_GUIDANCE,
    founderApprovalRequired: true,
    canSendMessage: false, canMakeBindingOffer: false, canMoveFunds: false,
  });
}

/**
 * A founder-review numerical boundary, not a live marketplace scanner,
 * negotiation bot, or credentialed source. Verification must come from trusted
 * source adapters. Reuses the existing Watch Deal Agent comparables/liquidity
 * rules; adds conservative cost/reserve/profit/capital hard stops.
 */
export function evaluateWatchSniperOpportunity(opp: WatchSniperOpportunity): WatchSniperDecision {
  if (!idPattern.test(opp.opportunityId) ||
      !opp.evidenceIds.every(v => idPattern.test(v)))
    throw new Error("Sniper opportunity and evidence IDs must be opaque safe IDs.");
  if (opp.provenanceEvidenceState !== "VERIFIED" ||
      opp.resalePriceEvidenceState !== "VERIFIED" ||
      opp.capitalEvidenceState !== "VERIFIED" ||
      !opp.evidenceIds.length || !finitePositive(opp.conservativeResalePrice) ||
      !finiteNonnegative(opp.directCosts) ||
      !finiteNonnegative(opp.serviceAndRiskReserve) ||
      !finitePositive(opp.minimumProfit) ||
      !finitePositive(opp.availableAcquisitionCapital) ||
      !finitePositive(opp.openingBidRatio) || opp.openingBidRatio! > 1)
    return decision(opp, "VERIFY", "Financial inputs, source evidence, approved bid ratio, provenance and capital must be verified before negotiating.");
  if (opp.currentOffer !== undefined && opp.currentOffer !== null &&
      !finitePositive(opp.currentOffer))
    return decision(opp, "VERIFY", "Current offer must be a verified positive amount.");

  const deal = runWatchDealAgent({ ...opp.intake, founderApproval: "PENDING" });
  const rejectedLeverage = [
    ...(opp.proposedLeverage ?? []).filter(x=>!x.verified).map(x=>x.claim),
    ...deal.rejectedLeverage,
  ];
  if (rejectedLeverage.length)
    return decision(opp,"VERIFY","Unverified leverage is prohibited from negotiation.",{},rejectedLeverage);
  // Dealer comparable boolean alone is insufficient proof of recent completed sales.
  // Sale-price evidence is separately required and must come from a trusted source.
  if (!deal.economics || deal.compValidation.accepted.length < 2)
    return decision(opp,"VERIFY","A validated liquidity policy and at least two exact-reference dealer comps are required.");
  const capByResale = roundCent(
    opp.conservativeResalePrice! - opp.directCosts! -
    opp.serviceAndRiskReserve! - opp.minimumProfit!,
  );
  const capByLiquidity = deal.economics.targetAcquisition;
  const capByCapital = opp.availableAcquisitionCapital!;
  const ceiling = roundCent(Math.min(capByResale,capByLiquidity,capByCapital));
  if (opp.verifiedRiskBlocker || ceiling <= 0) {
    return decision(opp,"WALK_AWAY","Risk exposure or verified economics fail the acquisition threshold.",
      {target: deal.economics.targetAcquisition,ceiling:Math.max(0,ceiling)},rejectedLeverage);
  }
  const opening = roundCent(Math.min(ceiling, ceiling * opp.openingBidRatio!));
  const profit = roundCent(opp.conservativeResalePrice! - ceiling -
    opp.directCosts! - opp.serviceAndRiskReserve!);
  const params = {
    target: deal.economics.targetAcquisition, open: opening, ceiling, profit,
  };
  if (opp.currentOffer !== undefined && opp.currentOffer !== null) {
    if (opp.currentOffer > ceiling && opp.sellerFinal === true)
      return decision(opp,"WALK_AWAY","Seller's final price exceeds the documented hard acquisition maximum.",params);
    if (opp.currentOffer > ceiling)
      return decision(opp,"NEGOTIATION_DRAFT","Current price exceeds the hard ceiling; any counteroffer must be below the ceiling and founder-approved.",params);
    return decision(opp,"WITHIN_POLICY","Current offer is inside verified guardrails; founder reviews all external actions.",params);
  }
  return decision(opp,"NEGOTIATION_DRAFT","Prepare a truthful, non-binding opening for founder approval; no external message has been sent.",params);
}
