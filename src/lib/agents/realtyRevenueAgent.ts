import type { RevenueAction } from "../command/revenueActivation.ts";

export type RealtyRecommendationKind =
  | "FOUNDER_REVIEW"
  | "VERIFY_EVIDENCE"
  | "ADVANCE_DEAL_WORK"
  | "RESOLVE_BLOCKER";

export interface RealtyRevenueRecommendation {
  recordId: string;
  kind: RealtyRecommendationKind;
  priority: number;
  rationale: string;
  requiredHumanAction: string;
  sourceAction: RevenueAction;
}

export function realtyRevenueAgent(
  actions: readonly RevenueAction[],
): readonly RealtyRevenueRecommendation[] {
  const recommendations = actions
    .filter((action) => action.division === "REALTY")
    .map((action): RealtyRevenueRecommendation => {
      if (action.status === "REQUIRES_FOUNDER") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "FOUNDER_REVIEW",
          priority: 100 + action.urgency,
          rationale: "A stored realty record requires founder judgment before any external commitment.",
          requiredHumanAction: "Founder must review and explicitly approve the next external realty action.",
          sourceAction: action,
        });
      }
      if (action.status === "UNKNOWN" || action.evidenceState !== "VERIFIED") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "VERIFY_EVIDENCE",
          priority: 70 + action.urgency,
          rationale: "Realty revenue cannot be promoted while property, seller, deal, or economics evidence remains unverified.",
          requiredHumanAction: "Verify authoritative realty evidence before commercial prioritization.",
          sourceAction: action,
        });
      }
      if (action.status === "BLOCKED") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "RESOLVE_BLOCKER",
          priority: 50 + action.urgency,
          rationale: "A realty opportunity is blocked and cannot advance.",
          requiredHumanAction: "Founder reviews the blocker and decides whether the opportunity may continue.",
          sourceAction: action,
        });
      }
      return Object.freeze({
        recordId: action.recordId,
        kind: "ADVANCE_DEAL_WORK",
        priority: (action.revenueScore ?? 0) + action.urgency,
        rationale: "Verified stored realty evidence supports continued internal deal work.",
        requiredHumanAction: "Founder selects the next permitted realty step; this agent sends no offers and makes no external commitment.",
        sourceAction: action,
      });
    })
    .sort((a, b) => b.priority - a.priority || a.recordId.localeCompare(b.recordId));
  return Object.freeze(recommendations);
}
