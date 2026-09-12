export interface QuestLuxoConfiguration {
  nickname: string;
  bracelet?: string;
  dial?: string;
  originalMSRP: number | null;
}

export interface QuestLuxoAsset {
  reference: string;
  model: string;
  configurations: QuestLuxoConfiguration[];
  material: string;
  bezel: string;
  productionStatus: string;
  marketPosition: string;
  liquidity: string;
  allocationDifficulty: string;
  questLuxoView: string;
}