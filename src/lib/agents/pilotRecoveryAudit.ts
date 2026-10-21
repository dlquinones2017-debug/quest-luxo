/** An operator-observed recovery receipt is evidence, never permission to process business data. */
export const RECOVERY_RECEIPT_MAX_AGE_MS = 86_400_000;
export interface PilotRecoveryState { storageVerified: boolean; localBackupVerified: boolean; pipelineRevision: string; intakeRevision: string }
const hash = /^[a-f0-9]{64}$/;
export function assessPilotRecovery(state: PilotRecoveryState, evidence: unknown, now: string) {
  const time = Date.parse(now);
  if (!Number.isFinite(time) || !state || Object.keys(state).sort().join() !== ["storageVerified", "localBackupVerified", "pipelineRevision", "intakeRevision"].sort().join() ||
      typeof state.storageVerified !== "boolean" || typeof state.localBackupVerified !== "boolean" || !hash.test(state.pipelineRevision) || !hash.test(state.intakeRevision))
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
  const verified = receiptState === "VERIFIED" && state.storageVerified && state.localBackupVerified;
  return Object.freeze({ schemaVersion: 1, mode: "PILOT_LOCAL_READ_ONLY", assessedAt: now, status: "HOLD",
    recoveryReceipt: receiptState, recoveryValidUntil: validUntil, independentBackupVerified: verified, keyRecoveryVerified: verified,
    retention: verified ? "ONE_TIME_OFFSITE_COPY" : "NOT_VERIFIED", recurringOffsiteRetentionVerified: false,
    requiredActions: Object.freeze([...(state.storageVerified ? [] : ["STORAGE"]), ...(state.localBackupVerified ? [] : ["LOCAL_RECOVERY"]),
      ...(verified ? [] : ["CURRENT_INDEPENDENT_RECOVERY"]), "RECURRING_OFFSITE_RETENTION", "AUTHORIZED_BUSINESS_SOURCE"]),
    businessDataExecutionAllowed: false, changesProduction: false, dispatchesWork: false, sendsMessages: false, writesCRM: false, activatesGmail: false });
}
