import { copyFile, mkdir, readFile, rename, stat } from "node:fs/promises";
import { basename, join } from "node:path";

export const verifyLeadFile = async (file) => {
  const content = await readFile(file, "utf8");
  const records = content
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch {
        throw new Error(`Invalid JSONL record on line ${index + 1}.`);
      }
    });
  const ids = new Set();
  for (const record of records) {
    if (!record.id || !record.createdAt || !record.email) {
      throw new Error("Lead backup contains an incomplete record.");
    }
    if (ids.has(record.id)) throw new Error(`Duplicate lead ID: ${record.id}`);
    ids.add(record.id);
  }
  return Object.freeze({ records: records.length, bytes: content.length });
};

export const backupLeadFile = async (sourceFile, backupDirectory) => {
  await stat(sourceFile);
  await mkdir(backupDirectory, { recursive: true, mode: 0o700 });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const target = join(backupDirectory, `leads-${stamp}.jsonl`);
  await copyFile(sourceFile, target);
  const verification = await verifyLeadFile(target);
  return Object.freeze({ target, verification });
};

export const restoreLeadFile = async (backupFile, targetFile) => {
  await verifyLeadFile(backupFile);
  const preRestore = `${targetFile}.pre-restore-${Date.now()}`;
  await copyFile(targetFile, preRestore).catch(() => undefined);
  const staged = `${targetFile}.restore-${Date.now()}`;
  await copyFile(backupFile, staged);
  await rename(staged, targetFile);
  const verification = await verifyLeadFile(targetFile);
  return Object.freeze({
    source: basename(backupFile),
    preRestore,
    verification,
  });
};
