import type { RevenueAction } from "../command/revenueActivation.ts";

export type CapitalRecommendationKind =
  | "FOUNDER_REVIEW"
  | "VERIFY_EVIDENCE"
  | "ADVANCE_FUNDING_WORK"
  | "RESOLVE_BLOCKER";

export interface CapitalRevenueRecommendation {
  recordId: string;
  kind: CapitalRecommendationKind;
  priority: number;
  rationale: string;
  requiredHumanAction: string;
  sourceAction: RevenueAction;
}

export function capitalAdvisoryRevenueAgent(
  actions: readonly RevenueAction[],
): readonly CapitalRevenueRecommendation[] {
  const recommendations = actions
    .filter((action) => action.division === "CAPITAL_ADVISORY")
    .map((action): CapitalRevenueRecommendation => {
      if (action.status === "REQUIRES_FOUNDER") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "FOUNDER_REVIEW",
          priority: 100 + action.urgency,
          rationale: "A stored capital record requires founder judgment before any external commitment.",
          requiredHumanAction: "Founder must review and explicitly approve the next external funding action.",
          sourceAction: action,
        });
      }
      if (action.status === "UNKNOWN" || action.evidenceState !== "VERIFIED") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "VERIFY_EVIDENCE",
          priority: 70 + action.urgency,
          rationale: "Capital revenue cannot be promoted while borrower, funding, or economics evidence remains unverified.",
          requiredHumanAction: "Verify authoritative funding evidence before commercial prioritization.",
          sourceAction: action,
        });
      }
      if (action.status === "BLOCKED") {
        return Object.freeze({
          recordId: action.recordId,
          kind: "RESOLVE_BLOCKER",
          priority: 50 + action.urgency,
          rationale: "A capital opportunity is blocked and cannot advance through the funding lifecycle.",
          requiredHumanAction: "Founder reviews the blocker and decides whether the opportunity may continue.",
          sourceAction: action,
        });
      }
      return Object.freeze({
        recordId: action.recordId,
        kind: "ADVANCE_FUNDING_WORK",
        priority: (action.revenueScore ?? 0) + action.urgency,
        rationale: "Verified stored capital evidence supports continued internal funding work.",
        requiredHumanAction: "Founder selects the next permitted funding step; this agent makes no lender or client commitment.",
        sourceAction: action,
      });
    })
    .sort((a, b) => b.priority - a.priority || a.recordId.localeCompare(b.recordId));
  return Object.freeze(recommendations);
}
