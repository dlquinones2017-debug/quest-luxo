import { createHash, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import {
  chmod,
  copyFile,
  mkdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";

export interface JsonlVerificationResult {
  readonly valid: true;
  readonly bytes: number;
  readonly records: number;
  readonly sha256: string;
}

export interface LeadBackupResult extends JsonlVerificationResult {
  readonly backupFile: string;
}

const hash = (value: string | Buffer): string =>
  createHash("sha256").update(value).digest("hex");

const parseJsonlRecords = (
  fileContents: string
): readonly { readonly line: string; readonly value: Record<string, unknown> }[] => {
  const records: { line: string; value: Record<string, unknown> }[] = [];

  fileContents.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;

    let value: unknown;

    try {
      value = JSON.parse(line);
    } catch {
      throw new Error(`Invalid JSONL at line ${index + 1}.`);
    }

    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`Invalid JSONL record at line ${index + 1}.`);
    }

    records.push({ line, value: value as Record<string, unknown> });
  });

  return Object.freeze(records);
};

export async function verifyLeadJsonlFile(
  file: string,
  options: { readonly requireNonEmpty?: boolean } = {}
): Promise<JsonlVerificationResult> {
  const fileContents = await readFile(file, "utf8");
  const records = parseJsonlRecords(fileContents);

  if (options.requireNonEmpty !== false && records.length === 0) {
    throw new Error("Lead JSONL file is empty.");
  }

  return Object.freeze({
    valid: true,
    bytes: Buffer.byteLength(fileContents, "utf8"),
    records: records.length,
    sha256: hash(fileContents),
  });
}

export async function createLeadStorageBackup(options: {
  readonly sourceFile: string;
  readonly backupDirectory: string;
  readonly timestamp?: Date;
}): Promise<LeadBackupResult> {
  const sourceVerification = await verifyLeadJsonlFile(options.sourceFile);
  const sourceStat = await stat(options.sourceFile);
  const timestamp = (options.timestamp ?? new Date())
    .toISOString()
    .replace(/[:.]/g, "-");
  const backupFile = join(
    options.backupDirectory,
    `${basename(options.sourceFile, ".jsonl")}-${timestamp}-${randomUUID().slice(
      0,
      8
    )}.jsonl`
  );

  await mkdir(options.backupDirectory, { recursive: true });
  await copyFile(options.sourceFile, backupFile, constants.COPYFILE_EXCL);
  await chmod(backupFile, sourceStat.mode).catch(() => undefined);

  const backupVerification = await verifyLeadJsonlFile(backupFile);

  if (
    backupVerification.bytes !== sourceVerification.bytes ||
    backupVerification.sha256 !== sourceVerification.sha256
  ) {
    throw new Error("Lead backup verification did not match the source file.");
  }

  return Object.freeze({
    ...backupVerification,
    backupFile,
  });
}

export async function restoreLeadStorageBackup(options: {
  readonly backupFile: string;
  readonly restoreTargetFile: string;
}): Promise<JsonlVerificationResult> {
  const backupVerification = await verifyLeadJsonlFile(options.backupFile);
  const backupStat = await stat(options.backupFile);

  await mkdir(dirname(options.restoreTargetFile), { recursive: true });
  await copyFile(
    options.backupFile,
    options.restoreTargetFile,
    constants.COPYFILE_EXCL
  );
  await chmod(options.restoreTargetFile, backupStat.mode).catch(() => undefined);

  const restoredVerification = await verifyLeadJsonlFile(
    options.restoreTargetFile
  );

  if (restoredVerification.sha256 !== backupVerification.sha256) {
    throw new Error("Restored lead file does not match the verified backup.");
  }

  return restoredVerification;
}

const getSmokeLabel = (record: Record<string, unknown>): string => {
  const payload =
    record.payload && typeof record.payload === "object"
      ? (record.payload as Record<string, unknown>)
      : {};

  return [payload.name, payload.message, payload.source]
    .filter((value): value is string => typeof value === "string")
    .join(" ");
};

export async function verifyLabeledSmokeTestLead(options: {
  readonly storageFile: string;
  readonly label: string;
  readonly leadId?: string;
}): Promise<{ readonly leadId: string; readonly matches: 1 }> {
  const fileContents = await readFile(options.storageFile, "utf8");
  const records = parseJsonlRecords(fileContents);
  const matches = records.filter(({ value }) => {
    const id = typeof value.id === "string" ? value.id : "";

    return (
      (!options.leadId || id === options.leadId) &&
      getSmokeLabel(value).includes(options.label)
    );
  });

  if (matches.length !== 1) {
    throw new Error(
      `Expected exactly one labeled smoke-test lead; found ${matches.length}.`
    );
  }

  const leadId = matches[0].value.id;

  if (typeof leadId !== "string" || !leadId.trim()) {
    throw new Error("Labeled smoke-test lead does not have a valid id.");
  }

  return Object.freeze({ leadId, matches: 1 });
}

export async function removeExactLabeledSmokeTestLead(options: {
  readonly storageFile: string;
  readonly leadId: string;
  readonly label: string;
}): Promise<{
  readonly removedLeadId: string;
  readonly recordsBefore: number;
  readonly recordsAfter: number;
  readonly unrelatedRecordsPreserved: true;
}> {
  const fileContents = await readFile(options.storageFile, "utf8");
  const records = parseJsonlRecords(fileContents);
  const matchingIndexes = records
    .map(({ value }, index) => ({
      index,
      matches:
        value.id === options.leadId &&
        getSmokeLabel(value).includes(options.label),
    }))
    .filter(({ matches }) => matches)
    .map(({ index }) => index);

  if (matchingIndexes.length !== 1) {
    throw new Error(
      `Cleanup requires exactly one id-and-label match; found ${matchingIndexes.length}.`
    );
  }

  const unrelatedBefore = records
    .filter((_, index) => index !== matchingIndexes[0])
    .map(({ line }) => line);
  const unrelatedDigestBefore = hash(unrelatedBefore.join("\n"));
  const replacementContents =
    unrelatedBefore.join("\n") + (unrelatedBefore.length > 0 ? "\n" : "");
  const sourceStat = await stat(options.storageFile);
  const tempFile = `${options.storageFile}.cleanup-${randomUUID()}.tmp`;

  await writeFile(tempFile, replacementContents, {
    encoding: "utf8",
    flag: "wx",
    mode: sourceStat.mode,
  });
  await rename(tempFile, options.storageFile);

  const afterContents = await readFile(options.storageFile, "utf8");
  const afterRecords = parseJsonlRecords(afterContents);
  const unrelatedDigestAfter = hash(
    afterRecords.map(({ line }) => line).join("\n")
  );

  if (
    afterRecords.length !== records.length - 1 ||
    unrelatedDigestAfter !== unrelatedDigestBefore
  ) {
    throw new Error("Smoke-test cleanup did not preserve unrelated records.");
  }

  return Object.freeze({
    removedLeadId: options.leadId,
    recordsBefore: records.length,
    recordsAfter: afterRecords.length,
    unrelatedRecordsPreserved: true,
  });
}
