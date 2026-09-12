import type { APIRoute } from "astro";

import { createHealthPayload } from "../../lib/config/healthResponse.ts";
import { verifyProductionReadiness } from "../../lib/config/productionReadiness.ts";

export const prerender = false;

export const GET: APIRoute = async () => {
  const readiness = await verifyProductionReadiness();
  const payload = createHealthPayload(readiness);

  return new Response(JSON.stringify(payload), {
    status: readiness.healthy ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};

