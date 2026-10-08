import type { Division } from "./enterpriseCommand.ts";
import type { BottleneckException } from "./bottleneckExceptionAgent.ts";
import type { OperationsValueState, OperationsWorkItem } from "./operationsCoordinator.ts";

export type OwnershipState = "VERIFIED" | "UNKNOWN" | "CONFLICT";
export type OwningRole =
  | "WATCH_BROKERAGE_OPERATIONS"
  | "CAPITAL_ADVISORY_OPERATIONS"
  | "REALTY_OPERATIONS"
  | "GROWTH_OPERATIONS";
export type FounderAuthorityKind =
  | "FOUNDER_RESERVED"
  | "APPROVAL_GATE"
  | "CAPITAL_EXPOSURE"
  | "RISK_EXPOSURE"
  | "CROSS_DIVISION_CONFLICT";

export interface RoleOwnershipEvidence {
  workKey: string;
  division: Division;
  role: OwningRole;
  evidenceState: OperationsValueState;
  evidenceIds: readonly string[];
  reason: string;
}

export interface FounderAuthorityEvidence {
  workKey: string;
  kind: FounderAuthorityKind;
  evidenceState: OperationsValueState;
  evidenceIds: readonly string[];
  requiredFounderAction: string;
}

export interface OwnershipDelegationInput {
  work: readonly OperationsWorkItem[];
  exceptions?: readonly BottleneckException[];
  ownershipEvidence?: readonly RoleOwnershipEvidence[];
  authorityEvidence?: readonly FounderAuthorityEvidence[];
}

export interface OwnershipDelegationRecommendation {
  delegationKey: string;
  workKey: string;
  exceptionKey: string | null;
  division: Division;
  recommendedOwningRole: OwningRole | null;
  ownershipState: OwnershipState;
  delegationReason: string;
  evidenceIds: readonly string[];
  founderEscalation: boolean;
  requiredFounderAction: string | null;
  upstreamBlockerExceptionReference: string | null;
  recommendedInternalHandoff: string;
  authority: "RECOMMENDATION_ONLY";
  prohibitedActions: readonly string[];
}

const ROLE_BY_DIVISION: Readonly<Record<Division, OwningRole>> = Object.freeze({
  WATCH_BROKERAGE: "WATCH_BROKERAGE_OPERATIONS",
  CAPITAL_ADVISORY: "CAPITAL_ADVISORY_OPERATIONS",
  REALTY: "REALTY_OPERATIONS",
  GROWTH_ENGINE: "GROWTH_OPERATIONS",
});
const PROHIBITED = Object.freeze([
  "MESSAGE", "PUBLISH", "MAKE_OFFER", "MAKE_PAYMENT", "MAKE_COMMITMENT", "DEPLOY_CAPITAL",
  "INTRODUCE_LENDER", "SUBMIT_APPLICATION", "MUTATE_AUTHORITATIVE_STATE",
]);
const verified = (state: OperationsValueState, ids: readonly string[]) => state === "VERIFIED" && ids.length > 0;
const safe = (value: string) => encodeURIComponent(value);

function latestWork(items: readonly OperationsWorkItem[]): Map<string, OperationsWorkItem> {
  const result = new Map<string, OperationsWorkItem>();
  for (const item of items) {
    const current = result.get(item.key);
    const candidateTime = Date.parse(item.updatedAt);
    const currentTime = current ? Date.parse(current.updatedAt) : Number.NEGATIVE_INFINITY;
    if (!current || candidateTime > currentTime || (candidateTime === currentTime && JSON.stringify(item) > JSON.stringify(current))) result.set(item.key, item);
  }
  return result;
}

export function ownershipDelegationAgent(input: OwnershipDelegationInput): readonly OwnershipDelegationRecommendation[] {
  const workByKey = latestWork(input.work);
  const exceptionsByWork = new Map<string, BottleneckException[]>();
  for (const exception of input.exceptions ?? []) {
    if (!workByKey.has(exception.workKey)) continue;
    exceptionsByWork.set(exception.workKey, [...(exceptionsByWork.get(exception.workKey) ?? []), exception]);
  }
  const ownershipByWork = new Map<string, RoleOwnershipEvidence[]>();
  for (const claim of input.ownershipEvidence ?? []) {
    if (!workByKey.has(claim.workKey)) continue;
    ownershipByWork.set(claim.workKey, [...(ownershipByWork.get(claim.workKey) ?? []), claim]);
  }
  const authorityByWork = new Map<string, FounderAuthorityEvidence[]>();
  for (const fact of input.authorityEvidence ?? []) {
    if (!workByKey.has(fact.workKey)) continue;
    authorityByWork.set(fact.workKey, [...(authorityByWork.get(fact.workKey) ?? []), fact]);
  }

  const output: OwnershipDelegationRecommendation[] = [];
  for (const work of workByKey.values()) {
    const exceptions = [...(exceptionsByWork.get(work.key) ?? [])].sort((a, b) => a.key.localeCompare(b.key));
    const claims = ownershipByWork.get(work.key) ?? [];
    const verifiedClaims = claims.filter(claim => verified(claim.evidenceState, claim.evidenceIds) && ROLE_BY_DIVISION[claim.division] === claim.role);
    const assignments = new Map(verifiedClaims.map(claim => [`${claim.division}:${claim.role}`, claim]));
    const distinct = [...assignments.values()].sort((a, b) => `${a.division}:${a.role}`.localeCompare(`${b.division}:${b.role}`));
    const ownershipState: OwnershipState = distinct.length === 0 ? "UNKNOWN" : distinct.length === 1 ? "VERIFIED" : "CONFLICT";
    const assignment = ownershipState === "VERIFIED" ? distinct[0]! : null;
    const targetDivision = assignment?.division ?? work.division;
    const role = assignment?.role ?? null;
    const authorityFacts = (authorityByWork.get(work.key) ?? []).filter(fact => verified(fact.evidenceState, fact.evidenceIds));
    const founderException = exceptions.find(exception => exception.founderActionRequired);
    const crossDivisionConflict = distinct.length > 1 && new Set(distinct.map(claim => claim.division)).size > 1;
    const founderFact = [...authorityFacts].sort((a, b) => a.kind.localeCompare(b.kind) || a.requiredFounderAction.localeCompare(b.requiredFounderAction))[0];
    const founderEscalation = work.founderApprovalRequired || Boolean(founderException) || Boolean(founderFact) || crossDivisionConflict;
    const requiredFounderAction = !founderEscalation ? null
      : work.requiredHumanAction ?? founderFact?.requiredFounderAction ?? (crossDivisionConflict ? "Resolve the verified cross-division ownership conflict." : "Review and decide the founder-reserved approval gate.");
    const exception = exceptions[0] ?? null;
    const upstreamReference = exception?.key ?? (work.blockerState === "VERIFIED" ? work.blocker : null);
    const evidenceIds = Object.freeze([...new Set([
      ...work.evidenceIds,
      ...exceptions.flatMap(item => [...item.evidenceIds]),
      ...distinct.flatMap(item => [...item.evidenceIds]),
      ...authorityFacts.flatMap(item => [...item.evidenceIds]),
    ])].sort());
    const delegationReason = ownershipState === "CONFLICT"
      ? "Verified ownership evidence conflicts; preserve the conflict and do not assign a person or role until it is resolved."
      : ownershipState === "UNKNOWN"
        ? "Authoritative role ownership is absent or unverified; preserve UNKNOWN without inventing an employee or role assignment."
        : assignment!.reason;
    const recommendedInternalHandoff = founderEscalation
      ? `Keep operational preparation with ${role ?? "UNKNOWN"}; present only the verified authority decision to the founder.`
      : role
        ? `Route internally to ${role} in ${targetDivision}; update only the authoritative source record.`
        : `Hold for verified role ownership in ${targetDivision}; do not create a person-level assignment.`;
    const identity = role ?? ownershipState;
    output.push(Object.freeze({
      delegationKey: `${work.key}:DELEGATION:${safe(`${targetDivision}:${identity}`)}`,
      workKey: work.key, exceptionKey: exception?.key ?? null, division: targetDivision,
      recommendedOwningRole: role, ownershipState, delegationReason, evidenceIds,
      founderEscalation, requiredFounderAction, upstreamBlockerExceptionReference: upstreamReference,
      recommendedInternalHandoff, authority: "RECOMMENDATION_ONLY", prohibitedActions: PROHIBITED,
    }));
  }
  return Object.freeze(output.sort((a, b) => Number(b.founderEscalation) - Number(a.founderEscalation) || a.delegationKey.localeCompare(b.delegationKey)));
}
