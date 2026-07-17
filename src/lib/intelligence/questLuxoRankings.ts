import {
  buildQuestLuxoIntelligence,
  type IntelligenceMetrics,
} from "./questLuxoIntelligence";

export interface RankableLuxuryAsset {
  reference: string;
  model: string;
  marketPosition: string;
  liquidity: string;
  allocationDifficulty: string;
  questLuxoView: string;
  intelligence?: IntelligenceMetrics;
}

export interface RankedLuxuryAsset<TAsset extends RankableLuxuryAsset> {
  asset: TAsset;
  rank: number;
  overallScore: number;
  grade: string;
  marketStrength: number;
  investmentPotential: number;
  rarityScore: number;
  confidence: number;
}

const getProfile = (asset: RankableLuxuryAsset) => {
  if (!asset.intelligence) return null;

  return buildQuestLuxoIntelligence(asset.intelligence);
};

const rankAssets = <TAsset extends RankableLuxuryAsset>(
  assets: TAsset[],
  getScore: (asset: TAsset) => number,
  limit?: number
): RankedLuxuryAsset<TAsset>[] => {
  const ranked = [...assets]
    .map((asset) => {
      const profile = getProfile(asset);

      return {
        asset,
        profile,
        score: getScore(asset),
      };
    })
    .filter((item) => item.profile && item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      asset: item.asset,
      rank: index + 1,
      overallScore: item.profile!.overallScore,
      grade: item.profile!.grade,
      marketStrength: item.profile!.marketStrength,
      investmentPotential: item.profile!.investmentPotential,
      rarityScore: item.profile!.rarityScore,
      confidence: item.profile!.confidence,
    }));

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
};

export const getTopOverallAssets = <TAsset extends RankableLuxuryAsset>(
  assets: TAsset[],
  limit?: number
) =>
  rankAssets(
    assets,
    (asset) => getProfile(asset)?.overallScore ?? 0,
    limit
  );

export const getBestInvestmentAssets = <TAsset extends RankableLuxuryAsset>(
  assets: TAsset[],
  limit?: number
) =>
  rankAssets(
    assets,
    (asset) => getProfile(asset)?.investmentPotential ?? 0,
    limit
  );

export const getMostLiquidAssets = <TAsset extends RankableLuxuryAsset>(
  assets: TAsset[],
  limit?: number
) =>
  rankAssets(
    assets,
    (asset) => asset.intelligence?.liquidity ?? 0,
    limit
  );

export const getHighestCollectorDemandAssets = <
  TAsset extends RankableLuxuryAsset
>(
  assets: TAsset[],
  limit?: number
) =>
  rankAssets(
    assets,
    (asset) => asset.intelligence?.collectorDemand ?? 0,
    limit
  );

export const getMostExclusiveAssets = <TAsset extends RankableLuxuryAsset>(
  assets: TAsset[],
  limit?: number
) =>
  rankAssets(
    assets,
    (asset) => asset.intelligence?.allocationDifficulty ?? 0,
    limit
  );

export const getBestDailyWearAssets = <TAsset extends RankableLuxuryAsset>(
  assets: TAsset[],
  limit?: number
) =>
  rankAssets(
    assets,
    (asset) => asset.intelligence?.wearability ?? 0,
    limit
  );