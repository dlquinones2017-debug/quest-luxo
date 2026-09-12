import { randomUUID } from "node:crypto";
import { mkdir, open } from "node:fs/promises";
import { join } from "node:path";

export const createLeadRecord = (payload, clientKey, now = new Date()) =>
  Object.freeze({
    id: `lead_${randomUUID()}`,
    createdAt: now.toISOString(),
    status: "new",
    clientKey,
    ...payload,
  });

export const persistLead = async (record, config) => {
  if (!config.storageDirectory) {
    throw new Error("Lead storage directory is not configured.");
  }

  await mkdir(config.storageDirectory, { recursive: true, mode: 0o700 });
  const file = join(config.storageDirectory, "leads.jsonl");
  const handle = await open(file, "a", 0o600);

  try {
    await handle.writeFile(`${JSON.stringify(record)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }

  return Object.freeze({ id: record.id, file });
};
