/** Deterministic decision previews. These functions do not authorize a source or execute a transaction. */
export const DIVISION_TEMPLATES = ["luxury-qualification", "realty-economics", "capital-package"] as const;
export type DivisionTemplate = typeof DIVISION_TEMPLATES[number];
const text = (v: unknown): v is string => typeof v === "string" && v.trim() === v && v.length > 0 && v.length <= 100 && !/[\x00-\x1f]/.test(v);
function object(v: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v) || Object.keys(v).sort().join() !== [...fields].sort().join()) throw Error("Unexpected decision-preview fields.");
  return v as Record<string, unknown>;
}
function amount(v: unknown, positive = false): v is number {
  return typeof v === "number" && Number.isFinite(v) && v >= (positive ? 0.01 : 0) && v <= 1_000_000_000 && Number.isSafeInteger(Math.round(v * 100)) && Math.abs(v * 100 - Math.round(v * 100)) < 0.00001;
}
const money = (v: number) => Math.round(v * 100) / 100;
const boundary = Object.freeze({ businessDataExecutionAllowed: false, dispatchesWork: false, sendsMessages: false, writesCRM: false, activatesGmail: false,
  changesProduction: false, modelApiRequestsAllowed: false, submitsApplications: false, makesOffers: false });

export function evaluateDivisionDecision(template: DivisionTemplate, input: unknown) {
  if (!DIVISION_TEMPLATES.includes(template)) throw Error("Unimplemented division template.");
  const fields = template === "luxury-qualification" ? ["brand", "reference", "budget", "timelineDays", "conditionTolerance", "boxPapers"] :
    template === "realty-economics" ? ["purchasePrice", "rehab", "closingCosts", "arv", "annualNetIncome"] : ["requestedAmount", "useOfFunds", "documents"];
  const v = object(input, ["evidenceState", ...fields]);
  if (!["VERIFIED", "UNKNOWN", "REQUIRES_VERIFICATION"].includes(v.evidenceState as string)) throw Error("Decision evidence state required.");
  const missing: string[] = [], evidenceVerified = v.evidenceState === "VERIFIED";
  let calculations: { allInCost: number; equitySpreadBeforeUnmodeledCosts: number; yieldOnCost: number | null } | null = null;
  for (const field of fields) {
    const value = v[field];
    if (value === null) { if (field !== "annualNetIncome") missing.push(field); continue; }
    if (["brand", "reference", "conditionTolerance", "boxPapers"].includes(field)) {
      if (!text(value)) throw Error("Invalid mandate field.");
    } else if (field === "timelineDays") {
      if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > 3650) throw Error("Invalid mandate timeline.");
    } else if (field === "useOfFunds") {
      if (!["WORKING_CAPITAL", "EQUIPMENT", "ACQUISITION", "REAL_ESTATE", "REFINANCE"].includes(value as string)) throw Error("Unsupported business-purpose category.");
    } else if (field === "documents") {
      const allowed = ["REVENUE_RECORDS", "TAX_RETURNS", "BANK_STATEMENTS", "ENTITY_DOCUMENTS", "COLLATERAL_SCHEDULE"];
      if (!Array.isArray(value) || value.length > allowed.length || new Set(value).size !== value.length || value.some(d => !allowed.includes(d))) throw Error("Only document-presence categories permitted.");
      if (value.length === 0) missing.push(field);
    } else if (!amount(field === "annualNetIncome" && typeof value === "number" ? Math.abs(value) : value,
      ["budget", "requestedAmount", "purchasePrice", "arv"].includes(field))) throw Error("Invalid decision amount.");
  }
  if (!evidenceVerified) missing.unshift("VERIFIED_EVIDENCE");
  if (template === "realty-economics" && evidenceVerified && missing.length === 0) {
    const allInCost = money((v.purchasePrice as number) + (v.rehab as number) + (v.closingCosts as number));
    calculations = { allInCost, equitySpreadBeforeUnmodeledCosts: money((v.arv as number) - allInCost),
      yieldOnCost: v.annualNetIncome === null ? null : (v.annualNetIncome as number) / allInCost };
  }
  return Object.freeze({ schemaVersion: 1, mode: "DECISION_PREVIEW_ONLY", template,
    status: missing.length ? "HOLD" : calculations && calculations.equitySpreadBeforeUnmodeledCosts <= 0 ? "NEGATIVE_OR_ZERO_SPREAD" : "READY_FOR_FOUNDER_REVIEW",
    missing: Object.freeze(missing), calculations: calculations ? Object.freeze(calculations) : null,
    limitations: Object.freeze(template === "realty-economics" ? ["SPREAD_IS_NOT_PROFIT", "FINANCING_HOLDING_SELLING_AND_OTHER_COSTS_NOT_MODELED", "NO_OFFER_OR_INVESTMENT_RECOMMENDATION"] :
      template === "capital-package" ? ["DOCUMENT_PRESENCE_IS_NOT_DOCUMENT_VERIFICATION", "LENDER_SPECIFIC_REQUIREMENTS_NOT_ASSESSED", "NO_FUNDING_APPROVAL"] :
      ["MANDATE_COMPLETENESS_ONLY", "AVAILABILITY_AUTHENTICITY_AND_BUDGET_FIT_NOT_VERIFIED"]), ...boundary });
}

/** Fixed test inputs only. No connector, credential, record identifier or customer data. */
export function syntheticDivisionDecision(template: DivisionTemplate) {
  return evaluateDivisionDecision(template, template === "luxury-qualification" ? { evidenceState: "VERIFIED", brand: "Synthetic", reference: null, budget: 2000, timelineDays: 30, conditionTolerance: null, boxPapers: null } :
    template === "realty-economics" ? { evidenceState: "VERIFIED", purchasePrice: 100000, rehab: 25000, closingCosts: 5000, arv: 160000, annualNetIncome: null } :
    { evidenceState: "VERIFIED", requestedAmount: 50000, useOfFunds: "WORKING_CAPITAL", documents: [] });
}
