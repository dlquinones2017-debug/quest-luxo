import type { BrokerageRecommendation } from "./brokerageEconomics";
import type { ServiceExposureClassification } from "./brokerageEconomicsRisk";

export const unavailableBrokerageValueLabel = "Not available";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const brokerageRecommendationLabels: Record<
  BrokerageRecommendation,
  string
> = {
  "strong-buy": "Strong Buy",
  buy: "Buy",
  neutral: "Neutral",
  pass: "Pass",
};

export const serviceExposureLabels: Record<
  ServiceExposureClassification,
  string
> = {
  protected: "Protected",
  exposed: "Exposed",
  fragile: "Fragile",
  unprofitable: "Unprofitable",
  incomplete: "Incomplete",
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export function normalizeBrokerageNumericInputValue(value: string): number | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) return null;

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function formatBrokerageCurrency(value: number | null): string {
  if (!isFiniteNumber(value)) return unavailableBrokerageValueLabel;

  return currencyFormatter.format(value);
}

export function formatBrokeragePercent(value: number | null): string {
  if (!isFiniteNumber(value)) return unavailableBrokerageValueLabel;

  return `${percentFormatter.format(value)}%`;
}

export function getBrokerageRecommendationLabel(
  recommendation: BrokerageRecommendation
): string {
  return brokerageRecommendationLabels[recommendation];
}

export function getServiceExposureLabel(
  classification: ServiceExposureClassification
): string {
  return serviceExposureLabels[classification];
}

export function getBrokerageValueTone(value: number | null): string {
  if (!isFiniteNumber(value)) return "unavailable";
  if (value < 0) return "negative";
  if (value > 0) return "positive";

  return "neutral";
}
