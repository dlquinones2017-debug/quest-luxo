import { PUBLIC_WEBSITE_TARGETS, PUBLIC_WEBSITE_INTERVAL_MS, classifyPublicHTTPStatus } from "./publicWebsiteHealth.ts";
import type { checkPublicWebsites } from "./publicWebsiteHealth.ts";
type Health = Awaited<ReturnType<typeof checkPublicWebsites>>;
const exact = (value: unknown, fields: readonly string[]): value is Record<string, unknown> => !!value && typeof value === "object" &&
  !Array.isArray(value) && Object.keys(value).sort().join() === [...fields].sort().join();
function validatedHealth(input: unknown, now: string): { health: Health; stale: boolean } {
  const time = Date.parse(now), health = input as Health;
  if (!Number.isFinite(time) || new Date(time).toISOString() !== now ||
      !exact(input, ["schemaVersion","mode","evidenceClass","observedAt","status","responding","checked","observations","assessesContentOrForms",
        "businessDataExecutionAllowed","changesProduction","persistsCustomerData","sendsMessages","writesCRM","activatesGmail"]) ||
      health.schemaVersion !== 1 || health.mode !== "PUBLIC_READ_ONLY" || health.evidenceClass !== "HTTP_HEADERS_ONLY" ||
      !Number.isFinite(Date.parse(health.observedAt)) || new Date(health.observedAt).toISOString() !== health.observedAt ||
      Date.parse(health.observedAt) > time || health.checked !== 3 || !Array.isArray(health.observations) || health.observations.length !== 3 ||
      [health.assessesContentOrForms,health.businessDataExecutionAllowed,health.changesProduction,health.persistsCustomerData,
        health.sendsMessages,health.writesCRM,health.activatesGmail].some(v => v !== false)) throw Error("Unverified public observation.");
  for (const [i, item] of health.observations.entries()) {
    const target = PUBLIC_WEBSITE_TARGETS[i]!;
    if (!exact(item,["division","url","status","state","durationMs"]) || item.division !== target.division || item.url !== target.url ||
        typeof item.durationMs !== "number" || typeof item.state !== "string" || !Number.isSafeInteger(item.durationMs) || item.durationMs < 0 || item.durationMs > 120_000 ||
        (item.status === null ? !["NETWORK_ERROR","TIMEOUT"].includes(item.state) :
          typeof item.status !== "number" || !Number.isInteger(item.status) || item.status < 100 || item.status > 599 || item.state !== classifyPublicHTTPStatus(item.status)))
      throw Error("Unverified public observation.");
  }
  const count = health.observations.filter(o => o.state === "RESPONDING").length;
  if (health.responding !== count || health.status !== (count === 3 ? "RESPONDING" : "ATTENTION")) throw Error("Inconsistent public observations.");
  return { health, stale: time - Date.parse(health.observedAt) > PUBLIC_WEBSITE_INTERVAL_MS + 30_000 };
}
const boundaries = { businessDataExecutionAllowed: false, changesProduction: false, dispatchesWork: false,
  sendsMessages: false, writesCRM: false, activatesGmail: false } as const;
const actionFor = (state: string) => state === "ACCESS_RESTRICTED" ? "VERIFY_ACCESS" : state === "REDIRECT_REVIEW" ? "REVIEW_REDIRECT" :
  state === "HEAD_UNSUPPORTED" ? "VERIFY_HTTP_METHOD" : state === "SERVER_ERROR" ? "INVESTIGATE_SERVER_RESPONSE" :
  state === "NOT_FOUND" ? "REVIEW_PUBLIC_ROUTE" : state === "RATE_LIMITED" ? "REVIEW_RATE_LIMIT" : "VERIFY_NETWORK_PATH";
export function triagePublicWebsiteReport(input: unknown, now: string) {
  const { health, stale } = validatedHealth(input, now);
  const incidents = stale ? [{ division: "ENTERPRISE_OPERATIONS", observation: "STALE", action: "VERIFY_FRESH_CHECK", severity: "REVIEW" }] :
    health.observations.filter(o => o.state !== "RESPONDING").map(o => ({ division: o.division, observation: o.state,
      action: actionFor(o.state), severity: o.state === "SERVER_ERROR" ? "ERROR" : "REVIEW" }));
  return Object.freeze({ schemaVersion: 1, mode: "PUBLIC_READ_ONLY", assessedAt: now, sourceObservedAt: health.observedAt,
    status: stale ? "HOLD" : incidents.length ? "ATTENTION" : "CLEAR", sourceFresh: !stale,
    incidentCount: incidents.length, incidents: Object.freeze(incidents.map(i => Object.freeze(i))), ...boundaries });
}
export function buildPublicOperationsBrief(input: unknown, incidentReport: unknown, now: string) {
  const { health } = validatedHealth(input, now);
  const expected = triagePublicWebsiteReport(input, now);
  if (JSON.stringify(incidentReport) !== JSON.stringify(expected)) throw Error("Founder brief requires matching verified public incident assessment.");
  return Object.freeze({ schemaVersion: 1, mode: "PUBLIC_READ_ONLY", assessedAt: now,
    status: expected.status === "HOLD" ? "HOLD" : "READY_FOR_REVIEW", sourceCoverage: "PUBLIC_WEBSITES_ONLY",
    sitesChecked: health.checked, sitesResponding: health.responding, sourceFresh: expected.sourceFresh,
    incidentCount: expected.incidentCount, requiredActions: Object.freeze(expected.incidents.map(i => i.action)),
    businessPipeline: "NOT_CONNECTED", ...boundaries });
}
