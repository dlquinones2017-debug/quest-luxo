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
  metrics: IntelligenceMetrics
): IntelligenceProfile {
  const marketStrength = clamp100(
    average([
      metrics.collectorDemand * 20,
      metrics.liquidity * 20,
      metrics.collectability * 20,
    ])
  );

  const investmentPotential = clamp100(
    average([
      metrics.collectorDemand * 20,
      metrics.collectability * 20,
      metrics.allocationDifficulty * 20,
    ])
  );

  const rarityScore = clamp100(
    average([
      metrics.collectability * 20,
      metrics.allocationDifficulty * 20,
    ])
  );

  const overallScore = clamp100(
    average([
      metrics.collectorDemand * 20,
      metrics.liquidity * 20,
      metrics.wearability * 20,
      metrics.collectability * 20,
      metrics.allocationDifficulty * 20,
      metrics.versatility * 20,
    ])
  );

  const strengths: string[] = [];

  if (metrics.collectorDemand >= 5)
    strengths.push("Exceptional collector demand");

  if (metrics.liquidity >= 5)
    strengths.push("Extremely liquid market");

  if (metrics.collectability >= 5)
    strengths.push("Highly collectible");

  if (metrics.wearability >= 5)
    strengths.push("Outstanding daily wear");

  if (metrics.versatility >= 5)
    strengths.push("Exceptional versatility");

  if (metrics.allocationDifficulty >= 5)
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