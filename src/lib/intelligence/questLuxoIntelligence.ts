export interface IntelligenceMetrics {
  collectorDemand: number;
  liquidity: number;
  wearability: number;
  collectability: number;
  allocationDifficulty: number;
  versatility: number;
}

export interface IntelligenceProfile {
  overallScore: number;
  grade: string;
  investmentPotential: number;
  marketStrength: number;
  rarityScore: number;
  confidence: number;
  strengths: string[];
}

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const clamp100 = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

export function buildQuestLuxoIntelligence(
  metrics: Partial<IntelligenceMetrics>
): IntelligenceProfile {
  const normalized: IntelligenceMetrics = {
    collectorDemand: metrics.collectorDemand ?? 0,
    liquidity: metrics.liquidity ?? 0,
    wearability: metrics.wearability ?? 0,
    collectability: metrics.collectability ?? 0,
    allocationDifficulty: metrics.allocationDifficulty ?? 0,
    versatility: metrics.versatility ?? 0,
  };
  const marketStrength = clamp100(
    average([
      normalized.collectorDemand * 20,
      normalized.liquidity * 20,
      normalized.collectability * 20,
    ])
  );

  const investmentPotential = clamp100(
    average([
      normalized.collectorDemand * 20,
      normalized.collectability * 20,
      normalized.allocationDifficulty * 20,
    ])
  );

  const rarityScore = clamp100(
    average([
      normalized.collectability * 20,
      normalized.allocationDifficulty * 20,
    ])
  );

  const overallScore = clamp100(
    average([
      normalized.collectorDemand * 20,
      normalized.liquidity * 20,
      normalized.wearability * 20,
      normalized.collectability * 20,
      normalized.allocationDifficulty * 20,
      normalized.versatility * 20,
    ])
  );

  const strengths: string[] = [];

  if (normalized.collectorDemand >= 5)
    strengths.push("Exceptional collector demand");

  if (normalized.liquidity >= 5)
    strengths.push("Extremely liquid market");

  if (normalized.collectability >= 5)
    strengths.push("Highly collectible");

  if (normalized.wearability >= 5)
    strengths.push("Outstanding daily wear");

  if (normalized.versatility >= 5)
    strengths.push("Exceptional versatility");

  if (normalized.allocationDifficulty >= 5)
    strengths.push("High allocation pressure");

  let grade = "B";

  if (overallScore >= 98) grade = "S+";
  else if (overallScore >= 95) grade = "S";
  else if (overallScore >= 90) grade = "A+";
  else if (overallScore >= 85) grade = "A";
  else if (overallScore >= 80) grade = "B+";

  return {
    overallScore,
    grade,
    investmentPotential,
    marketStrength,
    rarityScore,
    confidence: clamp100(overallScore - 2),
    strengths,
  };
}
