import type { Division } from "./enterpriseCommand.ts";
import type { RevenueAction, EvidenceState } from "./revenueActivation.ts";
import type { RecoveryRecommendation } from "./revenueRecoveryAgent.ts";
import type { NextBestActionRecommendation } from "./nextBestActionAgent.ts";

export type OperationsValueState = "VERIFIED" | "UNKNOWN" | "TBD" | "REQUIRES_VERIFICATION";
export type OperationsAttention = "FOUNDER_DECISION" | "BLOCKED" | "VERIFY" | "COORDINATE" | "ADVANCE";

export interface OperationsAnnotation {
  workKey: string;
  owner?: string;
  ownerState?: OperationsValueState;
  blocker?: string;
  blockerState?: OperationsValueState;
  dependencyKeys?: readonly string[];
  dependencyState?: OperationsValueState;
  evidenceIds: readonly string[];
}

export interface OperationsCoordinatorInput {
  queue: readonly RevenueAction[];
  recovery?: readonly RecoveryRecommendation[];
  nextBestActions?: readonly NextBestActionRecommendation[];
  annotations?: readonly OperationsAnnotation[];
}

export interface OperationsWorkItem {
  key: string;
  division: Division;
  recordId: string;
  attention: OperationsAttention;
  recommendation: string;
  evidenceState: EvidenceState;
  evidenceIds: readonly string[];
  founderApprovalRequired: boolean;
  requiredHumanAction: string | null;
  owner: string | null;
  ownerState: OperationsValueState;
  blocker: string | null;
  blockerState: OperationsValueState;
  dependencyKeys: readonly string[];
  dependencyState: OperationsValueState;
  coordinatingDivisions: readonly Division[];
  updatedAt: string;
  ageDays: number | null;
  sourceSystems: readonly string[];
  authority: "RECOMMENDATION_ONLY";
  prohibitedActions: readonly string[];
}

const DAY = 86_400_000;
const PROHIBITED = Object.freeze([
  "PUBLISH", "MESSAGE", "MAKE_OFFER", "MAKE_PAYMENT", "MAKE_COMMITMENT", "MUTATE_AUTHORITATIVE_STATE",
]);
const stateVerified = (state: OperationsValueState | undefined, ids: readonly string[]) => state === "VERIFIED" && ids.length > 0;
const ageDays = (value: string, now: Date) => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor((now.getTime() - parsed) / DAY)) : null;
};

function latestByKey<T extends { key?: string; opportunityKey?: string }>(items: readonly T[]): Map<string, T> {
  const result = new Map<string, T>();
  for (const item of items) result.set(item.key ?? item.opportunityKey ?? "", item);
  result.delete("");
  return result;
}

export function operationsCoordinator(input: OperationsCoordinatorInput, now = new Date()): readonly OperationsWorkItem[] {
  const queue = new Map<string, RevenueAction>();
  for (const action of input.queue) {
    const current = queue.get(action.key);
    const candidateTime = Date.parse(action.updatedAt);
    const currentTime = current ? Date.parse(current.updatedAt) : Number.NEGATIVE_INFINITY;
    if (!current || candidateTime > currentTime || (candidateTime === currentTime && JSON.stringify(action) > JSON.stringify(current))) queue.set(action.key, action);
  }
  const recovery = latestByKey(input.recovery ?? []);
  const next = latestByKey(input.nextBestActions ?? []);
  const annotations = new Map<string, OperationsAnnotation>();
  for (const annotation of input.annotations ?? []) annotations.set(annotation.workKey, annotation);

  const output: OperationsWorkItem[] = [];
  for (const action of queue.values()) {
    const rec = recovery.get(action.key);
    const nba = next.get(action.key);
    const annotation = annotations.get(action.key);
    const annotationIds = Object.freeze([...new Set(annotation?.evidenceIds ?? [])].sort());
    const ownerVerified = stateVerified(annotation?.ownerState, annotationIds) && Boolean(annotation?.owner?.trim());
    const blockerVerified = stateVerified(annotation?.blockerState, annotationIds) && Boolean(annotation?.blocker?.trim());
    const dependenciesVerified = stateVerified(annotation?.dependencyState, annotationIds);
    const dependencyKeys = dependenciesVerified
      ? Object.freeze([...new Set(annotation?.dependencyKeys ?? [])].filter(key => queue.has(key) && key !== action.key).sort())
      : Object.freeze([] as string[]);
    const coordinatingDivisions = Object.freeze([...new Set(dependencyKeys.map(key => queue.get(key)!.division).filter(d => d !== action.division))].sort());
    const evidenceVerified = action.evidenceState === "VERIFIED" && action.evidenceIds.length > 0 && action.status !== "UNKNOWN";
    const founderApprovalRequired = action.status === "REQUIRES_FOUNDER" || Boolean(nba?.founderActionRequired);
    const attention: OperationsAttention = founderApprovalRequired ? "FOUNDER_DECISION"
      : !evidenceVerified ? "VERIFY"
      : action.status === "BLOCKED" || Boolean(rec) || blockerVerified ? "BLOCKED"
      : coordinatingDivisions.length > 0 ? "COORDINATE" : "ADVANCE";
    const recommendation = founderApprovalRequired
      ? action.requiredHumanAction ?? nba?.requiredHumanAction ?? "Founder decision required."
      : !evidenceVerified ? "Collect or refresh authoritative evidence before coordinating work."
      : nba?.recommendedAction ?? rec?.recommendedAction ?? "Advance the verified work through its authoritative source system.";
    const sourceSystems = Object.freeze([...new Set([action.sourceSystem, rec && "revenue-recovery", nba && "next-best-action"].filter(Boolean) as string[])].sort());

    output.push(Object.freeze({
      key: action.key, division: action.division, recordId: action.recordId, attention, recommendation,
      evidenceState: action.evidenceState, evidenceIds: Object.freeze([...action.evidenceIds]),
      founderApprovalRequired, requiredHumanAction: founderApprovalRequired ? action.requiredHumanAction ?? nba?.requiredHumanAction ?? null : null,
      owner: ownerVerified ? annotation!.owner!.trim() : null,
      ownerState: ownerVerified ? "VERIFIED" : annotation?.ownerState ?? "UNKNOWN",
      blocker: blockerVerified ? annotation!.blocker!.trim() : action.status === "BLOCKED" && evidenceVerified ? action.reason : rec?.rationale ?? null,
      blockerState: blockerVerified || (evidenceVerified && (action.status === "BLOCKED" || Boolean(rec)))
        ? "VERIFIED" : annotation?.blockerState ?? (rec ? action.evidenceState : "UNKNOWN"),
      dependencyKeys, dependencyState: dependenciesVerified ? "VERIFIED" : annotation?.dependencyState ?? "UNKNOWN",
      coordinatingDivisions, updatedAt: action.updatedAt, ageDays: ageDays(action.updatedAt, now), sourceSystems,
      authority: "RECOMMENDATION_ONLY", prohibitedActions: PROHIBITED,
    }));
  }

  const rank: Record<OperationsAttention, number> = { FOUNDER_DECISION: 0, BLOCKED: 1, VERIFY: 2, COORDINATE: 3, ADVANCE: 4 };
  return Object.freeze(output.sort((a, b) => rank[a.attention] - rank[b.attention] || (b.ageDays ?? -1) - (a.ageDays ?? -1) || a.key.localeCompare(b.key)));
}
