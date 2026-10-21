import { readEncryptedIntakeJournal } from "../command/enterpriseIntakeJournal.ts";
import { previewBusinessSource } from "./businessSourcePreflight.ts";
import type { ReadinessEvidence } from "./agentReadinessPolicy.ts";

export const INTAKE_JOURNAL_SOURCE = "encrypted-formsubmit-journal";

/** Explicit read-only adapter for retained receipts, never a mailbox reader or an activation mechanism. */
export async function previewIntakeJournalSource(
  directory: string, key: Buffer, contract: unknown, evidence: readonly ReadinessEvidence[], now: string,
) {
  const time = new Date(now);
  if (!Number.isFinite(time.getTime()) || time.toISOString() !== now) throw Error("Canonical source observation time required.");
  const snapshot = await readEncryptedIntakeJournal(directory, key, time);
  if (snapshot.revision === "EMPTY" || !snapshot.observedAt) throw Error("Intake source missing; not an empty export.");
  const report = previewBusinessSource(contract, {
    schemaVersion: 1, sourceId: INTAKE_JOURNAL_SOURCE,
    // A read does not refresh the age of a retained collection checkpoint.
    capturedAt: new Date(snapshot.observedAt).toISOString(),
    records: snapshot.receipts.map(receipt => ({
      recordId: receipt.sourceRecordId.slice("gmail:".length), division: receipt.division,
      // Verified receipt provenance is not borrower/property qualification or permission to act.
      status: "BLOCKED", evidenceState: "UNKNOWN", updatedAt: new Date(receipt.receivedAt!).toISOString(),
    })),
  }, evidence, now);
  return Object.freeze({ ...report, sourceCoverage: "RETAINED_RECEIPTS_ONLY", collectsMailbox: false,
    qualificationEstablished: false, sourceCompletenessVerified: false });
}
