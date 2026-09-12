import type { ProductionReadinessResult } from "./productionReadiness.ts";

export interface QuestLuxoHealthPayload {
  readonly status: "ok" | "unavailable";
  readonly service: "quest-luxo";
  readonly checks: {
    readonly productionMode: boolean;
    readonly configuration: boolean;
    readonly storage: boolean;
    readonly notifications: boolean;
    readonly brokerConsole: boolean;
  };
}

export function createHealthPayload(
  readiness: ProductionReadinessResult
): QuestLuxoHealthPayload {
  return Object.freeze({
    status: readiness.healthy ? "ok" : "unavailable",
    service: "quest-luxo",
    checks: Object.freeze({
      productionMode: readiness.productionMode,
      configuration: readiness.requiredConfigurationPresent,
      storage: readiness.storageWritable,
      notifications: readiness.notificationProviderConfigured,
      brokerConsole: readiness.brokerConsoleProtected,
    }),
  });
}

