import { createHash, randomUUID } from "node:crypto";
import { mkdir, open, readFile, rename, unlink } from "node:fs/promises";
import { join, resolve } from "node:path";
import { withLeadStorageLock } from "./leadStorageLock.ts";
import type { BrokerageEconomicsInput } from "../brokerage/brokerageEconomics.ts";
import {
  appendBrokerageEconomicsSnapshot,
  createBrokerageEconomicsSnapshot,
  normalizeBrokerageEconomicsSnapshots,
} from "../brokerage/brokerageEconomicsSnapshot.ts";
import { getQuestLuxoServerConfig } from "../config/questLuxoConfig.ts";
import type { LeadCapturePayload } from "./leadCapture.ts";
import { withServerCommunicationConsent } from "./leadCommunicationConsent.ts";
import type { LeadEmailDeliveryResult } from "./leadEmail.ts";
import {
  leadStatusValues,
  type LeadStorageProvider,
  type LeadStatus,
  type LeadStorageAdapter,
  type LeadStorageResult,
  type LeadSubmissionRecord,
  type LeadSubmissionSnapshot,
} from "./leadStorageTypes.ts";

export {
  leadStatusValues,
  type LeadStorageProvider,
  type LeadStatus,
  type LeadStorageAdapter,
  type LeadStorageResult,
  type LeadSubmissionRecord,
} from "./leadStorageTypes.ts";

let didWarnUnsupportedStorageProvider = false;

export interface LeadStoragePaths {
  readonly directory: string;
  readonly file: string;
  readonly tempFile: string;
}

export const createLeadStoragePaths = (directory: string): LeadStoragePaths => {
  const resolvedDirectory = resolve(directory);

  return Object.freeze({
    directory: resolvedDirectory,
    file: join(resolvedDirectory, "leads.jsonl"),
    tempFile: join(resolvedDirectory, "leads.jsonl.tmp"),
  });
};

const hasErrorCode = (error: unknown, code: string): boolean =>
  error instanceof Error &&
  "code" in error &&
  (error as { readonly code?: unknown }).code === code;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isLeadStatus = (value: unknown): value is LeadStatus =>
  typeof value === "string" &&
  leadStatusValues.includes(value as LeadStatus);

const normalizeLeadTags = (value: unknown): readonly string[] => {
  if (!Array.isArray(value)) return [];

  const seenTags = new Set<string>();
  const tags: string[] = [];

  value.forEach((tag) => {
    if (typeof tag !== "string") return;

    const normalizedTag = tag.trim();
    const normalizedKey = normalizedTag.toLowerCase();

    if (!normalizedTag || seenTags.has(normalizedKey)) return;

    seenTags.add(normalizedKey);
    tags.push(normalizedTag);
  });

  return Object.freeze(tags);
};

const createLeadSubmissionId = (): string => `lead_${randomUUID()}`;

const createFallbackLeadId = (
  value: Record<string, unknown>,
  lineNumber: number
): string => {
  const hashSource = JSON.stringify({
    lineNumber,
    savedAt: value.savedAt,
    payload: value.payload,
  });
  const hash = createHash("sha256").update(hashSource).digest("hex");

  return `lead_${hash.slice(0, 24)}`;
};

const normalizeLeadSubmissionRecord = (
  value: unknown,
  lineNumber: number
): LeadSubmissionRecord | null => {
  if (
    !isRecord(value) ||
    !isRecord(value.payload) ||
    typeof value.savedAt !== "string" ||
    value.savedAt.trim().length === 0
  ) {
    return null;
  }

  const id =
    typeof value.id === "string" && value.id.trim()
      ? value.id.trim()
      : createFallbackLeadId(value, lineNumber);
  const status = isLeadStatus(value.status) ? value.status : "new";
  const notes = typeof value.notes === "string" ? value.notes : "";
  const notesUpdatedAt =
    typeof value.notesUpdatedAt === "string" && value.notesUpdatedAt.trim()
      ? value.notesUpdatedAt.trim()
      : null;
  const tags = normalizeLeadTags(value.tags);
  const tagsUpdatedAt =
    typeof value.tagsUpdatedAt === "string" && value.tagsUpdatedAt.trim()
      ? value.tagsUpdatedAt.trim()
      : null;
  const economicsSnapshots = normalizeBrokerageEconomicsSnapshots(
    value.economicsSnapshots
  );
  const emailDelivery = isRecord(value.emailDelivery)
    ? (value.emailDelivery as unknown as LeadEmailDeliveryResult)
    : undefined;

  return Object.freeze({
    id,
    status,
    notes,
    notesUpdatedAt,
    tags,
    tagsUpdatedAt,
    economicsSnapshots,
    payload: value.payload as unknown as LeadCapturePayload,
    savedAt: value.savedAt.trim(),
    ...(emailDelivery ? { emailDelivery } : {}),
  });
};

const getSavedAtTime = (record: LeadSubmissionRecord): number => {
  const savedAtTime = Date.parse(record.savedAt);

  return Number.isFinite(savedAtTime) ? savedAtTime : 0;
};

const logMalformedRow = (
  lineNumber: number,
  error: unknown,
  reason: string
): void => {
  console.error("Quest Luxo Lead Storage Malformed Row", {
    lineNumber,
    reason,
    // Parsed rows and JSON parser messages can contain client PII.
    errorType: error instanceof SyntaxError ? "INVALID_JSON" : "INVALID_RECORD",
  });
};

const saveJsonlLeadSubmission = async (
  paths: LeadStoragePaths,
  payload: LeadCapturePayload,
  emailDelivery?: LeadEmailDeliveryResult
): Promise<LeadStorageResult> => {
  const id = createLeadSubmissionId();
  const savedAt = new Date().toISOString();
  const record: LeadSubmissionRecord = Object.freeze({
    id,
    status: "new",
    notes: "",
    notesUpdatedAt: null,
    tags: [],
    tagsUpdatedAt: null,
    economicsSnapshots: [],
    payload: withServerCommunicationConsent(payload, savedAt),
    savedAt,
    ...(emailDelivery ? { emailDelivery } : {}),
  });

  await mkdir(paths.directory, { recursive: true });
  const handle = await open(paths.file, "a+", 0o600);

  try {
    const { size } = await handle.stat();
    const last = Buffer.alloc(1);
    if (size) await handle.read(last, 0, 1, size - 1);
    const boundary = size && last[0] !== 10 ? "\n" : "";
    await handle.writeFile(`${boundary}${JSON.stringify(record)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }

  return Object.freeze({
    saved: true,
    id,
    path: paths.file,
    savedAt,
  });
};

const writeLeadSubmissions = async (
  paths: LeadStoragePaths,
  records: readonly LeadSubmissionRecord[]
): Promise<void> => {
  const fileContents =
    records.map((record) => JSON.stringify(record)).join("\n") +
    (records.length > 0 ? "\n" : "");

  await mkdir(paths.directory, { recursive: true });
  const tempFile = `${paths.tempFile}-${randomUUID()}`;
  const handle = await open(tempFile, "wx", 0o600);

  try {
    try {
      await handle.writeFile(fileContents, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    await rename(tempFile, paths.file);
  } finally {
    await unlink(tempFile).catch(error => { if (!hasErrorCode(error, "ENOENT")) throw error; });
  }
};

const readJsonlLeadSnapshotAt = async (
  paths: LeadStoragePaths
): Promise<LeadSubmissionSnapshot> => {
  let fileContents: string;

  try {
    fileContents = await readFile(paths.file, "utf8");
  } catch (error) {
    if (hasErrorCode(error, "ENOENT")) return Object.freeze({ records: Object.freeze([]), status: "MISSING", malformedRows: 0 });

    throw error;
  }

  const records: LeadSubmissionRecord[] = [];
  let malformedRows = 0;

  fileContents.split(/\r?\n/).forEach((line, index) => {
    const trimmedLine = line.trim();
    const lineNumber = index + 1;

    if (!trimmedLine) return;

    try {
      const parsedRow: unknown = JSON.parse(trimmedLine);
      const record = normalizeLeadSubmissionRecord(parsedRow, lineNumber);

      if (!record) {
        malformedRows++;
        logMalformedRow(lineNumber, parsedRow, "Invalid lead record shape.");

        return;
      }

      records.push(record);
    } catch (error) {
      malformedRows++;
      logMalformedRow(lineNumber, error, "Invalid JSON.");
    }
  });

  return Object.freeze({
    records: Object.freeze(records.sort((a, b) => getSavedAtTime(b) - getSavedAtTime(a))),
    status: malformedRows ? "PARTIAL" : "COMPLETE",
    malformedRows,
  });
};

const readJsonlLeadSubmissionsAt = async (paths: LeadStoragePaths): Promise<readonly LeadSubmissionRecord[]> =>
  (await readJsonlLeadSnapshotAt(paths)).records;

type SnapshotLeadStorageAdapter = LeadStorageAdapter & {
  readLeadSubmissionSnapshot(): Promise<LeadSubmissionSnapshot>;
};

const updateJsonlLeadSubmissionStatus = async (
  paths: LeadStoragePaths,
  id: string,
  status: LeadStatus
): Promise<LeadSubmissionRecord | null> => {
  const normalizedId = id.trim();
  const records = [...(await readJsonlLeadSubmissionsAt(paths))];
  const leadIndex = records.findIndex((record) => record.id === normalizedId);

  if (leadIndex === -1) return null;

  const updatedRecord = Object.freeze({
    ...records[leadIndex],
    status,
  });

  records[leadIndex] = updatedRecord;
  await writeLeadSubmissions(paths, records);

  return updatedRecord;
};

const updateJsonlLeadSubmissionNotes = async (
  paths: LeadStoragePaths,
  id: string,
  notes: string
): Promise<LeadSubmissionRecord | null> => {
  const normalizedId = id.trim();
  const normalizedNotes = notes.trim();
  const records = [...(await readJsonlLeadSubmissionsAt(paths))];
  const leadIndex = records.findIndex((record) => record.id === normalizedId);

  if (leadIndex === -1) return null;

  const updatedRecord = Object.freeze({
    ...records[leadIndex],
    notes: normalizedNotes,
    notesUpdatedAt: new Date().toISOString(),
  });

  records[leadIndex] = updatedRecord;
  await writeLeadSubmissions(paths, records);

  return updatedRecord;
};

const updateJsonlLeadSubmissionTags = async (
  paths: LeadStoragePaths,
  id: string,
  tags: readonly string[]
): Promise<LeadSubmissionRecord | null> => {
  const normalizedId = id.trim();
  const normalizedTags = normalizeLeadTags(tags);
  const records = [...(await readJsonlLeadSubmissionsAt(paths))];
  const leadIndex = records.findIndex((record) => record.id === normalizedId);

  if (leadIndex === -1) return null;

  const updatedRecord = Object.freeze({
    ...records[leadIndex],
    tags: normalizedTags,
    tagsUpdatedAt: new Date().toISOString(),
  });

  records[leadIndex] = updatedRecord;
  await writeLeadSubmissions(paths, records);

  return updatedRecord;
};

const updateJsonlLeadSubmissionEmailDelivery = async (
  paths: LeadStoragePaths,
  id: string,
  emailDelivery: LeadEmailDeliveryResult
): Promise<LeadSubmissionRecord | null> => {
  const normalizedId = id.trim();
  const records = [...(await readJsonlLeadSubmissionsAt(paths))];
  const leadIndex = records.findIndex((record) => record.id === normalizedId);

  if (leadIndex === -1) return null;

  const updatedRecord = Object.freeze({
    ...records[leadIndex],
    emailDelivery,
  });

  records[leadIndex] = updatedRecord;
  await writeLeadSubmissions(paths, records);

  return updatedRecord;
};

const addJsonlLeadSubmissionEconomicsSnapshot = async (
  paths: LeadStoragePaths,
  id: string,
  economicsInput: BrokerageEconomicsInput,
  brokerNote?: string | null
): Promise<LeadSubmissionRecord | null> => {
  const normalizedId = id.trim();
  const records = [...(await readJsonlLeadSubmissionsAt(paths))];
  const leadIndex = records.findIndex((record) => record.id === normalizedId);

  if (leadIndex === -1) return null;

  const snapshot = createBrokerageEconomicsSnapshot({
    economicsInput,
    brokerNote,
    modelContext: records[leadIndex].payload,
  });
  const updatedRecord = Object.freeze({
    ...records[leadIndex],
    economicsSnapshots: appendBrokerageEconomicsSnapshot(
      records[leadIndex].economicsSnapshots,
      snapshot
    ),
  });

  records[leadIndex] = updatedRecord;
  await writeLeadSubmissions(paths, records);

  return updatedRecord;
};

export const createJsonlLeadStorageAdapter = (
  directory: string
): SnapshotLeadStorageAdapter => {
  const paths = createLeadStoragePaths(directory);
  const mutate = <T>(operation: () => Promise<T>): Promise<T> =>
    withLeadStorageLock(paths.file, async () => {
      // A partial normalized read must never become a destructive rewrite.
      // Preserve the original bytes for an operator to inspect and recover.
      if ((await readJsonlLeadSnapshotAt(paths)).status === "PARTIAL") {
        throw new Error("Lead storage integrity requires operator verification.");
      }
      return operation();
    });

  return Object.freeze({
    provider: "jsonl",
    saveLeadSubmission: (payload, emailDelivery) =>
      mutate(() => saveJsonlLeadSubmission(paths, payload, emailDelivery)),
    readLeadSubmissions: () => readJsonlLeadSubmissionsAt(paths),
    readLeadSubmissionSnapshot: () => readJsonlLeadSnapshotAt(paths),
    updateLeadSubmissionStatus: (id, status) =>
      mutate(() => updateJsonlLeadSubmissionStatus(paths, id, status)),
    updateLeadSubmissionNotes: (id, notes) =>
      mutate(() => updateJsonlLeadSubmissionNotes(paths, id, notes)),
    updateLeadSubmissionTags: (id, tags) =>
      mutate(() => updateJsonlLeadSubmissionTags(paths, id, tags)),
    updateLeadSubmissionEmailDelivery: (id, emailDelivery) =>
      mutate(() => updateJsonlLeadSubmissionEmailDelivery(paths, id, emailDelivery)),
    addLeadSubmissionEconomicsSnapshot: (id, economicsInput, brokerNote) =>
      mutate(() => addJsonlLeadSubmissionEconomicsSnapshot(
        paths,
        id,
        economicsInput,
        brokerNote
      )),
  } satisfies SnapshotLeadStorageAdapter);
};

export const jsonlLeadStorageAdapter = createJsonlLeadStorageAdapter(
  resolve(process.cwd(), ".quest-luxo")
);

export function getLeadStorageAdapter(): SnapshotLeadStorageAdapter {
  const config = getQuestLuxoServerConfig();

  if (
    config.leadStorage.providerStatus === "unsupported" &&
    !didWarnUnsupportedStorageProvider
  ) {
    console.error(
      "Quest Luxo lead storage provider is unsupported."
    );
    didWarnUnsupportedStorageProvider = true;
  }

  if (
    config.leadStorage.providerStatus === "unsupported" ||
    config.leadStorage.directoryStatus === "invalid" ||
    (config.isProduction &&
      (config.leadStorage.providerStatus !== "configured" ||
        config.leadStorage.directoryStatus !== "configured"))
  ) {
    throw new Error(
      "Quest Luxo lead storage configuration is invalid. Check LEAD_STORAGE_PROVIDER and LEAD_STORAGE_DIRECTORY."
    );
  }

  return createJsonlLeadStorageAdapter(config.leadStorage.directory);
}

export async function saveLeadSubmission(
  payload: LeadCapturePayload,
  emailDelivery?: LeadEmailDeliveryResult
): Promise<LeadStorageResult> {
  return getLeadStorageAdapter().saveLeadSubmission(payload, emailDelivery);
}

export async function readLeadSubmissions(): Promise<
  readonly LeadSubmissionRecord[]
> {
  return getLeadStorageAdapter().readLeadSubmissions();
}

export async function readLeadSubmissionSnapshot(): Promise<LeadSubmissionSnapshot> {
  return getLeadStorageAdapter().readLeadSubmissionSnapshot();
}

export async function updateLeadSubmissionStatus(
  id: string,
  status: LeadStatus
): Promise<LeadSubmissionRecord | null> {
  return getLeadStorageAdapter().updateLeadSubmissionStatus(id, status);
}

export async function updateLeadSubmissionNotes(
  id: string,
  notes: string
): Promise<LeadSubmissionRecord | null> {
  return getLeadStorageAdapter().updateLeadSubmissionNotes(id, notes);
}

export async function updateLeadSubmissionTags(
  id: string,
  tags: readonly string[]
): Promise<LeadSubmissionRecord | null> {
  return getLeadStorageAdapter().updateLeadSubmissionTags(id, tags);
}

export async function updateLeadSubmissionEmailDelivery(
  id: string,
  emailDelivery: LeadEmailDeliveryResult
): Promise<LeadSubmissionRecord | null> {
  return getLeadStorageAdapter().updateLeadSubmissionEmailDelivery(
    id,
    emailDelivery
  );
}

export async function addLeadSubmissionEconomicsSnapshot(
  id: string,
  economicsInput: BrokerageEconomicsInput,
  brokerNote?: string | null
): Promise<LeadSubmissionRecord | null> {
  return getLeadStorageAdapter().addLeadSubmissionEconomicsSnapshot(
    id,
    economicsInput,
    brokerNote
  );
}
