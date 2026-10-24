/** An operator-observed recovery receipt is evidence, never permission to process business data. */
export const RECOVERY_RECEIPT_MAX_AGE_MS = 86_400_000;
export const RECURRING_RECOVERY_MAX_AGE_MS = 43_200_000;
export interface PilotRecoveryState { storageVerified: boolean; localBackupVerified: boolean; pipelineRevision: string; intakeRevision: string; preparationRevision?: string }
const hash = /^[a-f0-9]{64}$/;
const exact = (v: unknown, fields: string[]): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join() === [...fields].sort().join();
const iso = (v: unknown): v is string => typeof v === "string" && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
/** Fourth argument is trusted only when obtained through the authenticated checkpoint reader. */
export function assessPilotRecovery(state: PilotRecoveryState, evidence: unknown, now: string, recurringProof?: unknown) {
  const time = Date.parse(now);
  if (!Number.isFinite(time) || !state || !exact(state, ["storageVerified", "localBackupVerified", "pipelineRevision", "intakeRevision", ...(state.preparationRevision === undefined ? [] : ["preparationRevision"])]) ||
      typeof state.storageVerified !== "boolean" || typeof state.localBackupVerified !== "boolean" || typeof state.pipelineRevision !== "string" || !hash.test(state.pipelineRevision) || typeof state.intakeRevision !== "string" || !hash.test(state.intakeRevision) || state.preparationRevision !== undefined && (typeof state.preparationRevision !== "string" || !hash.test(state.preparationRevision)))
    throw Error("Verified bounded pilot state required.");
  let receiptState = "MISSING";
  let validUntil: string | null = null;
  if (evidence !== null && evidence !== undefined) {
    const r = evidence as Record<string, unknown>;
    const fields = ["version", "mode", "verifiedAt", "pipelineRevision", "intakeRevision", "keyRecoveryVerified", "archiveRecoveryVerified", "retention", "verificationMethod", "evidenceRef"];
    if (!r || typeof r !== "object" || Array.isArray(r) || Object.keys(r).sort().join() !== fields.sort().join() ||
        r.version !== 1 || r.mode !== "SYNTHETIC_ONLY" || r.keyRecoveryVerified !== true || r.archiveRecoveryVerified !== true ||
        r.retention !== "ONE_TIME_OFFSITE_COPY" || r.verificationMethod !== "OPERATOR_OBSERVED_DPAPI_FRESH_PROCESS" ||
        typeof r.evidenceRef !== "string" || !/^[a-zA-Z0-9._:-]{1,160}$/.test(r.evidenceRef) ||
        typeof r.verifiedAt !== "string" || !Number.isFinite(Date.parse(r.verifiedAt)) ||
        typeof r.pipelineRevision !== "string" || !hash.test(r.pipelineRevision) || typeof r.intakeRevision !== "string" || !hash.test(r.intakeRevision))
      throw Error("Invalid recovery receipt.");
    const age = time - Date.parse(r.verifiedAt);
    receiptState = age < 0 || r.pipelineRevision !== state.pipelineRevision || r.intakeRevision !== state.intakeRevision ? "CONFLICT" :
      age > RECOVERY_RECEIPT_MAX_AGE_MS ? "STALE" : "VERIFIED";
    if (receiptState === "VERIFIED") validUntil = new Date(Date.parse(r.verifiedAt) + RECOVERY_RECEIPT_MAX_AGE_MS).toISOString();
  }
  let recurring = false;
  if (recurringProof !== null && recurringProof !== undefined) {
    const p = recurringProof;
    if (!exact(p, ["version", "clientId", "firstSuccessAt", "lastSuccessAt", "successfulCycles", "archives", "checkpointAuthenticated", "recurringIndependentRetentionVerified", "businessDataExecutionAllowed"]) ||
        p.version !== 1 || p.clientId !== "windows-recovery-primary" || p.checkpointAuthenticated !== true ||
        p.recurringIndependentRetentionVerified !== true || p.businessDataExecutionAllowed !== false ||
        !iso(p.firstSuccessAt) || !iso(p.lastSuccessAt) || !Number.isSafeInteger(p.successfulCycles) || (p.successfulCycles as number) < 2 || (p.successfulCycles as number) > 1_000_000_000 ||
        !Array.isArray(p.archives) || p.archives.length !== 3 || !state.preparationRevision) throw Error("Invalid recurring recovery proof.");
    const kinds = ["intake", "pipeline", "preparation"];
    const revisions = [state.intakeRevision, state.pipelineRevision, state.preparationRevision];
    let matches = true;
    p.archives.forEach((a: unknown, i: number) => {
      if (!exact(a, ["kind", "revision", "sha256"]) || a.kind !== kinds[i] || typeof a.revision !== "string" || !hash.test(a.revision) || typeof a.sha256 !== "string" || !hash.test(a.sha256))
        throw Error("Invalid recurring recovery archive proof.");
      if (a.revision !== revisions[i]) matches = false;
    });
    const first = Date.parse(p.firstSuccessAt), last = Date.parse(p.lastSuccessAt);
    if (last - first < 60_000) throw Error("Insufficient recurring recovery cycles.");
    recurring = matches && last <= time && time - last <= RECURRING_RECOVERY_MAX_AGE_MS;
    if (recurring) {
      receiptState = "VERIFIED";
      validUntil = new Date(last + RECURRING_RECOVERY_MAX_AGE_MS).toISOString();
    }
  }
  const verified = receiptState === "VERIFIED" && state.storageVerified && state.localBackupVerified;
  recurring = recurring && verified;
  return Object.freeze({ schemaVersion: 1, mode: "PILOT_LOCAL_READ_ONLY", assessedAt: now, status: "HOLD",
    recoveryReceipt: receiptState, recoveryValidUntil: validUntil, independentBackupVerified: verified, keyRecoveryVerified: verified,
    retention: recurring ? "RECURRING_INDEPENDENT_COPIES" : verified ? "ONE_TIME_OFFSITE_COPY" : "NOT_VERIFIED", recurringOffsiteRetentionVerified: recurring,
    requiredActions: Object.freeze([...(state.storageVerified ? [] : ["STORAGE"]), ...(state.localBackupVerified ? [] : ["LOCAL_RECOVERY"]),
      ...(verified ? [] : ["CURRENT_INDEPENDENT_RECOVERY"]), ...(recurring ? [] : ["RECURRING_OFFSITE_RETENTION"]), "AUTHORIZED_BUSINESS_SOURCE"]),
    businessDataExecutionAllowed: false, changesProduction: false, dispatchesWork: false, sendsMessages: false, writesCRM: false, activatesGmail: false });
}
