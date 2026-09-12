import type { APIRoute } from "astro";
import {
  createBrokerAuthJsonResponse,
  validateBrokerConsoleAccess,
} from "../../../../lib/broker/brokerAuth";
import { updateLeadSubmissionNotes } from "../../../../lib/leads/leadStorage";

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
      error: "Method not allowed. Update lead notes with POST.",
    },
    405,
    { Allow: "POST" }
  );

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
  const notes = body.notes;

  if (!id || typeof notes !== "string") {
    return jsonResponse(
      {
        success: false,
        error: "A valid lead id and notes string are required.",
      },
      400
    );
  }

  const updatedLead = await updateLeadSubmissionNotes(id, notes);

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
