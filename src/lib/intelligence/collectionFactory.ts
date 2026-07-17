import type { IntelligenceMetrics } from "./questLuxoIntelligence";

export interface QuestLuxoConfiguration {
  nickname: string;
  dial?: string;
  bracelet?: string;
  originalMSRP: number | null;
}

export interface QuestLuxoAsset {
  reference: string;
  model: string;
  brand: string;
  collection: string;

  configurations: QuestLuxoConfiguration[];

  material: string;
  bezel?: string;

  productionStatus: string;
  discontinuedYear?: number;

  marketPosition: string;

  liquidity: string;
  allocationDifficulty: string;

  questLuxoView: string;

  intelligence: IntelligenceMetrics;

  image?: string;
}

export interface QuestLuxoCollection {
  brand: string;
  collection: string;
  assets: QuestLuxoAsset[];
}

export function buildCollectionSummary(
  collection: QuestLuxoCollection
) {
  const assets = collection.assets;

  const current = assets.filter(
    asset => asset.productionStatus === "Current"
  );

  const discontinued = assets.filter(
    asset => asset.productionStatus === "Discontinued"
  );

  const highestDemand = assets.filter(
    asset => asset.intelligence.collectorDemand >= 5
  );

  return {
    totalAssets: assets.length,

    currentReferences: current.length,

    discontinuedReferences: discontinued.length,

    peakDemandReferences: highestDemand.length,
  };
}

export function buildCollectionSignals(
  collection: QuestLuxoCollection
) {
  const average = (values: number[]) =>
    Math.round(
      values.reduce((a, b) => a + b, 0) / values.length
    );

  const metrics = collection.assets.map(a => a.intelligence);

  return [
    {
      label: "Collector Demand",
      score: average(metrics.map(m => m.collectorDemand)),
    },
    {
      label: "Liquidity",
      score: average(metrics.map(m => m.liquidity)),
    },
    {
      label: "Wearability",
      score: average(metrics.map(m => m.wearability)),
    },
    {
      label: "Collectability",
      score: average(metrics.map(m => m.collectability)),
    },
    {
      label: "Allocation Difficulty",
      score: average(metrics.map(m => m.allocationDifficulty)),
    },
    {
      label: "Versatility",
      score: average(metrics.map(m => m.versatility)),
    },
  ];
}