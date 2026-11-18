import { readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";

/** Read-only operational exception counts; never publishes customer data. */
export function buildManualPipelineReport(snapshot) {
  const divisions = [
    ["CAPITAL_ADVISORY", snapshot.records.capital],
    ["REALTY", snapshot.records.realty],
  ];
  return {
    schemaVersion: 1,
    mode: "MANUAL_READ_ONLY",
    snapshotSequence: snapshot.sequence,
    divisions: divisions.map(([name, records]) => ({
      division: name,
      total: records.length,
      blocked: records.filter(r => r.status === "BLOCKED").length,
      founderReview: records.filter(r => r.status === "REQUIRES_FOUNDER").length,
      unverifiedEvidence: records.filter(r => r.evidenceState !== "VERIFIED").length,
    })),
    sendsMessages: false,
    writesCRM: false,
    activatesGmail: false,
  };
}
if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  const directory = process.env.QUEST_PIPELINE_DIRECTORY;
  const keyHex = process.env.QUEST_PIPELINE_KEY_HEX;
  if (!directory || !keyHex || !/^[0-9a-fA-F]{64}$/.test(keyHex)) {
    console.error("Manual report requires QUEST_PIPELINE_DIRECTORY and a managed 64-hex-character QUEST_PIPELINE_KEY_HEX.");
    process.exitCode = 2;
  } else {
    try {
      const snapshot = await readDurablePipelines(directory,Buffer.from(keyHex,"hex"));
      if (snapshot.revision === "EMPTY") {
        console.error("No encrypted pipeline snapshot found; missing source is not a zero-count report.");
        process.exitCode = 3;
      } else console.log(JSON.stringify(buildManualPipelineReport(snapshot),null,2));
    } catch {
      console.error("Encrypted pipeline report unavailable; verify key, integrity and source with an operator.");
      process.exitCode = 4;
    }
  }
}
