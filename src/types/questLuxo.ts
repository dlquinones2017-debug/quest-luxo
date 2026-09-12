import type { IntelligenceMetrics } from "../lib/intelligence/questLuxoIntelligence";
import type { ReferenceBrokerageIntelligence } from "./brokerageIntelligence";

export interface QuestLuxoConfiguration {
  nickname?: string;
  bracelet?: string;
  dial?: string;
  caseSize?: string;
  movement?: string;
  waterResistance?: string;
  originalMSRP?: number | null;
}

export type QuestLuxoIntelligence = Partial<IntelligenceMetrics> & {
  collectorDemand?: number;
  marketMomentum?: number;
  scarcity?: number;
  brandPower?: number;
  configurationPower?: number;
  liquidity?: number;
  retailPremium?: number;
  historicalSignificance?: number;
  brokerOpportunity?: number;
};

export interface QuestLuxoAsset {
  reference: string;
  model: string;
  brand?: string;
  collection?: string;
  configurations?: readonly QuestLuxoConfiguration[];
  material?: string;
  bezel?: string;
  productionStatus?: string;
  marketPosition?: string;
  liquidity?: string;
  allocationDifficulty?: string;
  questLuxoView?: string;
  collectorNotes?: string;
  brokerageIntelligence?: ReferenceBrokerageIntelligence;
  intelligence?: QuestLuxoIntelligence;
  image?: string;
}
