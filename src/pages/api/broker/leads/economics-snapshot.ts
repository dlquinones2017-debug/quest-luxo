import type { APIRoute } from "astro";
import {
  createBrokerAuthJsonResponse,
  validateBrokerConsoleAccess,
} from "../../../../lib/broker/brokerAuth";
import type { BrokerageEconomicsInput } from "../../../../lib/brokerage/brokerageEconomics";
import {
  BrokerageEconomicsSnapshotValidationError,
} from "../../../../lib/brokerage/brokerageEconomicsSnapshot";
import { addLeadSubmissionEconomicsSnapshot } from "../../../../lib/leads/leadStorage";

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
      error: "Method not allowed. Save economics snapshots with POST.",
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
  const economicsInput = body.economicsInput;
  const brokerNote = body.brokerNote;

  if (!id || !isRecord(economicsInput)) {
    return jsonResponse(
      {
        success: false,
        error: "A valid lead and economics assumptions are required.",
      },
      400
    );
  }

  if (
    brokerNote !== undefined &&
    brokerNote !== null &&
    typeof brokerNote !== "string"
  ) {
    return jsonResponse(
      {
        success: false,
        error: "Broker note must be plain text.",
      },
      400
    );
  }

  let updatedLead;

  try {
    updatedLead = await addLeadSubmissionEconomicsSnapshot(
      id,
      economicsInput as unknown as BrokerageEconomicsInput,
      brokerNote
    );
  } catch (error) {
    if (error instanceof BrokerageEconomicsSnapshotValidationError) {
      return jsonResponse(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }

    console.error("Quest Luxo Economics Snapshot Save Error", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              name: error.name,
              stack: error.stack,
            }
          : error,
    });

    return jsonResponse(
      {
        success: false,
        error: "Unable to save economics snapshot.",
      },
      500
    );
  }

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
