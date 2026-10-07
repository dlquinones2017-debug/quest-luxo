import type { ProspectRecord, ProspectRecommendation } from "./prospectIntelligenceAgent.ts";

export interface RelationshipRecord {
  prospectId: string;
  relationshipType: "BUYER" | "REFERRER" | "CAPITAL" | "REALTY" | "STRATEGIC" | "UNKNOWN";
  divisions: readonly string[];
  relationshipStrength: number;
  lastInteractionAt?: string;
  notes?: string;
}
export interface RelationshipRecommendation {
  prospect: ProspectRecord;
  prospectRecommendation: ProspectRecommendation;
  crossDivisionOpportunities: readonly string[];
  nextAction: string;
}
export function buildRelationshipRecommendation(prospect: ProspectRecord, recommendation: ProspectRecommendation, relationship?: RelationshipRecord): RelationshipRecommendation {
  if (recommendation.priority === "VERIFY") return Object.freeze({prospect, prospectRecommendation: recommendation, crossDivisionOpportunities: [], nextAction:"Verify identity and relationship evidence before activation."});
  const opportunities=new Set<string>();
  if (recommendation.classification==="DIRECT_BUYER") opportunities.add("LUXURY_ADVISORY");
  if (recommendation.classification==="REFERRAL_NODE") { opportunities.add("LUXURY_ADVISORY"); opportunities.add("REALTY"); opportunities.add("CAPITAL_ADVISORY"); }
  for (const division of relationship?.divisions ?? []) opportunities.add(division);
  return Object.freeze({prospect, prospectRecommendation:recommendation, crossDivisionOpportunities:Object.freeze([...opportunities]), nextAction:"Founder reviews relationship context and approves the next external connection."});
}
export function rankRelationshipOpportunities(records: readonly RelationshipRecommendation[]): readonly RelationshipRecommendation[] {
  return Object.freeze([...records].sort((a,b)=>(b.prospectRecommendation.score??-1)-(a.prospectRecommendation.score??-1)));
}