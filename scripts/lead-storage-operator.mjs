import {
  createLeadStorageBackup,
  removeExactLabeledSmokeTestLead,
  restoreLeadStorageBackup,
  verifyLabeledSmokeTestLead,
  verifyLeadJsonlFile,
} from "../src/lib/leads/leadStorageOperations.ts";

const [, , command, ...rawArgs] = process.argv;
const args = new Map();

for (let index = 0; index < rawArgs.length; index += 1) {
  const argument = rawArgs[index];

  if (!argument.startsWith("--")) continue;
  const next = rawArgs[index + 1];

  if (!next || next.startsWith("--")) {
    args.set(argument, true);
  } else {
    args.set(argument, next);
    index += 1;
  }
}

const requireString = (name) => {
  const value = args.get(name);

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required argument: ${name}`);
  }

  return value;
};

const printVerification = (result) =>
  console.log(
    JSON.stringify(
      {
        valid: result.valid,
        bytes: result.bytes,
        records: result.records,
        sha256: result.sha256,
      },
      null,
      2
    )
  );

switch (command) {
  case "verify": {
    printVerification(
      await verifyLeadJsonlFile(requireString("--file"), {
        requireNonEmpty: true,
      })
    );
    break;
  }
  case "backup": {
    const result = await createLeadStorageBackup({
      sourceFile: requireString("--source"),
      backupDirectory: requireString("--backup-dir"),
    });

    console.log(
      JSON.stringify(
        {
          backupFile: result.backupFile,
          valid: result.valid,
          bytes: result.bytes,
          records: result.records,
          sha256: result.sha256,
        },
        null,
        2
      )
    );
    break;
  }
  case "restore": {
    if (args.get("--confirm-restore") !== true) {
      throw new Error("Restore requires --confirm-restore.");
    }

    printVerification(
      await restoreLeadStorageBackup({
        backupFile: requireString("--backup"),
        restoreTargetFile: requireString("--target"),
      })
    );
    break;
  }
  case "verify-smoke": {
    const result = await verifyLabeledSmokeTestLead({
      storageFile: requireString("--file"),
      label: requireString("--label"),
      ...(typeof args.get("--id") === "string"
        ? { leadId: args.get("--id") }
        : {}),
    });

    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case "cleanup-smoke": {
    if (args.get("--confirm-cleanup") !== true) {
      throw new Error("Smoke-test cleanup requires --confirm-cleanup.");
    }

    const result = await removeExactLabeledSmokeTestLead({
      storageFile: requireString("--file"),
      leadId: requireString("--id"),
      label: requireString("--label"),
    });

    console.log(JSON.stringify(result, null, 2));
    break;
  }
  default:
    throw new Error(
      "Usage: lead-storage-operator.mjs <verify|backup|restore|verify-smoke|cleanup-smoke> [arguments]"
    );
}
