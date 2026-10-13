import { rolexAssets } from "../../data/rolex";
import { collectionRegistry } from "../../data/collectionRegistry";
import { referencePath } from "../routes/collectionRoutes";
import type { QuestLuxoAsset } from "../../types/questLuxo";
import {
  createSearchIndexRecord,
  generateSearchIndexRecords,
  rankSearchRecordsWithIntelligence,
  searchWatchRecords,
  type RankedSearchResult,
  type SearchableWatchRecord,
} from "./searchIndexGenerator";
import { cartierSantosSearchRecords } from "./cartierSantosSearchIndex";
import { vacheronConstantinOverseasSearchRecords } from "./vacheronConstantinSearchIndex";
import { ulysseNardinSearchRecords } from "./ulysseNardinSearchIndex";
import {
  parseWatchIntent,
  type WatchIntent,
  type WatchRecommendation,
} from "./watchIntelligenceEngine";

export interface AskQuestLuxoInput<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly query: string;
  readonly assets?: readonly TAsset[];
  readonly records?: readonly SearchableWatchRecord<TAsset>[];
  readonly maxResults?: number;
  readonly includeUnknownPrice?: boolean;
  readonly defaultBrand?: string;
  readonly defaultCollection?: string;
}

export interface AskQuestLuxoEmptyState {
  readonly title: string;
  readonly guidance: readonly string[];
  readonly suggestedQueries: readonly string[];
}

export interface AskQuestLuxoAnswer<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly query: string;
  readonly intent: WatchIntent;
  readonly summary: string;
  readonly totalMatches: number;
  readonly records: readonly SearchableWatchRecord<TAsset>[];
  readonly rankedResults: readonly RankedSearchResult<SearchableWatchRecord<TAsset>>[];
  readonly recommendations: readonly WatchRecommendation[];
  readonly emptyState: AskQuestLuxoEmptyState | null;
}

const defaultMaxResults = 5;

const defaultRolexAssets = rolexAssets as readonly QuestLuxoAsset[];

const registrySearchRecords = collectionRegistry.flatMap((collection) =>
  collection.assets.map((asset) =>
    createSearchIndexRecord({
      asset,
      brand: collection.brand,
      collection: collection.name,
      pageType: "reference",
      url: referencePath(collection.brandSlug, collection.slug, asset.reference),
      positioning: [
        collection.description,
        ...collection.intelligenceParagraphs,
        collection.directoryDescription,
      ],
      brokerageNotes: collection.sourcingText,
    })
  )
);

const defaultSearchRecords = Object.freeze([
  ...registrySearchRecords,
  ...vacheronConstantinOverseasSearchRecords,
  ...cartierSantosSearchRecords,
  ...ulysseNardinSearchRecords,
].filter((record, index, records) =>
  records.findIndex((candidate) => candidate.id === record.id) === index
));

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export function getAskQuestLuxoIntent(query: string): WatchIntent {
  return parseWatchIntent(query);
}

export function getAskQuestLuxoRecommendations<
  TRecord extends SearchableWatchRecord = SearchableWatchRecord
>(
  records: readonly TRecord[],
  intent: WatchIntent,
  maxResults = defaultMaxResults
): readonly RankedSearchResult<TRecord>[] {
  return Object.freeze(
    rankSearchRecordsWithIntelligence(records, intent).slice(0, maxResults)
  );
}

export function getAskQuestLuxoEmptyState(
  query: string,
  intent: WatchIntent
): AskQuestLuxoEmptyState {
  const guidance = [
    intent.maxBudget
      ? `Try raising the budget above ${formatCurrency(intent.maxBudget)} or include watches with unknown MSRP.`
      : "Try a broader brand, collection, color, or use-case query.",
    intent.brand
      ? `Search across all brands instead of only ${intent.brand}.`
      : "Try adding a brand such as Rolex.",
    "Try describing your budget, intended role, wrist preferences, brand exclusions, or strap preference.",
  ];

  return Object.freeze({
    title: `No Quest Luxo matches for "${query}".`,
    guidance: Object.freeze(guidance),
    suggestedQueries: Object.freeze([
      "best watches under $5000",
      "best watches under $25000",
      "dressy watches",
      "collectors watches",
      "dive watches",
      "starter watches",
      "I want a networking watch that is not a Rolex, for a large wrist, on a strap",
      "I have $50,000. Recommend a collection for all roles.",
    ]),
  });
}

export function generateAskQuestLuxoSummary(
  query: string,
  intent: WatchIntent,
  recommendations: readonly WatchRecommendation[]
): string {
  if (recommendations.length === 0) {
    return `No matching watches were found for "${query}".`;
  }

  const topRecommendation = recommendations[0];
  const budgetText = intent.maxBudget
    ? ` under ${formatCurrency(intent.maxBudget)}`
    : "";
  const intentText =
    intent.rankingMode === "investment"
      ? " ranked by investment strength"
      : intent.useCase
        ? ` for ${intent.useCase} fit`
        : "";
  const priceText =
    topRecommendation.estimatedPrice !== null
      ? ` with known MSRP around ${formatCurrency(topRecommendation.estimatedPrice)}`
      : " with price research pending";

  return `Found ${recommendations.length} Quest Luxo match${
    recommendations.length === 1 ? "" : "es"
  }${budgetText}${intentText}. Top result: ${topRecommendation.brand} ${
    topRecommendation.reference
  } ${topRecommendation.model}${priceText}.`;
}

export function askQuestLuxo<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  input: AskQuestLuxoInput<TAsset>
): AskQuestLuxoAnswer<TAsset> {
  const intent = getAskQuestLuxoIntent(input.query);
  const shouldUseDefaultSearchRecords =
    !input.assets && !input.defaultBrand && !input.defaultCollection;
  const records =
    input.records ??
    (shouldUseDefaultSearchRecords
      ? (defaultSearchRecords as readonly SearchableWatchRecord<TAsset>[])
      : generateSearchIndexRecords({
          assets: input.assets ?? (defaultRolexAssets as readonly TAsset[]),
          defaultBrand: input.defaultBrand ?? (input.assets ? undefined : "Rolex"),
          defaultCollection: input.defaultCollection,
        }));
  const matchingRecords = searchWatchRecords({
    records,
    query: input.query,
    includeUnknownPrice: input.includeUnknownPrice,
    rankResults: false,
  });
  const rankedResults = getAskQuestLuxoRecommendations(
    matchingRecords,
    intent,
    input.maxResults ?? defaultMaxResults
  );
  const recommendations = Object.freeze(
    rankedResults.map((result) => result.recommendation)
  );
  const emptyState =
    recommendations.length === 0
      ? getAskQuestLuxoEmptyState(input.query, intent)
      : null;

  return Object.freeze({
    query: input.query,
    intent,
    summary: generateAskQuestLuxoSummary(
      input.query,
      intent,
      recommendations
    ),
    totalMatches: matchingRecords.length,
    records: matchingRecords,
    rankedResults,
    recommendations,
    emptyState,
  });
}
