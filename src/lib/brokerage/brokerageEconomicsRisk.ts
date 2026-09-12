import {
  brokerageEconomicsRiskContingencies,
  brokerageThinMarginModels,
  type BrokerageThinMarginModelId,
} from "../config/brokerageEconomicsRiskConfig.ts";

export const serviceExposureClassificationValues = [
  "protected",
  "exposed",
  "fragile",
  "unprofitable",
  "incomplete",
] as const;

export type ServiceExposureClassification =
  (typeof serviceExposureClassificationValues)[number];

export interface BrokerageModelIdentificationInput {
  readonly brand?: unknown;
  readonly collection?: unknown;
  readonly desiredWatch?: unknown;
  readonly reference?: unknown;
}

export interface BrokerageThinMarginModelMatch {
  readonly id: BrokerageThinMarginModelId;
  readonly label: string;
}

export interface BrokerageEconomicsRiskAnalysisInput {
  readonly baseExpectedProfit: number | null | undefined;
  readonly modelContext?: BrokerageModelIdentificationInput | null;
}

export interface BrokerageEconomicsRiskAnalysis {
  readonly moderateContingencyAmount: number;
  readonly severeContingencyAmount: number;
  readonly baseExpectedProfit: number | null;
  readonly profitAfterModerateContingency: number | null;
  readonly profitAfterSevereContingency: number | null;
  readonly serviceExposureClassification: ServiceExposureClassification;
  readonly explanation: string;
  readonly thinMarginModel: BrokerageThinMarginModelMatch | null;
  readonly modelCaution: boolean;
}

const disqualifyingModelTerms = new Set([
  "alternative",
  "homage",
  "inspired",
  "lookalike",
  "replica",
  "style",
  "styled",
]);

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const normalizeText = (value: unknown): string =>
  typeof value === "string"
    ? value
        .normalize("NFKD")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
        .replace(/\s+/g, " ")
    : "";

const normalizeReferenceToken = (value: string): string =>
  value.replace(/[^a-z0-9]/g, "");

const containsPhrase = (value: string, phrase: string): boolean =>
  ` ${value} `.includes(` ${phrase} `);

const containsDisqualifyingModelTerm = (values: readonly string[]): boolean =>
  values.some((value) =>
    value.split(" ").some((token) => disqualifyingModelTerms.has(token))
  );

const hasReferencePrefix = (
  values: readonly string[],
  referencePrefixes: readonly string[]
): boolean =>
  values.some((value) =>
    value.split(" ").some((token) => {
      const normalizedToken = normalizeReferenceToken(token);

      return referencePrefixes.some((prefix) =>
        normalizedToken.startsWith(normalizeReferenceToken(prefix))
      );
    })
  );

const formatConfiguredCurrency = (value: number): string =>
  `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

const getClassificationExplanation = (
  classification: ServiceExposureClassification
): string => {
  const moderate = formatConfiguredCurrency(
    brokerageEconomicsRiskContingencies.moderate
  );
  const severe = formatConfiguredCurrency(
    brokerageEconomicsRiskContingencies.severe
  );

  switch (classification) {
    case "protected":
      return `Base expected profit remains above $0 after the ${severe} contingency.`;
    case "exposed":
      return `Profit remains above $0 after ${moderate}, but falls to $0 or below after ${severe}.`;
    case "fragile":
      return `Base expected profit is above $0, but falls to $0 or below after ${moderate}.`;
    case "unprofitable":
      return "Base expected profit is $0 or below before any additional contingency.";
    case "incomplete":
      return "Purchase price and estimated market value are required to assess service exposure.";
  }
};

export function isServiceExposureClassification(
  value: unknown
): value is ServiceExposureClassification {
  return (
    typeof value === "string" &&
    serviceExposureClassificationValues.includes(
      value as ServiceExposureClassification
    )
  );
}

/**
 * Identifies a configured thin-margin Rolex model from structured lead fields.
 * Free-form notes and messages are deliberately outside this contract. A
 * conflicting non-Rolex brand, qualifying homage/style language, or multiple
 * model matches returns null rather than guessing.
 */
export function identifyBrokerageThinMarginModel(
  input?: BrokerageModelIdentificationInput | null
): BrokerageThinMarginModelMatch | null {
  if (!input) return null;

  const brand = normalizeText(input.brand);
  const modelValues = [
    normalizeText(input.collection),
    normalizeText(input.desiredWatch),
    normalizeText(input.reference),
  ].filter(Boolean);

  if (
    (brand && brand !== "rolex" && !brand.startsWith("rolex ")) ||
    modelValues.length === 0 ||
    containsDisqualifyingModelTerm(modelValues)
  ) {
    return null;
  }

  const matches = brokerageThinMarginModels.filter((model) => {
    const normalizedAliases = model.aliases.map(normalizeText);
    const hasNameMatch = modelValues.some((value) =>
      normalizedAliases.some((alias) => containsPhrase(value, alias))
    );

    return hasNameMatch || hasReferencePrefix(modelValues, model.referencePrefixes);
  });

  if (matches.length !== 1) return null;

  return Object.freeze({
    id: matches[0].id,
    label: matches[0].label,
  });
}

/**
 * Applies configured unexpected-cost contingencies after existing deal costs.
 * Base expected profit should be the existing economics net-profit result.
 */
export function buildBrokerageEconomicsRiskAnalysis(
  input: BrokerageEconomicsRiskAnalysisInput
): BrokerageEconomicsRiskAnalysis {
  const moderateContingencyAmount =
    brokerageEconomicsRiskContingencies.moderate;
  const severeContingencyAmount = brokerageEconomicsRiskContingencies.severe;
  const thinMarginModel = identifyBrokerageThinMarginModel(input.modelContext);
  const hasBaseExpectedProfit =
    typeof input.baseExpectedProfit === "number" &&
    Number.isFinite(input.baseExpectedProfit);
  const baseExpectedProfit = hasBaseExpectedProfit
    ? roundMoney(input.baseExpectedProfit as number)
    : null;
  const profitAfterModerateContingency =
    baseExpectedProfit === null
      ? null
      : roundMoney(baseExpectedProfit - moderateContingencyAmount);
  const profitAfterSevereContingency =
    baseExpectedProfit === null
      ? null
      : roundMoney(baseExpectedProfit - severeContingencyAmount);
  let serviceExposureClassification: ServiceExposureClassification;

  if (baseExpectedProfit === null) {
    serviceExposureClassification = "incomplete";
  } else if (baseExpectedProfit <= 0) {
    serviceExposureClassification = "unprofitable";
  } else if (
    profitAfterModerateContingency !== null &&
    profitAfterModerateContingency <= 0
  ) {
    serviceExposureClassification = "fragile";
  } else if (
    profitAfterSevereContingency !== null &&
    profitAfterSevereContingency <= 0
  ) {
    serviceExposureClassification = "exposed";
  } else {
    serviceExposureClassification = "protected";
  }

  const modelCaution =
    thinMarginModel !== null &&
    (serviceExposureClassification === "exposed" ||
      serviceExposureClassification === "fragile" ||
      serviceExposureClassification === "unprofitable");

  return Object.freeze({
    moderateContingencyAmount,
    severeContingencyAmount,
    baseExpectedProfit,
    profitAfterModerateContingency,
    profitAfterSevereContingency,
    serviceExposureClassification,
    explanation: getClassificationExplanation(serviceExposureClassification),
    thinMarginModel,
    modelCaution,
  });
}
