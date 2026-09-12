import { ulysseNardinCollections } from "../../data/ulysse-nardin";
import { ulysseNardinReferenceAssets } from "../../data/ulysse-nardin-references";
import type { QuestLuxoAsset } from "../../types/questLuxo";
import { getFactoryCollectionPath } from "../factory/brandFactory";
import { buildReferencePath } from "../factory/referenceGenerator";
import {
  createSearchIndexRecord,
  type SearchableWatchRecord,
} from "./searchIndexGenerator";

const brand = "Ulysse Nardin";

export const ulysseNardinCollectionSearchRecords = Object.freeze(
  ulysseNardinCollections.map((collection) => {
    // Collection search documents make the landing pages discoverable without
    // creating synthetic reference pages or adding placeholder watch records.
    const searchAsset = Object.freeze({
      reference: `${collection.name} Collection`,
      model: collection.models.join(", "),
      brand,
      collection: collection.name,
      configurations: Object.freeze(
        collection.models.map((model) => Object.freeze({ nickname: model }))
      ),
      productionStatus: collection.status,
      marketPosition: collection.intelligence.marketPositioning,
      liquidity: "Reference and configuration dependent",
      allocationDifficulty: "Reference dependent",
      questLuxoView: collection.intelligence.perspective,
    } satisfies QuestLuxoAsset);

    return createSearchIndexRecord({
      asset: searchAsset,
      brand,
      collection: collection.name,
      pageType: "collection",
      url: getFactoryCollectionPath(brand, collection.name),
      category: collection.category,
      positioning: [
        collection.tagline,
        collection.description,
        collection.intelligence.historicalOverview,
        collection.intelligence.technicalHighlights,
        collection.intelligence.collectorProfile,
        collection.intelligence.buyingConsiderations,
        collection.intelligence.ownershipExperience,
        collection.intelligence.servicingConsiderations,
        collection.intelligence.liquidityObservations,
        collection.intelligence.relatedCollections,
      ],
      brokerageNotes: collection.intelligence.brokerageConsiderations,
    });
  })
) satisfies readonly SearchableWatchRecord<QuestLuxoAsset>[];

export const ulysseNardinReferenceSearchRecords = Object.freeze(
  ulysseNardinReferenceAssets.map((asset) => {
    const collection = ulysseNardinCollections.find(
      (candidate) => candidate.slug === asset.collectionSlug
    );

    return createSearchIndexRecord({
      asset,
      brand,
      collection: asset.collection,
      pageType: "reference",
      url: buildReferencePath("ulysse-nardin", asset.collectionSlug, asset.reference),
      category: collection?.category,
      positioning: [
        asset.collectorNotes ?? "",
        asset.brokerageIntelligence?.buyerGuidance ?? "",
        asset.brokerageIntelligence?.marketCommentary ?? "",
        asset.brokerageIntelligence?.history ?? "",
        asset.brokerageIntelligence?.innovations ?? "",
        asset.brokerageIntelligence?.collectorAppeal ?? "",
        asset.brokerageIntelligence?.complications ?? "",
        asset.brokerageIntelligence?.buyingConsiderations ?? "",
        asset.brokerageIntelligence?.ownershipExperience ?? "",
        asset.brokerageIntelligence?.relatedCollections ?? "",
      ],
      brokerageNotes: asset.brokerageIntelligence?.brokerageOpportunities,
    });
  })
) satisfies readonly SearchableWatchRecord<QuestLuxoAsset>[];

export const ulysseNardinSearchRecords = Object.freeze([
  ...ulysseNardinCollectionSearchRecords,
  ...ulysseNardinReferenceSearchRecords,
]) satisfies readonly SearchableWatchRecord<QuestLuxoAsset>[];

export function getUlysseNardinCollectionSearchRecords(): readonly SearchableWatchRecord<QuestLuxoAsset>[] {
  return ulysseNardinCollectionSearchRecords;
}
