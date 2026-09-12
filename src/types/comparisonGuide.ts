import type { BrokerageEvidenceSource } from "./brokerageIntelligence";

export const comparisonSectionOrder = [
  { id: "executive-summary", title: "Executive Summary" },
  { id: "who-each-watch-is-for", title: "Who Each Watch Is For" },
  { id: "heritage-and-brand-positioning", title: "Heritage & Brand Positioning" },
  { id: "design-philosophy", title: "Design Philosophy" },
  { id: "wearability", title: "Wearability" },
  { id: "movement-comparison", title: "Movement Comparison" },
  { id: "bracelet-and-comfort", title: "Bracelet & Comfort" },
  { id: "service-considerations", title: "Service Considerations" },
  { id: "market-liquidity", title: "Market Liquidity" },
  { id: "value-retention", title: "Value Retention" },
  { id: "risks-and-tradeoffs", title: "Risks & Tradeoffs" },
  { id: "quest-luxo-perspective", title: "Quest Luxo Perspective" },
  { id: "final-recommendation", title: "Final Recommendation" },
] as const;

export type ComparisonSectionId = (typeof comparisonSectionOrder)[number]["id"];

export interface ComparisonParticipant {
  readonly label: string;
  readonly brand: string;
  readonly collection: string;
  readonly model: string;
  readonly reference?: string;
  readonly href: string;
}

export interface ComparisonSectionContent {
  readonly summary: string;
  readonly left?: string;
  readonly right?: string;
}

export type ComparisonSectionMap = Readonly<
  Record<ComparisonSectionId, ComparisonSectionContent>
>;

export interface ComparisonLeadContext {
  readonly brand: string;
  readonly collection: string;
}

export interface ComparisonGuide {
  readonly slug: string;
  readonly status: "dormant" | "active";
  readonly title: string;
  readonly description: string;
  readonly seoTitle: string;
  readonly seoDescription: string;
  readonly canonicalPath: string;
  readonly reviewedAt: string;
  readonly participants: readonly [ComparisonParticipant, ComparisonParticipant];
  readonly sections: ComparisonSectionMap;
  readonly evidenceSources: readonly BrokerageEvidenceSource[];
  readonly leadContext: ComparisonLeadContext;
}
