export type BrokerageLiquidityBand =
  | "High"
  | "Moderate"
  | "Specialized"
  | "Insufficient evidence";

export type BrokerageExposureBand =
  | "Lower"
  | "Moderate"
  | "Elevated"
  | "Specialist"
  | "Unknown";

export interface BrokerageEvidenceSource {
  readonly label: string;
  readonly url: string;
}

export interface BrandBrokerageIntelligence {
  readonly brokeragePositioning: string;
  readonly overview: string;
  readonly perspective: string;
  readonly evidenceSources?: readonly BrokerageEvidenceSource[];
}

export interface CollectionBrokerageIntelligence {
  readonly overview: string;
  readonly marketPosition: string;
  readonly liquidityBand: BrokerageLiquidityBand;
  readonly liquidityGuidance: string;
  readonly buyerProfile: string;
  readonly sellerProfile: string;
  readonly ownershipConsiderations: string;
  readonly brokerageInsight: string;
  readonly marketCommentary: string;
  readonly perspective: string;
  readonly reviewedAt: string;
  readonly evidenceSources?: readonly BrokerageEvidenceSource[];
}

export interface ReferenceBrokerageIntelligence {
  readonly history?: string;
  readonly overview: string;
  readonly innovations?: string;
  readonly collectorAppeal?: string;
  readonly configurationSummary: string;
  readonly complications?: string;
  readonly buyingConsiderations?: string;
  readonly liquidityBand: BrokerageLiquidityBand;
  readonly liquidityObservations: string;
  readonly serviceExposure: BrokerageExposureBand;
  readonly serviceConsiderations: string;
  readonly ownershipComplexity: BrokerageExposureBand;
  readonly conditionConsiderations: string;
  readonly ownershipExperience?: string;
  readonly marketCommentary: string;
  readonly brokerageOpportunities: string;
  readonly buyerGuidance: string;
  readonly sellerGuidance: string;
  readonly relatedCollections?: string;
  readonly perspective: string;
  readonly reviewedAt: string;
  readonly evidenceSources?: readonly BrokerageEvidenceSource[];
}

export interface BrokerageIntelligenceItem {
  readonly title: string;
  readonly body: string;
  readonly label?: string;
}
