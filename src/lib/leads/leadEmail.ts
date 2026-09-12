import type { LeadCapturePayload } from "./leadCapture.ts";
import {
  getQuestLuxoServerConfig,
  validateQuestLuxoServerConfig,
} from "../config/questLuxoConfig.ts";
import {
  createLeadNotificationHtml,
  createLeadNotificationSubject,
  createLeadNotificationText,
} from "./leadNotification.ts";

type LeadEmailDeliveryStatus = "skipped" | "sent" | "failed";

export interface LeadEmailDeliveryResult {
  readonly status: LeadEmailDeliveryStatus;
  readonly configured: boolean;
  readonly reason?: string;
  readonly providerStatus?: number;
  readonly providerResponse?: string;
}

interface LeadEmailConfig {
  readonly to: readonly string[];
  readonly from: string;
  readonly apiKey: string;
  readonly providerApiUrl: string;
}

const LEAD_EMAIL_REQUEST_TIMEOUT_MS = 8_000;

const createSkippedResult = (missingEnvVars: readonly string[]) => {
  const reason = `Missing email configuration: ${missingEnvVars.join(", ")}`;

  console.log("Quest Luxo Lead Email Delivery Skipped", {
    reason,
    missingEnvVars,
  });

  return Object.freeze({
    status: "skipped",
    configured: false,
    reason,
  } satisfies LeadEmailDeliveryResult);
};

const getLeadEmailConfig = (): LeadEmailConfig | LeadEmailDeliveryResult => {
  const serverConfig = getQuestLuxoServerConfig();
  const validation = validateQuestLuxoServerConfig(serverConfig);
  const missingEnvVars = validation.items
    .filter(
      (item) =>
        item.scope === "lead-email" &&
        item.requirement === "required-for-production" &&
        item.status === "missing"
    )
    .map((item) => item.name);

  if (
    missingEnvVars.length > 0 ||
    !serverConfig.leadEmail.from ||
    !serverConfig.leadEmail.providerApiKey
  ) {
    return createSkippedResult(missingEnvVars);
  }

  return Object.freeze({
    to: serverConfig.leadEmail.to,
    from: serverConfig.leadEmail.from,
    apiKey: serverConfig.leadEmail.providerApiKey,
    providerApiUrl: serverConfig.leadEmail.providerApiUrl,
  });
};

export async function sendLeadNotificationEmail(
  payload: LeadCapturePayload
): Promise<LeadEmailDeliveryResult> {
  let configured = false;

  try {
    const config = getLeadEmailConfig();

    if ("status" in config) return config;

    configured = true;

    const emailPayload = {
      from: config.from,
      to: config.to,
      subject: createLeadNotificationSubject(payload),
      text: createLeadNotificationText(payload),
      html: createLeadNotificationHtml(payload),
    };
    const response = await fetch(config.providerApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
      signal: AbortSignal.timeout(LEAD_EMAIL_REQUEST_TIMEOUT_MS),
    });
    const providerResponse = await response.text();

    if (!response.ok) {
      return Object.freeze({
        status: "failed",
        configured: true,
        reason: "Email provider returned an error response.",
        providerStatus: response.status,
        providerResponse,
      });
    }

    return Object.freeze({
      status: "sent",
      configured: true,
      providerStatus: response.status,
      providerResponse,
    });
  } catch (error) {
    return Object.freeze({
      status: "failed",
      configured,
      reason:
        error instanceof Error && error.name === "TimeoutError"
          ? "Email provider request timed out."
          : error instanceof Error
          ? error.message
          : "Email provider request failed.",
    });
  }
}
