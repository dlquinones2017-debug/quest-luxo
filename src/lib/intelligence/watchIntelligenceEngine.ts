import type { QuestLuxoAsset } from "../../types/questLuxo";

export type WatchIntentUseCase = "daily" | "sports" | "investment";
export type WatchRankingMode = "relevance" | "investment" | "liquidity";
export type WatchMarketPosition =
  | "Trophy"
  | "High Demand"
  | "Core"
  | "Specialized"
  | "Research Pending";

export interface WatchIntelligenceInput<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly asset: TAsset;
  readonly brand?: string;
  readonly collection?: string;
  readonly estimatedPrice?: number | null;
}

export interface WatchIntent {
  readonly query: string;
  readonly maxBudget?: number;
  readonly brand?: string;
  readonly collection?: string;
  readonly dialColor?: string;
  readonly useCase?: WatchIntentUseCase;
  readonly rankingMode: WatchRankingMode;
  readonly keywords: readonly string[];
}

export interface WatchIntelligenceScores {
  readonly investmentScore: number;
  readonly liquidityScore: number;
  readonly marketScore: number;
  readonly relevanceScore: number;
  readonly overallScore: number;
}

export interface WatchRecommendation<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly asset: Readonly<TAsset>;
  readonly brand: string;
  readonly collection: string;
  readonly reference: string;
  readonly model: string;
  readonly estimatedPrice: number | null;
  readonly marketPosition: WatchMarketPosition;
  readonly scores: WatchIntelligenceScores;
  readonly matchedIntent: WatchIntent | null;
  readonly reasons: readonly string[];
}

export interface RankWatchAssetsOptions<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly assets: readonly TAsset[];
  readonly intent?: WatchIntent | string;
  readonly includeUnknownPrice?: boolean;
  readonly rankingMode?: WatchRankingMode;
}

export interface DealerComparable {
  readonly id: string;
  readonly reference: string;
  readonly configuration: string;
  readonly lowDealerValue: number;
  readonly valid: boolean;
}

export interface ComparableRejection {
  readonly comp: DealerComparable;
  readonly reason: "INVALID_COMP" | "WRONG_REFERENCE" | "WRONG_CONFIGURATION";
}

export interface ComparableValidationResult {
  readonly accepted: readonly DealerComparable[];
  readonly rejected: readonly ComparableRejection[];
  readonly averageLowDealerComp: number | null;
}

export function validateDealerComparables(input: {
  readonly reference: string;
  readonly configuration: string;
  readonly comparables: readonly DealerComparable[];
}): ComparableValidationResult {
  const reference = normalizeToken(input.reference);
  const configuration = normalizeComparable(input.configuration);
  const accepted: DealerComparable[] = [];
  const rejected: ComparableRejection[] = [];

  for (const comp of input.comparables) {
    let reason: ComparableRejection["reason"] | null = null;
    if (!comp.valid || !Number.isFinite(comp.lowDealerValue) || comp.lowDealerValue <= 0) {
      reason = "INVALID_COMP";
    } else if (normalizeToken(comp.reference) !== reference) {
      reason = "WRONG_REFERENCE";
    } else if (normalizeComparable(comp.configuration) !== configuration) {
      reason = "WRONG_CONFIGURATION";
    }

    if (reason) rejected.push(Object.freeze({ comp, reason }));
    else accepted.push(comp);
  }

  const averageLowDealerComp = accepted.length
    ? Math.round(accepted.reduce((sum, comp) => sum + comp.lowDealerValue, 0) / accepted.length)
    : null;

  return Object.freeze({
    accepted: Object.freeze(accepted),
    rejected: Object.freeze(rejected),
    averageLowDealerComp,
  });
}

const knownBrands = [
  "Rolex",
  "Audemars Piguet",
  "Patek Philippe",
  "Vacheron Constantin",
  "A. Lange & S\u00f6hne",
  "F.P. Journe",
  "Richard Mille",
  "Cartier",
  "Omega",
  "Grand Seiko",
  "Jaeger-LeCoultre",
] as const;

const knownDialColors = [
  "black",
  "blue",
  "white",
  "green",
  "silver",
  "champagne",
  "rhodium",
  "ice blue",
  "polar",
] as const;

const sportTerms = [
  "submariner",
  "daytona",
  "gmt",
  "explorer",
  "sea-dweller",
  "yacht-master",
  "offshore",
  "chronograph",
  "sports",
  "sport",
  "diver",
  "professional",
] as const;

const clampScore = (value: number): number =>
  Math.max(0, Math.min(100, Math.round(value)));

const normalizeText = (value: string | undefined): string =>
  (value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const normalizeComparable = (value: string | undefined): string =>
  normalizeText(value).replace(/[^a-z0-9]+/g, " ").trim();

const normalizeToken = (value: string | undefined): string =>
  normalizeText(value).replace(/[^a-z0-9]+/g, "");

const scoreMetric = (value: number | undefined): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return undefined;
  }

  return clampScore(value <= 5 ? value * 20 : value);
};

const textSignalScore = (value: string | undefined): number => {
  const normalized = normalizeComparable(value);

  if (!normalized) return 50;
  if (normalized.includes("extreme")) return 100;
  if (normalized.includes("very high")) return 90;
  if (normalized.includes("high")) return 78;
  if (normalized.includes("moderate to high")) return 70;
  if (normalized.includes("moderate")) return 62;
  if (normalized.includes("medium")) return 55;
  if (normalized.includes("specialized")) return 48;
  if (normalized.includes("low")) return 30;

  return 50;
};

const averageScores = (scores: readonly number[]): number => {
  if (scores.length === 0) return 50;

  return clampScore(
    scores.reduce((total, score) => total + score, 0) / scores.length
  );
};

export function getEstimatedWatchPrice(asset: QuestLuxoAsset): number | null {
  const prices = (asset.configurations ?? [])
    .map((configuration) => configuration.originalMSRP)
    .filter(
      (price): price is number =>
        typeof price === "number" && Number.isFinite(price) && price > 0
    );

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
}

export function filterWatchesByBudget<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  assets: readonly TAsset[],
  maxBudget: number,
  includeUnknownPrice = false
): readonly TAsset[] {
  return Object.freeze(
    assets.filter((asset) => {
      const estimatedPrice = getEstimatedWatchPrice(asset);

      if (estimatedPrice === null) {
        return includeUnknownPrice;
      }

      return estimatedPrice <= maxBudget;
    })
  );
}

export function filterWatchesByBrand<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(assets: readonly TAsset[], brand: string): readonly TAsset[] {
  const brandToken = normalizeToken(brand);

  return Object.freeze(
    assets.filter((asset) => normalizeToken(asset.brand) === brandToken)
  );
}

export function filterWatchesByCollection<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(assets: readonly TAsset[], collection: string): readonly TAsset[] {
  const collectionToken = normalizeToken(collection);

  return Object.freeze(
    assets.filter(
      (asset) => normalizeToken(asset.collection) === collectionToken
    )
  );
}

export function getInvestmentScore(asset: QuestLuxoAsset): number {
  const intelligence = asset.intelligence;
  const scores = [
    scoreMetric(intelligence?.collectorDemand),
    scoreMetric(intelligence?.collectability),
    scoreMetric(intelligence?.allocationDifficulty),
    scoreMetric(intelligence?.brandPower),
    textSignalScore(asset.allocationDifficulty),
    textSignalScore(asset.marketPosition),
  ].filter((score): score is number => typeof score === "number");

  return averageScores(scores);
}

export function getLiquidityScore(asset: QuestLuxoAsset): number {
  return averageScores([
    scoreMetric(asset.intelligence?.liquidity) ?? textSignalScore(asset.liquidity),
    textSignalScore(asset.liquidity),
  ]);
}

export function getMarketPosition(asset: QuestLuxoAsset): WatchMarketPosition {
  const marketPosition = normalizeComparable(asset.marketPosition);
  const liquidity = normalizeComparable(asset.liquidity);
  const allocation = normalizeComparable(asset.allocationDifficulty);

  if (
    marketPosition.includes("flagship") ||
    marketPosition.includes("trophy") ||
    liquidity.includes("extreme")
  ) {
    return "Trophy";
  }

  if (
    marketPosition.includes("high demand") ||
    liquidity.includes("very high") ||
    allocation.includes("very high") ||
    allocation.includes("extreme")
  ) {
    return "High Demand";
  }

  if (
    marketPosition.includes("core") ||
    marketPosition.includes("entry") ||
    marketPosition.includes("daily")
  ) {
    return "Core";
  }

  if (marketPosition || liquidity || allocation) {
    return "Specialized";
  }

  return "Research Pending";
}

export function parseWatchIntent(query: string): WatchIntent {
  const normalized = normalizeComparable(query);
  const maxBudgetMatch = normalized.match(
    /\b(?:under|below|less than|up to|max|budget)\s*(?:usd|dollars)?\s*(\d+(?:[,\s]\d{3})*|\d+)(k)?\b/
  );
  const numericBudget = maxBudgetMatch
    ? Number(maxBudgetMatch[1].replace(/[,\s]/g, ""))
    : undefined;
  const maxBudget =
    numericBudget && maxBudgetMatch?.[2] === "k"
      ? numericBudget * 1000
      : numericBudget;
  const matchedBrand = knownBrands.find((brand) =>
    normalized.includes(normalizeComparable(brand))
  );
  const matchedDial = knownDialColors.find((dialColor) =>
    normalized.includes(dialColor)
  );
  const wantsInvestment =
    normalized.includes("best investment") ||
    normalized.includes("investment") ||
    normalized.includes("collectible");
  const wantsDaily =
    normalized.includes("daily") ||
    normalized.includes("everyday") ||
    normalized.includes("wear");
  const wantsSports = sportTerms.some((term) => normalized.includes(term));
  const keywords = normalized.split(" ").filter(Boolean);

  return Object.freeze({
    query,
    maxBudget,
    brand: matchedBrand,
    dialColor: matchedDial,
    useCase: wantsInvestment
      ? "investment"
      : wantsDaily
        ? "daily"
        : wantsSports
          ? "sports"
          : undefined,
    rankingMode: wantsInvestment ? "investment" : "relevance",
    keywords: Object.freeze(keywords),
  });
}

export function scoreWatchAsset(
  input: WatchIntelligenceInput,
  intent: WatchIntent | null = null
): WatchIntelligenceScores {
  const investmentScore = getInvestmentScore(input.asset);
  const liquidityScore = getLiquidityScore(input.asset);
  const marketScore = averageScores([
    investmentScore,
    liquidityScore,
    textSignalScore(input.asset.allocationDifficulty),
  ]);
  const relevanceScore = getIntentRelevanceScore(input.asset, intent);

  return Object.freeze({
    investmentScore,
    liquidityScore,
    marketScore,
    relevanceScore,
    overallScore: averageScores([
      investmentScore,
      liquidityScore,
      marketScore,
      relevanceScore,
    ]),
  });
}

export function createWatchRecommendation<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  input: WatchIntelligenceInput<TAsset>,
  intent: WatchIntent | null = null
): WatchRecommendation<TAsset> {
  const scores = scoreWatchAsset(input, intent);
  const brand = input.brand ?? input.asset.brand ?? "Unknown Brand";
  const collection =
    input.collection ?? input.asset.collection ?? "Unknown Collection";

  return Object.freeze({
    asset: Object.freeze({ ...input.asset }) as Readonly<TAsset>,
    brand,
    collection,
    reference: input.asset.reference,
    model: input.asset.model,
    estimatedPrice: input.estimatedPrice ?? getEstimatedWatchPrice(input.asset),
    marketPosition: getMarketPosition(input.asset),
    scores,
    matchedIntent: intent,
    reasons: Object.freeze(buildRecommendationReasons(input.asset, scores)),
  });
}

export function rankWatchAssets<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  options: RankWatchAssetsOptions<TAsset>
): readonly WatchRecommendation<TAsset>[] {
  const intent =
    typeof options.intent === "string"
      ? parseWatchIntent(options.intent)
      : options.intent ?? null;
  const filteredAssets = applyIntentFilters(
    options.assets,
    intent,
    options.includeUnknownPrice
  );
  const rankingMode = options.rankingMode ?? intent?.rankingMode ?? "relevance";
  const recommendations = filteredAssets.map((asset) =>
    createWatchRecommendation({ asset }, intent)
  );

  return Object.freeze(
    recommendations.sort((first, second) => {
      const firstScore = getSortableScore(first, rankingMode);
      const secondScore = getSortableScore(second, rankingMode);

      if (secondScore !== firstScore) {
        return secondScore - firstScore;
      }

      return second.scores.overallScore - first.scores.overallScore;
    })
  );
}

function applyIntentFilters<TAsset extends QuestLuxoAsset>(
  assets: readonly TAsset[],
  intent: WatchIntent | null,
  includeUnknownPrice = false
): readonly TAsset[] {
  if (!intent) {
    return assets;
  }

  let filtered: readonly TAsset[] = assets;

  if (intent.maxBudget) {
    filtered = filterWatchesByBudget(
      filtered,
      intent.maxBudget,
      includeUnknownPrice
    );
  }

  if (intent.brand) {
    filtered = filterWatchesByBrand(filtered, intent.brand);
  }

  if (intent.collection) {
    filtered = filterWatchesByCollection(filtered, intent.collection);
  }

  if (intent.dialColor) {
    filtered = Object.freeze(
      filtered.filter((asset) => hasDialColor(asset, intent.dialColor ?? ""))
    );
  }

  if (intent.useCase === "daily") {
    filtered = Object.freeze(
      filtered.filter((asset) => getDailyScore(asset) >= 65)
    );
  }

  if (intent.useCase === "sports") {
    filtered = Object.freeze(filtered.filter(isSportsWatch));
  }

  return filtered;
}

function getIntentRelevanceScore(
  asset: QuestLuxoAsset,
  intent: WatchIntent | null
): number {
  if (!intent) {
    return 50;
  }

  const scores: number[] = [];

  if (intent.brand) {
    scores.push(normalizeToken(asset.brand) === normalizeToken(intent.brand) ? 100 : 0);
  }

  if (intent.collection) {
    scores.push(
      normalizeToken(asset.collection) === normalizeToken(intent.collection)
        ? 100
        : 0
    );
  }

  if (intent.dialColor) {
    scores.push(hasDialColor(asset, intent.dialColor) ? 100 : 0);
  }

  if (intent.maxBudget) {
    const estimatedPrice = getEstimatedWatchPrice(asset);
    scores.push(
      estimatedPrice !== null && estimatedPrice <= intent.maxBudget ? 100 : 0
    );
  }

  if (intent.useCase === "investment") {
    scores.push(getInvestmentScore(asset));
  }

  if (intent.useCase === "daily") {
    scores.push(getDailyScore(asset));
  }

  if (intent.useCase === "sports") {
    scores.push(isSportsWatch(asset) ? 90 : 35);
  }

  return averageScores(scores);
}

function getDailyScore(asset: QuestLuxoAsset): number {
  return averageScores([
    scoreMetric(asset.intelligence?.wearability) ?? 60,
    scoreMetric(asset.intelligence?.versatility) ?? 60,
    textSignalScore(asset.liquidity),
  ]);
}

function hasDialColor(asset: QuestLuxoAsset, dialColor: string): boolean {
  const dialToken = normalizeComparable(dialColor);

  return (asset.configurations ?? []).some((configuration) =>
    normalizeComparable(configuration.dial).includes(dialToken)
  );
}

function isSportsWatch(asset: QuestLuxoAsset): boolean {
  const searchableText = normalizeComparable(
    [
      asset.collection,
      asset.model,
      asset.marketPosition,
      asset.questLuxoView,
      asset.bezel,
    ].join(" ")
  );

  return sportTerms.some((term) => searchableText.includes(term));
}

function getSortableScore(
  recommendation: WatchRecommendation,
  rankingMode: WatchRankingMode
): number {
  if (rankingMode === "investment") {
    return recommendation.scores.investmentScore;
  }

  if (rankingMode === "liquidity") {
    return recommendation.scores.liquidityScore;
  }

  return recommendation.scores.relevanceScore;
}

function buildRecommendationReasons(
  asset: QuestLuxoAsset,
  scores: WatchIntelligenceScores
): string[] {
  const reasons: string[] = [];

  if (scores.investmentScore >= 85) {
    reasons.push("Strong investment profile");
  }

  if (scores.liquidityScore >= 85) {
    reasons.push("High liquidity signal");
  }

  if (getDailyScore(asset) >= 80) {
    reasons.push("Strong daily-wear fit");
  }

  if (getMarketPosition(asset) === "Trophy") {
    reasons.push("Trophy-market positioning");
  }

  if (reasons.length === 0) {
    reasons.push("Balanced market profile");
  }

  return reasons;
}
