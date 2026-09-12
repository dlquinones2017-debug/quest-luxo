import type { QuestLuxoAsset } from "../../types/questLuxo";
import { cartierBrandFoundation } from "../../data/brands/cartier";
import {
  cartierSantosCollection,
  cartierSantosReferenceAssets,
  cartierSantosReferenceFamilies,
  cartierSantosReferenceMetadata,
  type CartierSantosReferenceAsset,
} from "../../data/brands/cartier/santos";
import {
  createSearchIndexRecord,
  type SearchableWatchRecord,
} from "./searchIndexGenerator";

const santosCollectionPath = "/collections/cartier/santos";

const santosCollectionSearchAsset = Object.freeze({
  reference: "Santos Collection",
  model: "Santos Collection Page",
  brand: "Cartier",
  collection: "Santos",
  configurations: Object.freeze([
    Object.freeze({
      nickname: "Iconic luxury design watch",
      bracelet: "QuickSwitch bracelet and strap system",
      dial: "Reference family dependent",
      originalMSRP: null,
    }),
  ]),
  material: "Steel, two-tone, ADLC, precious metals, and reference family dependent",
  bezel: "Cartier Santos square bezel",
  productionStatus: "Public Collection Page",
  marketPosition: cartierSantosCollection.intelligence.marketPositioning,
  liquidity: cartierSantosCollection.intelligence.liquidityAssessment,
  allocationDifficulty:
    cartierSantosCollection.intelligence.allocationDemandDifficulty,
  questLuxoView: cartierSantosCollection.intelligence.questLuxoOverview,
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

export const cartierSantosCollectionSearchRecord = createSearchIndexRecord({
  asset: santosCollectionSearchAsset,
  brand: cartierBrandFoundation.name,
  collection: cartierBrandFoundation.flagshipCollection,
  pageType: "collection",
  url: santosCollectionPath,
  category: cartierSantosCollection.category,
  positioning: [
    ...cartierSantosCollection.positioning,
    cartierSantosCollection.intelligence.collectorProfile,
    cartierSantosCollection.intelligence.marketPositioning,
    cartierSantosCollection.intelligence.ownershipExperience,
    cartierSantosCollection.intelligence.buyingRecommendations,
  ],
  brokerageNotes: cartierBrandFoundation.brandIntelligence.brokerageOpportunity,
});

export const cartierSantosReferenceSearchRecords = Object.freeze(
  cartierSantosReferenceAssets.map((asset, index) => {
    const reference = cartierSantosReferenceFamilies.find(
      (item) => item.referenceFamily === asset.referenceFamily
    );
    const metadata = cartierSantosReferenceMetadata[index];

    return createSearchIndexRecord({
      asset,
      brand: cartierBrandFoundation.name,
      collection: cartierBrandFoundation.flagshipCollection,
      pageType: "reference",
      url: metadata?.referencePath,
      category: cartierSantosCollection.category,
      positioning: [
        ...cartierSantosCollection.positioning,
        reference?.caseProfile ?? "",
        reference?.targetBuyer ?? "",
        reference?.collectorAppeal ?? "",
        reference?.sourcingConsiderations ?? "",
        reference?.intelligenceSummary ?? "",
      ],
      brokerageNotes: reference?.brokerageNotes,
    });
  })
) satisfies readonly SearchableWatchRecord<CartierSantosReferenceAsset>[];

export const cartierSantosSearchRecords = Object.freeze([
  cartierSantosCollectionSearchRecord,
  ...cartierSantosReferenceSearchRecords,
]) satisfies readonly SearchableWatchRecord<QuestLuxoAsset>[];

export function getCartierSantosSearchRecords(): readonly SearchableWatchRecord<QuestLuxoAsset>[] {
  return cartierSantosSearchRecords;
}
