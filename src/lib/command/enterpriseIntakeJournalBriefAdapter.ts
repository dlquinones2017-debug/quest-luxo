import { readEncryptedIntakeJournal } from "./enterpriseIntakeJournal.ts";
import type { EnterpriseIntakeSnapshot } from "./storedEnterpriseRevenueBrief.ts";

/**
 * Optional read-only bridge to the existing Founder Revenue Brief.
 * Nothing activates this reader by default; the caller must already
 * possess an approved journal key and explicitly inject the reader.
 *
 * A journal is a retained set of previously authenticated message receipts,
 * NOT continuous Gmail collection or end-to-end source completeness. Return
 * PARTIAL even when its last metadata page was COMPLETE.
 */
export function createIntakeJournalBriefReader(
  directory: string,
  key: Buffer,
  now: () => Date = () => new Date(),
): () => Promise<EnterpriseIntakeSnapshot> {
  return async () => {
    const snapshot = await readEncryptedIntakeJournal(directory, key, now());
    const status = snapshot.revision === "EMPTY" ? "SOURCE_MISSING" as const : "PARTIAL" as const;
    const observation = Object.freeze({
      status,
      ...(snapshot.observedAt ? { observedAt: snapshot.observedAt } : {}),
    });
    return Object.freeze({
      receipts: Object.freeze([...snapshot.receipts]),
      observations: Object.freeze({
        CAPITAL_ADVISORY: observation,
        REALTY: observation,
      }),
    });
  };
}
