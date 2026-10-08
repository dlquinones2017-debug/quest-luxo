import type { RevenueAction } from "./revenueActivation.ts";
import { revenueRecoveryAgent, type RecoveryRecommendation } from "./revenueRecoveryAgent.ts";
import { enterpriseRelationshipIntelligence, type RelationshipObservation, type RelationshipResolution } from "./relationshipIntelligence.ts";
import { nextBestActionAgent, type NextBestActionRecommendation } from "./nextBestActionAgent.ts";
import { revenueLearningAgent, type RevenueLearningObservation, type RevenueOutcome } from "./revenueLearningAgent.ts";

export interface Wave3RevenueIntelligence {
  recovery:readonly RecoveryRecommendation[];
  relationships:readonly RelationshipResolution[];
  nextBestActions:readonly NextBestActionRecommendation[];
  learning:readonly RevenueLearningObservation[];
}

export function wave3RevenueIntelligence(
  queue:readonly RevenueAction[],
  relationships:readonly RelationshipObservation[],
  outcomes:readonly RevenueOutcome[],
  now=new Date(),
):Wave3RevenueIntelligence {
  const recovery=revenueRecoveryAgent(queue,now);
  return Object.freeze({
    recovery,
    relationships:enterpriseRelationshipIntelligence(relationships),
    nextBestActions:nextBestActionAgent(queue,recovery),
    learning:revenueLearningAgent(outcomes,queue),
  });
}
