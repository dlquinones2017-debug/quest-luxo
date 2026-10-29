import { join } from "node:path";
import { getQuestLuxoServerConfig } from "../src/lib/config/questLuxoConfig.ts";
import { WorkforcePhaseJournal } from "../src/lib/command/workforcePhaseJournal.ts";
import { workforceValidationReadiness, runWorkforceValidationOnce, reconcileWorkforceValidationNotification } from "../src/lib/command/workforceValidationRuntime.ts";

const [command = "status", ...args] = process.argv.slice(2);
try {
  if (command === "status") {
    console.log(JSON.stringify(workforceValidationReadiness()));
  } else if (command === "run-once") {
    console.log(JSON.stringify(await runWorkforceValidationOnce()));
  } else if (command === "reconcile-notification") {
    if (args.length !== 2) throw Error();
    console.log(JSON.stringify(await reconcileWorkforceValidationNotification(args[0], args[1])));
  } else {
    const config = getQuestLuxoServerConfig();
    if (config.leadStorage.directoryStatus !== "configured" || !/^[a-f0-9]{64}$/i.test(process.env.WORKFORCE_JOURNAL_KEY_HEX ?? "")) throw Error();
    const directory = join(config.leadStorage.directory, "workforce-validation-v2");
    const key = Buffer.from(process.env.WORKFORCE_JOURNAL_KEY_HEX, "hex");
    let store;
    try {
      if (command === "initialize" && !args.length) store = await WorkforcePhaseJournal.open(directory, key, { initialize: true });
      else if (command === "export-backup" && args.length === 1) {
        store = await WorkforcePhaseJournal.open(directory, key);
        console.log(JSON.stringify(await store.exportBackup(args[0])));
      } else if (command === "restore-backup" && args.length === 1) store = await WorkforcePhaseJournal.restoreBackup(args[0], directory, key);
      else throw Error();
      const state = store.read();
      console.log(JSON.stringify({ revision: state.revision, sequence: state.state.sequence, recoveryHold: state.state.recoveryHold, entries: state.state.entries.length, businessHold: true }));
    } finally { store?.close(); key.fill(0); }
  }
} catch {
  console.error("Workforce validation command held. Verify command, explicit fixture authorization, secure configuration, private journal and positive provider evidence.");
  process.exitCode = 1;
}
