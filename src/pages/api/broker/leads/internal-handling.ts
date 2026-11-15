import type { APIRoute } from "astro";
import { createLeadInternalHandlingEndpoint } from "../../../../lib/broker/leadInternalHandlingEndpoint.ts";
export const prerender = false;
const handle = createLeadInternalHandlingEndpoint();
export const POST: APIRoute = ({ request }) => handle(request);
export const ALL: APIRoute = ({ request }) => handle(request);
