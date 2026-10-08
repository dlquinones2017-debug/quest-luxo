import type { Division } from "./enterpriseCommand.ts";
import type { OperationsValueState, OperationsWorkItem } from "./operationsCoordinator.ts";

export type ExceptionType =
  | "BLOCKED_WORK"
  | "FOUNDER_APPROVAL"
  | "OVERDUE_DEPENDENCY"
  | "OWNERLESS_WORK"
  | "STALE_EVIDENCE"
  | "INVALID_STATE"
  | "REPEATED_DEFERRAL";

export type ExceptionSeverity = "HIGH" | "MEDIUM";
export type ExceptionUrgency = "IMMEDIATE" | "HIGH" | "NORMAL";
export type ExceptionFactKind =
  | "DEPENDENCY_DUE"
  | "OWNERSHIP_REQUIRED"
  | "EVIDENCE_OBSERVED"
  | "STATE_ASSERTION"
  | "DEFERRAL";

export interface ExceptionFact {
  workKey: string;
  kind: ExceptionFactKind;
  reference: string;
  evidenceState: OperationsValueState;
  evidenceIds: readonly string[];
  occurredAt?: string;
  dueAt?: string;
  assertedValue?: string;
}

export interface BottleneckExceptionInput {
  work: readonly OperationsWorkItem[];
  facts?: readonly ExceptionFact[];
  staleAfterDays?: number;
}

export interface BottleneckException {
  key: string;
  workKey: string;
  division: Division;
  exceptionType: ExceptionType;
  severity: ExceptionSeverity;
  urgency: ExceptionUrgency;
  evidenceIds: readonly string[];
  owner: string | null;
  ownershipState: OperationsValueState;
  dependencyReferences: readonly string[];
  blockerReferences: readonly string[];
  ageDays: number | null;
  founderActionRequired: boolean;
  recommendedInternalAction: string;
  authority: "RECOMMENDATION_ONLY";
  prohibitedActions: readonly string[];
}

const DAY = 86_400_000;
const DEFAULT_STALE_DAYS = 30;
const PROHIBITED = Object.freeze([
  "MESSAGE", "PUBLISH", "MAKE_OFFER", "MAKE_PAYMENT", "MAKE_COMMITMENT",
  "INTRODUCE_LENDER", "SUBMIT_APPLICATION", "MUTATE_AUTHORITATIVE_STATE",
]);

const validTime = (value: string | undefined) => value && Number.isFinite(Date.parse(value)) ? value : null;
const ageDays = (value: string | undefined, now: Date) => {
  const timestamp = validTime(value);
  return timestamp ? Math.max(0, Math.floor((now.getTime() - Date.parse(timestamp)) / DAY)) : null;
};
const verified = (fact: ExceptionFact) => fact.evidenceState === "VERIFIED" && fact.evidenceIds.length > 0;
const safePart = (value: string) => encodeURIComponent(value.trim());

interface Candidate {
  work: OperationsWorkItem;
  type: ExceptionType;
  reference: string;
  evidenceIds: readonly string[];
  occurredAt?: string;
  dependency?: string;
  blocker?: string;
}

function recommendation(type: ExceptionType): string {
  switch (type) {
    case "BLOCKED_WORK": return "Review the verified blocker and coordinate an internal resolution through the authoritative source system.";
    case "FOUNDER_APPROVAL": return "Present the verified decision and supporting evidence to the founder for explicit approval.";
    case "OVERDUE_DEPENDENCY": return "Review the overdue verified dependency internally and update only its authoritative source record.";
    case "OWNERLESS_WORK": return "Assign an internal owner in the authoritative source system after confirming responsibility.";
    case "STALE_EVIDENCE": return "Refresh authoritative evidence before relying on this work item.";
    case "INVALID_STATE": return "Reconcile the contradictory verified state in the authoritative source system.";
    case "REPEATED_DEFERRAL": return "Review the verified deferral history and decide whether to unblock, re-scope, or explicitly close the work.";
  }
}

function severity(type: ExceptionType, age: number | null): ExceptionSeverity {
  if (type === "FOUNDER_APPROVAL" || type === "INVALID_STATE" || type === "BLOCKED_WORK") return "HIGH";
  if (type === "OVERDUE_DEPENDENCY" && age !== null && age >= 7) return "HIGH";
  return "MEDIUM";
}

export function bottleneckExceptionAgent(input: BottleneckExceptionInput, now = new Date()): readonly BottleneckException[] {
  const staleAfterDays = Math.max(1, input.staleAfterDays ?? DEFAULT_STALE_DAYS);
  const workByKey = new Map<string, OperationsWorkItem>();
  for (const item of input.work) {
    const current = workByKey.get(item.key);
    const candidateTime = Date.parse(item.updatedAt);
    const currentTime = current ? Date.parse(current.updatedAt) : Number.NEGATIVE_INFINITY;
    if (!current || candidateTime > currentTime || (candidateTime === currentTime && JSON.stringify(item) > JSON.stringify(current))) workByKey.set(item.key, item);
  }

  const facts = (input.facts ?? []).filter(verified);
  const candidates: Candidate[] = [];
  for (const work of workByKey.values()) {
    const workVerified = work.evidenceState === "VERIFIED" && work.evidenceIds.length > 0;
    if (work.attention === "BLOCKED" && workVerified) candidates.push({
      work, type: "BLOCKED_WORK", reference: work.blocker ?? work.key,
      evidenceIds: work.evidenceIds, occurredAt: work.updatedAt, blocker: work.blocker ?? undefined,
    });
    if (work.founderApprovalRequired && workVerified) candidates.push({
      work, type: "FOUNDER_APPROVAL", reference: work.requiredHumanAction ?? work.key,
      evidenceIds: work.evidenceIds, occurredAt: work.updatedAt,
    });
  }

  const grouped = new Map<string, ExceptionFact[]>();
  for (const fact of facts) {
    if (!workByKey.has(fact.workKey)) continue;
    const key = `${fact.workKey}\u0000${fact.kind}\u0000${fact.reference}`;
    grouped.set(key, [...(grouped.get(key) ?? []), fact]);
  }
  for (const group of grouped.values()) {
    const first = group[0];
    if (!first) continue;
    const work = workByKey.get(first.workKey)!;
    const evidenceIds = [...new Set(group.flatMap(fact => [...fact.evidenceIds]))].sort();
    const occurred = group.map(fact => validTime(fact.occurredAt)).filter((value): value is string => Boolean(value)).sort()[0];
    if (first.kind === "DEPENDENCY_DUE") {
      const due = group.map(fact => validTime(fact.dueAt)).filter((value): value is string => Boolean(value)).sort()[0];
      if (due && Date.parse(due) < now.getTime()) candidates.push({ work, type: "OVERDUE_DEPENDENCY", reference: first.reference, evidenceIds, occurredAt: due, dependency: first.reference });
    } else if (first.kind === "OWNERSHIP_REQUIRED" && work.owner === null) {
      candidates.push({ work, type: "OWNERLESS_WORK", reference: first.reference, evidenceIds, occurredAt: occurred });
    } else if (first.kind === "EVIDENCE_OBSERVED" && occurred && ageDays(occurred, now)! >= staleAfterDays) {
      candidates.push({ work, type: "STALE_EVIDENCE", reference: first.reference, evidenceIds, occurredAt: occurred });
    } else if (first.kind === "STATE_ASSERTION") {
      const values = new Set(group.map(fact => fact.assertedValue?.trim()).filter(Boolean));
      if (values.size > 1) candidates.push({ work, type: "INVALID_STATE", reference: first.reference, evidenceIds, occurredAt: occurred });
    } else if (first.kind === "DEFERRAL" && group.length >= 2) {
      candidates.push({ work, type: "REPEATED_DEFERRAL", reference: first.reference, evidenceIds, occurredAt: occurred });
    }
  }

  const deduped = new Map<string, Candidate[]>();
  for (const candidate of candidates) {
    const key = `${candidate.work.key}:EXCEPTION:${safePart(candidate.reference)}`;
    deduped.set(key, [...(deduped.get(key) ?? []), candidate]);
  }
  const output: BottleneckException[] = [];
  for (const [key, group] of deduped) {
    const typeRank: Record<ExceptionType, number> = {
      FOUNDER_APPROVAL: 0, INVALID_STATE: 1, BLOCKED_WORK: 2, OVERDUE_DEPENDENCY: 3,
      OWNERLESS_WORK: 4, STALE_EVIDENCE: 5, REPEATED_DEFERRAL: 6,
    };
    const first = [...group].sort((a, b) => typeRank[a.type] - typeRank[b.type])[0]!;
    const age = group.map(candidate => ageDays(candidate.occurredAt, now)).filter((value): value is number => value !== null).sort((a, b) => b - a)[0] ?? null;
    const level = severity(first.type, age);
    output.push(Object.freeze({
      key, workKey: first.work.key, division: first.work.division, exceptionType: first.type,
      severity: level, urgency: first.type === "FOUNDER_APPROVAL" ? "IMMEDIATE" : level === "HIGH" ? "HIGH" : "NORMAL",
      evidenceIds: Object.freeze([...new Set(group.flatMap(candidate => [...candidate.evidenceIds]))].sort()),
      owner: first.work.owner, ownershipState: first.work.ownerState,
      dependencyReferences: Object.freeze([...new Set(group.map(candidate => candidate.dependency).filter((value): value is string => Boolean(value)))].sort()),
      blockerReferences: Object.freeze([...new Set(group.map(candidate => candidate.blocker).filter((value): value is string => Boolean(value)))].sort()),
      ageDays: age, founderActionRequired: first.type === "FOUNDER_APPROVAL",
      recommendedInternalAction: recommendation(first.type), authority: "RECOMMENDATION_ONLY", prohibitedActions: PROHIBITED,
    }));
  }

  const rank: Record<ExceptionUrgency, number> = { IMMEDIATE: 0, HIGH: 1, NORMAL: 2 };
  return Object.freeze(output.sort((a, b) => rank[a.urgency] - rank[b.urgency] || (b.ageDays ?? -1) - (a.ageDays ?? -1) || a.key.localeCompare(b.key)));
}
