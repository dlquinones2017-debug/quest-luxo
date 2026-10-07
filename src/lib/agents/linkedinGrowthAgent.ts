import type { ProspectRecord, ProspectRecommendation } from "./prospectIntelligenceAgent.ts";
import type { RelationshipRecommendation } from "./relationshipIntelligenceAgent.ts";

export interface LinkedInAction {
  prospectId: string;
  priority: "HIGH" | "MEDIUM" | "LOW" | "VERIFY";
  profileUrl: string | null;
  connectionAngle: string;
  founderAction: string;
}

export function prepareLinkedInAction(
  prospect: ProspectRecord,
  recommendation: ProspectRecommendation,
  relationship?: RelationshipRecommendation,
): LinkedInAction {
  if (recommendation.priority === "VERIFY") {
    return Object.freeze({
      prospectId: prospect.id, priority: "VERIFY", profileUrl: prospect.linkedinUrl ?? null,
      connectionAngle: "Verify identity and LinkedIn profile before preparing outreach.",
      founderAction: "Verify and approve before any external action.",
    });
  }
  const crossDivision = relationship?.crossDivisionOpportunities ?? [];
  const angle = prospect.reason || (crossDivision.length
    ? `Relevant to ${crossDivision.join(", ")}.`
    : "Relevant to Quest Luxo.");
  return Object.freeze({
    prospectId: prospect.id,
    priority: recommendation.priority,
    profileUrl: prospect.linkedinUrl ?? null,
    connectionAngle: angle,
    founderAction: "Founder reviews and sends the connection; agent does not send externally.",
  });
}

export function prepareLinkedInQueue(
  records: readonly { prospect: ProspectRecord; recommendation: ProspectRecommendation; relationship?: RelationshipRecommendation }[],
): readonly LinkedInAction[] {
  return Object.freeze(records.map(({prospect,recommendation,relationship}) =>
    prepareLinkedInAction(prospect,recommendation,relationship)
  ).sort((a,b) => ({HIGH:0,MEDIUM:1,LOW:2,VERIFY:3}[a.priority]) - ({HIGH:0,MEDIUM:1,LOW:2,VERIFY:3}[b.priority])));
}
