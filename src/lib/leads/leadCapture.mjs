export const LEAD_FIELDS = Object.freeze([
  "name",
  "email",
  "phone",
  "desiredWatch",
  "budget",
  "timeline",
  "message",
  "intent",
  "brand",
  "collection",
  "reference",
  "source",
]);

const FIELD_LIMITS = Object.freeze({
  name: 120,
  email: 254,
  phone: 40,
  desiredWatch: 240,
  budget: 80,
  timeline: 80,
  message: 2_000,
  intent: 80,
  brand: 120,
  collection: 160,
  reference: 120,
  source: 80,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const clean = (value, limit) =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
        .trim()
        .slice(0, limit)
    : "";

export const createLeadPayload = (input = {}) =>
  Object.freeze(
    Object.fromEntries(
      LEAD_FIELDS.map((field) => [
        field,
        clean(input[field], FIELD_LIMITS[field]),
      ])
    )
  );

export const validateLeadPayload = (payload) => {
  const issues = [];

  if (payload.name.length < 2) issues.push("name");
  if (!EMAIL_PATTERN.test(payload.email)) issues.push("email");
  if (!payload.desiredWatch && !payload.message) issues.push("request");

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze(issues),
  });
};
