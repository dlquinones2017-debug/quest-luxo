import { createHash } from "node:crypto";
import { founderQueue } from "./enterpriseCommand.ts";
import { resolveWorkforceOwnership, WORKFORCE_OPERATIONS, type WorkforceOperation, type WorkforceDivision } from "../agents/workforceOperatingModel.ts";

export const OPERATING_SEQUENCE = ["CAPTURE", "VERIFY", "QUALIFY", "ROUTE", "FOLLOW_UP", "ADVANCE", "MEASURE", "REPORT"] as const;
export const WORKFORCE_EVENT_MAX_AGE_MS = 86_400_000;
export interface WorkforceEvent {
  schemaVersion: 1; eventId: string; sourceSystem: string; sourceRevision: number; recordId: string; division: WorkforceDivision;
  stage: typeof OPERATING_SEQUENCE[number]; operation: WorkforceOperation; status: "BLOCKED" | "REQUIRES_FOUNDER" | "UNKNOWN" | "READY";
  evidenceState: "VERIFIED" | "UNKNOWN" | "REQUIRES_VERIFICATION"; evidenceIds: readonly string[]; observedAt: string;
}
const sha = (x: string) => createHash("sha256").update(x).digest("hex");
const hash = /^[a-f0-9]{64}$/;
const time = (s: unknown): s is string => typeof s === "string" && Number.isFinite(Date.parse(s)) && new Date(s).toISOString() === s;
const identity = (e: WorkforceEvent) => [e.sourceSystem, e.division, e.recordId, e.stage, e.operation].join(":");
function validate(raw: unknown, now: string): WorkforceEvent {
  const e = raw as WorkforceEvent;
  const fields = ["schemaVersion", "eventId", "sourceSystem", "sourceRevision", "recordId", "division", "stage", "operation", "status", "evidenceState", "evidenceIds", "observedAt"];
  if (!e || typeof e !== "object" || Array.isArray(e) || Object.keys(e).sort().join() !== fields.sort().join() || e.schemaVersion !== 1 ||
    typeof e.eventId !== "string" || !hash.test(e.eventId) || typeof e.recordId !== "string" || !hash.test(e.recordId) ||
    typeof e.sourceSystem !== "string" || !/^[a-z][a-z0-9._-]{1,63}$/.test(e.sourceSystem) || !Number.isSafeInteger(e.sourceRevision) || e.sourceRevision < 1 ||
    !OPERATING_SEQUENCE.includes(e.stage) || !WORKFORCE_OPERATIONS.includes(e.operation) || !["BLOCKED", "REQUIRES_FOUNDER", "UNKNOWN", "READY"].includes(e.status) ||
    !["VERIFIED", "UNKNOWN", "REQUIRES_VERIFICATION"].includes(e.evidenceState) || !Array.isArray(e.evidenceIds) || e.evidenceIds.length > 10 ||
    !e.evidenceIds.every(x => typeof x === "string" && hash.test(x)) || new Set(e.evidenceIds).size !== e.evidenceIds.length ||
    !time(e.observedAt) || Date.parse(e.observedAt) > Date.parse(now)) throw Error("Invalid bounded workforce event.");
  resolveWorkforceOwnership(e.operation, e.division);
  if (e.evidenceState === "VERIFIED" && e.evidenceIds.length === 0) throw Error("Verified events require source evidence.");
  return structuredClone(e);
}

/** Read-only projection into the existing Command queue, not an outbox or replacement source store. */
export function buildWorkforceQueue(input: readonly WorkforceEvent[], now: string) {
  if (!time(now) || !Array.isArray(input) || input.length > 1000) throw Error("Bounded queue and canonical clock required.");
  const groups = new Map<string, WorkforceEvent[]>(), eventIds = new Map<string, string>();
  let duplicates = 0, replays = 0;
  const conflictingIds = new Set<string>();
  for (const raw of input) {
    const e = validate(raw, now), fingerprint = sha(JSON.stringify([identity(e), e.sourceRevision, e.status, e.evidenceState, [...e.evidenceIds].sort(), e.observedAt]));
    const prior = eventIds.get(e.eventId);
    if (prior === fingerprint) { duplicates++; continue; }
    if (prior && prior !== fingerprint) conflictingIds.add(e.eventId);
    eventIds.set(e.eventId, fingerprint);
    const key = identity(e); groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  const projected = [...groups.entries()].map(([key, history]) => {
    history.sort((a, b) => b.sourceRevision - a.sourceRevision || b.observedAt.localeCompare(a.observedAt) || a.eventId.localeCompare(b.eventId));
    const e = history[0]!, revisionContent = new Map<number, string>();
    let conflict = history.some(x => conflictingIds.has(x.eventId));
    for (const x of history) {
      const content = JSON.stringify([x.status, x.evidenceState, [...x.evidenceIds].sort(), x.observedAt]);
      if (revisionContent.has(x.sourceRevision) && revisionContent.get(x.sourceRevision) !== content) conflict = true;
      revisionContent.set(x.sourceRevision, content);
      if (x.sourceRevision < e.sourceRevision) { replays++; if (Date.parse(x.observedAt) > Date.parse(e.observedAt)) conflict = true; }
    }
    const stale = Date.parse(now) - Date.parse(e.observedAt) > WORKFORCE_EVENT_MAX_AGE_MS;
    const owner = resolveWorkforceOwnership(e.operation, e.division);
    const decision = conflict ? "CONFLICT" : stale ? "STALE" : e.evidenceState !== "VERIFIED" || e.status === "UNKNOWN" ? "VERIFY_SOURCE" :
      e.status === "BLOCKED" ? "BLOCKED" : owner.founderApprovalRequired || e.status === "REQUIRES_FOUNDER" ? "FOUNDER_REVIEW" : owner.handoffRequired ? "HANDOFF_REQUIRED" : "INTERNAL_PREPARATION_READY";
    const queueStatus = conflict || e.status === "BLOCKED" ? "BLOCKED" : ["STALE", "VERIFY_SOURCE"].includes(decision) ? "UNKNOWN" : decision === "FOUNDER_REVIEW" ? "REQUIRES_FOUNDER" : "READY";
    return { key: sha(key), event: e, owner, decision, queueStatus };
  });
  const ordered = founderQueue(projected.map(p => ({ division: p.event.division, recordId: p.key, stage: p.event.stage, status: p.queueStatus as WorkforceEvent["status"],
    reason: p.decision, evidenceIds: p.event.evidenceIds, sourceSystem: "consolidated-workforce-v1", updatedAt: p.event.observedAt })));
  const byKey = new Map(projected.map(p => [p.key, p]));
  const items = ordered.map(q => {
    const p = byKey.get(q.recordId)!;
    return Object.freeze({ queueId: p.key, eventId: p.event.eventId, sourceRevision: p.event.sourceRevision, recordId: p.event.recordId, division: p.event.division,
      stage: p.event.stage, operation: p.event.operation, decision: p.decision, ...p.owner,
      founderApprovalRequired: p.owner.founderApprovalRequired || p.event.status === "REQUIRES_FOUNDER", observedAt: p.event.observedAt });
  });
  return Object.freeze({ schemaVersion: 1, operatingModelVersion: 2, mode: "READ_ONLY_COMMAND_PROJECTION", observedAt: now,
    sourceCoverage: "SUPPLIED_EVENTS_ONLY", sourceCompletenessVerified: false, items: Object.freeze(items),
    metrics: Object.freeze({ suppliedEvents: input.length, queueItems: items.length, duplicateEvents: duplicates, replayedRevisions: replays,
      conflicts: items.filter(i => i.decision === "CONFLICT").length, completedTasks: null, leadConversion: null, founderMinutesSaved: null, modelCallsExecuted: 0 }),
    writesCRM: false, sendsMessages: false, dispatchesWork: false, businessDataExecutionAllowed: false, replacesCanonicalStores: false });
}
