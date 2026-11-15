import { WORKFORCE_MAILBOX, type LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";
import type { WorkforceDeliveryMode } from "./workforceContactTaskDelivery.ts";
import { workforceOwnerNotification } from "./workforceOwnerNotification.ts";

export class WorkforceNotificationReadUnavailable extends Error {
  readonly code = "WORKFORCE_NOTIFICATION_READ_UNAVAILABLE";
  readonly reason: "RESTRICTED_SEND_ONLY_KEY" | "PROVIDER_READ_UNAVAILABLE";
  constructor(reason: "RESTRICTED_SEND_ONLY_KEY" | "PROVIDER_READ_UNAVAILABLE") {
    super("Provider notification read is unavailable; absence is not established."); this.reason = reason;
  }
}
export interface OwnerInboxReceiptRequest {
  readonly messageId: string; readonly event: LuxuryWorkforceEvent;
  readonly contactId: string; readonly taskId: string; readonly mode: WorkforceDeliveryMode;
}
export type OwnerInboxReceipt =
  | { readonly status: "UNAVAILABLE" | "UNVERIFIED"; readonly reason: string }
  | { readonly status: "VERIFIED"; readonly source: "AUTHENTICATED_OWNER_GMAIL";
      readonly accountId: string; readonly mailbox: typeof WORKFORCE_MAILBOX;
      readonly messageId: string; readonly rfcMessageId: string; readonly observedAt: string;
      readonly providerId: null; readonly humanAction: "UNKNOWN" };
export interface WorkforceOwnerInboxReceiptReader { read(request: OwnerInboxReceiptRequest): Promise<OwnerInboxReceipt> }

/** Trusted server capability, never a request-body object or an evidence-file import.
 * Bind these methods to the existing authenticated business Gmail connection. A profile
 * object or copied headers alone do not authenticate a transport. No such runtime binding
 * is supplied here; an unbound reader is explicitly unavailable. */
export interface AuthenticatedOwnerGmailTransport {
  getProfile(): Promise<unknown>;
  readFullMessage(messageId: string): Promise<unknown>;
}
/** Supplied by the existing trusted server owner configuration, never native
 * message input. Missing identity cannot be inferred from the returned profile. */
export interface AuthenticatedOwnerGmailBinding {
  readonly accountId: string;
  readonly mailbox: typeof WORKFORCE_MAILBOX;
}
const plain = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);
const normal = (s: string) => s.replace(/\r\n/g, "\n");
const issued = new WeakMap<object, { request: string; accountId: string }>();
const binding = (r: OwnerInboxReceiptRequest) => JSON.stringify([r.messageId, r.event.eventKey, r.event.fingerprint, r.event.emailKey, r.event.leadId, r.event.savedAt, r.contactId, r.taskId, r.mode]);
/** In-process issuance rejects copied/imported JSON and cross-event proof substitution. */
export function isBoundWorkforceOwnerInboxReceipt(receipt: OwnerInboxReceipt, request: OwnerInboxReceiptRequest, now: number): boolean {
  const proof = issued.get(receipt);
  return receipt.status === "VERIFIED" && proof?.request === binding(request) && proof.accountId === receipt.accountId && receipt.mailbox === WORKFORCE_MAILBOX && receipt.providerId === null && receipt.humanAction === "UNKNOWN" &&
    Number.isFinite(Date.parse(receipt.observedAt)) && Math.abs(now - Date.parse(receipt.observedAt)) <= 300_000;
}

/** Mapping is the observed native Gmail connector full-message contract (snake_case).
 * This callable adds no Gmail authorization, route, subscription, storage or provider call. */
export function createWorkforceOwnerInboxReceiptReader(transport?: AuthenticatedOwnerGmailTransport, accountBinding?: AuthenticatedOwnerGmailBinding, clock: () => number = Date.now): WorkforceOwnerInboxReceiptReader {
  // Snapshot configuration so later caller mutation cannot switch the account.
  const accountId = typeof accountBinding?.accountId === "string" && /^[1-9]\d{5,30}$/.test(accountBinding.accountId) && accountBinding.mailbox === WORKFORCE_MAILBOX ? accountBinding.accountId : null;
  return Object.freeze({ async read(request: OwnerInboxReceiptRequest): Promise<OwnerInboxReceipt> {
    if (!transport) return { status: "UNAVAILABLE", reason: "AUTHENTICATED_OWNER_GMAIL_TRANSPORT_NOT_BOUND" };
    if (!accountId) return { status: "UNAVAILABLE", reason: "AUTHENTICATED_OWNER_GMAIL_ACCOUNT_BINDING_NOT_CONFIGURED" };
    try {
      if (!/^[a-f0-9]{8,64}$/.test(request.messageId)) return { status: "UNVERIFIED", reason: "MESSAGE_ID_INVALID" };
      const expected = workforceOwnerNotification(request.event, request.contactId, request.taskId, request.mode);
      const profile = await transport.getProfile();
      if (!plain(profile) || profile.id !== accountId || profile.email !== WORKFORCE_MAILBOX) return { status: "UNVERIFIED", reason: "AUTHENTICATED_ACCOUNT_MISMATCH" };
      const m = await transport.readFullMessage(request.messageId);
      const after = await transport.getProfile();
      if (!plain(after) || after.id !== accountId || after.email !== WORKFORCE_MAILBOX) throw Error();
      if (!plain(m) || m.id !== request.messageId || !Array.isArray(m.label_ids) || !m.label_ids.includes("INBOX") || m.label_ids.some((v: unknown) => v === "SPAM" || v === "TRASH") || !plain(m.payload)) throw Error();
      const received = Number(m.internal_date), saved = Date.parse(request.event.savedAt), now = clock();
      if (!/^\d{10,16}$/.test(String(m.internal_date)) || !Number.isSafeInteger(received) || !Number.isFinite(saved) || !Number.isFinite(now) || received < saved - 5_000 || received > now + 300_000) throw Error();
      const headers = m.payload.headers;
      if (!Array.isArray(headers) || headers.length > 150 || headers.some(h => !plain(h) || typeof h.name !== "string" || typeof h.value !== "string" || h.value.length > 16_384)) throw Error();
      const values = (name: string): string[] => headers.filter(h => h.name.toLowerCase() === name).map(h => h.value);
      const one = (name: string): string => { const v = values(name); if (v.length !== 1) throw Error(); return v[0]; };
      if (one("from") !== "info@questluxo.com" || one("to") !== expected.to || one("delivered-to") !== expected.to || one("subject") !== expected.subject || values("cc").some(Boolean) || values("bcc").some(Boolean)) throw Error();
      const rfcMessageId = one("message-id");
      if (!/^<[^<>\s]{1,250}@[^<>\s]{1,250}>$/.test(rfcMessageId) || !Number.isFinite(Date.parse(one("date"))) || Math.abs(Date.parse(one("date")) - received) > 300_000) throw Error();
      // A trusted Gmail transport supplies the delivered header chain; never accept
      // caller-asserted dkimPass flags or an Authentication-Results header in body text.
      const authentication = one("authentication-results");
      if (!/^mx\.google\.com\s*;/.test(authentication) || !/\bdkim=pass\s+header\.i=@questluxo\.com(?=[\s;])/.test(authentication) || !/\bspf=pass\b/.test(authentication) || !/\bsmtp\.mailfrom=[^\s;]+@send\.questluxo\.com(?=[\s;])/.test(authentication) || !/\bdmarc=pass\b[^;]*\bheader\.from=questluxo\.com(?=[\s;]|$)/.test(authentication) || !values("received").some(v => /\bby mx\.google\.com\b/.test(v) && v.includes(`for <${expected.to}>`))) throw Error();
      const bodies = new Map<string, string>(); let parts = 0;
      const visit = (part: any, depth: number): void => {
        if (!plain(part) || ++parts > 8 || depth > 3 || part.filename || part.body?.attachment_id) throw Error();
        if (part.mime_type === "multipart/alternative") { if (!Array.isArray(part.parts) || !part.parts.length) throw Error(); for (const p of part.parts) visit(p, depth + 1); return; }
        if (!["text/plain", "text/html"].includes(part.mime_type) || bodies.has(part.mime_type) || part.parts?.length || typeof part.body?.content !== "string" || Buffer.byteLength(part.body.content) > 100_000) throw Error();
        bodies.set(part.mime_type, normal(part.body.content));
      };
      visit(m.payload, 0);
      if (bodies.size !== 2 || bodies.get("text/plain") !== normal(expected.text) || bodies.get("text/html") !== normal(expected.html)) throw Error();
      const receipt = Object.freeze({ status: "VERIFIED" as const, source: "AUTHENTICATED_OWNER_GMAIL" as const, accountId, mailbox: WORKFORCE_MAILBOX, messageId: m.id,
        rfcMessageId, observedAt: new Date(now).toISOString(), providerId: null, humanAction: "UNKNOWN" as const });
      issued.set(receipt, { request: binding(request), accountId }); return receipt;
    } catch { return { status: "UNVERIFIED", reason: "NATIVE_OWNER_INBOX_RECEIPT_UNVERIFIED" }; }
  } });
}
