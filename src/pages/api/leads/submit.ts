import type { APIRoute } from "astro";
import {
  MAX_LEAD_BODY_BYTES,
  clientAddress,
  consumeLeadAttempt,
  hashClientAddress,
  verifyLeadRequestOrigin,
} from "../../../lib/leads/leadAbuseProtection.mjs";
import {
  createLeadPayload,
  validateLeadPayload,
} from "../../../lib/leads/leadCapture.mjs";
import {
  createLeadConfig,
  validateProductionLeadConfig,
} from "../../../lib/leads/leadConfig.mjs";
import { processLeadSubmission } from "../../../lib/leads/leadSubmission.mjs";

export const prerender = false;

const json = (
  body: Record<string, unknown>,
  status = 200,
  headers: HeadersInit = {}
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });

export const POST: APIRoute = async ({ request }) => {
  const config = createLeadConfig();
  const readiness = config.production
    ? validateProductionLeadConfig(config)
    : { healthy: true, issues: [] };

  if (!readiness.healthy) {
    console.error("Lead intake is unavailable: production configuration failed.", {
      issues: readiness.issues,
    });
    return json({ success: false, error: "Contact service unavailable." }, 503);
  }

  if (!verifyLeadRequestOrigin(request, config.siteUrl, config.production)) {
    return json({ success: false, error: "Request origin rejected." }, 403);
  }

  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return json({ success: false, error: "JSON content type required." }, 415);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_LEAD_BODY_BYTES) {
    return json({ success: false, error: "Request is too large." }, 413);
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > MAX_LEAD_BODY_BYTES) {
    return json({ success: false, error: "Request is too large." }, 413);
  }

  let input: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawBody);
    input =
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
  } catch {
    return json({ success: false, error: "Invalid JSON body." }, 400);
  }

  if (typeof input.website === "string" && input.website.trim()) {
    return json({ success: true });
  }

  const startedAt = Number(input.formStartedAt);
  const elapsed = Date.now() - startedAt;
  if (!Number.isFinite(startedAt) || elapsed < 1_500 || elapsed > 86_400_000) {
    return json({ success: false, error: "Please refresh and try again." }, 400);
  }

  const clientKey = hashClientAddress(
    clientAddress(request),
    config.abuseHashSecret
  );
  const rate = consumeLeadAttempt(clientKey);
  if (!rate.allowed) {
    return json(
      { success: false, error: "Too many requests. Please try again later." },
      429,
      { "Retry-After": String(rate.retryAfterSeconds) }
    );
  }

  const payload = createLeadPayload(input);
  const validation = validateLeadPayload(payload);
  if (!validation.valid) {
    return json(
      {
        success: false,
        error: "Name, valid email, and inquiry details are required.",
      },
      400
    );
  }

  try {
    const result = await processLeadSubmission(payload, clientKey, config);
    return json({
      success: result.success,
      message:
        "Thank you. A Quest Luxo advisor will review your inquiry and respond within one business day.",
    });
  } catch (error) {
    console.error("Quest Luxo lead persistence failed.", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return json(
      {
        success: false,
        error:
          "We could not securely save your inquiry. Please email contact@questluxo.com.",
      },
      503
    );
  }
};

export const ALL: APIRoute = () =>
  json(
    { success: false, error: "Method not allowed." },
    405,
    { Allow: "POST" }
  );
