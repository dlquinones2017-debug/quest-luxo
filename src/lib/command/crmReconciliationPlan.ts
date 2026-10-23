import { createHash } from "node:crypto";

/** An internal metadata comparison, not a CRM client or a replacement canonical store. */
export const CRM_HANDOFF_STAGES = Object.freeze(["CAPTURE", "VERIFY", "QUALIFY", "ROUTE", "FOLLOW_UP", "ADVANCE", "MEASURE", "REPORT"] as const);
export const CRM_MAPPING_FIELDS = Object.freeze(["DIVISION", "SOURCE_IDENTITY", "CANONICAL_IDENTITY", "SOURCE_REVISION", "PROCESSING_CONSENT", "PIPELINE_STAGE"] as const);
export type CRMDivision = "LUXURY_ADVISORY" | "CAPITAL_ADVISORY" | "REALTY";
type Connection = "CONNECTED" | "UNCONNECTED" | "FAILED";
interface Source {
  division: CRMDivision; sourceId: string; connection: Connection; capturedAt: string | null;
  mapping: { state: "REVIEWED" | "UNREVIEWED"; evidenceRef: string | null; verifiedFields: readonly string[]; reviewedAt: string | null; expiresAt: string | null };
}
export interface CRMHandoffEvent {
  division: CRMDivision; sourceId: string; sourceRecordId: string; sourceRevision: number;
  canonicalRecordId: string | null; payloadFingerprint: string; observedAt: string;
  provenanceState: "VERIFIED" | "UNKNOWN"; evidenceRef: string | null;
  qualificationState: "VERIFIED" | "UNKNOWN"; processingConsent: "VERIFIED" | "UNKNOWN" | "DENIED";
}
interface CRMCase {
  division: CRMDivision; sourceId: string; sourceRecordId: string; canonicalRecordId: string;
  crmCaseId: string; crmRevision: string; sourceRevision: number; metadataFingerprint: string;
}
interface CheckpointEntry {
  division: CRMDivision; sourceId: string; sourceRecordId: string; sourceRevision: number;
  idempotencyKey: string; metadataFingerprint: string;
}
interface Input {
  schemaVersion: 1; mode: "INTERNAL_METADATA_PLAN_ONLY"; maxAgeSeconds: number; sources: readonly Source[]; events: readonly CRMHandoffEvent[];
  crm: { connection: Connection; capturedAt: string | null; cases: readonly CRMCase[] };
  checkpoint: { revision: string; capturedAt: string; entries: readonly CheckpointEntry[] };
  readiness: { verifiedAt: string; durableCheckpointVerified: boolean; independentRecoveryVerified: boolean; keyRecoveryVerified: boolean };
}
const divisions = ["LUXURY_ADVISORY", "CAPITAL_ADVISORY", "REALTY"] as const;
const hashPattern = /^[a-f0-9]{64}$/;
const sourcePattern = /^[a-z][a-z0-9-]{0,79}$/;
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const fields = (value: unknown, keys: readonly string[]): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value) &&
  Object.keys(value).sort().join() === [...keys].sort().join();
const time = (value: unknown): number => typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value ? Date.parse(value) : NaN;
const hash = (value: unknown): value is string => typeof value === "string" && hashPattern.test(value);
const source = (value: unknown): value is string => typeof value === "string" && sourcePattern.test(value);
const revision = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 1 && (value as number) <= 1_000_000_000;
const connected = (value: unknown) => ["CONNECTED", "UNCONNECTED", "FAILED"].includes(value as string);
const fail = (): never => { throw Error("CRM handoff plan rejected; verify bounded metadata, source scope and checkpoint integrity."); };
function identity(value: { division: CRMDivision; sourceId: string; sourceRecordId: string }) {
  return JSON.stringify([value.division, value.sourceId, value.sourceRecordId]);
}
/** Stable identity excludes payload so changed content at the same revision conflicts instead of becoming a new event. */
export function crmHandoffIdempotencyKey(value: Pick<CRMHandoffEvent, "division" | "sourceId" | "sourceRecordId" | "sourceRevision">) {
  if (!value || !divisions.includes(value.division) || !source(value.sourceId) || !hash(value.sourceRecordId) || !revision(value.sourceRevision)) return fail();
  return digest(["quest-luxo-crm-handoff-v1", value.division, value.sourceId, value.sourceRecordId, value.sourceRevision]);
}
export function crmHandoffMetadataFingerprint(value: CRMHandoffEvent) {
  validateEvent(value);
  return digest([value.canonicalRecordId, value.payloadFingerprint, value.observedAt, value.provenanceState, value.evidenceRef, value.qualificationState, value.processingConsent]);
}
function validateEvent(value: unknown): asserts value is CRMHandoffEvent {
  if (!fields(value, ["division", "sourceId", "sourceRecordId", "sourceRevision", "canonicalRecordId", "payloadFingerprint", "observedAt", "provenanceState", "evidenceRef", "qualificationState", "processingConsent"]) ||
      !divisions.includes(value.division as CRMDivision) || !source(value.sourceId) || !hash(value.sourceRecordId) || !revision(value.sourceRevision) ||
      !(value.canonicalRecordId === null || hash(value.canonicalRecordId)) || !hash(value.payloadFingerprint) || !Number.isFinite(time(value.observedAt)) ||
      !["VERIFIED", "UNKNOWN"].includes(value.provenanceState as string) || !(value.evidenceRef === null || hash(value.evidenceRef)) ||
      !["VERIFIED", "UNKNOWN"].includes(value.qualificationState as string) || !["VERIFIED", "UNKNOWN", "DENIED"].includes(value.processingConsent as string)) return fail();
}
function validate(input: unknown, now: string): Input {
  const current = time(now);
  if (!Number.isFinite(current) || !fields(input, ["schemaVersion", "mode", "maxAgeSeconds", "sources", "events", "crm", "checkpoint", "readiness"]) ||
      input.schemaVersion !== 1 || input.mode !== "INTERNAL_METADATA_PLAN_ONLY" || !Number.isSafeInteger(input.maxAgeSeconds) ||
      (input.maxAgeSeconds as number) < 1 || (input.maxAgeSeconds as number) > 86400 || !Array.isArray(input.sources) || input.sources.length > 12 ||
      !Array.isArray(input.events) || input.events.length > 100 || !fields(input.crm, ["connection", "capturedAt", "cases"]) ||
      !connected(input.crm.connection) || !Array.isArray(input.crm.cases) || input.crm.cases.length > 1000 ||
      !fields(input.checkpoint, ["revision", "capturedAt", "entries"]) || !hash(input.checkpoint.revision) || !Array.isArray(input.checkpoint.entries) || input.checkpoint.entries.length > 1000 ||
      !fields(input.readiness, ["verifiedAt", "durableCheckpointVerified", "independentRecoveryVerified", "keyRecoveryVerified"]) ||
      [input.readiness.durableCheckpointVerified, input.readiness.independentRecoveryVerified, input.readiness.keyRecoveryVerified].some(v => typeof v !== "boolean")) return fail();
  const snapshotTime = (v: unknown, allowNull = false) => {
    if (allowNull && v === null) return;
    if (!Number.isFinite(time(v)) || time(v) > current) return fail();
  };
  snapshotTime(input.crm.capturedAt, input.crm.connection !== "CONNECTED");
  snapshotTime(input.checkpoint.capturedAt); snapshotTime(input.readiness.verifiedAt);
  const seenSources = new Set<string>();
  for (const s of input.sources) {
    if (!fields(s, ["division", "sourceId", "connection", "capturedAt", "mapping"]) || !divisions.includes(s.division as CRMDivision) || !source(s.sourceId) ||
        seenSources.has(s.sourceId) || !connected(s.connection) || !fields(s.mapping, ["state", "evidenceRef", "verifiedFields", "reviewedAt", "expiresAt"]) ||
        !["REVIEWED", "UNREVIEWED"].includes(s.mapping.state as string) || !(s.mapping.evidenceRef === null || hash(s.mapping.evidenceRef)) ||
        !Array.isArray(s.mapping.verifiedFields) || s.mapping.verifiedFields.length > CRM_MAPPING_FIELDS.length ||
        new Set(s.mapping.verifiedFields).size !== s.mapping.verifiedFields.length || s.mapping.verifiedFields.some(v => !CRM_MAPPING_FIELDS.includes(v)) ||
        !(s.mapping.expiresAt === null || Number.isFinite(time(s.mapping.expiresAt))) ||
        !(s.mapping.reviewedAt === null || Number.isFinite(time(s.mapping.reviewedAt)) && time(s.mapping.reviewedAt) <= current)) return fail();
    snapshotTime(s.capturedAt, s.connection !== "CONNECTED"); seenSources.add(s.sourceId);
  }
  const registeredSources = input.sources;
  const scoped = (v: Record<string, unknown>) => registeredSources.some(s => s.sourceId === v.sourceId && s.division === v.division);
  for (const event of input.events) {
    validateEvent(event);
    if (!scoped(event as unknown as Record<string, unknown>) || time(event.observedAt) > current) return fail();
    const s = input.sources.find(s => s.sourceId === event.sourceId)!;
    if (s.capturedAt !== null && time(event.observedAt) > time(s.capturedAt)) return fail();
  }
  for (const c of input.crm.cases) {
    if (!fields(c, ["division", "sourceId", "sourceRecordId", "canonicalRecordId", "crmCaseId", "crmRevision", "sourceRevision", "metadataFingerprint"]) ||
        !divisions.includes(c.division as CRMDivision) || !source(c.sourceId) || !hash(c.sourceRecordId) || !hash(c.canonicalRecordId) ||
        !hash(c.crmCaseId) || !hash(c.crmRevision) || !revision(c.sourceRevision) || !hash(c.metadataFingerprint)) return fail();
  }
  const seenKeys = new Set<string>();
  for (const entry of input.checkpoint.entries) {
    if (!fields(entry, ["division", "sourceId", "sourceRecordId", "sourceRevision", "idempotencyKey", "metadataFingerprint"]) ||
        !divisions.includes(entry.division as CRMDivision) || !source(entry.sourceId) || !hash(entry.sourceRecordId) || !revision(entry.sourceRevision) ||
        !hash(entry.idempotencyKey) || !hash(entry.metadataFingerprint) || seenKeys.has(entry.idempotencyKey) ||
        entry.idempotencyKey !== crmHandoffIdempotencyKey(entry as unknown as CRMHandoffEvent)) return fail();
    seenKeys.add(entry.idempotencyKey);
  }
  return input as unknown as Input;
}
const owners: Record<CRMDivision, string> = { LUXURY_ADVISORY: "technology-luxury", CAPITAL_ADVISORY: "capital-advisory", REALTY: "property-acquisitions" };
type State = "UNKNOWN_SOURCE_UNAVAILABLE" | "UNKNOWN_CRM_UNAVAILABLE" | "HOLD_STALE_EVIDENCE" | "HOLD_MAPPING_REVIEW_REQUIRED" |
  "HOLD_DURABLE_RECOVERY_REQUIRED" | "HOLD_SOURCE_EVIDENCE_REQUIRED" | "HOLD_CANONICAL_LINK_MISSING" | "HOLD_CROSS_DIVISION_CONFLICT" |
  "HOLD_REVISION_CONFLICT" | "HOLD_OUT_OF_ORDER" | "HOLD_SOURCE_REVISION_GAP" | "REPLAY_NOOP" | "HOLD_QUALIFICATION_REVIEW_REQUIRED" |
  "HOLD_PROCESSING_CONSENT_REQUIRED" | "SUPPRESSED_CONSENT_DENIED" | "HOLD_CRM_LINK_MISSING" | "HOLD_CRM_LINK_AMBIGUOUS" |
  "HOLD_CANONICAL_LINK_CONFLICT" | "REVIEW_CRM_REVISION" | "MATCHED_METADATA_ONLY";

export function planCRMReconciliation(value: unknown, now: string) {
  const input = validate(value, now), current = time(now), ttl = input.maxAgeSeconds * 1000;
  const fresh = (v: string | null) => v !== null && current - time(v) <= ttl;
  const readiness = input.readiness;
  const recoveryReady = readiness.durableCheckpointVerified && readiness.independentRecoveryVerified && readiness.keyRecoveryVerified;
  const unique = new Map<string, { event: CRMHandoffEvent; fingerprint: string; duplicates: number; conflict: boolean }>();
  for (const event of input.events) {
    const key = crmHandoffIdempotencyKey(event), fingerprint = crmHandoffMetadataFingerprint(event), old = unique.get(key);
    if (old) { old.duplicates++; if (old.fingerprint !== fingerprint) old.conflict = true; }
    else unique.set(key, { event, fingerprint, duplicates: 0, conflict: false });
  }
  const findings = [...unique.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([idempotencyKey, item]) => {
    const { event, fingerprint } = item, s = input.sources.find(s => s.sourceId === event.sourceId)!;
    const history = input.checkpoint.entries.filter(e => identity(e) === identity(event));
    const prior = history.find(e => e.idempotencyKey === idempotencyKey), latest = Math.max(0, ...history.map(e => e.sourceRevision));
    const matches = input.crm.cases.filter(c => identity(c) === identity(event));
    const sourceCollision = input.events.some(e => e.sourceId === event.sourceId && e.sourceRecordId === event.sourceRecordId && e.division !== event.division) ||
      input.checkpoint.entries.some(e => e.sourceId === event.sourceId && e.sourceRecordId === event.sourceRecordId && e.division !== event.division);
    const caseCollision = matches.some(c => input.crm.cases.some(other => other.crmCaseId === c.crmCaseId && other.division !== event.division));
    let state: State;
    if (sourceCollision || caseCollision) state = "HOLD_CROSS_DIVISION_CONFLICT";
    else if (item.conflict) state = "HOLD_REVISION_CONFLICT";
    else if (s.connection !== "CONNECTED") state = "UNKNOWN_SOURCE_UNAVAILABLE";
    else if (input.crm.connection !== "CONNECTED") state = "UNKNOWN_CRM_UNAVAILABLE";
    else if (![s.capturedAt, input.crm.capturedAt, input.checkpoint.capturedAt, readiness.verifiedAt, event.observedAt].every(fresh) ||
      s.mapping.reviewedAt !== null && !fresh(s.mapping.reviewedAt)) state = "HOLD_STALE_EVIDENCE";
    else if (s.mapping.state !== "REVIEWED" || !s.mapping.evidenceRef || s.mapping.reviewedAt === null || s.mapping.expiresAt === null || time(s.mapping.expiresAt) <= current || time(s.mapping.expiresAt) <= time(s.mapping.reviewedAt) ||
      CRM_MAPPING_FIELDS.some(field => !s.mapping.verifiedFields.includes(field))) state = "HOLD_MAPPING_REVIEW_REQUIRED";
    else if (!recoveryReady) state = "HOLD_DURABLE_RECOVERY_REQUIRED";
    else if (event.provenanceState !== "VERIFIED" || !event.evidenceRef) state = "HOLD_SOURCE_EVIDENCE_REQUIRED";
    else if (event.canonicalRecordId === null) state = "HOLD_CANONICAL_LINK_MISSING";
    else if (prior) state = prior.metadataFingerprint === fingerprint ? "REPLAY_NOOP" : "HOLD_REVISION_CONFLICT";
    else if (event.sourceRevision <= latest) state = "HOLD_OUT_OF_ORDER";
    else if (event.sourceRevision !== latest + 1) state = "HOLD_SOURCE_REVISION_GAP";
    else if (event.processingConsent === "DENIED") state = "SUPPRESSED_CONSENT_DENIED";
    else if (event.qualificationState !== "VERIFIED") state = "HOLD_QUALIFICATION_REVIEW_REQUIRED";
    else if (event.processingConsent !== "VERIFIED") state = "HOLD_PROCESSING_CONSENT_REQUIRED";
    else if (matches.length === 0) state = "HOLD_CRM_LINK_MISSING";
    else if (matches.length !== 1) state = "HOLD_CRM_LINK_AMBIGUOUS";
    else if (matches[0]!.canonicalRecordId !== event.canonicalRecordId) state = "HOLD_CANONICAL_LINK_CONFLICT";
    else if (matches[0]!.sourceRevision > event.sourceRevision) state = "HOLD_OUT_OF_ORDER";
    else if (matches[0]!.sourceRevision === event.sourceRevision && matches[0]!.metadataFingerprint !== fingerprint) state = "HOLD_REVISION_CONFLICT";
    else state = matches[0]!.sourceRevision === event.sourceRevision && matches[0]!.metadataFingerprint === fingerprint ? "MATCHED_METADATA_ONLY" : "REVIEW_CRM_REVISION";
    return Object.freeze({ division: event.division, sourceId: event.sourceId, sourceRecordId: event.sourceRecordId, sourceRevision: event.sourceRevision,
      idempotencyKey, metadataFingerprint: fingerprint, duplicateReceipts: item.duplicates, state,
      ownerTeamId: owners[event.division], reconciliationOwnerTeamId: "enterprise-operations", stage: state === "SUPPRESSED_CONSENT_DENIED" ? "FOLLOW_UP" :
        state === "HOLD_QUALIFICATION_REVIEW_REQUIRED" ? "QUALIFY" : state === "MATCHED_METADATA_ONLY" || state === "REVIEW_CRM_REVISION" ? "ROUTE" : "VERIFY",
      crmCaseId: matches.length === 1 && !caseCollision ? matches[0]!.crmCaseId : null,
      expectedCRMRevision: matches.length === 1 && !caseCollision ? matches[0]!.crmRevision : null,
      recommendation: state === "MATCHED_METADATA_ONLY" ? "PREPARE_INTERNAL_FOLLOW_UP_REVIEW" : state === "REPLAY_NOOP" ? "NO_ACTION" : "REVIEW_HELD_METADATA" });
  });
  const summaries = divisions.map(division => {
    const sources = input.sources.filter(s => s.division === division), observed = findings.filter(f => f.division === division);
    const known = sources.length > 0 && sources.every(s => s.connection === "CONNECTED" && fresh(s.capturedAt)) && input.crm.connection === "CONNECTED" && fresh(input.crm.capturedAt);
    return Object.freeze({ division, observationState: known ? "OBSERVED_BOUNDED_METADATA" : "UNKNOWN",
      observedEvents: known ? observed.length : null, matchedMetadata: known ? observed.filter(f => f.state === "MATCHED_METADATA_ONLY").length : null,
      businessPipelineCount: null, sourceCompletenessVerified: false });
  });
  return Object.freeze({ schemaVersion: 1, mode: "INTERNAL_METADATA_PLAN_ONLY", assessedAt: now, status: "HOLD",
    stageSequence: CRM_HANDOFF_STAGES, evidenceAttestation: "CALLER_SUPPLIED_UNVERIFIED", findings: Object.freeze(findings), divisions: Object.freeze(summaries),
    checkpointRevision: input.checkpoint.revision, checkpointAdvancementAllowed: false, replacesCanonicalStores: false,
    durableReconciliationVerified: false, businessDataExecutionAllowed: false, writesCRM: false, sendsMessages: false, activatesGmail: false,
    submitsApplications: false, makesOffers: false, modelApiRequestsAllowed: false });
}
