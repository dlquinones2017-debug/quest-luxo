import type { APIRoute } from "astro";
import { createLeadConfig } from "../../lib/leads/leadConfig.mjs";

export const prerender = false;

export const GET: APIRoute = () => {
  const config = createLeadConfig();
  const healthy =
    !config.production ||
    Boolean(
      config.siteUrl &&
        config.storageExplicit &&
        config.emailApiKey &&
        config.emailFrom &&
        config.emailTo.length &&
        config.abuseHashSecret
    );

  return new Response(
    JSON.stringify({
      status: healthy ? "ok" : "unavailable",
      service: "quest-luxo",
    }),
    {
      status: healthy ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    }
  );
};
