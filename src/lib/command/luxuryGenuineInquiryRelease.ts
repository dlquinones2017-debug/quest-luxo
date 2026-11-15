import { isGenuineInquiryReleaseValid, runLuxuryGenuineInquiryOnce, type GenuineInquiryDependencies, type GenuineInquiryRelease } from "./luxuryGenuineInquiryRuntime.ts";
import { createExistingLuxuryGenuineSource } from "./luxuryGenuineInquirySource.ts";
import { getQuestLuxoServerConfig, type QuestLuxoServerConfig } from "../config/questLuxoConfig.ts";
import { readExistingIntakeNotification, type ExistingIntakeNotificationReceipt } from "./luxuryExistingIntakeNotification.ts";
import type { LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";

interface ConfiguredRelease extends GenuineInquiryRelease { readonly schema: "ql-bounded-genuine-release-v1" }
const field = "QUEST_WORKFORCE_GENUINE_RELEASE_JSON";
const serialize = (r: ConfiguredRelease) => JSON.stringify([r.schema, r.enabled, r.businessHold, r.scope, r.portal, r.ownerId, r.acceptedAt, r.expiresAt,
  r.releaseApprovalRef, r.recoveryAcceptanceRef, r.runtimeAcceptanceRef, r.approvedEvents.map(e => [e.leadId, e.fingerprint, e.reviewRef])]);

/** Trusted server configuration controls only the original bounded release gate.
 * No additional owner-email approval exists: genuine intake reuses its existing
 * form notification. Missing/revoked/replaced/expired release stays disabled.
 */
export function createGenuineInquiryReleaseReader(environment: () => Readonly<Record<string, string | undefined>> = () => process.env, clock: () => number = Date.now) {
  const readCurrentRelease = (): ConfiguredRelease | null => {
    try {
      const text = environment()[field];
      if (!text || Buffer.byteLength(text) > 8192) return null;
      const r = JSON.parse(text), schema = r?.schema;
      const allowed = ["schema", "enabled", "businessHold", "scope", "portal", "ownerId", "acceptedAt", "expiresAt", "releaseApprovalRef", "recoveryAcceptanceRef", "runtimeAcceptanceRef", "approvedEvents"];
      if (!r || Object.keys(r).sort().join() !== allowed.sort().join() || schema !== "ql-bounded-genuine-release-v1" || !isGenuineInquiryReleaseValid(r, clock()) ||
          r.approvedEvents.some((e: any) => Object.keys(e).sort().join() !== ["leadId", "fingerprint", "reviewRef"].sort().join() || !/^canonical-review:review_[a-f0-9-]{36}$/.test(e.reviewRef ?? ""))) return null;
      return Object.freeze({ ...r, schema, approvedEvents: Object.freeze(r.approvedEvents.map((e: any) => Object.freeze({ ...e }))) });
    } catch { return null; }
  };
  return Object.freeze({ readCurrentRelease,
    isReleaseCurrent: async (expected: GenuineInquiryRelease): Promise<boolean> => {
      const current = readCurrentRelease();
      try { return !!current && serialize(current) === serialize(expected as ConfiguredRelease); } catch { return false; }
    },
  });
}

/** Disjoint source/admission/release context for the SAME existing delivery
 * engine. Its genuine notification-reuse branch is integrated by that owner;
 * this context performs no provider/journal operation and installs no runner.
 */
export function createConfiguredGenuineInquiryContext(options: {
  readonly key: Buffer; readonly clock?: () => number;
  readonly storage?: QuestLuxoServerConfig["leadStorage"];
  readonly environment?: () => Readonly<Record<string, string | undefined>>;
}) {
  const storage = options.storage ?? getQuestLuxoServerConfig().leadStorage;
  const release = createGenuineInquiryReleaseReader(options.environment, options.clock ?? Date.now);
  const source = createExistingLuxuryGenuineSource(storage, { key: options.key, clock: options.clock });
  const getExistingIntakeNotification = async (event: LuxuryWorkforceEvent): Promise<ExistingIntakeNotificationReceipt> => {
    const snapshot = await source.readCanonicalSnapshot();
    if (snapshot.status !== "COMPLETE") return { status: "UNVERIFIED" };
    return readExistingIntakeNotification(snapshot.records.find(r => r.id === event.leadId), event, options.key);
  };
  return Object.freeze({ ...release, readCanonicalSnapshot: source.readCanonicalSnapshot, readAdmission: source.readAdmission,
    getExistingIntakeNotification, diagnostics: source.diagnostics, ownerNotificationPolicy: "EXISTING_INTAKE_NOTICE_ONLY" as const });
}

/** One bounded invocation using the existing source, journal lifecycle and CRM
 * adapter. Merely importing this callable enables no schedule or startup path.
 * Existing intake evidence is injected by trusted server code, never a request.
 */
export async function runLuxuryGenuineInquiryFromConfiguredRelease(
  runtime: Omit<GenuineInquiryDependencies, "readCanonicalSnapshot" | "readAdmission" | "isReleaseCurrent">,
  storage: QuestLuxoServerConfig["leadStorage"] = getQuestLuxoServerConfig().leadStorage,
  environment: () => Readonly<Record<string, string | undefined>> = () => process.env,
) {
  const context = createConfiguredGenuineInquiryContext({ key: runtime.key, clock: runtime.clock, storage, environment });
  const result = await runLuxuryGenuineInquiryOnce(context.readCurrentRelease(), { ...runtime,
    readCanonicalSnapshot: context.readCanonicalSnapshot, readAdmission: context.readAdmission, isReleaseCurrent: context.isReleaseCurrent,
    createGenuineAdapter: async beforeWrite => ({ ...await runtime.createGenuineAdapter(beforeWrite), getExistingIntakeNotification: context.getExistingIntakeNotification }),
  });
  return { ...result, sourceAdmission: context.diagnostics(), ownerNotificationPolicy: context.ownerNotificationPolicy };
}
