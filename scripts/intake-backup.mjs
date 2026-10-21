import { pathToFileURL } from "node:url";
import { exportIntakeJournalBackup, restoreIntakeJournalBackup } from "../src/lib/command/enterprisePipelineBackup.ts";
export async function main(args = process.argv.slice(2), env = process.env) {
  const [action, backupFile, directory] = args;
  if (args.length !== 3 || !["export", "restore"].includes(action) || !/^[a-fA-F0-9]{64}$/.test(env.QUEST_INTAKE_KEY_HEX ?? ""))
    throw Error("Usage: intake-backup.mjs export|restore BACKUP_FILE DIRECTORY; managed QUEST_INTAKE_KEY_HEX required.");
  const key = Buffer.from(env.QUEST_INTAKE_KEY_HEX, "hex");
  try {
    return action === "export" ? await exportIntakeJournalBackup(directory, backupFile, key) : await restoreIntakeJournalBackup(backupFile, directory, key);
  } finally { key.fill(0); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await main(), null, 2)); }
  catch { console.error("Intake backup operation failed; no source data or key printed and no recovery success asserted."); process.exitCode = 1; }
}
