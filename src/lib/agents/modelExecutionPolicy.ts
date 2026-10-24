/** No model transport exists until a separately reviewed funded policy is implemented. */
export function assessModelExecutionPolicy(value: unknown) {
  const policy = value as Record<string, unknown>;
  if (!policy || typeof policy !== "object" || Array.isArray(policy) ||
      Object.keys(policy).sort().join() !== ["version", "mode", "enabled", "dailyBudgetUsd"].sort().join() ||
      policy.version !== 1 || policy.mode !== "DISABLED_ZERO_BUDGET" || policy.enabled !== false || policy.dailyBudgetUsd !== 0)
    throw Error("Model execution policy is unrecognized; execution held.");
  return Object.freeze({ schemaVersion: 1, status: "HOLD", reason: "PAID_API_USAGE_NOT_AUTHORIZED",
    dailyBudgetUsd: 0, modelExecutionAllowed: false, providerSessionCreationAllowed: false,
    networkRequestsAllowed: false, credentialsRead: false });
}

export function assertModelExecutionAllowed(value: unknown): never {
  assessModelExecutionPolicy(value);
  throw Error("Paid model execution is disabled by the approved zero-dollar policy.");
}
