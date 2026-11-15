import { readExistingIntakeNotification } from "./luxuryExistingIntakeNotification.ts";
import { readCurrentInternalHandlingReview } from "../leads/leadInternalHandlingReview.ts";
import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { createJsonlLeadStorageAdapter, createLeadStoragePaths } from "../leads/leadStorage.ts";
import { getQuestLuxoServerConfig, type QuestLuxoServerConfig } from "../config/questLuxoConfig.ts";
import { createLeadNotificationContext } from "../leads/leadNotificationContext.ts";
import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import type { LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";
import { runLuxuryGenuineInquiryOnce, type GenuineInquiryDependencies, type GenuineInquiryRelease, type GenuineInquiryAdmission } from "./luxuryGenuineInquiryRuntime.ts";

type StorageConfig = QuestLuxoServerConfig["leadStorage"];
const MAX_BYTES = 8_000_000;
const payloadFields = ["name", "email", "phone", "intent", "brand", "collection", "reference", "desiredWatch", "budget", "timeline", "message", "source", "createdAt"] as const;
const blocked = (reason: string) => ({ status: "HELD", records: [] as readonly LeadSubmissionRecord[], reason });
const samePayload = (a: unknown, b: unknown) => !!a && !!b && typeof a === "object" && typeof b === "object" &&
  payloadFields.every(k => (a as Record<string, unknown>)[k] === (b as Record<string, unknown>)[k]);

/** Server-local canonical-source binding, not Gmail authentication or permission.
 * Uses the actual configured JSONL adapter and verifies raw persisted identity
 * before its legacy normalizer can synthesize a missing ID. No mutation methods
 * from that adapter are called and no journal/key/provider is accessed here.
 */
export function createExistingLuxuryGenuineSource(storage: StorageConfig = getQuestLuxoServerConfig().leadStorage, policy?: { readonly key: Buffer; readonly clock?: () => number }) {
  let lastReason = "SOURCE_NOT_READ";
  const readCanonicalSnapshot = async () => {
    if (storage.provider !== "jsonl" || storage.providerStatus !== "configured" || storage.directoryStatus !== "configured") {
      lastReason = "EXPLICIT_CANONICAL_STORAGE_CONFIGURATION_REQUIRED"; return blocked(lastReason);
    }
    const paths = createLeadStoragePaths(storage.directory);
    try {
      const directory = await lstat(paths.directory);
      if (!directory.isDirectory() || directory.isSymbolicLink() || resolve(await realpath(paths.directory)) !== paths.directory) throw Error();
      const entry = await lstat(paths.file);
      if (!entry.isFile() || entry.isSymbolicLink() || entry.nlink !== 1) throw Error();
      const handle = await open(paths.file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
      try {
        const before = await handle.stat();
        if (!before.isFile() || before.dev !== entry.dev || before.ino !== entry.ino || before.nlink !== 1 || before.size > MAX_BYTES ||
            process.platform !== "win32" && ((before.mode & 0o077) !== 0 || before.uid !== process.geteuid!())) throw Error();
        const raw = await handle.readFile("utf8");
        const records: Record<string, unknown>[] = [];
        for (const line of raw.split(/\r?\n/)) {
          if (!line.trim()) continue;
          const r: unknown = JSON.parse(line);
          if (!r || typeof r !== "object" || Array.isArray(r)) throw Error();
          const row = r as Record<string, unknown>;
          if (typeof row.id !== "string" || row.id !== row.id.trim() || typeof row.savedAt !== "string" ||
              !row.payload || typeof row.payload !== "object" || Array.isArray(row.payload)) throw Error();
          createLeadNotificationContext({ id: row.id, savedAt: row.savedAt });
          if (Object.keys(row.payload).sort().join() !== [...payloadFields].sort().join() ||
              payloadFields.some(k => { const v = (row.payload as Record<string, unknown>)[k]; return v !== null && (typeof v !== "string" || v.length > 20_000); })) throw Error();
          records.push(row);
        }
        if (new Set(records.map(r => r.id)).size !== records.length) throw Error();
        const normalized = await createJsonlLeadStorageAdapter(paths.directory).readLeadSubmissionSnapshot();
        const after = await handle.stat(), current = await lstat(paths.file), currentDirectory = await lstat(paths.directory);
        if (normalized.status !== "COMPLETE" || normalized.malformedRows !== 0 || normalized.records.length !== records.length ||
            !current.isFile() || current.isSymbolicLink() || current.nlink !== 1 || current.dev !== before.dev || current.ino !== before.ino ||
            currentDirectory.isSymbolicLink() || currentDirectory.dev !== directory.dev || currentDirectory.ino !== directory.ino || resolve(await realpath(paths.directory)) !== paths.directory ||
            process.platform !== "win32" && ((after.mode & 0o077) !== 0 || after.uid !== before.uid) ||
            after.size !== before.size || after.mtimeMs !== before.mtimeMs || after.ctimeMs !== before.ctimeMs) throw Error();
        for (const r of normalized.records) {
          const persisted = records.find(x => x.id === r.id);
          if (!persisted || persisted.savedAt !== r.savedAt || !samePayload(persisted.payload, r.payload)) throw Error();
        }
        lastReason = "CANONICAL_SOURCE_BOUND_PERMISSION_AND_SUPPRESSION_UNAVAILABLE";
        return { status: "COMPLETE", records: Object.freeze(normalized.records.map(r => Object.freeze({ ...r, payload: Object.freeze({ ...r.payload }) }))), reason: lastReason };
      } finally { await handle.close(); }
    } catch {
      lastReason = "CANONICAL_SOURCE_IDENTITY_INTEGRITY_OR_PRIVATE_PATH_UNVERIFIED";
      return blocked(lastReason);
    }
  };
  const readAdmission = async (event: LuxuryWorkforceEvent): Promise<GenuineInquiryAdmission | null> => {
    const snapshot = await readCanonicalSnapshot();
    const record = snapshot.records.find(r => r.id === event.leadId);
    if (snapshot.status !== "COMPLETE" || !record || record.savedAt !== event.savedAt || !samePayload(record.payload, event.payload)) {
      lastReason = "CURRENT_CANONICAL_EVENT_BINDING_UNVERIFIED"; return null;
    }
    const review = policy && readCurrentInternalHandlingReview(record, event, policy.key, (policy.clock ?? Date.now)());
    if (!review) {
      lastReason = record.internalHandlingReviews?.length ? "CURRENT_SIGNED_INTERNAL_REVIEW_DENIED_OR_UNVERIFIED" : "PERMISSION_REVIEW_FIELD_AND_SUPPRESSION_IDENTITY_SOURCE_ABSENT";
      return null;
    }
    if (!policy || readExistingIntakeNotification(record, event, policy.key).status !== "ACCEPTANCE_RECORDED") {
      lastReason = "EXISTING_INTAKE_NOTICE_EVIDENCE_UNVERIFIED"; return null;
    }
    lastReason = "EXPLICIT_AUTHENTICATED_OPERATOR_REVIEW_CLEAR_FOR_INTERNAL_HANDLING";
    return Object.freeze({ source: "AUTHENTICATED_CANONICAL_SNAPSHOT", division: "luxury", leadId: event.leadId,
      fingerprint: event.fingerprint, reviewRef: `canonical-review:${review.id}`, reviewedAt: review.recordedAt, expiresAt: review.expiresAt,
      purpose: "REQUESTED_INQUIRY_INTERNAL_HANDLING", permission: "VERIFIED", suppression: "CLEAR", doNotContact: false,
      scope: "LUXURY_INTERNAL_CONTACT_TASK_ONLY", customerCommunication: "NOT_GRANTED" });
  };
  return Object.freeze({ readCanonicalSnapshot, readAdmission,
    diagnostics: () => Object.freeze({ reason: lastReason, admissionImplemented: "SIGNED_EXPLICIT_OPERATOR_REVIEW_REQUIRED", permissionGranted: lastReason === "EXPLICIT_AUTHENTICATED_OPERATOR_REVIEW_CLEAR_FOR_INTERNAL_HANDLING", customerCommunication: "NOT_GRANTED",
      missing: lastReason === "EXPLICIT_AUTHENTICATED_OPERATOR_REVIEW_CLEAR_FOR_INTERNAL_HANDLING" ? [] : ["current signed operator handling/suppression review for the exact identity"] }) });
}

/** Concrete source wiring for the earlier isolated callable. It cannot dispatch
 * without a current signed explicit operator review; it never infers permission.
 * Journal/provider/release lifecycle remains owned by the original runtime owner.
 */
export async function runLuxuryGenuineInquiryFromExistingSource(
  release: GenuineInquiryRelease | null | undefined,
  runtime: Omit<GenuineInquiryDependencies, "readCanonicalSnapshot" | "readAdmission">,
  storage: StorageConfig = getQuestLuxoServerConfig().leadStorage,
) {
  const source = createExistingLuxuryGenuineSource(storage, { key: runtime.key, clock: runtime.clock });
  const result = await runLuxuryGenuineInquiryOnce(release, { ...runtime, readCanonicalSnapshot: source.readCanonicalSnapshot, readAdmission: source.readAdmission });
  return { ...result, sourceAdmission: source.diagnostics() };
}
