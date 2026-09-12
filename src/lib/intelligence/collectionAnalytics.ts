import {
  buildQuestLuxoIntelligence,
  type IntelligenceMetrics,
} from "./questLuxoIntelligence";

import type { QuestLuxoAsset } from "../../types/questLuxo";

export interface CollectionAnalytics {
  referenceCount: number;
  currentProduction: number;
  discontinued: number;
  averageScore: number;
  highestScore: number;
  averageLiquidity: number;
  peakDemand: number;
  topReference: QuestLuxoAsset | null;
  rankedAssets: QuestLuxoAsset[];
}

export function buildCollectionAnalytics(
  assets: QuestLuxoAsset[]
): CollectionAnalytics {
  const rankedAssets = [...assets].sort((a, b) => {
    const scoreA = a.intelligence
      ? buildQuestLuxoIntelligence(a.intelligence).overallScore
      : 0;

    const scoreB = b.intelligence
      ? buildQuestLuxoIntelligence(b.intelligence).overallScore
      : 0;

    return scoreB - scoreA;
  });

  const scores = rankedAssets.map((asset) =>
    asset.intelligence
      ? buildQuestLuxoIntelligence(asset.intelligence).overallScore
      : 0
  );

  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : 0;

  const averageLiquidity =
    assets.length > 0
      ? assets.reduce(
          (sum, asset) => sum + (asset.intelligence?.liquidity ?? 0),
          0
        ) / assets.length
      : 0;

  return {
    referenceCount: assets.length,

    currentProduction: assets.filter(
      (asset) => asset.productionStatus === "Current Production"
    ).length,

    discontinued: assets.filter(
      (asset) => asset.productionStatus === "Discontinued"
    ).length,

    peakDemand: assets.filter(
      (asset) => (asset.intelligence?.collectorDemand ?? 0) >= 5
    ).length,

    averageScore: Math.round(averageScore),

    highestScore: scores.length > 0 ? Math.max(...scores) : 0,

    averageLiquidity: Number(averageLiquidity.toFixed(1)),

    topReference: rankedAssets[0] ?? null,

    rankedAssets,
  };
}