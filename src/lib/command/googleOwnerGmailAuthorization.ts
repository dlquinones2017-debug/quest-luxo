import { WORKFORCE_MAILBOX } from "./luxuryWorkforceEvent.ts";
import type { GoogleOwnerGmailAuthorization } from "./googleOwnerGmailTransport.ts";

const TOKEN = "https://oauth2.googleapis.com/token";
const USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";
const EMAIL = "https://www.googleapis.com/auth/userinfo.email";
const READONLY = "https://www.googleapis.com/auth/gmail.readonly";
const SKEW_MS = 60_000;
const MAX_BYTES = 32_768;
const plain = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
const printable = (value: unknown, min: number, max: number): value is string =>
  typeof value === "string" && value.length >= min && value.length <= max && /^[\x21-\x7e]+$/.test(value);

/** A separately approved server-owned credential, never request JSON, a browser
 * response, or a credential exported from the operator's ChatGPT connection.
 * Its original grant and stable Google subject must already be verified. */
export interface GoogleOwnerGmailRefreshCredential {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly refreshToken: string;
  readonly grantedScopes: readonly string[];
  readonly binding: GoogleOwnerGmailAuthorization["binding"];
}

export class GoogleOwnerGmailAuthorizationUnavailable extends Error {
  readonly code = "GOOGLE_OWNER_GMAIL_AUTHORIZATION_UNAVAILABLE";
  constructor() { super("Business Gmail authorization is unavailable."); }
}

function scopes(value: unknown): readonly string[] {
  const list = typeof value === "string" ? value.trim().split(/\s+/) : value;
  if (!Array.isArray(list) || list.length !== 3 || list.some(item => typeof item !== "string")) throw Error();
  const normalized = list.map(item => item === "email" ? EMAIL : item);
  if (new Set(normalized).size !== 3 || !normalized.includes("openid") ||
      !normalized.includes(EMAIL) || !normalized.includes(READONLY)) throw Error();
  return Object.freeze([...normalized].sort());
}

/** Optional, manually composed token lifecycle. Construction performs no IO.
 * No environment lookup, file access, consent flow, scheduler, mailbox call,
 * credential write, runtime caller or startup hook is supplied here. */
export function createGoogleOwnerGmailAuthorizationProvider(
  credential?: GoogleOwnerGmailRefreshCredential,
  request: typeof fetch = fetch,
  clock: () => number = Date.now,
) {
  let clientId: string | undefined, clientSecret: string | undefined, refreshToken: string | undefined;
  let accountId = "", mailbox: typeof WORKFORCE_MAILBOX = WORKFORCE_MAILBOX;
  let grantScopes: readonly string[] = [];
  try {
    if (credential !== undefined) {
      if (!plain(credential) || typeof credential.clientId !== "string" ||
          !/^\d{5,30}-[a-z0-9]{10,128}\.apps\.googleusercontent\.com$/.test(credential.clientId) ||
          !printable(credential.clientSecret, 1, 1024) || !printable(credential.refreshToken, 16, 8192) ||
          !Array.isArray(credential.grantedScopes) ||
          !plain(credential.binding) || typeof credential.binding.accountId !== "string" ||
          !/^[1-9]\d{5,30}$/.test(credential.binding.accountId) || credential.binding.mailbox !== WORKFORCE_MAILBOX) throw Error();
      grantScopes = scopes(credential.grantedScopes);
      clientId = credential.clientId;
      clientSecret = credential.clientSecret;
      refreshToken = credential.refreshToken;
      accountId = credential.binding.accountId;
    }
  } catch { throw new GoogleOwnerGmailAuthorizationUnavailable(); }

  let cached: GoogleOwnerGmailAuthorization | undefined;
  let inFlight: Promise<GoogleOwnerGmailAuthorization> | undefined;
  let closed = false, failed = false, previousTime = -1;
  const shutdown = new AbortController();

  function now(): number {
    const value = clock();
    if (!Number.isSafeInteger(value) || value < 0 || value < previousTime) throw Error();
    previousTime = value;
    return value;
  }
  function requireOpen(): void {
    if (closed || failed || !clientId || !clientSecret || !refreshToken) throw Error();
  }

  async function json(url: typeof TOKEN | typeof USERINFO, options: RequestInit): Promise<Record<string, unknown>> {
    let response: Response | undefined;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      requireOpen();
      response = await request(url, {
        ...options, redirect: "error", credentials: "omit", cache: "no-store",
        signal: AbortSignal.any([shutdown.signal, AbortSignal.timeout(10_000)]),
      });
      requireOpen();
      if (response.status !== 200 || !/^application\/json(?:\s*;|$)/i.test(response.headers.get("content-type") ?? "")) throw Error();
      const length = response.headers.get("content-length");
      if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BYTES)) throw Error();
      if (!response.body) throw Error();
      reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        requireOpen();
        if (done) break;
        if ((size += value.byteLength) > MAX_BYTES) throw Error();
        chunks.push(value);
      }
      const value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
      if (!plain(value)) throw Error();
      return value;
    } finally {
      // Cancel unread bodies on denial/overflow as well as releasing reader locks.
      if (reader) {
        try { await reader.cancel(); } catch { /* no provider detail crosses the boundary */ }
        reader.releaseLock();
      } else if (response?.body) {
        try { await response.body.cancel(); } catch { /* already closed or aborted */ }
      }
    }
  }

  async function refresh(): Promise<GoogleOwnerGmailAuthorization> {
    requireOpen();
    const started = now();
    const result = await json(TOKEN, {
      method: "POST", headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId!, client_secret: clientSecret!, refresh_token: refreshToken!, grant_type: "refresh_token",
      }).toString(),
    });
    if (!printable(result.access_token, 16, 4096) || !/^[A-Za-z0-9._~+\/-]+={0,2}$/.test(result.access_token) ||
        typeof result.token_type !== "string" || result.token_type.toLowerCase() !== "bearer" ||
        !Number.isSafeInteger(result.expires_in) || (result.expires_in as number) <= 60 ||
        (result.expires_in as number) > 86_400) throw Error();
    // Require explicit scope evidence on every refresh; never infer a missing field.
    if (typeof result.scope !== "string") throw Error();
    const grantedScopes = scopes(result.scope);
    if (grantedScopes.some((scope, index) => scope !== grantScopes[index])) throw Error();
    // A rotated persistent secret needs a separately reviewed durable custody write.
    if (result.refresh_token !== undefined && result.refresh_token !== refreshToken) throw Error();
    const expiresAt = started + (result.expires_in as number) * 1000;
    if (now() + SKEW_MS >= expiresAt) throw Error();
    const identity = await json(USERINFO, {
      method: "GET", headers: { Accept: "application/json", Authorization: `Bearer ${result.access_token}` },
    });
    if (identity.sub !== accountId || identity.email !== mailbox || identity.email_verified !== true ||
        now() + SKEW_MS >= expiresAt) throw Error();
    requireOpen();
    cached = Object.freeze({
      accessToken: result.access_token, expiresAt, grantedScopes,
      binding: Object.freeze({ accountId, mailbox }),
    });
    return cached;
  }

  return Object.freeze({
    async getAuthorization(): Promise<GoogleOwnerGmailAuthorization> {
      try {
        requireOpen();
        if (cached && now() + SKEW_MS < cached.expiresAt) return cached;
        if (!inFlight) {
          cached = undefined;
          inFlight = refresh().catch(() => {
            // Fail closed until the runtime owner reviews and reconstructs the provider.
            failed = true;
            cached = undefined;
            throw new GoogleOwnerGmailAuthorizationUnavailable();
          }).finally(() => { inFlight = undefined; });
        }
        return await inFlight;
      } catch {
        failed = true;
        cached = undefined;
        throw new GoogleOwnerGmailAuthorizationUnavailable();
      }
    },
    close(): void {
      closed = true;
      cached = undefined;
      shutdown.abort();
      clientId = clientSecret = refreshToken = undefined;
    },
  });
}
