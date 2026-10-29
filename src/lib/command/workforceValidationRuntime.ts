import { join } from "node:path";
import { getQuestLuxoServerConfig } from "../config/questLuxoConfig.ts";
import { readLeadSubmissionSnapshot } from "../leads/leadStorage.ts";
import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import { createLuxuryWorkforceEvent, isApprovedWorkforceFixture } from "./luxuryWorkforceEvent.ts";
import { WorkforcePhaseJournal } from "./workforcePhaseJournal.ts";
import { WorkforceContactTaskDelivery } from "./workforceContactTaskDelivery.ts";
import { createHubspotWorkforceAdapter } from "./hubspotWorkforceAdapter.ts";

type SavedRecord = Pick<LeadSubmissionRecord, "id" | "savedAt" | "payload">;
const validId = /^[a-z0-9][a-z0-9_-]{0,127}$/i;
export function workforceValidationReadiness(env: Readonly<Record<string, string | undefined>> = process.env) {
  const enabled = env.QUEST_WORKFORCE_VALIDATION_ENABLED === "true";
  const allowedIds = (env.WORKFORCE_VALIDATION_LEAD_IDS ?? "").split(",").map(x => x.trim()).filter(Boolean);
  const missing: string[] = [];
  if (!env.WORKFORCE_HUBSPOT_ACCESS_TOKEN?.trim()) missing.push("WORKFORCE_HUBSPOT_ACCESS_TOKEN");
  if (!/^[a-f0-9]{64}$/i.test(env.WORKFORCE_JOURNAL_KEY_HEX ?? "")) missing.push("WORKFORCE_JOURNAL_KEY_HEX");
  if (!allowedIds.length || allowedIds.length > 10 || new Set(allowedIds).size !== allowedIds.length || allowedIds.some(x => !validId.test(x))) missing.push("WORKFORCE_VALIDATION_LEAD_IDS");
  if (Number(process.versions.node.split(".")[0]) < 24) missing.push("NODE_24_RUNTIME");
  return Object.freeze({ enabled, configured: missing.length === 0, mode: "INTERNAL_VALIDATION_ONLY", businessHold: true, missing: Object.freeze(missing), allowedIds: Object.freeze(allowedIds) });
}
let journalPromise: Promise<WorkforcePhaseJournal> | undefined;
let deliveryPromise: Promise<WorkforceContactTaskDelivery> | undefined;
function journal(): Promise<WorkforcePhaseJournal> {
  if (!journalPromise) journalPromise = (async () => {
    const config = getQuestLuxoServerConfig();
    if (config.leadStorage.providerStatus !== "configured" || config.leadStorage.directoryStatus !== "configured") throw Error("Configured canonical storage required.");
    const key = Buffer.from(process.env.WORKFORCE_JOURNAL_KEY_HEX!, "hex");
    try { return await WorkforcePhaseJournal.open(join(config.leadStorage.directory, "workforce-validation-v2"), key); }
    finally { key.fill(0); }
  })().catch(error => { journalPromise = undefined; throw error; });
  return journalPromise;
}
function delivery(): Promise<WorkforceContactTaskDelivery> {
  if (!deliveryPromise) deliveryPromise = (async () => new WorkforceContactTaskDelivery(await journal(), await createHubspotWorkforceAdapter(process.env.WORKFORCE_HUBSPOT_ACCESS_TOKEN!)))().catch(error => { deliveryPromise = undefined; throw error; });
  return deliveryPromise;
}
function validationEvent(record: SavedRecord) {
  const readiness = workforceValidationReadiness();
  if (!readiness.enabled || !readiness.configured || !readiness.allowedIds.includes(record.id)) return null;
  const key = Buffer.from(process.env.WORKFORCE_JOURNAL_KEY_HEX!, "hex");
  try {
    const event = createLuxuryWorkforceEvent(record, key);
    // Additional server-generated IDs require explicit secure allowlisting. The founder identity/marker/source remain fixed.
    if (!isApprovedWorkforceFixture(event, readiness.allowedIds)) return null;
    return event;
  } finally { key.fill(0); }
}
/** Called only after canonical persistence succeeds. It never performs network I/O. */
export async function queueWorkforceValidationRecord(record: SavedRecord): Promise<string> {
  const event = validationEvent(record);
  if (!event) return "DISABLED_OR_EXCLUDED";
  const store = await journal();
  return WorkforceContactTaskDelivery.enqueueSavedEvent(store, event);
}
export async function runWorkforceValidationOnce() {
  const readiness = workforceValidationReadiness();
  if (!readiness.enabled || !readiness.configured) return { ...readiness, processed: 0 };
  const snapshot = await readLeadSubmissionSnapshot();
  if (snapshot.status !== "COMPLETE") throw Error("Canonical source completeness not verified.");
  const worker = await delivery();
  const results = [];
  for (const record of snapshot.records) {
    const event = validationEvent(record);
    if (!event) continue;
    results.push(await worker.deliver(event));
  }
  return { mode: readiness.mode, businessHold: true, processed: results.length, results };
}
export async function reconcileWorkforceValidationNotification(leadId: string, providerId: string) {
  const readiness = workforceValidationReadiness();
  if (!readiness.enabled || !readiness.configured || !readiness.allowedIds.includes(leadId)) throw Error("Approved internal validation configuration required.");
  const snapshot = await readLeadSubmissionSnapshot();
  if (snapshot.status !== "COMPLETE") throw Error("Canonical source completeness not verified.");
  const record = snapshot.records.find(r => r.id === leadId);
  const event = record && validationEvent(record);
  if (!event) throw Error("Approved canonical fixture not found.");
  return (await delivery()).reconcileNotification(event, providerId);
}
export function startWorkforceValidationRuntime(): () => void {
  const readiness = workforceValidationReadiness();
  console.log("Quest Luxo workforce runtime readiness", { enabled: readiness.enabled, configured: readiness.configured, mode: readiness.mode, businessHold: true, missing: readiness.missing });
  if (!readiness.enabled || !readiness.configured) return () => {};
  let stopped = false, timer: ReturnType<typeof setTimeout> | undefined;
  const reported = new Map<string, string>();
  async function tick() {
    try {
      const result = await runWorkforceValidationOnce();
      for (const row of "results" in result ? result.results ?? [] : []) {
        if (reported.get(row.eventKey) === row.status) continue;
        reported.set(row.eventKey, row.status);
        console.log("Quest Luxo internal validation delivery", row);
      }
    } catch { console.error("Quest Luxo internal validation held; inspect secure runtime access and phase journal."); }
    if (!stopped) { timer = setTimeout(() => { void tick(); }, 15_000); timer.unref(); }
  }
  void tick();
  return () => { stopped = true; if (timer) clearTimeout(timer); };
}
