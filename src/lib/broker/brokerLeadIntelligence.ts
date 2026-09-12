import type { LeadCapturePayloadInput } from "../leads/leadCapture";

export type BrokerLeadPriority = "High" | "Medium" | "Low";
export type BrokerLeadDifficulty = "High" | "Moderate" | "Low" | "Unknown";
export type BrokerLeadUrgency =
  | "Immediate"
  | "Soon"
  | "Flexible"
  | "Research"
  | "Unknown";
export type BrokerLeadBudgetAssessment =
  | "Strong"
  | "Possible"
  | "Weak"
  | "Unknown";

export interface BrokerLeadIntelligenceSnapshot {
  readonly leadPriority: BrokerLeadPriority;
  readonly allocationDifficulty: BrokerLeadDifficulty;
  readonly sourcingComplexity: BrokerLeadDifficulty;
  readonly estimatedResponseUrgency: BrokerLeadUrgency;
  readonly budgetAssessment: BrokerLeadBudgetAssessment;
  readonly watchContext: string;
  readonly brokerRecommendation: string;
}

type BrokerLeadPayloadInput = LeadCapturePayloadInput;

type BudgetTier =
  | "under-10000"
  | "10000-20000"
  | "20000-50000"
  | "50000-100000"
  | "100000-plus"
  | "unknown";

const highDemandSignals = [
  "5711",
  "5811",
  "5712",
  "5990",
  "5980",
  "5726",
  "nautilus",
  "aquanaut",
  "15202",
  "16202",
  "15510",
  "15500",
  "royal oak",
  "daytona",
  "gmt-master",
  "gmt master",
  "pepsi",
  "batman",
  "sprite",
  "sky-dweller",
  "sky dweller",
  "silver snoopy",
] as const;

const moderateDemandSignals = [
  "submariner",
  "sea-dweller",
  "sea dweller",
  "explorer",
  "milgauss",
  "speedmaster",
  "moonwatch",
  "yacht-master",
  "yacht master",
] as const;

const normalizeText = (value?: string | null): string => value?.trim() ?? "";

const normalizeSearchText = (payload: BrokerLeadPayloadInput): string =>
  [
    payload.brand,
    payload.collection,
    payload.reference,
    payload.desiredWatch,
    payload.message,
  ]
    .map(normalizeText)
    .join(" ")
    .toLowerCase();

const hasAnySignal = (
  searchText: string,
  signals: readonly string[]
): boolean => signals.some((signal) => searchText.includes(signal));

const getBudgetTier = (budget?: string | null): BudgetTier => {
  const normalized = normalizeText(budget)
    .toLowerCase()
    .replace(/\u2013|\u2014/g, "-")
    .replace(/,/g, "");

  if (!normalized || normalized.includes("prefer not")) return "unknown";
  if (normalized.includes("100k+") || normalized.includes("100000+")) {
    return "100000-plus";
  }
  if (normalized.includes("50k-100k") || normalized.includes("50000-100000")) {
    return "50000-100000";
  }
  if (normalized.includes("20k-50k") || normalized.includes("20000-50000")) {
    return "20000-50000";
  }
  if (normalized.includes("10k-20k") || normalized.includes("10000-20000")) {
    return "10000-20000";
  }
  if (normalized.includes("under") || normalized.includes("<")) {
    return "under-10000";
  }

  const numericValues = normalized
    .match(/\d+(?:\.\d+)?/g)
    ?.map((value) => Number(value))
    .filter((value) => Number.isFinite(value));

  if (!numericValues?.length) return "unknown";

  const largestValue = Math.max(...numericValues);
  const normalizedBudget = largestValue < 1000 ? largestValue * 1000 : largestValue;

  if (normalizedBudget >= 100000) return "100000-plus";
  if (normalizedBudget >= 50000) return "50000-100000";
  if (normalizedBudget >= 20000) return "20000-50000";
  if (normalizedBudget >= 10000) return "10000-20000";

  return "under-10000";
};

const getEstimatedResponseUrgency = (
  timeline?: string | null
): BrokerLeadUrgency => {
  const normalized = normalizeText(timeline).toLowerCase();

  if (!normalized) return "Unknown";
  if (normalized.includes("immediately")) return "Immediate";
  if (normalized.includes("30")) return "Soon";
  if (normalized.includes("research")) return "Research";
  if (normalized.includes("1-3") || normalized.includes("3-6")) {
    return "Flexible";
  }

  return "Flexible";
};

const getAllocationDifficulty = (
  payload: BrokerLeadPayloadInput
): BrokerLeadDifficulty => {
  const searchText = normalizeSearchText(payload);

  if (!searchText.trim()) return "Unknown";
  if (hasAnySignal(searchText, highDemandSignals)) return "High";
  if (hasAnySignal(searchText, moderateDemandSignals)) return "Moderate";
  if (payload.reference || payload.collection || payload.desiredWatch) return "Low";

  return "Unknown";
};

const getSourcingComplexity = (
  payload: BrokerLeadPayloadInput,
  allocationDifficulty: BrokerLeadDifficulty
): BrokerLeadDifficulty => {
  const hasSpecificReference = Boolean(normalizeText(payload.reference));
  const hasSpecificWatch = Boolean(
    normalizeText(payload.reference) || normalizeText(payload.desiredWatch)
  );

  if (allocationDifficulty === "Unknown" && !hasSpecificWatch) return "Unknown";
  if (allocationDifficulty === "High" && hasSpecificReference) return "High";
  if (allocationDifficulty === "High") return "Moderate";
  if (allocationDifficulty === "Moderate" && hasSpecificWatch) return "Moderate";
  if (hasSpecificReference) return "Moderate";

  return "Low";
};

const getBudgetAssessment = (
  payload: BrokerLeadPayloadInput,
  allocationDifficulty: BrokerLeadDifficulty
): BrokerLeadBudgetAssessment => {
  const budgetTier = getBudgetTier(payload.budget);
  const searchText = normalizeSearchText(payload);
  const isUltraCompetitive =
    allocationDifficulty === "High" &&
    hasAnySignal(searchText, ["nautilus", "aquanaut", "15202", "16202", "daytona"]);

  if (budgetTier === "unknown") return "Unknown";
  if (budgetTier === "100000-plus") return "Strong";
  if (budgetTier === "50000-100000") return isUltraCompetitive ? "Possible" : "Strong";
  if (budgetTier === "20000-50000") {
    return allocationDifficulty === "High" ? "Possible" : "Strong";
  }
  if (budgetTier === "10000-20000") {
    return allocationDifficulty === "High" ? "Weak" : "Possible";
  }

  return allocationDifficulty === "Low" ? "Possible" : "Weak";
};

const getWatchContext = (payload: BrokerLeadPayloadInput): string => {
  const brand = normalizeText(payload.brand);
  const collection = normalizeText(payload.collection);
  const reference = normalizeText(payload.reference);
  const desiredWatch = normalizeText(payload.desiredWatch);

  if (reference) {
    return `Specific reference: ${[brand, collection, reference]
      .filter(Boolean)
      .join(" ")}`;
  }

  if (desiredWatch) return `Desired watch: ${desiredWatch}`;
  if (brand && collection) return `Collection interest: ${brand} ${collection}`;
  if (brand) return `Brand-only interest: ${brand}`;

  return "Watch interest not provided.";
};

const getLeadPriority = (
  payload: BrokerLeadPayloadInput,
  allocationDifficulty: BrokerLeadDifficulty,
  budgetAssessment: BrokerLeadBudgetAssessment,
  urgency: BrokerLeadUrgency
): BrokerLeadPriority => {
  let score = 0;

  if (payload.reference) score += 1;
  if (allocationDifficulty === "High") score += 1;
  if (budgetAssessment === "Strong") score += 2;
  if (budgetAssessment === "Possible") score += 1;
  if (urgency === "Immediate") score += 2;
  if (urgency === "Soon") score += 1;
  if (urgency === "Research") score -= 2;
  if (budgetAssessment === "Weak") score -= 1;

  if (score >= 4) return "High";
  if (score >= 2) return "Medium";

  return "Low";
};

const getBrokerRecommendation = (
  priority: BrokerLeadPriority,
  sourcingComplexity: BrokerLeadDifficulty,
  budgetAssessment: BrokerLeadBudgetAssessment,
  urgency: BrokerLeadUrgency
): string => {
  if (priority === "High" && urgency === "Immediate") {
    return "Prioritize broker follow-up today and qualify availability, budget ceiling, and acceptable alternatives.";
  }

  if (sourcingComplexity === "High") {
    return "Confirm exact configuration, flexibility, and budget ceiling before beginning targeted sourcing.";
  }

  if (budgetAssessment === "Weak") {
    return "Set expectations early and suggest adjacent references or a revised budget range.";
  }

  if (urgency === "Research") {
    return "Send market guidance and keep the lead warm until buying intent becomes clearer.";
  }

  if (priority === "Medium") {
    return "Follow up promptly, confirm buying criteria, and prepare a short sourcing path.";
  }

  return "Gather missing watch and budget details before assigning sourcing effort.";
};

export function createBrokerLeadIntelligence(
  payload: BrokerLeadPayloadInput
): BrokerLeadIntelligenceSnapshot {
  const allocationDifficulty = getAllocationDifficulty(payload);
  const sourcingComplexity = getSourcingComplexity(payload, allocationDifficulty);
  const estimatedResponseUrgency = getEstimatedResponseUrgency(payload.timeline);
  const budgetAssessment = getBudgetAssessment(payload, allocationDifficulty);
  const leadPriority = getLeadPriority(
    payload,
    allocationDifficulty,
    budgetAssessment,
    estimatedResponseUrgency
  );

  return Object.freeze({
    leadPriority,
    allocationDifficulty,
    sourcingComplexity,
    estimatedResponseUrgency,
    budgetAssessment,
    watchContext: getWatchContext(payload),
    brokerRecommendation: getBrokerRecommendation(
      leadPriority,
      sourcingComplexity,
      budgetAssessment,
      estimatedResponseUrgency
    ),
  });
}
