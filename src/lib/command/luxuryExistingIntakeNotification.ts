import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import { createLuxuryWorkforceEvent, type LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";

export type ExistingIntakeNotificationReceipt = {
  readonly status: "ACCEPTANCE_RECORDED";
  readonly providerId: string | null;
  readonly sourceRecordId: string;
  readonly savedAt: string;
  readonly fingerprint: string;
} | { readonly status: "UNVERIFIED" };

/** Reuses only the same canonical record's existing form-delivery outcome.
 * This is recorded intake acceptance, not workforce notification acceptance,
 * native provider readback, inbox receipt or human action. No send/retry occurs.
 */
export function readExistingIntakeNotification(record: LeadSubmissionRecord | undefined, event: LuxuryWorkforceEvent, key: Buffer): ExistingIntakeNotificationReceipt {
  try {
    if (!record || record.id !== event.leadId || record.savedAt !== event.savedAt) return { status: "UNVERIFIED" };
    const current = createLuxuryWorkforceEvent(record, key);
    if (current.fingerprint !== event.fingerprint || current.emailKey !== event.emailKey) return { status: "UNVERIFIED" };
    const delivery = record.emailDelivery;
    if (!delivery || delivery.status !== "sent" || delivery.configured !== true || !Number.isInteger(delivery.providerStatus) || delivery.providerStatus! < 200 || delivery.providerStatus! >= 300) return { status: "UNVERIFIED" };
    let providerId: string | null = null;
    if (typeof delivery.providerResponse === "string" && Buffer.byteLength(delivery.providerResponse) <= 100_000) {
      try {
        const response = JSON.parse(delivery.providerResponse);
        if (typeof response?.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(response.id)) providerId = response.id;
      } catch { /* Preserve the recorded HTTP outcome without inventing a provider ID. */ }
    }
    return Object.freeze({ status: "ACCEPTANCE_RECORDED", providerId, sourceRecordId: record.id, savedAt: record.savedAt, fingerprint: event.fingerprint });
  } catch { return { status: "UNVERIFIED" }; }
}
