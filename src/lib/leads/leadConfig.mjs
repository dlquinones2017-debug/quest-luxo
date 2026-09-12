import { isAbsolute, resolve } from "node:path";

const value = (env, name) => {
  const candidate = env[name];
  return typeof candidate === "string" && candidate.trim()
    ? candidate.trim()
    : null;
};

export const createLeadConfig = (env = process.env) => {
  const configuredDirectory = value(env, "LEAD_STORAGE_DIRECTORY");
  const storageDirectory = configuredDirectory
    ? isAbsolute(configuredDirectory)
      ? configuredDirectory
      : null
    : resolve(process.cwd(), ".quest-luxo");

  return Object.freeze({
    production: value(env, "NODE_ENV") === "production",
    siteUrl: value(env, "SITE_URL"),
    storageDirectory,
    storageExplicit: Boolean(configuredDirectory && storageDirectory),
    emailApiUrl:
      value(env, "EMAIL_PROVIDER_API_URL") ??
      "https://api.resend.com/emails",
    emailApiKey: value(env, "EMAIL_PROVIDER_API_KEY"),
    emailFrom: value(env, "LEAD_EMAIL_FROM"),
    emailTo: Object.freeze(
      (value(env, "LEAD_EMAIL_TO") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
    contactEmail:
      value(env, "PUBLIC_CONTACT_EMAIL") ?? "contact@questluxo.com",
    abuseHashSecret: value(env, "LEAD_ABUSE_HASH_SECRET"),
  });
};

export const validateProductionLeadConfig = (config) => {
  const issues = [];

  if (!config.production) issues.push("NODE_ENV");
  if (!config.siteUrl) issues.push("SITE_URL");
  if (!config.storageExplicit) issues.push("LEAD_STORAGE_DIRECTORY");
  if (!config.emailApiKey) issues.push("EMAIL_PROVIDER_API_KEY");
  if (!config.emailFrom) issues.push("LEAD_EMAIL_FROM");
  if (config.emailTo.length === 0) issues.push("LEAD_EMAIL_TO");
  if (!config.abuseHashSecret || config.abuseHashSecret.length < 32) {
    issues.push("LEAD_ABUSE_HASH_SECRET");
  }

  try {
    if (config.siteUrl) new URL(config.siteUrl);
    new URL(config.emailApiUrl);
  } catch {
    issues.push("VALID_HTTP_URLS");
  }

  return Object.freeze({
    healthy: issues.length === 0,
    issues: Object.freeze([...new Set(issues)].sort()),
  });
};
