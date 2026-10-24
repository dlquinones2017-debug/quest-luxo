/** Evidence assessment only. A report can recommend review, never grant access. */
export const READINESS_CHECKS = ["STORAGE", "LOCAL_RECOVERY", "OFFSITE_RECOVERY", "KEY_RECOVERY", "RETENTION_POLICY", "MONITORING", "SOURCE_SCOPE"] as const;
export type ReadinessCheck = typeof READINESS_CHECKS[number];
type EvidenceState = "VERIFIED" | "MISSING" | "CONFLICT";
export interface ReadinessEvidence {
  check: ReadinessCheck;
  state: EvidenceState;
  observedAt: string;
  evidenceRef: string;
}
const identifier = /^[a-zA-Z0-9._:-]{1,160}$/;
export function assessAgentReadiness(input: readonly ReadinessEvidence[], now: string) {
  const time = Date.parse(now);
  if (!Number.isFinite(time) || !Array.isArray(input) || input.length > READINESS_CHECKS.length) throw Error("Invalid readiness assessment.");
  const seen = new Map<ReadinessCheck, ReadinessEvidence>();
  for (const item of input) {
    if (!item || typeof item !== "object" || Array.isArray(item) ||
        Object.keys(item).sort().join() !== ["check", "state", "observedAt", "evidenceRef"].sort().join() ||
        !READINESS_CHECKS.includes(item.check) || seen.has(item.check) ||
        !["VERIFIED", "MISSING", "CONFLICT"].includes(item.state) ||
        typeof item.evidenceRef !== "string" || !identifier.test(item.evidenceRef) ||
        typeof item.observedAt !== "string" || !Number.isFinite(Date.parse(item.observedAt)))
      throw Error("Invalid, duplicate or unrecognized readiness evidence.");
    seen.set(item.check, item);
  }
  const checks = READINESS_CHECKS.map(check => {
    const evidence = seen.get(check);
    const age = evidence ? time - Date.parse(evidence.observedAt) : Infinity;
    const state = !evidence ? "MISSING" : age < 0 ? "CONFLICT" : age > 86_400_000 ? "STALE" : evidence.state;
    return Object.freeze({ check, state, evidenceRef: evidence?.evidenceRef ?? null });
  });
  const requiredActions = checks.filter(c => c.state !== "VERIFIED").map(c => c.check);
  return Object.freeze({ schemaVersion: 1, mode: "READ_ONLY_ASSESSMENT", assessedAt: now,
    status: requiredActions.length ? "HOLD" : "READY_FOR_FOUNDER_REVIEW", checks: Object.freeze(checks),
    requiredActions: Object.freeze(requiredActions), businessDataExecutionAllowed: false,
    sendsMessages: false, writesCRM: false, activatesGmail: false });
}

type Aggregate = { division: "CAPITAL_ADVISORY" | "REALTY"; total: number; blocked: number; founderReview: number; unverifiedEvidence: number };
function aggregateReport(input: unknown): readonly Aggregate[] | null {
  if (input === null || input === undefined) return null;
  const r = input as Record<string, unknown>;
  if (!r || r.schemaVersion !== 1 || r.mode !== "MANUAL_READ_ONLY" || r.sendsMessages !== false || r.writesCRM !== false ||
      Object.keys(r).sort().join() !== ["schemaVersion", "mode", "snapshotSequence", "divisions", "sendsMessages", "writesCRM", "activatesGmail"].sort().join() ||
      r.activatesGmail !== false || !Number.isSafeInteger(r.snapshotSequence) || (r.snapshotSequence as number) < 1 ||
      !Array.isArray(r.divisions) || r.divisions.length !== 2) throw Error("Unverified aggregate report.");
  const divisions = r.divisions as Aggregate[];
  if (divisions[0]?.division !== "CAPITAL_ADVISORY" || divisions[1]?.division !== "REALTY") throw Error("Aggregate division identity mismatch.");
  for (const d of divisions) {
    if (Object.keys(d).sort().join() !== ["division", "total", "blocked", "founderReview", "unverifiedEvidence"].sort().join() ||
        ![d.total, d.blocked, d.founderReview, d.unverifiedEvidence].every(n => Number.isSafeInteger(n) && n >= 0) ||
        d.blocked + d.founderReview > d.total || d.unverifiedEvidence > d.total) throw Error("Invalid aggregate counts.");
  }
  return divisions.map(d => Object.freeze({ ...d }));
}

/** Projects existing aggregates into an internal recommendation, not a competing CRM or dispatch queue. */
export function buildFounderOperationsBrief(report: unknown, evidence: readonly ReadinessEvidence[], now: string) {
  const readiness = assessAgentReadiness(evidence, now);
  const divisions = aggregateReport(report);
  return Object.freeze({ schemaVersion: 1, mode: "RECOMMENDATION_ONLY", assessedAt: now,
    status: !divisions || readiness.status === "HOLD" ? "HOLD" : "READY_FOR_FOUNDER_REVIEW",
    pipelineSource: divisions ? "AUTHENTICATED_AGGREGATE" : "MISSING", divisions,
    readiness, requiredActions: Object.freeze([...(divisions ? [] : ["PIPELINE_SOURCE_MISSING"]), ...readiness.requiredActions]),
    dispatchesWork: false, businessDataExecutionAllowed: false, sendsMessages: false, writesCRM: false, activatesGmail: false });
}
