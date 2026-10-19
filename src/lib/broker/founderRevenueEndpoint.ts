import { validateBrokerConsoleAccess, type BrokerConsoleAuthResult } from "./brokerAuth.ts";
import { founderRevenueReadModel, type FounderRevenueReadModel } from "../command/founderRevenueReadModel.ts";

interface ReadDependencies {
  authorize(request: Request): BrokerConsoleAuthResult;
  read(): Promise<FounderRevenueReadModel>;
}
const defaults: ReadDependencies = Object.freeze({ authorize: validateBrokerConsoleAccess, read: founderRevenueReadModel });
export async function founderRevenueResponse(request: Request, dependencies: ReadDependencies = defaults): Promise<Response> {
  const respond = (body: unknown, status: number, extra: Record<string, string> = {}) => new Response(
    request.method === "HEAD" ? null : JSON.stringify(body).replace(/[<>&]/g, character => ({ "<": "\\u003c", ">": "\\u003e", "&": "\\u0026" }[character]!)),
    { status, headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store", "Vary": "x-broker-console-key", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff", ...extra } },
  );
  if (request.method !== "GET" && request.method !== "HEAD") return respond({ success: false, error: "Read-only endpoint." }, 405, { Allow: "GET, HEAD" });
  const auth = dependencies.authorize(request);
  if (!auth.allowed) return respond({ success: false, error: auth.reason === "invalid-key" ? "Invalid Broker Console access key." : "Broker Console access key required." }, 401);
  try {
    return respond(await dependencies.read(), 200);
  } catch {
    // Never log source rows, exception messages, paths or access credentials.
    console.error("Quest Luxo Founder Revenue Read Error");
    return respond({ success: false, error: "Unable to read founder revenue state." }, 500);
  }
}
