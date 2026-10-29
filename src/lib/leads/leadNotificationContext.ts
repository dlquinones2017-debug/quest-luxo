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
  if (!/^lead_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(storage.id) ||
      !Number.isFinite(Date.parse(storage.savedAt)) || new Date(storage.savedAt).toISOString() !== storage.savedAt) {
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
