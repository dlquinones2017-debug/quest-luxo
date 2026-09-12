import type { QuestLuxoAsset } from "../../types/questLuxo";
import {
  getEstimatedWatchPrice,
  parseWatchIntent,
  rankWatchAssets,
  type WatchIntent,
  type WatchRecommendation,
} from "./watchIntelligenceEngine";

export interface SearchableWatchFacets {
  readonly brand: readonly string[];
  readonly collection: readonly string[];
  readonly reference: readonly string[];
  readonly material: readonly string[];
  readonly dial: readonly string[];
  readonly bezel: readonly string[];
  readonly productionStatus: readonly string[];
  readonly marketPosition: readonly string[];
  readonly liquidity: readonly string[];
  readonly allocationDifficulty: readonly string[];
}

export interface SearchIndexRecordConfig<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly asset: TAsset;
  readonly brand?: string;
  readonly collection?: string;
  readonly pageType?: SearchIndexPageType;
  readonly url?: string;
  readonly category?: string;
  readonly positioning?: string | readonly string[];
  readonly brokerageNotes?: string;
}

export interface SearchIndexGenerationConfig<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly assets: readonly TAsset[];
  readonly defaultBrand?: string;
  readonly defaultCollection?: string;
}

export interface SearchableWatchRecord<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly id: string;
  readonly pageType: SearchIndexPageType;
  readonly url: string | null;
  readonly brand: string;
  readonly collection: string;
  readonly reference: string;
  readonly model: string;
  readonly category: string | null;
  readonly positioning: readonly string[];
  readonly brokerageNotes: string | null;
  readonly estimatedPrice: number | null;
  readonly facets: SearchableWatchFacets;
  readonly keywords: readonly string[];
  readonly searchText: string;
  readonly asset: Readonly<TAsset>;
}

export type SearchIndexPageType = "watch" | "collection" | "reference";

export interface SearchWatchRecordsOptions<
  TRecord extends SearchableWatchRecord = SearchableWatchRecord
> {
  readonly records: readonly TRecord[];
  readonly query: string;
  readonly includeUnknownPrice?: boolean;
  readonly rankResults?: boolean;
}

export interface RankedSearchResult<
  TRecord extends SearchableWatchRecord = SearchableWatchRecord
> {
  readonly record: TRecord;
  readonly recommendation: WatchRecommendation;
  readonly matchScore: number;
}

const splitTerms = (value: string): readonly string[] =>
  normalizeSearchableText(value).split(" ").filter(Boolean);

const ignoredSearchTerms = new Set([
  "best",
  "below",
  "collectable",
  "collectible",
  "daily",
  "everyday",
  "for",
  "investment",
  "investments",
  "less",
  "sport",
  "sports",
  "than",
  "to",
  "under",
  "up",
  "watch",
  "watches",
  "with",
]);

const uniqueValues = (values: readonly (string | undefined)[]): readonly string[] =>
  Object.freeze(
    Array.from(
      new Set(
        values
          .map((value) => value?.trim())
          .filter((value): value is string => Boolean(value))
      )
    )
  );

const normalizeFacetValue = (value: string): string =>
  normalizeSearchableText(value).replace(/\s+/g, " ").trim();

const normalizeOptionalText = (value: string | undefined): string | null => {
  const trimmed = value?.trim();

  return trimmed ? trimmed : null;
};

const normalizePositioning = (
  value: string | readonly string[] | undefined
): readonly string[] =>
  Object.freeze(
    (Array.isArray(value) ? value : value ? [value] : [])
      .map((item) => item.trim())
      .filter(Boolean)
  );

export function normalizeSearchableText(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchKeywords(asset: QuestLuxoAsset): readonly string[] {
  const configurationTerms = (asset.configurations ?? []).flatMap(
    (configuration) => [
      configuration.nickname,
      configuration.bracelet,
      configuration.dial,
    ]
  );

  return Object.freeze(
    Array.from(
      new Set(
        [
          asset.brand,
          asset.collection,
          asset.reference,
          asset.model,
          asset.material,
          asset.bezel,
          asset.productionStatus,
          asset.marketPosition,
          asset.liquidity,
          asset.allocationDifficulty,
          ...configurationTerms,
        ].flatMap((value) => splitTerms(value ?? ""))
      )
    )
  );
}

export function buildSearchFacets(
  asset: QuestLuxoAsset,
  defaultBrand?: string,
  defaultCollection?: string
): SearchableWatchFacets {
  const dials = uniqueValues(
    (asset.configurations ?? []).map((configuration) => configuration.dial)
  );

  return Object.freeze({
    brand: uniqueValues([asset.brand, defaultBrand]).map(normalizeFacetValue),
    collection: uniqueValues([asset.collection, defaultCollection]).map(
      normalizeFacetValue
    ),
    reference: uniqueValues([asset.reference]).map(normalizeFacetValue),
    material: uniqueValues([asset.material]).map(normalizeFacetValue),
    dial: dials.map(normalizeFacetValue),
    bezel: uniqueValues([asset.bezel]).map(normalizeFacetValue),
    productionStatus: uniqueValues([asset.productionStatus]).map(
      normalizeFacetValue
    ),
    marketPosition: uniqueValues([asset.marketPosition]).map(
      normalizeFacetValue
    ),
    liquidity: uniqueValues([asset.liquidity]).map(normalizeFacetValue),
    allocationDifficulty: uniqueValues([asset.allocationDifficulty]).map(
      normalizeFacetValue
    ),
  });
}

export function createSearchIndexRecord<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  config: SearchIndexRecordConfig<TAsset>
): SearchableWatchRecord<TAsset> {
  const brand = config.brand ?? config.asset.brand ?? "Unknown Brand";
  const collection =
    config.collection ?? config.asset.collection ?? "Unknown Collection";
  const category = normalizeOptionalText(config.category);
  const positioning = normalizePositioning(config.positioning);
  const brokerageNotes = normalizeOptionalText(config.brokerageNotes);
  const facets = buildSearchFacets(config.asset, brand, collection);
  const keywords = buildSearchKeywords({
    ...config.asset,
    brand,
    collection,
  });
  const searchText = normalizeSearchableText(
    [
      brand,
      collection,
      config.asset.reference,
      config.asset.model,
      config.asset.material,
      config.asset.bezel,
      config.asset.productionStatus,
      config.asset.marketPosition,
      config.asset.liquidity,
      config.asset.allocationDifficulty,
      config.asset.questLuxoView,
      category,
      ...positioning,
      brokerageNotes,
      ...keywords,
    ].join(" ")
  );

  return Object.freeze({
    id: `${normalizeFacetValue(brand)}:${normalizeFacetValue(collection)}:${normalizeFacetValue(
      config.asset.reference
    )}`,
    pageType: config.pageType ?? "watch",
    url: normalizeOptionalText(config.url),
    brand,
    collection,
    reference: config.asset.reference,
    model: config.asset.model,
    category,
    positioning,
    brokerageNotes,
    estimatedPrice: getEstimatedWatchPrice(config.asset),
    facets,
    keywords,
    searchText,
    asset: Object.freeze({ ...config.asset }) as Readonly<TAsset>,
  });
}

export function generateSearchIndexRecords<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  config: SearchIndexGenerationConfig<TAsset>
): readonly SearchableWatchRecord<TAsset>[] {
  return Object.freeze(
    config.assets.map((asset) =>
      createSearchIndexRecord({
        asset,
        brand: config.defaultBrand,
        collection: config.defaultCollection,
      })
    )
  );
}

export function filterSearchRecordsByBudget<
  TRecord extends SearchableWatchRecord = SearchableWatchRecord
>(
  records: readonly TRecord[],
  maxBudget: number,
  includeUnknownPrice = false
): readonly TRecord[] {
  return Object.freeze(
    records.filter((record) => {
      if (record.estimatedPrice === null) {
        return includeUnknownPrice;
      }

      return record.estimatedPrice <= maxBudget;
    })
  );
}

export function searchWatchRecords<
  TRecord extends SearchableWatchRecord = SearchableWatchRecord
>(
  options: SearchWatchRecordsOptions<TRecord>
): readonly TRecord[] {
  const intent = parseWatchIntent(options.query);
  const consumedTerms = new Set([
    ...splitTerms(intent.brand ?? ""),
    ...splitTerms(intent.dialColor ?? ""),
  ]);
  const queryTerms = intent.keywords.filter(
    (keyword) =>
      !ignoredSearchTerms.has(keyword) &&
      !consumedTerms.has(keyword) &&
      !/^\d+$/.test(keyword)
  );
  let records = options.records;

  if (intent.maxBudget) {
    records = filterSearchRecordsByBudget(
      records,
      intent.maxBudget,
      options.includeUnknownPrice
    );
  }

  if (intent.brand) {
    const brand = normalizeFacetValue(intent.brand);
    records = Object.freeze(
      records.filter((record) => record.facets.brand.includes(brand))
    );
  }

  if (intent.dialColor) {
    const dialColor = normalizeFacetValue(intent.dialColor);
    records = Object.freeze(
      records.filter((record) =>
        record.facets.dial.some((dial) => dial.includes(dialColor))
      )
    );
  }

  const matchedRecords =
    queryTerms.length === 0
      ? records
      : Object.freeze(
          records.filter((record) =>
            queryTerms.every((term) => record.searchText.includes(term))
          )
        );

  if (options.rankResults === false) {
    return matchedRecords;
  }

  return rankSearchRecordsWithIntelligence(matchedRecords, intent).map(
    (result) => result.record
  );
}

export function rankSearchRecordsWithIntelligence<
  TRecord extends SearchableWatchRecord = SearchableWatchRecord
>(
  records: readonly TRecord[],
  intentOrQuery?: WatchIntent | string
): readonly RankedSearchResult<TRecord>[] {
  const intent =
    typeof intentOrQuery === "string"
      ? parseWatchIntent(intentOrQuery)
      : intentOrQuery;
  const rankedAssets = rankWatchAssets({
    assets: records.map((record) => record.asset),
    intent,
    includeUnknownPrice: true,
  });
  const recordsByReference = new Map(
    records.map((record) => [record.reference, record])
  );

  return Object.freeze(
    rankedAssets.flatMap((recommendation) => {
      const record = recordsByReference.get(recommendation.reference);

      if (!record) {
        return [];
      }

      return [
        Object.freeze({
          record,
          recommendation,
          matchScore: recommendation.scores.relevanceScore,
        }),
      ];
    })
  );
}
