import type { QuestLuxoAsset } from "../../types/questLuxo";

export interface QuestLuxoCollection {
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
    asset => (asset.intelligence?.collectorDemand ?? 0) >= 5
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

  const metrics = collection.assets
    .map(a => a.intelligence)
    .filter((metric): metric is NonNullable<typeof metric> => Boolean(metric));

  if (!metrics.length) return [];

  return [
    {
      label: "Collector Demand",
      score: average(metrics.map(m => m.collectorDemand ?? 0)),
    },
    {
      label: "Liquidity",
      score: average(metrics.map(m => m.liquidity ?? 0)),
    },
    {
      label: "Wearability",
      score: average(metrics.map(m => m.wearability ?? 0)),
    },
    {
      label: "Collectability",
      score: average(metrics.map(m => m.collectability ?? 0)),
    },
    {
      label: "Allocation Difficulty",
      score: average(metrics.map(m => m.allocationDifficulty ?? 0)),
    },
    {
      label: "Versatility",
      score: average(metrics.map(m => m.versatility ?? 0)),
    },
  ];
}
