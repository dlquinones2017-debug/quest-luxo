import type { APIRoute } from "astro";
import { founderRevenueResponse } from "../../../lib/broker/founderRevenueEndpoint.ts";

export const prerender = false;
export const GET: APIRoute = ({ request }) => founderRevenueResponse(request);
export const HEAD: APIRoute = GET;
export const ALL: APIRoute = GET;
