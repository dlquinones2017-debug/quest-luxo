import { open, constants } from "node:fs/promises";
import { realpath } from "node:fs/promises";
import { join, resolve } from "node:path";
import { readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { readEncryptedIntakeJournal } from "../src/lib/command/enterpriseIntakeJournal.ts";
import { readCRMDeliveryOutbox } from "../src/lib/command/crmDeliveryOutbox.ts";
import { readCRMPreparationJournal } from "../src/lib/command/crmPreparationJournal.ts";
import { readRecurringCheckpoint } from "./pilot-backup-channel.mjs";
import { assessPilotRecovery } from "../src/lib/agents/pilotRecoveryAudit.ts";

export async function readPilotRecoveryReceipt(directory) {
  const path = join(directory, "independent-recovery-receipt.json");
  try {
    if (await realpath(path) !== resolve(path)) throw Error("Real receipt path required.");
    const fd = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
      const stat = await fd.stat();
      if (!stat.isFile() || stat.nlink !== 1 || stat.size <= 0 || stat.size > 4096 || (stat.mode & 0o077)) throw Error("Private bounded receipt required.");
      const bytes = Buffer.alloc(stat.size + 1); const { bytesRead } = await fd.read(bytes);
      if (bytesRead !== stat.size) throw Error("Receipt changed during read.");
      return JSON.parse(bytes.subarray(0, bytesRead).toString("utf8"));
    } finally { await fd.close(); }
  } catch (error) { if (error?.code === "ENOENT") return null; throw error; }
}
export async function readPilotRecoveryAssessment({ storageVerified = false, localBackupVerified = false } = {}) {
  const env = process.env;
  if (env.RENDER_SERVICE_ID !== "srv-dbbkmb0n74is73d111hg" || env.QUEST_AGENT_PILOT_MODE !== "SYNTHETIC_ONLY" ||
      env.QUEST_PIPELINE_DIRECTORY !== "/var/data/quest-agent-pilot" || !/^[a-f0-9]{64}$/.test(env.QUEST_PIPELINE_KEY_HEX ?? "") ||
      env.QUEST_ENABLE_GMAIL !== "false" || env.QUEST_ENABLE_CRM !== "false") throw Error("Isolated pilot required.");
  const key = Buffer.from(env.QUEST_PIPELINE_KEY_HEX, "hex");
  try {
    const pipeline = await readDurablePipelines(join(env.QUEST_PIPELINE_DIRECTORY, "synthetic"), key);
    const intake = await readEncryptedIntakeJournal(join(env.QUEST_PIPELINE_DIRECTORY, "synthetic-intake"), key);
    const now = new Date().toISOString();
    const proof = await readRecurringCheckpoint(env.QUEST_PIPELINE_DIRECTORY, key, Date.parse(now));
    // Decrypt current selected stores before comparing their authenticated checkpoint revisions.
    const includeOutbox = env.QUEST_ENABLE_PILOT_OUTBOX_BACKUP === "true";
    const preparation = proof || includeOutbox ? await readCRMPreparationJournal(join(env.QUEST_PIPELINE_DIRECTORY, "synthetic-crm-preparation"), key) : null;
    if (preparation && !/^[a-f0-9]{64}$/.test(preparation.revision)) throw Error("Current preparation recovery required.");
    const outbox = includeOutbox ? await readCRMDeliveryOutbox(join(env.QUEST_PIPELINE_DIRECTORY, "synthetic-crm-outbox"), key) : null;
    if (outbox && !/^[a-f0-9]{64}$/.test(outbox.revision)) throw Error("Current outbox recovery required.");
    return assessPilotRecovery({ storageVerified, localBackupVerified, pipelineRevision: pipeline.revision, intakeRevision: intake.revision,
      ...(preparation ? { preparationRevision: preparation.revision } : {}), ...(outbox ? { outboxRevision: outbox.revision } : {}) },
      await readPilotRecoveryReceipt(env.QUEST_PIPELINE_DIRECTORY), now, proof);
  } finally { key.fill(0); }
}
