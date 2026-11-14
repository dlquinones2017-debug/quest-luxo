import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { createJsonlLeadStorageAdapter, createLeadStoragePaths } from "../leads/leadStorage.ts";
import { getQuestLuxoServerConfig, type QuestLuxoServerConfig } from "../config/questLuxoConfig.ts";
import { createLeadNotificationContext } from "../leads/leadNotificationContext.ts";
import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import type { LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";
import { runLuxuryGenuineInquiryOnce, type GenuineInquiryDependencies, type GenuineInquiryRelease } from "./luxuryGenuineInquiryRuntime.ts";

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
export function createExistingLuxuryGenuineSource(storage: StorageConfig = getQuestLuxoServerConfig().leadStorage) {
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
  const readAdmission = async (event: LuxuryWorkforceEvent): Promise<null> => {
    const snapshot = await readCanonicalSnapshot();
    const record = snapshot.records.find(r => r.id === event.leadId);
    if (snapshot.status !== "COMPLETE" || !record || record.savedAt !== event.savedAt || !samePayload(record.payload, event.payload)) {
      lastReason = "CURRENT_CANONICAL_EVENT_BINDING_UNVERIFIED"; return null;
    }
    // Current main's13 payload fields and record fields contain no typed internal
    // permission review, identity-bound suppression/DND verdict or release record.
    // status/notes/tags, analytics consent and subscription state cannot supply it.
    // Do not invent VERIFIED/CLEAR/false flags from an authentic inquiry alone.
    lastReason = "PERMISSION_REVIEW_FIELD_AND_SUPPRESSION_IDENTITY_SOURCE_ABSENT";
    return null;
  };
  return Object.freeze({ readCanonicalSnapshot, readAdmission,
    diagnostics: () => Object.freeze({ reason: lastReason, admissionImplemented: "FAIL_CLOSED_CURRENT_CONTRACT", permissionGranted: false,
      missing: ["typed event-bound internal handling review", "authoritative current identity suppression/DND source", "authoritative runtime release/revocation source"] }) });
}

/** Concrete source wiring for the earlier isolated callable. It cannot dispatch
 * using current main's contracts because readAdmission never mints permission.
 * Journal/provider/release lifecycle remains owned by the original runtime owner.
 */
export async function runLuxuryGenuineInquiryFromExistingSource(
  release: GenuineInquiryRelease | null | undefined,
  runtime: Omit<GenuineInquiryDependencies, "readCanonicalSnapshot" | "readAdmission">,
  storage: StorageConfig = getQuestLuxoServerConfig().leadStorage,
) {
  const source = createExistingLuxuryGenuineSource(storage);
  const result = await runLuxuryGenuineInquiryOnce(release, { ...runtime, readCanonicalSnapshot: source.readCanonicalSnapshot, readAdmission: source.readAdmission });
  return { ...result, sourceAdmission: source.diagnostics() };
}
