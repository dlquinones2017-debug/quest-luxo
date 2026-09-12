import {
  buildQuestLuxoIntelligence,
  type IntelligenceMetrics,
} from "./questLuxoIntelligence";

import type {
  QuestLuxoAsset,
  QuestLuxoIntelligence,
} from "../../types/questLuxo";

export interface BrandAnalytics {
  totalReferences: number;
  averageScore: number;
  highestScore: number;
  averageLiquidity: number;
  peakDemandReferences: number;
  currentProduction: number;
  discontinued: number;
  topReference: QuestLuxoAsset | null;
  rankedAssets: QuestLuxoAsset[];
}

function normalizeIntelligence(
  intelligence?: QuestLuxoIntelligence
): IntelligenceMetrics {
  return {
    collectorDemand: intelligence?.collectorDemand ?? 0,
    liquidity: intelligence?.liquidity ?? 0,
    wearability: intelligence?.wearability ?? intelligence?.versatility ?? 0,
    collectability: intelligence?.collectability ?? intelligence?.scarcity ?? 0,
    allocationDifficulty:
      intelligence?.allocationDifficulty ?? intelligence?.scarcity ?? 0,
    versatility: intelligence?.versatility ?? intelligence?.wearability ?? 0,
  };
}

function getScore(asset: QuestLuxoAsset): number {
  return buildQuestLuxoIntelligence(
    normalizeIntelligence(asset.intelligence)
  ).overallScore;
}

export function buildBrandAnalytics(
  assets: QuestLuxoAsset[]
): BrandAnalytics {
  const rankedAssets = [...assets].sort((a, b) => getScore(b) - getScore(a));
  const scores = rankedAssets.map((asset) => getScore(asset));

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

  const averageLiquidity =
    assets.length > 0
      ? Number(
          (
            assets.reduce(
              (sum, asset) => sum + (asset.intelligence?.liquidity ?? 0),
              0
            ) / assets.length
          ).toFixed(1)
        )
      : 0;

  return {
    totalReferences: assets.length,
    averageScore,
    highestScore: scores.length ? Math.max(...scores) : 0,
    averageLiquidity,

    peakDemandReferences: assets.filter(
      (asset) => (asset.intelligence?.collectorDemand ?? 0) >= 5
    ).length,

    currentProduction: assets.filter(
      (asset) => asset.productionStatus === "Current Production"
    ).length,

    discontinued: assets.filter(
      (asset) => asset.productionStatus === "Discontinued"
    ).length,

    topReference: rankedAssets[0] ?? null,
    rankedAssets,
  };
}