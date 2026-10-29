import { createHash } from "node:crypto";
import { getQuestLuxoServerConfig } from "../config/questLuxoConfig.ts";
import { luxurySignatureHtml, luxurySignatureText } from "../config/luxuryEmailSignature.ts";
import { WORKFORCE_MAILBOX, WORKFORCE_OWNER, WORKFORCE_PORTAL, type LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";
import { workforceTaskMetadata, type WorkforceContact, type WorkforceTask, type WorkforceCRMAdapter } from "./workforceContactTaskDelivery.ts";

const id = (value: unknown): string => {
  if (typeof value !== "string" || !/^[1-9]\d{0,30}$/.test(value)) throw Error("CRM native identity not verified.");
  return value;
};
const fail = (): never => { throw Error("CRM provider result is unavailable or unverified."); };
const subject = (event: LuxuryWorkforceEvent) => `[INTERNAL VALIDATION] Quest Luxo ${event.leadId}`;
const taskSubject = (event: LuxuryWorkforceEvent) => `[INTERNAL VALIDATION] ${event.eventKey}`;
const due = (event: LuxuryWorkforceEvent) => new Date(Date.parse(event.savedAt) + 86_400_000).toISOString();
const notificationMessage = (event: LuxuryWorkforceEvent, contactId: string, taskId: string) =>
  `This is a controlled Luxury Advisory workforce validation event.\n${workforceTaskMetadata(event)}\nContact: https://app.hubspot.com/contacts/${WORKFORCE_PORTAL}/contact/${id(contactId)}\nTask: https://app.hubspot.com/tasks/${WORKFORCE_PORTAL}/view/all/task/${id(taskId)}\nProvider acceptance does not establish inbox receipt or human completion.`;

interface WorkforceEmailProviderConfig { readonly from: string | null; readonly providerApiKey: string | null; readonly providerApiUrl: string }
export async function createHubspotWorkforceAdapter(token: string, request: typeof fetch = fetch, emailConfig: () => WorkforceEmailProviderConfig = () => getQuestLuxoServerConfig().leadEmail): Promise<WorkforceCRMAdapter> {
  if (!token || token.length > 512 || /\s/.test(token)) return fail();
  async function api(path: string, method = "GET", body?: unknown, notFound = false): Promise<any> {
    const response = await request(`https://api.hubapi.com${path}`, {
      method, redirect: "error", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 404 && notFound) return null;
    if (!response.ok || Number(response.headers.get("content-length") ?? "0") > 1_000_000) return fail();
    const text = await response.text();
    if (Buffer.byteLength(text) > 1_000_000) return fail();
    try { return JSON.parse(text); } catch { return fail(); }
  }
  // Read-only token introspection uses a POST body, never a token-bearing URL or connector export.
  const access = await api("/oauth/v2/private-apps/get/access-token-info", "POST", { tokenKey: token });
  if (String(access.hubId) !== WORKFORCE_PORTAL || !Array.isArray(access.scopes) ||
      !["crm.objects.contacts.read", "crm.objects.contacts.write"].every(scope => access.scopes.includes(scope))) return fail();
  const contact = (value: any): WorkforceContact | null => value === null ? null : {
    id: id(value.id), email: typeof value.properties?.email === "string" ? value.properties.email : fail(), archived: value.archived === false ? false : fail(),
    ownerId: typeof value.properties?.hubspot_owner_id === "string" ? value.properties.hubspot_owner_id : undefined,
    lifecycleStage: typeof value.properties?.lifecyclestage === "string" ? value.properties.lifecyclestage : undefined,
  };
  const task = (value: any): WorkforceTask | null => value === null ? null : {
    id: id(value.id), body: typeof value.properties?.hs_task_body === "string" ? value.properties.hs_task_body : fail(),
    subject: typeof value.properties?.hs_task_subject === "string" ? value.properties.hs_task_subject : undefined,
    ownerId: id(value.properties?.hubspot_owner_id), contactIds: value.associations?.contacts?.paging ? fail() : (value.associations?.contacts?.results ?? []).map((x: any) => id(x.id)),
    archived: value.archived === false ? false : fail(), dueAt: String(value.properties?.hs_timestamp ?? ""),
    status: String(value.properties?.hs_task_status ?? ""), type: String(value.properties?.hs_task_type ?? ""),
  };
  const getTask = async (nativeId: string) => task(await api(`/crm/v3/objects/tasks/${id(nativeId)}?properties=hs_task_body,hs_task_subject,hs_timestamp,hs_task_status,hs_task_type,hubspot_owner_id&associations=contacts`, "GET", undefined, true));
  const provider = async (event: LuxuryWorkforceEvent, method: "GET" | "POST", providerId?: string, contactId?: string, taskId?: string) => {
    const config = emailConfig();
    if (!config.providerApiKey || !config.from || config.providerApiUrl !== "https://api.resend.com/emails") return fail();
    const message = method === "POST" ? notificationMessage(event, contactId!, taskId!) : "";
    const result = await request(`https://api.resend.com/emails${method === "GET" ? `/${providerId}` : ""}`, {
      method, redirect: "error", signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${config.providerApiKey}`, "Content-Type": "application/json", ...(method === "POST" ? { "Idempotency-Key": createHash("sha256").update(`workforce-notification-v2:${event.eventKey}`).digest("hex") } : {}) },
      ...(method === "POST" ? { body: JSON.stringify({ from: config.from, to: [WORKFORCE_MAILBOX], subject: subject(event),
        text: `${message}\n\n${luxurySignatureText}`, html: `<p>Controlled Luxury Advisory workforce validation.</p><pre>${message.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</pre><div>${luxurySignatureHtml}</div>` }) } : {}),
    });
    if (!result.ok) return fail();
    const text = await result.text(); if (Buffer.byteLength(text) > 100_000) return fail();
    return JSON.parse(text);
  };
  return {
    findContact: async email => contact(await api(`/crm/v3/objects/contacts/${encodeURIComponent(email.trim().toLowerCase())}?idProperty=email&properties=email`, "GET", undefined, true)),
    getContact: async nativeId => contact(await api(`/crm/v3/objects/contacts/${id(nativeId)}?properties=email,hubspot_owner_id,lifecyclestage`, "GET", undefined, true)),
    createContact: async event => contact(await api("/crm/v3/objects/contacts", "POST", { properties: { email: event.payload.email, firstname: event.payload.name, lifecyclestage: "other" } })) ?? fail(),
    getTask,
    findTask: async event => {
      const result = await api("/crm/v3/objects/tasks/search", "POST", { filterGroups: [{ filters: [{ propertyName: "hs_task_subject", operator: "EQ", value: taskSubject(event) }] }], properties: ["hs_task_body"], limit: 100 });
      if (!Array.isArray(result.results) || result.total !== result.results.length || result.total > 1 || result.paging) return fail();
      return result.results.length ? getTask(id(result.results[0].id)) : null;
    },
    createTask: async (event, contactId) => {
      const created = await api("/crm/v3/objects/tasks", "POST", { properties: { hs_task_subject: taskSubject(event), hs_task_body: workforceTaskMetadata(event),
        hs_task_type: "TODO", hs_task_status: "NOT_STARTED", hubspot_owner_id: WORKFORCE_OWNER, hs_timestamp: due(event) },
        associations: [{ to: { id: id(contactId) }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 204 }] }] });
      // Return the native ID before separate readback; a readback failure must not erase successful creation.
      return { id: id(created.id), body: workforceTaskMetadata(event), ownerId: WORKFORCE_OWNER, contactIds: [], archived: false, dueAt: due(event), status: "NOT_STARTED", type: "TODO" };
    },
    notifyOwner: async (event, contactId, taskId) => {
      const result = await provider(event, "POST", undefined, id(contactId), id(taskId));
      return { accepted: typeof result.id === "string" && /^[a-zA-Z0-9_-]{1,128}$/.test(result.id), providerId: result.id };
    },
    getNotification: async (providerId, event, contactId, taskId) => {
      if (!/^[a-zA-Z0-9_-]{1,128}$/.test(providerId) || !/^[1-9]\d{0,30}$/.test(contactId) || !/^[1-9]\d{0,30}$/.test(taskId)) return false;
      const result = await provider(event, "GET", providerId);
      return result.id === providerId && Array.isArray(result.to) && result.to.length === 1 && result.to[0] === WORKFORCE_MAILBOX && result.subject === subject(event) &&
        result.text === `${notificationMessage(event, contactId, taskId)}\n\n${luxurySignatureText}`;
    },
  };
}
