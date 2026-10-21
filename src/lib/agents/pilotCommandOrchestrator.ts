import { buildPublicOperationsBrief, triagePublicWebsiteReport } from "./publicOperationsTeam.ts";
import { RECOVERY_RECEIPT_MAX_AGE_MS, type assessPilotRecovery } from "./pilotRecoveryAudit.ts";
import { assessModelExecutionPolicy } from "./modelExecutionPolicy.ts";

type Recovery = ReturnType<typeof assessPilotRecovery>;
type Brief = ReturnType<typeof buildPublicOperationsBrief>;
const exact = (value: unknown, fields: readonly string[]): value is Record<string, unknown> => !!value && typeof value === "object" &&
  !Array.isArray(value) && Object.keys(value).sort().join() === [...fields].sort().join();
function iso(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
}
function validateRecovery(input: unknown, now: string): { recovery: Recovery; fresh: boolean } {
  const r = input as Recovery;
  if (!exact(input, ["schemaVersion", "mode", "assessedAt", "status", "recoveryReceipt", "recoveryValidUntil", "independentBackupVerified", "keyRecoveryVerified",
    "retention", "recurringOffsiteRetentionVerified", "requiredActions", "businessDataExecutionAllowed", "changesProduction", "dispatchesWork", "sendsMessages", "writesCRM", "activatesGmail"]) ||
    r.schemaVersion !== 1 || r.mode !== "PILOT_LOCAL_READ_ONLY" || r.status !== "HOLD" || !iso(r.assessedAt) || Date.parse(r.assessedAt) > Date.parse(now) ||
    !["VERIFIED", "MISSING", "STALE", "CONFLICT"].includes(r.recoveryReceipt) ||
    typeof r.independentBackupVerified !== "boolean" || r.keyRecoveryVerified !== r.independentBackupVerified ||
    [r.recurringOffsiteRetentionVerified, r.businessDataExecutionAllowed, r.changesProduction, r.dispatchesWork, r.sendsMessages, r.writesCRM, r.activatesGmail].some(v => v !== false) ||
    !Array.isArray(r.requiredActions) || r.requiredActions.length > 5 || !r.requiredActions.every(x => typeof x === "string")) throw Error("Unverified recovery assessment.");
  const storage = !r.requiredActions.includes("STORAGE"), local = !r.requiredActions.includes("LOCAL_RECOVERY");
  const verified = r.recoveryReceipt === "VERIFIED" && storage && local;
  const expected = [...(storage ? [] : ["STORAGE"]), ...(local ? [] : ["LOCAL_RECOVERY"]), ...(verified ? [] : ["CURRENT_INDEPENDENT_RECOVERY"]),
    "RECURRING_OFFSITE_RETENTION", "AUTHORIZED_BUSINESS_SOURCE"];
  if (JSON.stringify(r.requiredActions) !== JSON.stringify(expected) || r.independentBackupVerified !== verified ||
    r.retention !== (verified ? "ONE_TIME_OFFSITE_COPY" : "NOT_VERIFIED") ||
    (r.recoveryReceipt === "VERIFIED" ? !iso(r.recoveryValidUntil) || Date.parse(r.recoveryValidUntil) < Date.parse(r.assessedAt) ||
      Date.parse(r.recoveryValidUntil) - Date.parse(r.assessedAt) > RECOVERY_RECEIPT_MAX_AGE_MS : r.recoveryValidUntil !== null))
    throw Error("Inconsistent recovery assessment.");
  return { recovery: r, fresh: Date.parse(now) - Date.parse(r.assessedAt) <= 120_000 };
}

/** Coordinates bounded observations into recommendations. Never dispatches work or grants authority. */
export function coordinatePilotOperations(health: unknown, inputBrief: unknown, inputRecovery: unknown, modelPolicy: unknown, now: string) {
  if (!iso(now)) throw Error("Canonical assessment time required.");
  const brief = inputBrief as Brief;
  if (!brief || !iso(brief.assessedAt) || Date.parse(brief.assessedAt) > Date.parse(now)) throw Error("Verified public brief required.");
  // Rebuild from the original fixed-target observations; matching counts alone are insufficient.
  const originalIncidents = triagePublicWebsiteReport(health, brief.assessedAt);
  const expectedBrief = buildPublicOperationsBrief(health, originalIncidents, brief.assessedAt);
  if (JSON.stringify(brief) !== JSON.stringify(expectedBrief)) throw Error("Public brief does not match its observations.");
  const currentIncidents = triagePublicWebsiteReport(health, now);
  const { recovery, fresh: recoveryFresh } = validateRecovery(inputRecovery, now);
  const model = assessModelExecutionPolicy(modelPolicy);
  const publicFresh = currentIncidents.sourceFresh;
  const independentVerified = recoveryFresh && recovery.independentBackupVerified &&
    recovery.recoveryValidUntil !== null && Date.parse(now) <= Date.parse(recovery.recoveryValidUntil);
  const tasks: { action: string; priority: number; state: string; ownerRoleId: string }[] = [];
  const add = (action: string, priority: number, ownerRoleId: string) => tasks.push({ action, priority, state: "RECOMMENDATION_ONLY", ownerRoleId });
  if (recovery.requiredActions.includes("STORAGE")) add("RESTORE_STORAGE_HEALTH", 0, "reliability-qa-and-incident-response-agent");
  if (recovery.requiredActions.includes("LOCAL_RECOVERY")) add("VERIFY_LOCAL_BACKUP_RECOVERY", 0, "reliability-qa-and-incident-response-agent");
  if (!publicFresh) add("VERIFY_FRESH_PUBLIC_OBSERVATION", 1, "website-product");
  else if (currentIncidents.incidentCount) add("REVIEW_PUBLIC_SITE_INCIDENTS", 1, "enterprise-risk");
  if (!recoveryFresh) add("VERIFY_FRESH_RECOVERY_ASSESSMENT", 1, "reliability-qa-and-incident-response-agent");
  if (!independentVerified) add("VERIFY_INDEPENDENT_RECOVERY", 1, "reliability-qa-and-incident-response-agent");
  add("ESTABLISH_RECURRING_OFFSITE_RETENTION", 2, "reliability-qa-and-incident-response-agent");
  add("REVIEW_BUSINESS_SOURCE_SCOPE", 2, "founder-chief-of-staff-and-approval-agent");
  return Object.freeze({ schemaVersion: 1, mode: "PILOT_LOCAL_READ_ONLY", assessedAt: now, status: "HOLD",
    operationalState: publicFresh && recoveryFresh ? "CURRENT" : "STALE", sourceCount: 3,
    sitesChecked: brief.sitesChecked, sitesResponding: publicFresh ? brief.sitesResponding : null,
    publicIncidentCount: publicFresh ? currentIncidents.incidentCount : null, independentRecoveryVerified: independentVerified,
    modelExecution: "DISABLED_ZERO_BUDGET", dailyModelBudgetUsd: model.dailyBudgetUsd,
    businessPipeline: "NOT_CONNECTED", sourceCoverage: "PUBLIC_WEBSITES_AND_SYNTHETIC_PILOT_ONLY",
    tasks: Object.freeze(tasks.map(task => Object.freeze(task))), businessDataExecutionAllowed: false,
    modelApiRequestsAllowed: false, changesProduction: false, dispatchesWork: false, sendsMessages: false, writesCRM: false, activatesGmail: false });
}
