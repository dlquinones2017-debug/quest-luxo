import {
  getQuestLuxoServerConfig,
  type QuestLuxoServerConfig,
} from "../config/questLuxoConfig.ts";

export type BrokerConsoleAuthReason =
  | "auth-disabled"
  | "authorized"
  | "missing-key"
  | "invalid-key";

export interface BrokerConsoleAuthResult {
  readonly configured: boolean;
  readonly allowed: boolean;
  readonly provided: boolean;
  readonly reason: BrokerConsoleAuthReason;
}

const brokerConsoleKeyHeader = "x-broker-console-key";
let didWarnAuthDisabled = false;

const getConfiguredAccessKey = (): string => {
  return getQuestLuxoServerConfig().brokerConsole.accessKey ?? "";
};

const warnAuthDisabled = (): void => {
  if (didWarnAuthDisabled) return;

  console.warn(
    "Quest Luxo Broker Console auth is disabled because BROKER_CONSOLE_ACCESS_KEY is not configured."
  );
  didWarnAuthDisabled = true;
};

const warnProductionAuthLocked = (): void => {
  if (didWarnAuthDisabled) return;

  console.warn(
    "Quest Luxo Broker Console is locked because BROKER_CONSOLE_ACCESS_KEY is not configured in production."
  );
  didWarnAuthDisabled = true;
};

const safeEquals = (left: string, right: string): boolean => {
  if (left.length !== right.length) return false;

  let mismatch = 0;

  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
};

export const isBrokerConsoleAuthConfigured = (): boolean =>
  getConfiguredAccessKey().length > 0;

export const getBrokerConsoleRequestKey = (request: Request): string => {
  const requestUrl = new URL(request.url);
  const queryKey = requestUrl.searchParams.get("key")?.trim();

  if (queryKey) return queryKey;

  return request.headers.get(brokerConsoleKeyHeader)?.trim() ?? "";
};

export const validateBrokerConsoleAccess = (
  request: Request,
  config: QuestLuxoServerConfig = getQuestLuxoServerConfig()
): BrokerConsoleAuthResult => {
  const configuredKey = config.brokerConsole.accessKey ?? "";

  if (!configuredKey) {
    if (config.isProduction) {
      warnProductionAuthLocked();

      return {
        configured: false,
        allowed: false,
        provided: false,
        reason: "missing-key",
      };
    }

    warnAuthDisabled();

    return {
      configured: false,
      allowed: true,
      provided: false,
      reason: "auth-disabled",
    };
  }

  const requestKey = getBrokerConsoleRequestKey(request);

  if (!requestKey) {
    return {
      configured: true,
      allowed: false,
      provided: false,
      reason: "missing-key",
    };
  }

  const allowed = safeEquals(requestKey, configuredKey);

  return {
    configured: true,
    allowed,
    provided: true,
    reason: allowed ? "authorized" : "invalid-key",
  };
};

export const createBrokerAuthJsonResponse = (
  auth: BrokerConsoleAuthResult
): Response =>
  new Response(
    JSON.stringify({
      success: false,
      error:
        auth.reason === "invalid-key"
          ? "Invalid Broker Console access key."
          : "Broker Console access key required.",
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
