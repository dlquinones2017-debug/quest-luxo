import { resolve } from "node:path";
import {
  backupLeadFile,
  restoreLeadFile,
  verifyLeadFile,
} from "../src/lib/leads/leadStorageOperations.mjs";

const [command, source, target, confirmation] = process.argv.slice(2);

if (command === "verify" && source) {
  console.log(await verifyLeadFile(resolve(source)));
} else if (command === "backup" && source && target) {
  console.log(await backupLeadFile(resolve(source), resolve(target)));
} else if (
  command === "restore" &&
  source &&
  target &&
  confirmation === "--confirm"
) {
  console.log(await restoreLeadFile(resolve(source), resolve(target)));
} else {
  console.error(
    [
      "Usage:",
      "  node scripts/lead-storage.mjs verify <leads.jsonl>",
      "  node scripts/lead-storage.mjs backup <leads.jsonl> <backup-dir>",
      "  node scripts/lead-storage.mjs restore <backup.jsonl> <leads.jsonl> --confirm",
    ].join("\n")
  );
  process.exitCode = 2;
}
