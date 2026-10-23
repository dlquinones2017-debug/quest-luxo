import { getAgent } from "../agents/qluxAgenticTeam.ts";

export type HandoffDivision = "LUXURY_ADVISORY" | "REALTY" | "CAPITAL_ADVISORY" | "ENTERPRISE_SHARED";
export type HandoffEvidence = "VERIFIED" | "UNKNOWN" | "REQUIRES_VERIFICATION" | "CONFLICT";
export type HandoffAuthority =
  | "INTERNAL_PREPARATION" | "EXTERNAL_MESSAGE" | "PUBLISH" | "CODE_DEPLOY"
  | "CONTRACT" | "CREDIT_ACTION" | "FUNDS_MOVEMENT";
export type HandoffState =
  | "COMPLETE_EVIDENCED" | "CONFLICT" | "VERIFY" | "WAITING_DEPENDENCY"
  | "FOUNDER_APPROVAL" | "RECOMMENDATION_ONLY" | "READY_INTERNAL";

export interface EnterpriseWorkHandoff {
  readonly workId: string;
  readonly division: HandoffDivision;
  readonly ownerAgentId: string;
  readonly sourceSystem: string;
  readonly sourceRecordId: string;
  readonly evidenceState: HandoffEvidence;
  readonly evidenceIds: readonly string[];
  readonly observedAt: string;
  readonly authority: HandoffAuthority;
  readonly lifecycle: "PENDING" | "COMPLETE";
  readonly dependencyIds?: readonly string[];
  readonly founderApprovalRequired?: boolean;
  readonly priority: number;
  readonly proposedInternalAction: string;
}

export interface EnterpriseWorkHandoffDecision {
  readonly workId: string;
  readonly division: HandoffDivision;
  readonly ownerAgentId: string | null;
  readonly state: HandoffState;
  readonly reason: string;
  readonly dependencyIds: readonly string[];
  readonly evidenceIds: readonly string[];
  readonly sourceReference: string;
  readonly priority: number;
  readonly requiresFounderApproval: boolean;
  readonly executionAllowed: false;
  readonly proposedInternalAction: string;
}

const identity = /^[A-Za-z0-9._:-]{1,160}$/;
const iso = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/;
const allowedAuthority: readonly HandoffAuthority[] = Object.freeze([
  "INTERNAL_PREPARATION", "EXTERNAL_MESSAGE", "PUBLISH", "CODE_DEPLOY",
  "CONTRACT", "CREDIT_ACTION", "FUNDS_MOVEMENT",
]);
const list = (a: readonly string[] | undefined) => Object.freeze([...new Set(a ?? [])].sort());
const safeId = (s: string) => typeof s === "string" && identity.test(s);

function normalized(record: EnterpriseWorkHandoff): EnterpriseWorkHandoff {
  if (!safeId(record.workId) || !safeId(record.ownerAgentId) ||
      !safeId(record.sourceSystem) || !safeId(record.sourceRecordId))
    throw new Error("Work, owner, source and record IDs must be opaque safe identifiers.");
  if (!["LUXURY_ADVISORY", "REALTY", "CAPITAL_ADVISORY", "ENTERPRISE_SHARED"].includes(record.division))
    throw new Error("Unsupported division.");
  if (!["VERIFIED", "UNKNOWN", "REQUIRES_VERIFICATION", "CONFLICT"].includes(record.evidenceState))
    throw new Error("Unsupported evidence state.");
  if (!allowedAuthority.includes(record.authority) || !["PENDING", "COMPLETE"].includes(record.lifecycle))
    throw new Error("Unsupported authority or lifecycle.");
  if (!Number.isFinite(record.priority) || record.priority < 0 || record.priority > 100)
    throw new Error("Priority must be a finite score between 0 and 100.");
  if (typeof record.proposedInternalAction !== "string" || !record.proposedInternalAction.trim())
    throw new Error("Internal action description required.");
  const e = list(record.evidenceIds);
  const d = list(record.dependencyIds);
  if (![...e, ...d].every(safeId)) throw new Error("Evidence/dependencies require opaque IDs.");
  return Object.freeze({
    workId: record.workId, division: record.division, ownerAgentId: record.ownerAgentId,
    sourceSystem: record.sourceSystem, sourceRecordId: record.sourceRecordId,
    evidenceState: record.evidenceState, evidenceIds: e, observedAt: record.observedAt,
    authority: record.authority, lifecycle: record.lifecycle, dependencyIds: d,
    founderApprovalRequired: record.founderApprovalRequired === true,
    priority: record.priority, proposedInternalAction: record.proposedInternalAction.trim(),
  });
}

const verifiedTime = (at: string, now: Date) =>
  typeof at === "string" && iso.test(at) &&
  Number.isFinite(Date.parse(at)) && Date.parse(at) <= now.getTime();

const result = (
  item: EnterpriseWorkHandoff, state: HandoffState, reason: string,
  ownerAgentId: string | null,
): EnterpriseWorkHandoffDecision => Object.freeze({
  workId: item.workId,
  division: item.division,
  ownerAgentId,
  state,
  reason,
  dependencyIds: Object.freeze([...(item.dependencyIds ?? [])]),
  evidenceIds: Object.freeze([...item.evidenceIds]),
  sourceReference: `${item.sourceSystem}:${item.sourceRecordId}`,
  priority: item.priority,
  requiresFounderApproval: item.founderApprovalRequired === true ||
    item.authority !== "INTERNAL_PREPARATION",
  executionAllowed: false,
  proposedInternalAction: item.proposedInternalAction,
});

/**
 * Internal, non-mutating orchestration contract.
 * The evidenceState input MUST originate from a trusted source adapter;
 * arbitrary user text or public form submissions cannot confer VERIFIED.
 * Never interprets a recommended action as permission to send, publish or transact.
 */
export function coordinateEnterpriseWorkHandoffs(
  records: readonly EnterpriseWorkHandoff[],
  now = new Date(),
): readonly EnterpriseWorkHandoffDecision[] {
  if (!Number.isFinite(now.getTime())) throw new Error("Valid evaluation time required.");
  const byId = new Map<string, EnterpriseWorkHandoff>();
  const conflicts = new Set<string>();
  for (const raw of records) {
    const item = normalized(raw);
    const previous = byId.get(item.workId);
    if (previous && JSON.stringify(previous) !== JSON.stringify(item)) conflicts.add(item.workId);
    else if (!previous) byId.set(item.workId, item);
  }
  const decisions = new Map<string, EnterpriseWorkHandoffDecision>();
  const resolving = new Set<string>();

  function resolve(id: string): EnterpriseWorkHandoffDecision {
    const cached = decisions.get(id);
    if (cached) return cached;
    const item = byId.get(id)!;
    let answer: EnterpriseWorkHandoffDecision;
    const agent = getAgent(item.ownerAgentId);
    const owner = agent?.id ?? null;
    if (conflicts.has(id) || item.evidenceState === "CONFLICT") {
      answer = result(item, "CONFLICT", "Conflicting work evidence; human reconciliation required.", owner);
    } else if (resolving.has(id)) {
      answer = result(item, "CONFLICT", "Dependency cycle; no handoff permitted.", owner);
    } else if (item.evidenceState !== "VERIFIED" || !item.evidenceIds.length ||
               !verifiedTime(item.observedAt, now) || !agent ||
               (agent.division !== item.division && item.division !== "ENTERPRISE_SHARED") ||
               (item.division === "ENTERPRISE_SHARED" && !["COMMAND_CENTER", "ENTERPRISE_OPERATIONS", "WEBSITE_PRODUCT", "MARKETING", "GROWTH_ENGINE"].includes(agent.division))) {
      answer = result(item, "VERIFY", "Verify evidence, timestamp, agent registration and division ownership before routing.", owner);
    } else {
      resolving.add(id);
      let blockers: string[] = [];
      for (const dependency of item.dependencyIds ?? []) {
        if (!byId.has(dependency)) { blockers.push(dependency); continue; }
        if (resolving.has(dependency)) { blockers.push(dependency); conflicts.add(id); continue; }
        const upstream = resolve(dependency);
        if (upstream.state !== "COMPLETE_EVIDENCED") blockers.push(dependency);
      }
      resolving.delete(id);
      if (conflicts.has(id)) {
        answer = result(item, "CONFLICT", "Circular handoff dependencies require reconciliation.", owner);
      } else if (blockers.length) {
        answer = result(item, "WAITING_DEPENDENCY", `Dependency evidence incomplete: ${blockers.join(", ")}`, owner);
      } else if (item.lifecycle === "COMPLETE" && item.authority === "INTERNAL_PREPARATION") {
        answer = result(item, "COMPLETE_EVIDENCED", "Verified internal completion; not proof of an external action.", owner);
      } else if (item.authority !== "INTERNAL_PREPARATION" || item.founderApprovalRequired) {
        answer = result(item, "FOUNDER_APPROVAL", "Founder authorization and any regulatory controls required before external/binding action.", owner);
      } else if (agent.status !== "DEPLOYED") {
        answer = result(item, "RECOMMENDATION_ONLY", "Agent is not deployed for autonomous internal execution.", owner);
      } else {
        answer = result(item, "READY_INTERNAL", "Verified internal preparation can be recommended; this module never executes it.", owner);
      }
    }
    decisions.set(id, answer);
    return answer;
  }
  for (const id of [...byId.keys()].sort()) resolve(id);
  return Object.freeze([...decisions.values()].sort(
    (a, b) => b.priority - a.priority || a.workId.localeCompare(b.workId),
  ));
}
