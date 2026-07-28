import { createHmac } from "node:crypto";

export const MAX_LEAD_BODY_BYTES = 16 * 1024;
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RATE_LIMIT_ATTEMPTS = 5;

const attempts = new Map();

const compactAttempts = (now) => {
  if (attempts.size < 2_000) return;
  for (const [key, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
};

export const clientAddress = (request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
};

export const hashClientAddress = (address, secret) =>
  createHmac("sha256", secret || "development-only")
    .update(address)
    .digest("hex");

export const consumeLeadAttempt = (
  key,
  now = Date.now(),
  limit = RATE_LIMIT_ATTEMPTS,
  windowMs = RATE_LIMIT_WINDOW_MS
) => {
  compactAttempts(now);
  const existing = attempts.get(key);
  const entry =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + windowMs };

  entry.count += 1;
  attempts.set(key, entry);

  return Object.freeze({
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)),
  });
};

export const verifyLeadRequestOrigin = (request, siteUrl, production) => {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  const expectedOrigin = siteUrl
    ? new URL(siteUrl).origin
    : new URL(request.url).origin;

  if (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite)) {
    return false;
  }

  if (!origin) return !production;
  return origin === expectedOrigin || origin === new URL(request.url).origin;
};

export const resetLeadAttemptsForTests = () => attempts.clear();
