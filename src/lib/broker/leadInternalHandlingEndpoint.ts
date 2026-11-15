import { validateBrokerConsoleAccess, createBrokerAuthJsonResponse } from "./brokerAuth.ts";
import { getQuestLuxoServerConfig, type QuestLuxoServerConfig } from "../config/questLuxoConfig.ts";
import { createJsonlLeadStorageAdapter } from "../leads/leadStorage.ts";
import { createInternalHandlingReview, type InternalHandlingDecision } from "../leads/leadInternalHandlingReview.ts";
import { createLuxuryWorkforceEvent } from "../command/luxuryWorkforceEvent.ts";
import { createExistingLuxuryGenuineSource } from "../command/luxuryGenuineInquirySource.ts";
import { isGenuineLuxuryCanonicalEvent } from "../command/luxuryGenuineInquiryRuntime.ts";

type Storage = ReturnType<typeof createJsonlLeadStorageAdapter>;
interface Dependencies {
  readonly config?: () => QuestLuxoServerConfig;
  readonly storage?: () => Storage;
  readonly key?: () => Buffer;
  readonly clock?: () => number;
}
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status,
  headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const keyFromEnvironment = () => {
  const value = process.env.WORKFORCE_JOURNAL_KEY_HEX;
  if (!/^[a-f0-9]{64}$/i.test(value ?? "")) throw Error();
  return Buffer.from(value!, "hex");
};

/** Same protected operator surface and same canonical store; no provider call.
 * A review is an explicit authenticated owner decision, not machine verification
 * of a source reference. No positive decision is made by installing this route.
 */
export function createLeadInternalHandlingEndpoint(deps: Dependencies = {}) {
  return async (request: Request): Promise<Response> => {
    const config = (deps.config ?? getQuestLuxoServerConfig)();
    const auth = validateBrokerConsoleAccess(request, config);
    // Existing development auth-disabled mode must never mint policy decisions.
    if (!auth.allowed || !auth.configured || !auth.provided || auth.reason !== "authorized") return createBrokerAuthJsonResponse({ ...auth, allowed: false });
    if (request.method !== "POST") return json({ success: false, error: "Use POST for an explicit internal-handling review." }, 405);
    if (config.leadStorage.providerStatus !== "configured" || config.leadStorage.directoryStatus !== "configured") return json({ success: false, error: "Explicit canonical storage required." }, 503);
    let body: any;
    try {
      const text = await request.text();
      if (Buffer.byteLength(text) > 8192) return json({ success: false, error: "Review request too large." }, 413);
      body = JSON.parse(text);
    } catch { return json({ success: false, error: "Invalid review request." }, 400); }
    const allowed = ["id", "expectedFingerprint", "expectedPreviousReviewId", "decision", "suppression", "sourceRefs", "sourceReviewAttestation"];
    if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some(k => !allowed.includes(k)) ||
        typeof body.id !== "string" || !/^lead_[a-z0-9_-]{1,123}$/i.test(body.id) ||
        !/^[a-f0-9]{64}$/.test(body.expectedFingerprint ?? "") ||
        body.expectedPreviousReviewId !== null && (typeof body.expectedPreviousReviewId !== "string" || !/^review_[a-f0-9-]{36}$/.test(body.expectedPreviousReviewId))) {
      return json({ success: false, error: "Exact event/review identity required; server-owned fields cannot be supplied." }, 400);
    }
    let key: Buffer | undefined;
    try {
      key = (deps.key ?? keyFromEnvironment)();
      if (!Buffer.isBuffer(key) || key.length !== 32) throw Error();
      const now = (deps.clock ?? Date.now)();
      const bound = await createExistingLuxuryGenuineSource(config.leadStorage).readCanonicalSnapshot();
      if (bound.status !== "COMPLETE") throw Error("Canonical source binding unverified.");
      const storage = deps.storage?.() ?? createJsonlLeadStorageAdapter(config.leadStorage.directory);
      const input: InternalHandlingDecision = { expectedFingerprint: body.expectedFingerprint, decision: body.decision, suppression: body.suppression,
        sourceRefs: body.sourceRefs, sourceReviewAttestation: body.sourceReviewAttestation };
      const updated = await storage.appendLeadInternalHandlingReview(body.id, body.expectedPreviousReviewId, record => {
        const event = createLuxuryWorkforceEvent(record, key!);
        if (!isGenuineLuxuryCanonicalEvent(event, now)) throw Error("Unsupported source.");
        return createInternalHandlingReview(record, input, key!, now);
      });
      if (!updated) return json({ success: false, error: "Canonical inquiry not found." }, 404);
      const review = updated.internalHandlingReviews!.at(-1)!;
      return json({ success: true, review: { id: review.id, decision: review.decision, suppression: review.suppression,
        recordedAt: review.recordedAt, expiresAt: review.expiresAt, customerCommunication: "NOT_GRANTED" }, runtimeReleased: false });
    } catch {
      return json({ success: false, error: "Review not recorded. Refresh exact source/review identity and verify explicit source evidence and secure configuration." }, 409);
    } finally { key?.fill(0); }
  };
}
