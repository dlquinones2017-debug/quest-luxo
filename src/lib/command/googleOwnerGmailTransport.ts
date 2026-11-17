import { WORKFORCE_MAILBOX } from "./luxuryWorkforceEvent.ts";
import { createWorkforceOwnerInboxReceiptReader, type AuthenticatedOwnerGmailBinding, type AuthenticatedOwnerGmailTransport } from "./workforceOwnerInboxReceipt.ts";

const DISCOVERY = "https://accounts.google.com/.well-known/openid-configuration";
const USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";
const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me/";
const READONLY = "https://www.googleapis.com/auth/gmail.readonly";
const MAX_MESSAGE_BYTES = 750_000;
const plain = (x: unknown): x is Record<string, any> => !!x && typeof x === "object" && !Array.isArray(x);

/** Server-owned OAuth result only, never request JSON or an exported ChatGPT connection.
 * The existing authorization owner supplies a short-lived token and its granted scopes.
 * This module neither obtains/refreshes a token nor persists one or requests a grant. */
export interface GoogleOwnerGmailAuthorization {
  readonly accessToken: string;
  readonly expiresAt: number;
  readonly grantedScopes: readonly string[];
  readonly binding: AuthenticatedOwnerGmailBinding;
}
export class GoogleOwnerGmailReadUnavailable extends Error {
  readonly code = "GOOGLE_OWNER_GMAIL_READ_UNAVAILABLE";
  constructor() { super("Authenticated business Gmail read is unavailable."); }
}

/** No URLs, methods, mailbox selectors or credentials are accepted from a message.
 * The fetch override is a trusted server/test dependency, never caller-supplied input. */
export function createGoogleOwnerGmailTransport(
  authorization: GoogleOwnerGmailAuthorization,
  request: typeof fetch = fetch,
  clock: () => number = Date.now,
): AuthenticatedOwnerGmailTransport {
  const token = authorization?.accessToken, expires = authorization?.expiresAt;
  const accountId = authorization?.binding?.accountId, mailbox = authorization?.binding?.mailbox;
  const scopes = authorization?.grantedScopes;
  if (typeof token !== "string" || token.length < 16 || token.length > 4096 || !/^[A-Za-z0-9._~+\/-]+={0,2}$/.test(token) ||
      !Number.isFinite(clock()) || !Number.isFinite(expires) || expires <= clock() ||
      typeof accountId !== "string" || !/^[1-9]\d{5,30}$/.test(accountId) || mailbox !== WORKFORCE_MAILBOX ||
      !Array.isArray(scopes) || scopes.length !== 3 || new Set(scopes).size !== 3 ||
      !scopes.includes("openid") || !scopes.includes(READONLY) ||
      !(scopes.includes("email") || scopes.includes("https://www.googleapis.com/auth/userinfo.email"))) {
    throw new GoogleOwnerGmailReadUnavailable();
  }

  async function get(url: string, authenticated: boolean, maxBytes: number): Promise<unknown> {
    try {
      if (!Number.isFinite(clock()) || clock() >= expires) throw Error();
      const response = await request(url, {
        method: "GET", redirect: "error", credentials: "omit", cache: "no-store",
        signal: AbortSignal.timeout(10_000),
        headers: authenticated ? { Accept: "application/json", Authorization: `Bearer ${token}` } : { Accept: "application/json" },
      });
      if (!response.ok || !/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) throw Error();
      const length = response.headers.get("content-length");
      if (length !== null && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw Error();
      if (!response.body) throw Error();
      const reader = response.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read(); if (done) break;
          size += value.byteLength;
          if (size > maxBytes) { await reader.cancel(); throw Error(); }
          chunks.push(value);
        }
      } finally { reader.releaseLock(); }
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
    } catch { throw new GoogleOwnerGmailReadUnavailable(); }
  }
  let discovery: Promise<void> | undefined;
  function discover(): Promise<void> {
    return discovery ??= (async () => {
      const d = await get(DISCOVERY, false, 32_768);
      // Exact allowlist: a changed or poisoned discovery URI cannot receive a token.
      if (!plain(d) || d.issuer !== "https://accounts.google.com" || d.userinfo_endpoint !== USERINFO) throw new GoogleOwnerGmailReadUnavailable();
    })();
  }
  async function getProfile(): Promise<{ id: string; email: typeof WORKFORCE_MAILBOX }> {
    try {
      await discover();
      const identity = await get(USERINFO, true, 32_768);
      if (!plain(identity) || identity.sub !== accountId || identity.email !== mailbox || identity.email_verified !== true) throw Error();
      const profile = await get(GMAIL + "profile", true, 32_768);
      if (!plain(profile) || profile.emailAddress !== mailbox) throw Error();
      return { id: accountId, email: mailbox };
    } catch { throw new GoogleOwnerGmailReadUnavailable(); }
  }

  function mapMessage(message: unknown, id: string): unknown {
    if (!plain(message) || message.id !== id || !Array.isArray(message.labelIds) ||
        !message.labelIds.every((v: unknown) => typeof v === "string") ||
        typeof message.internalDate !== "string" || !/^\d{10,16}$/.test(message.internalDate)) throw Error();
    let count = 0, total = 0;
    function part(p: unknown, depth: number): unknown {
      if (!plain(p) || ++count > 8 || depth > 3 || (p.filename !== undefined && p.filename !== "") ||
          !plain(p.body) || p.body.attachmentId !== undefined || !Number.isSafeInteger(p.body.size) || p.body.size < 0) throw Error();
      if (p.headers !== undefined && (!Array.isArray(p.headers) || p.headers.length > 150 || p.headers.some((h: unknown) =>
          !plain(h) || typeof h.name !== "string" || typeof h.value !== "string" || h.name.length > 256 || h.value.length > 16_384))) throw Error();
      if (p.mimeType === "multipart/alternative") {
        if (!Array.isArray(p.parts) || !p.parts.length || p.body.size !== 0 || (p.body.data !== undefined && p.body.data !== "")) throw Error();
        return { mime_type: p.mimeType, filename: "", headers: p.headers, parts: p.parts.map((child: unknown) => part(child, depth + 1)) };
      }
      if (!["text/plain", "text/html"].includes(p.mimeType) || (p.parts !== undefined && (!Array.isArray(p.parts) || p.parts.length)) ||
          typeof p.body.data !== "string" || p.body.data.length > 133_336 || !/^[A-Za-z0-9_-]*={0,2}$/.test(p.body.data)) throw Error();
      const bytes = Buffer.from(p.body.data, "base64url");
      const canonical = bytes.toString("base64url"), padded = canonical + "=".repeat((4 - canonical.length % 4) % 4);
      if ((p.body.data !== canonical && p.body.data !== padded) || bytes.length !== p.body.size || bytes.length > 100_000 || (total += bytes.length) > 200_000) throw Error();
      const content = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
      return { mime_type: p.mimeType, filename: "", headers: p.headers, body: { content } };
    }
    return { id, label_ids: [...message.labelIds], internal_date: message.internalDate, payload: part(message.payload, 0) };
  }
  return Object.freeze({
    getProfile,
    async readFullMessage(id: string): Promise<unknown> {
      try {
        if (!/^[a-f0-9]{8,64}$/.test(id)) throw Error();
        // Standalone use must verify account ownership before reading a body too.
        await getProfile();
        return mapMessage(await get(GMAIL + `messages/${id}?format=full`, true, MAX_MESSAGE_BYTES), id);
      } catch { throw new GoogleOwnerGmailReadUnavailable(); }
    },
  });
}

/** Optional composition for the existing receipt reader. Missing auth stays unbound.
 * No production caller is changed and no journal reconciliation is started here. */
export function createGoogleOwnerGmailReceiptReader(
  authorization?: GoogleOwnerGmailAuthorization,
  request: typeof fetch = fetch,
  clock: () => number = Date.now,
) {
  if (!authorization) return createWorkforceOwnerInboxReceiptReader();
  try {
    return createWorkforceOwnerInboxReceiptReader(createGoogleOwnerGmailTransport(authorization, request, clock), authorization.binding, clock);
  } catch { return createWorkforceOwnerInboxReceiptReader(); }
}
