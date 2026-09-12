import {
  validateDealerComparables,
  type ComparableValidationResult,
  type DealerComparable,
} from "../intelligence/watchIntelligenceEngine.ts";

export interface DealCalculationInput {
  wholesaleLow: number;
  wholesaleHigh: number;
  retailLow: number;
  retailHigh: number;
  targetBuyAdjustment?: number;
  targetSellAdjustment?: number;
}

export interface DealCalculationResult {
  wholesaleLow: number;
  wholesaleHigh: number;
  retailLow: number;
  retailHigh: number;
  wholesaleMidpoint: number;
  retailMidpoint: number;
  targetBuy: number;
  targetSell: number;
  expectedGrossProfit: number;
  marginPercent: number;
}

export function calculateDealCard(
  input: DealCalculationInput
): DealCalculationResult {
  const wholesaleMidpoint = Math.round(
    (input.wholesaleLow + input.wholesaleHigh) / 2
  );

  const retailMidpoint = Math.round((input.retailLow + input.retailHigh) / 2);

  const targetBuy = Math.round(
    wholesaleMidpoint + (input.targetBuyAdjustment ?? 0)
  );

  const targetSell = Math.round(
    retailMidpoint + (input.targetSellAdjustment ?? 0)
  );

  const expectedGrossProfit = targetSell - targetBuy;

  const marginPercent =
    targetSell > 0 ? Number(((expectedGrossProfit / targetSell) * 100).toFixed(2)) : 0;

  return {
    wholesaleLow: input.wholesaleLow,
    wholesaleHigh: input.wholesaleHigh,
    retailLow: input.retailLow,
    retailHigh: input.retailHigh,
    wholesaleMidpoint,
    retailMidpoint,
    targetBuy,
    targetSell,
    expectedGrossProfit,
    marginPercent,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export type LiquidityPolicy = "LIQUID" | "NON_LIQUID";
export type FounderApproval = "PENDING" | "APPROVED" | "REJECTED";
export type NegotiationRecommendation = "PURSUE" | "COUNTER" | "HOLD" | "WALK" | "ESCALATE";

export interface DealAgentEconomics {
  readonly policy: LiquidityPolicy;
  readonly liquidValueConclusion: number;
  readonly averageLowDealerComp: number;
  readonly targetAcquisition: number;
  readonly willingToSell: number;
  readonly willingToBuy: number;
}

export interface FounderApprovalGate {
  readonly status: FounderApproval;
  readonly canCommit: boolean;
  readonly canAccept: boolean;
  readonly canSendBindingOffer: boolean;
}

export interface LeverageClaim {
  readonly claim: string;
  readonly verified: boolean;
}

export interface DealDeskOutput {
  readonly economics: DealAgentEconomics | null;
  readonly recommendation: NegotiationRecommendation;
  readonly approval: FounderApprovalGate;
  readonly rejectedLeverage: readonly string[];
  readonly reason: string;
}

export interface WatchDealIntake {
  readonly reference: string;
  readonly configuration: string;
  readonly comparables: readonly DealerComparable[];
  readonly liquidityPolicy?: LiquidityPolicy;
  readonly liquidValueConclusion: number;
  readonly sellerAsk?: number | null;
  readonly proposedCounter?: number | null;
  readonly founderApproval: FounderApproval;
  readonly leverageClaims?: readonly LeverageClaim[];
}

export interface WatchDealAgentResult extends DealDeskOutput {
  readonly intake: Readonly<Pick<WatchDealIntake, "reference" | "configuration">>;
  readonly compValidation: ComparableValidationResult;
}

const positiveMoney = (value: number): boolean => Number.isFinite(value) && value > 0;
const money = (value: number): number => Math.round(value);

export function calculateDealAgentEconomics(input: {
  readonly policy?: LiquidityPolicy;
  readonly liquidValueConclusion: number;
  readonly averageLowDealerComp: number;
}): DealAgentEconomics | null {
  if (!input.policy || !positiveMoney(input.liquidValueConclusion) || !positiveMoney(input.averageLowDealerComp)) {
    return null;
  }

  const targetRate = input.policy === "LIQUID" ? 0.67 : 0.55;
  const willingToSell = money(input.averageLowDealerComp * 0.8);

  return Object.freeze({
    policy: input.policy,
    liquidValueConclusion: input.liquidValueConclusion,
    averageLowDealerComp: input.averageLowDealerComp,
    targetAcquisition: money(input.liquidValueConclusion * targetRate),
    willingToSell,
    willingToBuy: money(willingToSell * 0.8),
  });
}

export function applyFounderApproval(status: FounderApproval): FounderApprovalGate {
  const approved = status === "APPROVED";
  return Object.freeze({
    status,
    canCommit: approved,
    canAccept: approved,
    canSendBindingOffer: approved,
  });
}

export function createDealDeskOutput(input: {
  readonly economics: DealAgentEconomics | null;
  readonly founderApproval: FounderApproval;
  readonly sellerAsk?: number | null;
  readonly proposedCounter?: number | null;
  readonly leverageClaims?: readonly LeverageClaim[];
}): DealDeskOutput {
  const approval = applyFounderApproval(input.founderApproval);
  const rejectedLeverage = (input.leverageClaims ?? [])
    .filter((claim) => !claim.verified)
    .map((claim) => claim.claim);

  if (rejectedLeverage.length) {
    return Object.freeze({ economics: input.economics, recommendation: "ESCALATE", approval, rejectedLeverage: Object.freeze(rejectedLeverage), reason: "Unverified leverage must not be used." });
  }
  if (!input.economics) {
    return Object.freeze({ economics: null, recommendation: "HOLD", approval, rejectedLeverage: Object.freeze([]), reason: "Validated comps and a liquidity policy are required." });
  }

  const ask = input.sellerAsk;
  const counter = input.proposedCounter;
  let recommendation: NegotiationRecommendation = "HOLD";
  let reason = "A seller ask or proposed counter is required.";
  if (positiveMoney(ask ?? Number.NaN) && (ask as number) <= input.economics.targetAcquisition) {
    recommendation = "PURSUE";
    reason = "Seller ask is inside target acquisition economics.";
  } else if (positiveMoney(counter ?? Number.NaN) && (counter as number) <= input.economics.targetAcquisition) {
    recommendation = "COUNTER";
    reason = "Proposed counter is inside target acquisition economics.";
  } else if (positiveMoney(ask ?? Number.NaN) || positiveMoney(counter ?? Number.NaN)) {
    recommendation = "WALK";
    reason = "Available terms remain outside target acquisition economics.";
  }

  return Object.freeze({ economics: input.economics, recommendation, approval, rejectedLeverage: Object.freeze([]), reason });
}

export function runWatchDealAgent(intake: WatchDealIntake): WatchDealAgentResult {
  const compValidation = validateDealerComparables({
    reference: intake.reference,
    configuration: intake.configuration,
    comparables: intake.comparables,
  });
  const economics = compValidation.averageLowDealerComp === null
    ? null
    : calculateDealAgentEconomics({
        policy: intake.liquidityPolicy,
        liquidValueConclusion: intake.liquidValueConclusion,
        averageLowDealerComp: compValidation.averageLowDealerComp,
      });
  const desk = createDealDeskOutput({
    economics,
    founderApproval: intake.founderApproval,
    sellerAsk: intake.sellerAsk,
    proposedCounter: intake.proposedCounter,
    leverageClaims: intake.leverageClaims,
  });

  return Object.freeze({
    intake: Object.freeze({ reference: intake.reference, configuration: intake.configuration }),
    compValidation,
    ...desk,
  });
}
