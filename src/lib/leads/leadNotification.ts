import type { LeadCapturePayload } from "./leadCapture.ts";

const FALLBACK_VALUE = "Not provided";

const leadNotificationFields = [
  ["Lead name", "name"],
  ["Email", "email"],
  ["Phone", "phone"],
  ["Intent", "intent"],
  ["Brand", "brand"],
  ["Collection", "collection"],
  ["Reference", "reference"],
  ["Desired Watch", "desiredWatch"],
  ["Budget", "budget"],
  ["Timeline", "timeline"],
  ["Message", "message"],
  ["Source", "source"],
  ["Created At", "createdAt"],
] as const;

type LeadNotificationFieldKey = (typeof leadNotificationFields)[number][1];

const formatValue = (value?: string | null): string => {
  const normalized = value?.trim();

  return normalized ? normalized : FALLBACK_VALUE;
};

const formatIntent = (intent: LeadCapturePayload["intent"]): string => {
  if (!intent) return FALLBACK_VALUE;

  return intent
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getFieldValue = (
  payload: LeadCapturePayload,
  key: LeadNotificationFieldKey
): string => {
  if (key === "intent") return formatIntent(payload.intent);

  return formatValue(payload[key]);
};

const getWatchContext = (payload: LeadCapturePayload): string => {
  const desiredWatch = formatValue(payload.desiredWatch);

  if (desiredWatch !== FALLBACK_VALUE) return desiredWatch;

  const watchParts = [
    payload.brand,
    payload.collection,
    payload.reference ? `Ref. ${payload.reference}` : null,
  ]
    .map((part) => part?.trim())
    .filter(Boolean);

  return watchParts.length > 0 ? watchParts.join(" ") : FALLBACK_VALUE;
};

const formatSubjectSegment = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Readonly<Record<string, string>> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] ?? character;
  });

const escapeHtmlWithLineBreaks = (value: string): string =>
  escapeHtml(value).replace(/\r?\n/g, "<br />");

export function createLeadNotificationSubject(
  payload: LeadCapturePayload
): string {
  const leadName = formatValue(payload.name);
  const intent = formatIntent(payload.intent);
  const watchContext = getWatchContext(payload);
  const leadSegment =
    leadName === FALLBACK_VALUE ? "New brokerage lead" : leadName;
  const contextSegments = [intent, watchContext].filter(
    (segment) => segment !== FALLBACK_VALUE
  );

  return contextSegments.length > 0
    ? formatSubjectSegment(
        `Quest Luxo Lead: ${leadSegment} - ${contextSegments.join(" - ")}`
      )
    : formatSubjectSegment(`Quest Luxo Lead: ${leadSegment}`);
}

export function createLeadNotificationText(
  payload: LeadCapturePayload
): string {
  return [
    createLeadNotificationSubject(payload),
    "",
    ...leadNotificationFields.map(
      ([label, key]) => `${label}: ${getFieldValue(payload, key)}`
    ),
  ].join("\n");
}

export function createLeadNotificationHtml(
  payload: LeadCapturePayload
): string {
  const subject = escapeHtml(createLeadNotificationSubject(payload));
  const rows = leadNotificationFields
    .map(([label, key]) => {
      const safeLabel = escapeHtml(label);
      const safeValue = escapeHtmlWithLineBreaks(getFieldValue(payload, key));

      return `<tr><th scope="row" style="width:34%; padding:12px 0; border-bottom:1px solid #e5dac7; color:#5c4630; font-size:13px; line-height:1.5; text-align:left; vertical-align:top;">${safeLabel}</th><td style="padding:12px 0 12px 18px; border-bottom:1px solid #e5dac7; color:#1f1a17; font-size:14px; line-height:1.5; vertical-align:top;">${safeValue}</td></tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${subject}</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f2ec; color:#1f1a17; font-family:Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f2ec; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#fffaf2; border:1px solid #d8c9b2; border-radius:8px; overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 18px; border-bottom:1px solid #d8c9b2;">
                <p style="margin:0 0 8px; color:#8a6a3f; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Quest Luxo Lead</p>
                <h1 style="margin:0; color:#1f1a17; font-size:24px; line-height:1.25;">${subject}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px;">
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  ${rows}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
