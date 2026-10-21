import { assessAgentReadiness } from "./agentReadinessPolicy.ts";
import type { ReadinessEvidence } from "./agentReadinessPolicy.ts";

const DIVISIONS = ["CAPITAL_ADVISORY", "REALTY"] as const;
const exact = (value: unknown, keys: readonly string[]): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join() === [...keys].sort().join();
const token = (value: unknown) => typeof value === "string" && /^[a-z][a-z0-9-]{0,79}$/.test(value);
const timestamp = (value: unknown): number => typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value ? Date.parse(value) : NaN;
const fail = () => { throw Error("Source preflight rejected; verify reviewed scope, bounded metadata and freshness."); };

/** Pure, non-persistent preflight. Caller-supplied evidence is not independently attested. */
export function previewBusinessSource(contract: unknown, envelope: unknown, evidence: readonly ReadinessEvidence[], now: string) {
  const time = timestamp(now);
  if (!Number.isFinite(time) || !exact(contract, ["schemaVersion", "sourceId", "mode", "divisions", "maxRecords", "maxAgeSeconds", "expiresAt"]) ||
      contract.schemaVersion !== 1 || contract.mode !== "PREVIEW_ONLY" || !token(contract.sourceId) ||
      !Array.isArray(contract.divisions) || contract.divisions.length < 1 || contract.divisions.length > 2 ||
      new Set(contract.divisions).size !== contract.divisions.length || contract.divisions.some(d => !DIVISIONS.includes(d)) ||
      !Number.isSafeInteger(contract.maxRecords) || (contract.maxRecords as number) < 1 || (contract.maxRecords as number) > 1000 ||
      !Number.isSafeInteger(contract.maxAgeSeconds) || (contract.maxAgeSeconds as number) < 1 || (contract.maxAgeSeconds as number) > 86400 ||
      !Number.isFinite(timestamp(contract.expiresAt)) || timestamp(contract.expiresAt) <= time) return fail();
  if (!exact(envelope, ["schemaVersion", "sourceId", "capturedAt", "records"]) || envelope.schemaVersion !== 1 ||
      envelope.sourceId !== contract.sourceId || !Number.isFinite(timestamp(envelope.capturedAt)) ||
      timestamp(envelope.capturedAt) > time || time - timestamp(envelope.capturedAt) > (contract.maxAgeSeconds as number) * 1000 ||
      !Array.isArray(envelope.records) || envelope.records.length > (contract.maxRecords as number)) return fail();
  const approvedDivisions = contract.divisions;
  const seen = new Set<string>();
  const counts = DIVISIONS.filter(d => approvedDivisions.includes(d)).map(division => ({ division, total: 0, blocked: 0, founderReview: 0, unverifiedEvidence: 0 }));
  for (const record of envelope.records) {
    if (!exact(record, ["recordId", "division", "status", "evidenceState", "updatedAt"]) ||
        typeof record.recordId !== "string" || !/^[a-f0-9]{64}$/.test(record.recordId) ||
        !contract.divisions.includes(record.division) || !["READY", "BLOCKED", "REQUIRES_FOUNDER"].includes(record.status as string) ||
        !["VERIFIED", "UNKNOWN", "REQUIRES_VERIFICATION"].includes(record.evidenceState as string) ||
        !Number.isFinite(timestamp(record.updatedAt)) || timestamp(record.updatedAt) > timestamp(envelope.capturedAt) ||
        time - timestamp(record.updatedAt) > (contract.maxAgeSeconds as number) * 1000) return fail();
    // A duplicate opaque identifier across divisions also requires operator reconciliation.
    if (seen.has(record.recordId)) return fail();
    seen.add(record.recordId);
    const count = counts.find(c => c.division === record.division)!;
    count.total++;
    if (record.status === "BLOCKED") count.blocked++;
    if (record.status === "REQUIRES_FOUNDER") count.founderReview++;
    if (record.evidenceState !== "VERIFIED") count.unverifiedEvidence++;
  }
  const readiness = assessAgentReadiness(evidence, now);
  return Object.freeze({ schemaVersion: 1, mode: "PREVIEW_ONLY", sourceId: contract.sourceId,
    assessedAt: now, status: readiness.status, evidenceAttestation: "CALLER_SUPPLIED_UNVERIFIED",
    divisions: Object.freeze(counts.map(c => Object.freeze(c))), readiness,
    businessDataExecutionAllowed: false, persistsRecords: false, dispatchesWork: false,
    sendsMessages: false, writesCRM: false, activatesGmail: false });
}
