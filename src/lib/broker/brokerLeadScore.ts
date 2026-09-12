import type { LeadCapturePayloadInput } from "../leads/leadCapture";

export type BrokerLeadScoreTier = "cold" | "warm" | "hot" | "vip";

export interface BrokerLeadScoreInput {
  readonly payload?: LeadCapturePayloadInput | null;
  readonly status?: string | null;
  readonly tags?: readonly string[] | null;
}

export interface BrokerLeadScoreResult {
  readonly score: number;
  readonly tier: BrokerLeadScoreTier;
  readonly reasons: readonly string[];
}

type BrokerLeadScoreSource =
  | BrokerLeadScoreInput
  | LeadCapturePayloadInput
  | null
  | undefined;

type BudgetTier =
  | "under-10000"
  | "10000-20000"
  | "20000-50000"
  | "50000-100000"
  | "100000-plus"
  | "unknown";

const normalizeText = (value?: string | null): string => value?.trim() ?? "";

const isScoreInput = (value: unknown): value is BrokerLeadScoreInput =>
  typeof value === "object" &&
  value !== null &&
  ("payload" in value || "status" in value || "tags" in value);

const normalizeTagList = (tags?: readonly string[] | null): readonly string[] => {
  if (!Array.isArray(tags)) return [];

  const seenTags = new Set<string>();
  const normalizedTags: string[] = [];

  tags.forEach((tag) => {
    const normalizedTag = normalizeText(tag);
    const normalizedKey = normalizedTag.toLowerCase();

    if (!normalizedTag || seenTags.has(normalizedKey)) return;

    seenTags.add(normalizedKey);
    normalizedTags.push(normalizedTag);
  });

  return normalizedTags;
};

const getScoreInputParts = (
  input: BrokerLeadScoreSource
): {
  readonly payload: LeadCapturePayloadInput;
  readonly status: string;
  readonly tags: readonly string[];
} => {
  if (!input) return { payload: {}, status: "", tags: [] };

  if (isScoreInput(input)) {
    return {
      payload: input.payload ?? {},
      status: normalizeText(input.status).toLowerCase(),
      tags: normalizeTagList(input.tags),
    };
  }

  return {
    payload: input,
    status: "",
    tags: [],
  };
};

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

const getTier = (
  score: number,
  status: string,
  tags: readonly string[]
): BrokerLeadScoreTier => {
  const normalizedTags = tags.map((tag) => tag.toLowerCase());

  if (status === "lost") return "cold";
  if (status === "closed") return score >= 45 ? "warm" : "cold";
  if (normalizedTags.includes("vip") && score >= 70) return "vip";
  if (score >= 85) return "vip";
  if (score >= 60) return "hot";
  if (score >= 30) return "warm";

  return "cold";
};

const clampScore = (score: number): number => Math.min(100, Math.max(0, score));

const addSignal = (
  reasons: string[],
  label: string,
  amount: number
): number => {
  reasons.push(`${amount > 0 ? "+" : ""}${amount} ${label}`);

  return amount;
};

export function createBrokerLeadScore(
  input: BrokerLeadScoreSource
): BrokerLeadScoreResult {
  const { payload, status, tags } = getScoreInputParts(input);
  const reasons: string[] = [];
  const normalizedTags = tags.map((tag) => tag.toLowerCase());
  const timeline = normalizeText(payload.timeline).toLowerCase();
  let score = 0;

  if (normalizeText(payload.reference)) {
    score += addSignal(reasons, "specific reference provided", 15);
  }

  if (normalizeText(payload.brand) && normalizeText(payload.collection)) {
    score += addSignal(reasons, "brand and collection provided", 10);
  }

  if (timeline.includes("immediately")) {
    score += addSignal(reasons, "immediate timeline", 20);
  } else if (timeline.includes("30")) {
    score += addSignal(reasons, "timeline within 30 days", 15);
  }

  switch (getBudgetTier(payload.budget)) {
    case "100000-plus":
      score += addSignal(reasons, "$100k+ budget", 25);
      break;
    case "50000-100000":
      score += addSignal(reasons, "$50k-$100k budget", 15);
      break;
    case "unknown":
      reasons.push("Budget not provided or intentionally withheld");
      break;
    default:
      break;
  }

  if (normalizedTags.includes("vip")) {
    score += addSignal(reasons, "VIP tag", 25);
  }

  if (normalizedTags.includes("hot lead")) {
    score += addSignal(reasons, "Hot Lead tag", 20);
  }

  if (normalizedTags.includes("needs follow-up")) {
    score += addSignal(reasons, "Needs Follow-Up tag", 10);
  }

  if (status === "sourcing") {
    score += addSignal(reasons, "sourcing status", 10);
  }

  if (status === "offer-sent") {
    score += addSignal(reasons, "offer sent status", 15);
  }

  if (!normalizeText(payload.email)) {
    score += addSignal(reasons, "missing email", -15);
  }

  if (!normalizeText(payload.phone)) {
    score += addSignal(reasons, "missing phone", -5);
  }

  if (status === "closed") {
    score = Math.min(score - 10, 55);
    reasons.push("Closed lead capped for active pipeline priority");
  }

  if (status === "lost") {
    score = Math.min(score - 35, 25);
    reasons.push("Lost lead capped for active pipeline priority");
  }

  const finalScore = clampScore(score);

  return Object.freeze({
    score: finalScore,
    tier: getTier(finalScore, status, tags),
    reasons: Object.freeze(reasons.length > 0 ? reasons : ["No scoring signals available"]),
  });
}
