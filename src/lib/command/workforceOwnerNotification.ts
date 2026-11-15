import { luxurySignatureHtml, luxurySignatureText } from "../config/luxuryEmailSignature.ts";
import { WORKFORCE_MAILBOX, WORKFORCE_PORTAL, type LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";
import { workforceTaskMetadata, type WorkforceDeliveryMode } from "./workforceContactTaskDelivery.ts";

/** The identical content contract is used for sending and independent receipt comparison. */
export function workforceOwnerNotification(event: LuxuryWorkforceEvent, contactId: string, taskId: string, mode: WorkforceDeliveryMode) {
  if (!["INTERNAL_VALIDATION", "GENUINE_INQUIRY"].includes(mode) || !/^[1-9]\d{0,30}$/.test(contactId) || !/^[1-9]\d{0,30}$/.test(taskId)) throw Error("Notification binding unavailable.");
  const message = `${mode === "GENUINE_INQUIRY" ? "A genuine Luxury Advisory inquiry needs internal owner follow-up. No customer acknowledgement or marketing message was sent by this path." : "This is a controlled Luxury Advisory workforce validation event."}\n${workforceTaskMetadata(event, mode)}\nContact: https://app.hubspot.com/contacts/${WORKFORCE_PORTAL}/contact/${contactId}\nTask: https://app.hubspot.com/tasks/${WORKFORCE_PORTAL}/view/all/task/${taskId}\nProvider acceptance does not establish inbox receipt or human completion.`;
  return Object.freeze({ to: WORKFORCE_MAILBOX,
    subject: `${mode === "GENUINE_INQUIRY" ? "[LUXURY INQUIRY]" : "[INTERNAL VALIDATION]"} Quest Luxo ${event.leadId}`,
    text: `${message}\n\n${luxurySignatureText}`,
    html: `<p>${mode === "GENUINE_INQUIRY" ? "Luxury Advisory inquiry for internal follow-up." : "Controlled Luxury Advisory workforce validation."}</p><pre>${message.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</pre><div>${luxurySignatureHtml}</div>`,
  });
}
