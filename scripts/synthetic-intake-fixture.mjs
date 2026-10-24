import { createHash } from "node:crypto";
export const SYNTHETIC_INTAKE_TIME = "2026-10-21T00:00:00.000Z";
const hash = text => createHash("sha256").update(text).digest("hex");
export function syntheticIntakeBatch() {
  const receipts = ["CAPITAL_ADVISORY", "REALTY"].map(division => ({
    division, provider: "FORMSUBMIT", sourceRecordId: "gmail:" + hash("synthetic-intake-" + division),
    receivedAt: SYNTHETIC_INTAKE_TIME, evidenceIds: ["gmail:" + hash("synthetic-intake-" + division), "synthetic-mapping-" + division.toLowerCase()],
    receiptVerification: "VERIFIED", qualificationVerification: "UNKNOWN", notification: "UNKNOWN",
  }));
  return { status: "COMPLETE", receipts, checkpoint: { seen: Object.fromEntries(receipts.map(r => [r.sourceRecordId, hash("synthetic-proof-" + r.sourceRecordId)])) },
    counts: { examined: 2, rejected: 0, unmapped: 0, replayed: 0, conflicts: 0, retentionWarnings: 0 } };
}
