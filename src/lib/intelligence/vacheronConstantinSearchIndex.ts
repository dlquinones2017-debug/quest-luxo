import type { QuestLuxoAsset } from "../../types/questLuxo";
import {
  vacheronConstantinBrandFoundation,
  vacheronConstantinOverseasCollection,
  vacheronConstantinOverseasReferenceAssets,
  vacheronConstantinOverseasReferenceMetadata,
  vacheronConstantinOverseasReferences,
  type VacheronConstantinOverseasReferenceAsset,
} from "../../data/brands/vacheron-constantin";
import {
  createSearchIndexRecord,
  type SearchableWatchRecord,
} from "./searchIndexGenerator";

const overseasCollectionPath = "/collections/vacheron-constantin/overseas";

const overseasCollectionSearchAsset = Object.freeze({
  reference: "Overseas Collection",
  model: "Overseas Collection Page",
  brand: "Vacheron Constantin",
  collection: "Overseas",
  configurations: Object.freeze([
    Object.freeze({
      nickname: "Luxury Integrated Sports Watch",
      bracelet: "Integrated Bracelet with Interchangeable Strap System",
      dial: "Blue dial demand and reference family dependent",
      originalMSRP: null,
    }),
  ]),
  material: "Steel, precious metals, and reference family dependent",
  bezel: "Overseas integrated bezel",
  productionStatus: "Public Collection Page",
  marketPosition:
    vacheronConstantinOverseasCollection.intelligence.marketPositioning,
  liquidity:
    vacheronConstantinOverseasCollection.intelligence.liquidityAssessment,
  allocationDifficulty:
    vacheronConstantinOverseasCollection.intelligence.allocationDifficulty,
  questLuxoView:
    vacheronConstantinOverseasCollection.intelligence.questLuxoOverview,
  intelligence: Object.freeze({
    collectorDemand: 5,
    liquidity: 4,
    wearability: 5,
    collectability: 5,
    allocationDifficulty: 4,
    versatility: 5,
    brokerOpportunity: 5,
  }),
} satisfies QuestLuxoAsset);

export const vacheronConstantinOverseasCollectionSearchRecord =
  createSearchIndexRecord({
    asset: overseasCollectionSearchAsset,
    brand: vacheronConstantinBrandFoundation.name,
    collection: vacheronConstantinBrandFoundation.flagshipCollection,
    pageType: "collection",
    url: overseasCollectionPath,
    category: vacheronConstantinOverseasCollection.category,
    positioning: vacheronConstantinOverseasCollection.positioning,
    brokerageNotes:
      vacheronConstantinBrandFoundation.questLuxoPositioning
        .overseasBrokerageOpportunity,
  });

export const vacheronConstantinOverseasReferenceSearchRecords = Object.freeze(
  vacheronConstantinOverseasReferenceAssets.map((asset, index) => {
    const reference = vacheronConstantinOverseasReferences.find(
      (item) => item.referenceFamily === asset.referenceFamily
    );
    const metadata = vacheronConstantinOverseasReferenceMetadata[index];

    return createSearchIndexRecord({
      asset,
      brand: vacheronConstantinBrandFoundation.name,
      collection: vacheronConstantinBrandFoundation.flagshipCollection,
      pageType: "reference",
      url: metadata?.referencePath,
      category: vacheronConstantinOverseasCollection.category,
      positioning: [
        ...vacheronConstantinOverseasCollection.positioning,
        reference?.complication ?? "",
        reference?.targetBuyer ?? "",
        reference?.collectorAppeal ?? "",
        reference?.sourcingConsiderations ?? "",
      ],
      brokerageNotes: reference?.brokerageNotes,
    });
  })
) satisfies readonly SearchableWatchRecord<VacheronConstantinOverseasReferenceAsset>[];

export const vacheronConstantinOverseasSearchRecords = Object.freeze([
  vacheronConstantinOverseasCollectionSearchRecord,
  ...vacheronConstantinOverseasReferenceSearchRecords,
]) satisfies readonly SearchableWatchRecord<QuestLuxoAsset>[];

export function getVacheronConstantinOverseasSearchRecords(): readonly SearchableWatchRecord<QuestLuxoAsset>[] {
  return vacheronConstantinOverseasSearchRecords;
}
