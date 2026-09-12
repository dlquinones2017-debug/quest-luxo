import type { BrokerageEconomicsInput } from "./brokerageEconomics";

export type LeadEconomicsMappedField =
  | "reference"
  | "purchasePrice"
  | "estimatedMarketValue";

export interface LeadEconomicsWorkspacePayload {
  readonly name?: unknown;
  readonly email?: unknown;
  readonly reference?: unknown;
  readonly desiredWatch?: unknown;
  readonly purchasePrice?: unknown;
  readonly acquisitionPrice?: unknown;
  readonly acquisitionCost?: unknown;
  readonly askingPrice?: unknown;
  readonly estimatedMarketValue?: unknown;
  readonly marketValue?: unknown;
}

export interface LeadEconomicsWorkspaceLead {
  readonly payload?: LeadEconomicsWorkspacePayload | null;
}

export interface LeadEconomicsWorkspaceMapping {
  readonly economicsInput: BrokerageEconomicsInput;
  readonly contextLabel: string;
  readonly mappedFields: readonly LeadEconomicsMappedField[];
}

const trustedPurchasePriceFields = [
  "purchasePrice",
  "acquisitionPrice",
  "acquisitionCost",
  "askingPrice",
] as const;
const trustedMarketValueFields = ["estimatedMarketValue", "marketValue"] as const;

const emptyEconomicsInput: BrokerageEconomicsInput = Object.freeze({
  reference: "",
  purchasePrice: null,
  estimatedMarketValue: null,
  estimatedServiceCost: null,
  estimatedPolishCost: null,
  estimatedShippingCost: null,
  estimatedInsuranceCost: null,
  estimatedSellingFees: null,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeTrustedMoneyValue = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }

  if (typeof value !== "string") return null;

  const normalizedValue = value.trim().replace(/[$,]/g, "");

  if (!normalizedValue) return null;

  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : null;
};

const getPayload = (
  lead: LeadEconomicsWorkspaceLead | null | undefined
): Record<string, unknown> => {
  if (!lead || !isRecord(lead.payload)) return {};

  return lead.payload;
};

const getTrustedMoneyValue = (
  payload: Record<string, unknown>,
  fieldNames: readonly string[]
): number | null => {
  for (const fieldName of fieldNames) {
    const value = normalizeTrustedMoneyValue(payload[fieldName]);

    if (value !== null) return value;
  }

  return null;
};

const getContextLabel = (payload: Record<string, unknown>, reference: string): string => {
  const name = normalizeText(payload.name);
  const desiredWatch = normalizeText(payload.desiredWatch);
  const email = normalizeText(payload.email);

  return name || reference || desiredWatch || email || "Selected lead";
};

/**
 * Maps a lead into Brokerage Economics calculator inputs using only trusted
 * structured fields. Trusted fields are:
 * - payload.reference -> reference
 * - payload.purchasePrice, acquisitionPrice, acquisitionCost, or askingPrice -> purchasePrice
 * - payload.estimatedMarketValue or marketValue -> estimatedMarketValue
 *
 * Free-form notes, messages, budget text, collection names, desired-watch text,
 * and other ambiguous numeric content are intentionally ignored. Expense fields
 * are never prefilled from a lead.
 */
export function createLeadEconomicsWorkspaceInput(
  lead: LeadEconomicsWorkspaceLead | null | undefined
): LeadEconomicsWorkspaceMapping {
  const payload = getPayload(lead);
  const reference = normalizeText(payload.reference);
  const purchasePrice = getTrustedMoneyValue(payload, trustedPurchasePriceFields);
  const estimatedMarketValue = getTrustedMoneyValue(
    payload,
    trustedMarketValueFields
  );
  const mappedFields: LeadEconomicsMappedField[] = [];

  if (reference) mappedFields.push("reference");
  if (purchasePrice !== null) mappedFields.push("purchasePrice");
  if (estimatedMarketValue !== null) mappedFields.push("estimatedMarketValue");

  return Object.freeze({
    economicsInput: Object.freeze({
      ...emptyEconomicsInput,
      reference,
      purchasePrice,
      estimatedMarketValue,
    }),
    contextLabel: getContextLabel(payload, reference),
    mappedFields: Object.freeze(mappedFields),
  });
}