import type { LeadStorageResult } from "./leadStorageTypes.ts";

export interface LeadNotificationContext {
  readonly version: 1;
  readonly sourceSystem: "luxury-canonical-jsonl";
  readonly leadId: string;
  readonly savedAt: string;
}

// Only a server persistence result supplies identity. Never read this from intake fields.
export function createLeadNotificationContext(
  storage: Pick<LeadStorageResult, "id" | "savedAt">
): LeadNotificationContext {
  // Older normalized records include hash IDs and ISO timestamps without milliseconds
  // or with explicit offsets. Preserve their stored identity/time on retry.
  const safeId = /^[a-z0-9][a-z0-9_-]{0,127}$/i.test(storage.id);
  const isoTimestamp = /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/;
  const dateOnly = new Date(`${storage.savedAt.slice(0,10)}T00:00:00.000Z`);
  const validTimestamp = isoTimestamp.test(storage.savedAt) && Number.isFinite(Date.parse(storage.savedAt)) &&
    Number.isFinite(dateOnly.getTime()) && dateOnly.toISOString().slice(0,10) === storage.savedAt.slice(0,10);
  if (!safeId || !validTimestamp) {
    throw new Error("Invalid persisted inquiry identity.");
  }
  return Object.freeze({ version: 1, sourceSystem: "luxury-canonical-jsonl", leadId: storage.id, savedAt: storage.savedAt });
}

export function getLeadNotificationContextFields(context?: LeadNotificationContext): readonly (readonly [string, string])[] {
  if (!context) return [];
  if (context.version !== 1 || context.sourceSystem !== "luxury-canonical-jsonl") throw new Error("Unsupported inquiry event contract.");
  const verified = createLeadNotificationContext({ id: context.leadId, savedAt: context.savedAt });
  return [
    ["Contract-Version", "1"], ["Source-System", verified.sourceSystem],
    ["Lead-ID", verified.leadId], ["Saved-At", verified.savedAt],
    ["Event-Key", `luxury-inquiry-v1/${verified.leadId}`],
  ];
}
