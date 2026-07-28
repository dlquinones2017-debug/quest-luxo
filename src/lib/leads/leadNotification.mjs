const safeText = (value) => value || "Not provided";

export const sendLeadNotification = async (
  record,
  config,
  fetchImpl = fetch
) => {
  const response = await fetchImpl(config.emailApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.emailApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.emailFrom,
      to: config.emailTo,
      reply_to: record.email,
      subject: `Quest Luxo inquiry: ${record.desiredWatch || record.collection || "Private sourcing"}`,
      text: [
        `Lead ID: ${record.id}`,
        `Name: ${record.name}`,
        `Email: ${record.email}`,
        `Phone: ${safeText(record.phone)}`,
        `Desired watch: ${safeText(record.desiredWatch)}`,
        `Budget: ${safeText(record.budget)}`,
        `Timeline: ${safeText(record.timeline)}`,
        `Brand: ${safeText(record.brand)}`,
        `Collection: ${safeText(record.collection)}`,
        `Reference: ${safeText(record.reference)}`,
        `Message: ${safeText(record.message)}`,
      ].join("\n"),
    }),
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Lead notification provider returned ${response.status}.`);
  }

  return Object.freeze({ delivered: true, providerStatus: response.status });
};
