export type BrokerageRecommendation =
  | "strong-buy"
  | "buy"
  | "neutral"
  | "pass";

export interface BrokerageEconomicsInput {
  reference: string;
  purchasePrice: number | null;
  estimatedMarketValue: number | null;
  estimatedServiceCost: number | null;
  estimatedPolishCost: number | null;
  estimatedShippingCost: number | null;
  estimatedInsuranceCost: number | null;
  estimatedSellingFees: number | null;
}

export interface BrokerageEconomics {
  reference: string;
  grossProfit: number | null;
  expectedExpenses: number;
  netProfit: number | null;
  roiPercent: number | null;
  capitalRequired: number | null;
  riskPenalty: number;
  riskAdjustedProfit: number | null;
  recommendation: BrokerageRecommendation;
}

const normalizeText = (value: string): string => value.trim();

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const roundPercent = (value: number): number => Math.round(value * 100) / 100;

const normalizeNullableAmount = (value: number | null): number | null => {
  if (!isFiniteNumber(value)) return null;
  if (value < 0) return null;

  return value;
};

const normalizeExpense = (value: number | null): number => {
  if (!isFiniteNumber(value)) return 0;

  return Math.max(0, value);
};

const getRecommendation = (
  riskAdjustedProfit: number | null,
  hasRequiredPricing: boolean
): BrokerageRecommendation => {
  if (!hasRequiredPricing || riskAdjustedProfit === null) return "pass";
  if (riskAdjustedProfit >= 3000) return "strong-buy";
  if (riskAdjustedProfit >= 1500) return "buy";
  if (riskAdjustedProfit >= 500) return "neutral";

  return "pass";
};

/**
 * Calculates a simple Version 1 expense-based risk penalty.
 *
 * Formula: normalized expected expenses multiplied by 25%, rounded to cents.
 * Null, negative, NaN, and infinite expense values are safely normalized before
 * this function is called, and this helper also guards its own input. The result
 * increases linearly as expected expenses rise.
 */
export function calculateRiskPenalty(expectedExpenses: number): number {
  const normalizedExpectedExpenses = normalizeExpense(expectedExpenses);

  return roundMoney(normalizedExpectedExpenses * 0.25);
}

/**
 * Builds deterministic brokerage economics for a single watch opportunity.
 *
 * The function treats null expenses as zero, treats negative purchase or market
 * values as unavailable, returns null for calculations that require missing
 * purchase or market values, avoids division by zero, and never returns NaN or
 * Infinity.
 */
export function buildBrokerageEconomics(
  input: BrokerageEconomicsInput
): BrokerageEconomics {
  const reference = normalizeText(input.reference);
  const purchasePrice = normalizeNullableAmount(input.purchasePrice);
  const estimatedMarketValue = normalizeNullableAmount(input.estimatedMarketValue);
  const expectedExpenses = roundMoney(
    normalizeExpense(input.estimatedServiceCost) +
      normalizeExpense(input.estimatedPolishCost) +
      normalizeExpense(input.estimatedShippingCost) +
      normalizeExpense(input.estimatedInsuranceCost) +
      normalizeExpense(input.estimatedSellingFees)
  );
  const hasRequiredPricing = purchasePrice !== null && estimatedMarketValue !== null;
  const grossProfit = hasRequiredPricing
    ? roundMoney(estimatedMarketValue - purchasePrice)
    : null;
  const netProfit =
    grossProfit !== null ? roundMoney(grossProfit - expectedExpenses) : null;
  const capitalRequired =
    purchasePrice !== null ? roundMoney(Math.max(0, purchasePrice + expectedExpenses)) : null;
  const roiPercent =
    netProfit !== null && capitalRequired !== null && capitalRequired > 0
      ? roundPercent((netProfit / capitalRequired) * 100)
      : null;
  const riskPenalty = calculateRiskPenalty(expectedExpenses);
  const riskAdjustedProfit =
    netProfit !== null ? roundMoney(netProfit - riskPenalty) : null;

  return {
    reference,
    grossProfit,
    expectedExpenses,
    netProfit,
    roiPercent,
    capitalRequired,
    riskPenalty,
    riskAdjustedProfit,
    recommendation: getRecommendation(riskAdjustedProfit, hasRequiredPricing),
  };
}
