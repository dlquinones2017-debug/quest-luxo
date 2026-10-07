import type { RevenueAction } from "../command/revenueActivation.ts";

export type BrokerageRecommendationKind =
  | "FOUNDER_REVIEW"
  | "VERIFY_ECONOMICS"
  | "ADVANCE_REVENUE_WORK"
  | "RESOLVE_BLOCKER";

export interface BrokerageRevenueRecommendation {
  recordId: string;
  kind: BrokerageRecommendationKind;
  priority: number;
  rationale: string;
  requiredHumanAction: string;
  sourceAction: RevenueAction;
}

export function watchBrokerageRevenueAgent(
  actions: readonly RevenueAction[],
): readonly BrokerageRevenueRecommendation[] {
  const recommendations = actions
    .filter((action) => action.division === "WATCH_BROKERAGE")
    .map((action): BrokerageRevenueRecommendation => {
      if (action.status === "REQUIRES_FOUNDER") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "FOUNDER_REVIEW",
          priority: 100 + action.urgency,
          rationale: "A stored brokerage record requires founder judgment before any external commitment.",
          requiredHumanAction: "Founder must review and explicitly approve the next external action.",
          sourceAction: action,
        });
      }
      if (action.status === "UNKNOWN" || action.evidenceState !== "VERIFIED") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "VERIFY_ECONOMICS",
          priority: 70 + action.urgency,
          rationale: "Brokerage revenue cannot be promoted while economics or evidence remain unverified.",
          requiredHumanAction: "Verify stored economics and evidence before commercial prioritization.",
          sourceAction: action,
        });
      }
      if (action.status === "BLOCKED") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "RESOLVE_BLOCKER",
          priority: 50 + action.urgency,
          rationale: "A verified brokerage record is blocked and cannot advance.",
          requiredHumanAction: "Founder reviews the blocker and decides whether the opportunity should be recovered or remain stopped.",
          sourceAction: action,
        });
      }
      return Object.freeze({
        recordId: action.recordId,
        kind: "ADVANCE_REVENUE_WORK",
        priority: (action.revenueScore ?? 0) + action.urgency,
        rationale: "Verified stored brokerage evidence supports continued internal revenue work.",
        requiredHumanAction: "Founder selects the next permitted brokerage step; no external action is executed by this agent.",
        sourceAction: action,
      });
    })
    .sort((a, b) => b.priority - a.priority || a.recordId.localeCompare(b.recordId));

  return Object.freeze(recommendations);
}
