/** Fixed public targets only. No arbitrary URLs, private endpoints, redirects, bodies or credentials. */
export const PUBLIC_WEBSITE_TARGETS = Object.freeze([
  Object.freeze({ division: "LUXURY_ADVISORY", url: "https://questluxo.com/" }),
  Object.freeze({ division: "REALTY", url: "https://realty.questluxo.com/" }),
  Object.freeze({ division: "CAPITAL_ADVISORY", url: "https://capital.questluxo.com/" }),
]);
export const PUBLIC_WEBSITE_INTERVAL_MS = 300_000;
type Reader = (url: string, init: RequestInit) => Promise<Response>;
const classify = (status: number) => status >= 200 && status < 300 ? "RESPONDING" :
  status >= 300 && status < 400 ? "REDIRECT_REVIEW" : status === 401 || status === 403 ? "ACCESS_RESTRICTED" :
  status === 405 ? "HEAD_UNSUPPORTED" : status === 429 ? "RATE_LIMITED" : status === 404 ? "NOT_FOUND" :
  status >= 500 ? "SERVER_ERROR" : "HTTP_REVIEW";

export async function checkPublicWebsites({ reader = fetch as Reader, now = () => new Date(), monotonic = () => performance.now() } = {}) {
  const observedAt = now().toISOString();
  const observations = await Promise.all(PUBLIC_WEBSITE_TARGETS.map(async target => {
    const started = monotonic();
    let state: string, status: number | null = null;
    const signal = AbortSignal.timeout(10_000);
    try {
      const response = await reader(target.url, { method: "HEAD", redirect: "manual", credentials: "omit", cache: "no-store", signal,
        headers: { "User-Agent": "QuestLuxo-WebsiteHealth/1.0" } });
      if (!Number.isInteger(response.status) || response.status < 100 || response.status > 599) throw Error("Invalid HTTP status.");
      status = response.status; state = classify(status);
      // HEAD does not consume source content; discard a body if a nonstandard implementation supplies one.
      await response.body?.cancel();
    } catch (error) {
      const name = error && typeof error === "object" && "name" in error ? error.name : null;
      state = signal.aborted || name === "TimeoutError" || name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
      status = null;
    }
    return Object.freeze({ division: target.division, url: target.url, status, state,
      durationMs: Math.max(0, Math.round(monotonic() - started)) });
  }));
  const responding = observations.filter(o => o.state === "RESPONDING").length;
  return Object.freeze({ schemaVersion: 1, mode: "PUBLIC_READ_ONLY", evidenceClass: "HTTP_HEADERS_ONLY", observedAt,
    status: responding === observations.length ? "RESPONDING" : "ATTENTION", responding, checked: observations.length,
    observations: Object.freeze(observations), assessesContentOrForms: false, businessDataExecutionAllowed: false,
    changesProduction: false, persistsCustomerData: false, sendsMessages: false, writesCRM: false, activatesGmail: false });
}

/** Single flight; stale observations are reported as stale, never silently refreshed by a read. */
export function createPublicWebsiteMonitor(check = () => checkPublicWebsites(), clock = () => performance.now()) {
  let report: Awaited<ReturnType<typeof checkPublicWebsites>> | null = null, completedAt: number | null = null;
  let pending: Promise<Awaited<ReturnType<typeof checkPublicWebsites>>> | null = null;
  let failed = false;
  return {
    async run() {
      if (pending) return pending;
      pending = (async () => {
        try { const next = await check(); report = next; completedAt = clock(); failed = false; return next; }
        catch { failed = true; throw Error("Public website assessment unavailable."); }
      })().finally(() => { pending = null; });
      return pending;
    },
    snapshot() {
      return Object.freeze({ state: failed ? "CHECK_FAILED" : completedAt === null ? "NOT_CHECKED" :
        clock() - completedAt > PUBLIC_WEBSITE_INTERVAL_MS + 30_000 ? "STALE" : "CURRENT", report });
    },
  };
}
