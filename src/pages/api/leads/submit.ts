import type { APIRoute } from "astro";
import {
  createLeadCapturePayload,
  hasRequiredLeadContactFields,
  type LeadCapturePayloadInput,
} from "../../../lib/leads/leadCapture.ts";
import { processLeadSubmission } from "../../../lib/leads/leadSubmission.ts";

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

const getPayloadField = (
  input: Record<string, unknown>,
  fieldName: keyof LeadCapturePayloadInput
): string | null => {
  const value = input[fieldName];

  return typeof value === "string" ? value : null;
};

const createPayloadInput = (body: unknown): LeadCapturePayloadInput => {
  if (!isRecord(body)) return {};

  return {
    name: getPayloadField(body, "name"),
    email: getPayloadField(body, "email"),
    phone: getPayloadField(body, "phone"),
    intent: getPayloadField(body, "intent"),
    brand: getPayloadField(body, "brand"),
    collection: getPayloadField(body, "collection"),
    reference: getPayloadField(body, "reference"),
    desiredWatch: getPayloadField(body, "desiredWatch"),
    budget: getPayloadField(body, "budget"),
    timeline: getPayloadField(body, "timeline"),
    message: getPayloadField(body, "message"),
    source: getPayloadField(body, "source"),
    createdAt: getPayloadField(body, "createdAt"),
  };
};

const methodNotAllowed = (): Response =>
  jsonResponse(
    {
      success: false,
      error: "Method not allowed. Submit leads with POST.",
    },
    405,
    { Allow: "POST" }
  );

export const POST: APIRoute = async ({ request }) => {
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

  const payload = createLeadCapturePayload(createPayloadInput(body));

  if (!hasRequiredLeadContactFields(payload)) {
    return jsonResponse(
      {
        success: false,
        error: "Full name and a valid email are required.",
      },
      400
    );
  }

  const submission = await processLeadSubmission(payload);

  if (!submission.success) {
    console.error("Quest Luxo Lead Storage Error", {
      failureStage: submission.failureStage,
      error:
        submission.error instanceof Error
          ? {
              message: submission.error.message,
              name: submission.error.name,
              stack: submission.error.stack,
            }
          : submission.error,
    });

    return jsonResponse(
      {
        success: false,
        error: "Unable to save your request. Please try again.",
      },
      503
    );
  }

  const emailDelivery = submission.delivery;

  const notificationLog = {
    createdAt: payload.createdAt,
    source: payload.source,
    intent: payload.intent,
    brand: payload.brand,
    collection: payload.collection,
    reference: payload.reference,
    deliveryStatus: emailDelivery.status,
    configured: emailDelivery.configured,
    reason: emailDelivery.reason,
    providerStatus: emailDelivery.providerStatus,
    deliveryRecorded: submission.deliveryRecorded,
  };

  if (!submission.deliveryRecorded) {
    console.error("Quest Luxo Lead Delivery Status Persistence Failed", {
      ...notificationLog,
      leadId: submission.storage.id,
      error:
        submission.deliveryRecordError instanceof Error
          ? {
              message: submission.deliveryRecordError.message,
              name: submission.deliveryRecordError.name,
            }
          : submission.deliveryRecordError,
    });
  }

  if (emailDelivery.status === "failed") {
    console.error("Quest Luxo Lead Notification Failed", notificationLog);
  } else if (emailDelivery.status === "skipped") {
    console.warn("Quest Luxo Lead Notification Skipped", notificationLog);
  } else {
    console.log("Quest Luxo Lead Notification Sent", notificationLog);
  }

  return jsonResponse({ success: true });
};

export const ALL: APIRoute = () => methodNotAllowed();
