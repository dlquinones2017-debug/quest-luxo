import type { APIRoute } from "astro";
import {
  createBrokerAuthJsonResponse,
  validateBrokerConsoleAccess,
} from "../../../../lib/broker/brokerAuth";
import { updateLeadSubmissionTags } from "../../../../lib/leads/leadStorage.ts";

export const prerender = false;

const jsonResponse = (
  body: Record<string, unknown>,
  status = 200,
  headers: HeadersInit = {}
): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const methodNotAllowed = (): Response =>
  jsonResponse(
    {
      success: false,
      error: "Method not allowed. Update lead tags with POST.",
    },
    405,
    { Allow: "POST" }
  );

const normalizeTagsInput = (tags: unknown): readonly string[] | null => {
  if (!Array.isArray(tags)) return null;

  const seenTags = new Set<string>();
  const normalizedTags: string[] = [];

  for (const tag of tags) {
    if (typeof tag !== "string") return null;

    const normalizedTag = tag.trim();
    const normalizedKey = normalizedTag.toLowerCase();

    if (!normalizedTag || seenTags.has(normalizedKey)) continue;

    seenTags.add(normalizedKey);
    normalizedTags.push(normalizedTag);
  }

  return normalizedTags;
};

export const POST: APIRoute = async ({ request }) => {
  const brokerAuth = validateBrokerConsoleAccess(request);

  if (!brokerAuth.allowed) {
    return createBrokerAuthJsonResponse(brokerAuth);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      400
    );
  }

  if (!isRecord(body)) {
    return jsonResponse(
      {
        success: false,
        error: "Request body must be an object.",
      },
      400
    );
  }

  const id = typeof body.id === "string" ? body.id.trim() : "";
  const tags = normalizeTagsInput(body.tags);

  if (!id || tags === null) {
    return jsonResponse(
      {
        success: false,
        error: "A valid lead id and tags array are required.",
      },
      400
    );
  }

  const updatedLead = await updateLeadSubmissionTags(id, tags);

  if (!updatedLead) {
    return jsonResponse(
      {
        success: false,
        error: "Lead not found.",
      },
      404
    );
  }

  return jsonResponse({
    success: true,
    lead: updatedLead,
  });
};

export const ALL: APIRoute = ({ request }) => {
  const brokerAuth = validateBrokerConsoleAccess(request);

  if (!brokerAuth.allowed) {
    return createBrokerAuthJsonResponse(brokerAuth);
  }

  return methodNotAllowed();
};
