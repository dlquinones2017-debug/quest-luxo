import { randomUUID } from "node:crypto";
import {
  buildBrokerageEconomics,
  type BrokerageEconomicsInput,
  type BrokerageRecommendation,
} from "./brokerageEconomics.ts";
import {
  buildBrokerageEconomicsRiskAnalysis,
  isServiceExposureClassification,
  type BrokerageEconomicsRiskAnalysis,
  type BrokerageModelIdentificationInput,
  type BrokerageThinMarginModelMatch,
} from "./brokerageEconomicsRisk.ts";
import { brokerageThinMarginModels } from "../config/brokerageEconomicsRiskConfig.ts";

export const brokerageEconomicsSnapshotNoteMaxLength = 1000;

export class BrokerageEconomicsSnapshotValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrokerageEconomicsSnapshotValidationError";
  }
}

export interface BrokerageEconomicsSnapshotInput {
  readonly id?: string;
  readonly createdAt?: string;
  readonly brokerNote?: string | null;
  readonly economicsInput: BrokerageEconomicsInput;
  readonly modelContext?: BrokerageModelIdentificationInput | null;
}

export interface BrokerageEconomicsSnapshot {
  readonly id: string;
  readonly createdAt: string;
  readonly brokerNote: string | null;
  readonly reference: string;
  readonly purchasePrice: number;
  readonly estimatedMarketValue: number;
  readonly estimatedServiceCost: number | null;
  readonly estimatedPolishCost: number | null;
  readonly estimatedShippingCost: number | null;
  readonly estimatedInsuranceCost: number | null;
  readonly estimatedSellingFees: number | null;
  readonly grossProfit: number;
  readonly expectedExpenses: number;
  readonly netProfit: number;
  readonly capitalRequired: number;
  readonly roiPercent: number | null;
  readonly riskPenalty: number;
  readonly riskAdjustedProfit: number;
  readonly recommendation: BrokerageRecommendation;
  readonly riskAnalysis?: BrokerageEconomicsRiskAnalysis;
}

const brokerageRecommendationValues = [
  "strong-buy",
  "buy",
  "neutral",
  "pass",
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const isValidDateString = (value: string): boolean =>
  Number.isFinite(Date.parse(value));

const getTimestamp = (value?: string): string => {
  if (typeof value === "string" && value.trim()) {
    const normalizedValue = value.trim();

    if (!isValidDateString(normalizedValue)) {
      throw new BrokerageEconomicsSnapshotValidationError(
        "Snapshot timestamp is invalid."
      );
    }

    return normalizedValue;
  }

  return new Date().toISOString();
};

const normalizeSnapshotId = (value: unknown): string => {
  const normalizedValue = normalizeText(value).replace(/[^a-zA-Z0-9_-]/g, "");

  return normalizedValue || createBrokerageEconomicsSnapshotId();
};

const normalizeRequiredMoney = (value: unknown, label: string): number => {
  if (!isFiniteNumber(value) || value < 0) {
    throw new BrokerageEconomicsSnapshotValidationError(`${label} is required.`);
  }

  return value;
};

const normalizeOptionalExpense = (value: unknown, label: string): number | null => {
  if (value === null || value === undefined) return null;

  if (!isFiniteNumber(value) || value < 0) {
    throw new BrokerageEconomicsSnapshotValidationError(
      `${label} must be a non-negative finite number.`
    );
  }

  return value;
};

const normalizeBrokerNote = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;

  if (typeof value !== "string") {
    throw new BrokerageEconomicsSnapshotValidationError(
      "Broker note must be plain text."
    );
  }

  const normalizedNote = value.trim();

  if (!normalizedNote) return null;

  if (normalizedNote.length > brokerageEconomicsSnapshotNoteMaxLength) {
    throw new BrokerageEconomicsSnapshotValidationError(
      `Broker note must be ${brokerageEconomicsSnapshotNoteMaxLength} characters or fewer.`
    );
  }

  return normalizedNote;
};

const normalizeStoredBrokerNote = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;

  const normalizedNote = value.trim();

  return normalizedNote
    ? normalizedNote.slice(0, brokerageEconomicsSnapshotNoteMaxLength)
    : null;
};

const normalizeSnapshotEconomicsInput = (
  value: unknown
): BrokerageEconomicsInput => {
  if (!isRecord(value)) {
    throw new BrokerageEconomicsSnapshotValidationError(
      "Economics assumptions are required."
    );
  }

  return {
    reference: normalizeText(value.reference),
    purchasePrice: normalizeRequiredMoney(value.purchasePrice, "Purchase price"),
    estimatedMarketValue: normalizeRequiredMoney(
      value.estimatedMarketValue,
      "Estimated market value"
    ),
    estimatedServiceCost: normalizeOptionalExpense(
      value.estimatedServiceCost,
      "Estimated service cost"
    ),
    estimatedPolishCost: normalizeOptionalExpense(
      value.estimatedPolishCost,
      "Estimated polishing cost"
    ),
    estimatedShippingCost: normalizeOptionalExpense(
      value.estimatedShippingCost,
      "Estimated shipping cost"
    ),
    estimatedInsuranceCost: normalizeOptionalExpense(
      value.estimatedInsuranceCost,
      "Estimated insurance cost"
    ),
    estimatedSellingFees: normalizeOptionalExpense(
      value.estimatedSellingFees,
      "Estimated selling fees"
    ),
  };
};

const isBrokerageRecommendation = (
  value: unknown
): value is BrokerageRecommendation =>
  typeof value === "string" &&
  brokerageRecommendationValues.includes(value as BrokerageRecommendation);

const getStoredFiniteNumber = (value: unknown): number | null =>
  isFiniteNumber(value) ? value : null;

const getStoredNonNegativeNumber = (value: unknown): number | null =>
  isFiniteNumber(value) && value >= 0 ? value : null;

const isBrokerageThinMarginModelMatch = (
  value: unknown
): value is BrokerageThinMarginModelMatch =>
  isRecord(value) &&
  typeof value.id === "string" &&
  brokerageThinMarginModels.some((model) => model.id === value.id) &&
  typeof value.label === "string" &&
  value.label.trim().length > 0;

const normalizeStoredRiskAnalysis = (
  value: unknown
): BrokerageEconomicsRiskAnalysis | null => {
  if (!isRecord(value)) return null;

  const moderateContingencyAmount = getStoredNonNegativeNumber(
    value.moderateContingencyAmount
  );
  const severeContingencyAmount = getStoredNonNegativeNumber(
    value.severeContingencyAmount
  );
  const baseExpectedProfit = getStoredFiniteNumber(value.baseExpectedProfit);
  const profitAfterModerateContingency = getStoredFiniteNumber(
    value.profitAfterModerateContingency
  );
  const profitAfterSevereContingency = getStoredFiniteNumber(
    value.profitAfterSevereContingency
  );
  const serviceExposureClassification = value.serviceExposureClassification;
  const explanation = normalizeText(value.explanation);
  const thinMarginModel =
    value.thinMarginModel === null
      ? null
      : isBrokerageThinMarginModelMatch(value.thinMarginModel)
        ? Object.freeze({
            id: value.thinMarginModel.id,
            label: value.thinMarginModel.label.trim(),
          })
        : undefined;

  if (
    moderateContingencyAmount === null ||
    severeContingencyAmount === null ||
    baseExpectedProfit === null ||
    profitAfterModerateContingency === null ||
    profitAfterSevereContingency === null ||
    !isServiceExposureClassification(serviceExposureClassification) ||
    serviceExposureClassification === "incomplete" ||
    !explanation ||
    thinMarginModel === undefined ||
    typeof value.modelCaution !== "boolean"
  ) {
    return null;
  }

  return Object.freeze({
    moderateContingencyAmount,
    severeContingencyAmount,
    baseExpectedProfit,
    profitAfterModerateContingency,
    profitAfterSevereContingency,
    serviceExposureClassification,
    explanation,
    thinMarginModel,
    modelCaution: value.modelCaution,
  });
};

const normalizeStoredSnapshot = (
  value: unknown
): BrokerageEconomicsSnapshot | null => {
  if (!isRecord(value)) return null;

  const id = normalizeText(value.id);
  const createdAt = normalizeText(value.createdAt);
  const reference = normalizeText(value.reference);
  const purchasePrice = getStoredNonNegativeNumber(value.purchasePrice);
  const estimatedMarketValue = getStoredNonNegativeNumber(
    value.estimatedMarketValue
  );
  const grossProfit = getStoredFiniteNumber(value.grossProfit);
  const expectedExpenses = getStoredNonNegativeNumber(value.expectedExpenses);
  const netProfit = getStoredFiniteNumber(value.netProfit);
  const capitalRequired = getStoredNonNegativeNumber(value.capitalRequired);
  const roiPercent =
    value.roiPercent === null ? null : getStoredFiniteNumber(value.roiPercent);
  const riskPenalty = getStoredNonNegativeNumber(value.riskPenalty);
  const riskAdjustedProfit = getStoredFiniteNumber(value.riskAdjustedProfit);
  const recommendation = isBrokerageRecommendation(value.recommendation)
    ? value.recommendation
    : null;
  const riskAnalysis = normalizeStoredRiskAnalysis(value.riskAnalysis);

  if (
    !id ||
    !createdAt ||
    !isValidDateString(createdAt) ||
    purchasePrice === null ||
    estimatedMarketValue === null ||
    grossProfit === null ||
    expectedExpenses === null ||
    netProfit === null ||
    capitalRequired === null ||
    roiPercent === null && value.roiPercent !== null ||
    riskPenalty === null ||
    riskAdjustedProfit === null ||
    recommendation === null
  ) {
    return null;
  }

  return Object.freeze({
    id,
    createdAt,
    brokerNote: normalizeStoredBrokerNote(value.brokerNote),
    reference,
    purchasePrice,
    estimatedMarketValue,
    estimatedServiceCost: getStoredNonNegativeNumber(value.estimatedServiceCost),
    estimatedPolishCost: getStoredNonNegativeNumber(value.estimatedPolishCost),
    estimatedShippingCost: getStoredNonNegativeNumber(value.estimatedShippingCost),
    estimatedInsuranceCost: getStoredNonNegativeNumber(
      value.estimatedInsuranceCost
    ),
    estimatedSellingFees: getStoredNonNegativeNumber(value.estimatedSellingFees),
    grossProfit,
    expectedExpenses,
    netProfit,
    capitalRequired,
    roiPercent,
    riskPenalty,
    riskAdjustedProfit,
    recommendation,
    ...(riskAnalysis ? { riskAnalysis } : {}),
  });
};

export function createBrokerageEconomicsSnapshotId(seed = randomUUID()): string {
  const normalizedSeed = normalizeText(seed).replace(/[^a-zA-Z0-9_-]/g, "");

  return `economics_${normalizedSeed || randomUUID()}`;
}

export function createBrokerageEconomicsSnapshot(
  input: BrokerageEconomicsSnapshotInput
): BrokerageEconomicsSnapshot {
  const economicsInput = normalizeSnapshotEconomicsInput(input.economicsInput);
  const economics = buildBrokerageEconomics(economicsInput);

  if (
    economics.grossProfit === null ||
    economics.netProfit === null ||
    economics.capitalRequired === null ||
    economics.riskAdjustedProfit === null
  ) {
    throw new BrokerageEconomicsSnapshotValidationError(
      "Purchase price and estimated market value are required."
    );
  }

  const riskAnalysis = buildBrokerageEconomicsRiskAnalysis({
    baseExpectedProfit: economics.netProfit,
    modelContext: {
      brand: input.modelContext?.brand,
      collection: input.modelContext?.collection,
      desiredWatch: input.modelContext?.desiredWatch,
      reference: economics.reference || input.modelContext?.reference,
    },
  });

  return Object.freeze({
    id: normalizeSnapshotId(input.id),
    createdAt: getTimestamp(input.createdAt),
    brokerNote: normalizeBrokerNote(input.brokerNote),
    reference: economics.reference,
    purchasePrice: economicsInput.purchasePrice!,
    estimatedMarketValue: economicsInput.estimatedMarketValue!,
    estimatedServiceCost: economicsInput.estimatedServiceCost,
    estimatedPolishCost: economicsInput.estimatedPolishCost,
    estimatedShippingCost: economicsInput.estimatedShippingCost,
    estimatedInsuranceCost: economicsInput.estimatedInsuranceCost,
    estimatedSellingFees: economicsInput.estimatedSellingFees,
    grossProfit: economics.grossProfit,
    expectedExpenses: economics.expectedExpenses,
    netProfit: economics.netProfit,
    capitalRequired: economics.capitalRequired,
    roiPercent: economics.roiPercent,
    riskPenalty: economics.riskPenalty,
    riskAdjustedProfit: economics.riskAdjustedProfit,
    recommendation: economics.recommendation,
    riskAnalysis,
  });
}

export function normalizeBrokerageEconomicsSnapshots(
  value: unknown
): readonly BrokerageEconomicsSnapshot[] {
  if (!Array.isArray(value)) return Object.freeze([]);

  return Object.freeze(
    value
      .map(normalizeStoredSnapshot)
      .filter(
        (snapshot): snapshot is BrokerageEconomicsSnapshot => snapshot !== null
      )
  );
}

export function appendBrokerageEconomicsSnapshot(
  currentSnapshots: unknown,
  snapshot: BrokerageEconomicsSnapshot
): readonly BrokerageEconomicsSnapshot[] {
  const normalizedSnapshot = normalizeStoredSnapshot(snapshot);

  if (!normalizedSnapshot) {
    throw new BrokerageEconomicsSnapshotValidationError(
      "Economics snapshot is invalid."
    );
  }

  return Object.freeze([
    ...normalizeBrokerageEconomicsSnapshots(currentSnapshots),
    normalizedSnapshot,
  ]);
}
