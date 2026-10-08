import type { Division } from "./enterpriseCommand.ts";
import type { OperationsAttention, OperationsValueState, OperationsWorkItem } from "./operationsCoordinator.ts";
import type { OwnershipDelegationRecommendation, OwnershipState, OwningRole } from "./ownershipDelegationAgent.ts";

export type SlaState = "UNKNOWN" | "WITHIN_SLA" | "AT_RISK" | "OVERDUE";

export interface SlaTimestampEvidence {
  workKey: string;
  observedAt: string;
  evidenceState: OperationsValueState;
  evidenceIds: readonly string[];
  sourceReference: string;
}

export interface SlaThreshold {
  division: Division;
  attention: OperationsAttention;
  warningAfterHours: number;
  overdueAfterHours: number;
  evidenceState: OperationsValueState;
  evidenceIds: readonly string[];
  configReference: string;
}

export interface SlaAgingInput {
  work: readonly OperationsWorkItem[];
  delegations?: readonly OwnershipDelegationRecommendation[];
  timestamps?: readonly SlaTimestampEvidence[];
  thresholds?: readonly SlaThreshold[];
}

export interface SlaAgingRecommendation {
  slaKey: string;
  workKey: string;
  division: Division;
  attention: OperationsAttention;
  slaState: SlaState;
  ageHours: number | null;
  warningAfterHours: number | null;
  overdueAfterHours: number | null;
  observedAt: string | null;
  timestampSourceReference: string | null;
  configReference: string | null;
  evidenceIds: readonly string[];
  ownershipState: OwnershipState;
  recommendedOwningRole: OwningRole | null;
  founderEscalation: boolean;
  requiredFounderAction: string | null;
  coordinatingDivisions: readonly Division[];
  recommendedInternalAction: string;
  authority: "RECOMMENDATION_ONLY";
  prohibitedActions: readonly string[];
}

const HOUR = 3_600_000;
const PROHIBITED = Object.freeze([
  "MESSAGE", "PUBLISH", "MAKE_OFFER", "MAKE_PAYMENT", "MAKE_COMMITMENT", "DEPLOY_CAPITAL",
  "INTRODUCE_LENDER", "SUBMIT_APPLICATION", "MUTATE_STATUS", "MUTATE_AUTHORITATIVE_STATE",
]);
const verified = (state: OperationsValueState, ids: readonly string[]) => state === "VERIFIED" && ids.length > 0;
const validTime = (value: string) => Number.isFinite(Date.parse(value));
const thresholdKey = (division: Division, attention: OperationsAttention) => `${division}:${attention}`;

function latestWork(items: readonly OperationsWorkItem[]): Map<string, OperationsWorkItem> {
  const result = new Map<string, OperationsWorkItem>();
  for (const item of items) {
    const current = result.get(item.key);
    const candidateTime = validTime(item.updatedAt) ? Date.parse(item.updatedAt) : Number.NEGATIVE_INFINITY;
    const currentTime = current && validTime(current.updatedAt) ? Date.parse(current.updatedAt) : Number.NEGATIVE_INFINITY;
    if (!current || candidateTime > currentTime || (candidateTime === currentTime && JSON.stringify(item) > JSON.stringify(current))) result.set(item.key, item);
  }
  return result;
}

function recommendation(state: SlaState): string {
  switch (state) {
    case "UNKNOWN": return "Verify the authoritative timestamp and SLA configuration before making an aging claim.";
    case "WITHIN_SLA": return "Continue the recommended internal work within the verified SLA window.";
    case "AT_RISK": return "Prioritize an internal review before the verified SLA threshold is reached.";
    case "OVERDUE": return "Review the verified overdue work internally and update only the authoritative source record.";
  }
}

export function slaAgingIntelligence(input: SlaAgingInput, now = new Date()): readonly SlaAgingRecommendation[] {
  const workByKey = latestWork(input.work);
  const delegations = new Map<string, OwnershipDelegationRecommendation>();
  for (const item of input.delegations ?? []) {
    if (!workByKey.has(item.workKey)) continue;
    const current = delegations.get(item.workKey);
    if (!current || item.delegationKey.localeCompare(current.delegationKey) < 0) delegations.set(item.workKey, item);
  }

  const timestamps = new Map<string, SlaTimestampEvidence>();
  for (const item of input.timestamps ?? []) {
    if (!workByKey.has(item.workKey) || !verified(item.evidenceState, item.evidenceIds) || !validTime(item.observedAt)) continue;
    const current = timestamps.get(item.workKey);
    const itemTime = Date.parse(item.observedAt);
    const currentTime = current ? Date.parse(current.observedAt) : Number.NEGATIVE_INFINITY;
    if (!current || itemTime > currentTime || (itemTime === currentTime && JSON.stringify(item) < JSON.stringify(current))) timestamps.set(item.workKey, item);
  }

  const thresholds = new Map<string, SlaThreshold>();
  for (const item of input.thresholds ?? []) {
    const valid = verified(item.evidenceState, item.evidenceIds)
      && Number.isFinite(item.warningAfterHours) && Number.isFinite(item.overdueAfterHours)
      && item.warningAfterHours >= 0 && item.overdueAfterHours > item.warningAfterHours;
    if (!valid) continue;
    const key = thresholdKey(item.division, item.attention);
    const current = thresholds.get(key);
    if (!current || JSON.stringify(item) < JSON.stringify(current)) thresholds.set(key, item);
  }

  const output: SlaAgingRecommendation[] = [];
  for (const work of workByKey.values()) {
    const timestamp = timestamps.get(work.key);
    const threshold = thresholds.get(thresholdKey(work.division, work.attention));
    const delegation = delegations.get(work.key);
    const parsed = timestamp ? Date.parse(timestamp.observedAt) : Number.NaN;
    const ageHours = timestamp && parsed <= now.getTime() ? Math.floor((now.getTime() - parsed) / HOUR) : null;
    const configured = Boolean(threshold);
    const slaState: SlaState = ageHours === null || !threshold ? "UNKNOWN"
      : ageHours >= threshold.overdueAfterHours ? "OVERDUE"
      : ageHours >= threshold.warningAfterHours ? "AT_RISK" : "WITHIN_SLA";
    const ownershipState = delegation?.ownershipState ?? "UNKNOWN";
    const evidenceIds = Object.freeze([...new Set([
      ...work.evidenceIds,
      ...(timestamp?.evidenceIds ?? []),
      ...(threshold?.evidenceIds ?? []),
      ...(delegation?.evidenceIds ?? []),
    ])].sort());
    const founderEscalation = work.founderApprovalRequired || Boolean(delegation?.founderEscalation);
    output.push(Object.freeze({
      slaKey: `${work.key}:SLA:${slaState}`, workKey: work.key, division: work.division, attention: work.attention,
      slaState, ageHours, warningAfterHours: configured ? threshold!.warningAfterHours : null,
      overdueAfterHours: configured ? threshold!.overdueAfterHours : null,
      observedAt: ageHours === null ? null : timestamp!.observedAt,
      timestampSourceReference: ageHours === null ? null : timestamp!.sourceReference,
      configReference: threshold?.configReference ?? null, evidenceIds,
      ownershipState, recommendedOwningRole: ownershipState === "VERIFIED" ? delegation?.recommendedOwningRole ?? null : null,
      founderEscalation, requiredFounderAction: founderEscalation ? work.requiredHumanAction ?? delegation?.requiredFounderAction ?? "Review the verified founder-reserved decision." : null,
      coordinatingDivisions: Object.freeze([...work.coordinatingDivisions]),
      recommendedInternalAction: recommendation(slaState), authority: "RECOMMENDATION_ONLY", prohibitedActions: PROHIBITED,
    }));
  }

  const rank: Record<SlaState, number> = { OVERDUE: 0, AT_RISK: 1, UNKNOWN: 2, WITHIN_SLA: 3 };
  return Object.freeze(output.sort((a, b) => rank[a.slaState] - rank[b.slaState] || (b.ageHours ?? -1) - (a.ageHours ?? -1) || a.slaKey.localeCompare(b.slaKey)));
}
