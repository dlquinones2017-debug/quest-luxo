import {
  leadStorageProviderValues,
  type LeadStorageProvider,
} from "../leads/leadStorageTypes.ts";
import { isAbsolute, resolve } from "node:path";

const DEFAULT_EMAIL_PROVIDER_API_URL = "https://api.resend.com/emails";

export type QuestLuxoConfigRequirement = "required-for-production" | "optional";
export type QuestLuxoConfigStatus =
  | "configured"
  | "missing"
  | "defaulted"
  | "unsupported"
  | "production-warning";
export type QuestLuxoConfigScope =
  | "lead-email"
  | "broker-console"
  | "lead-storage";

export interface QuestLuxoServerConfig {
  readonly isProduction: boolean;
  readonly leadEmail: {
    readonly to: readonly string[];
    readonly from: string | null;
    readonly providerApiKey: string | null;
    readonly providerApiUrl: string;
    readonly providerApiUrlSource:
      | "EMAIL_PROVIDER_API_URL"
      | "EMAIL_PROVIDER_ENDPOINT"
      | "default";
    readonly providerApiUrlStatus: "configured" | "invalid";
  };
  readonly brokerConsole: {
    readonly accessKey: string | null;
  };
  readonly leadStorage: {
    readonly provider: LeadStorageProvider;
    readonly providerSource: "LEAD_STORAGE_PROVIDER" | "default";
    readonly providerStatus: "configured" | "defaulted" | "unsupported";
    readonly directory: string;
    readonly directorySource: "LEAD_STORAGE_DIRECTORY" | "default";
    readonly directoryStatus: "configured" | "defaulted" | "invalid";
  };
}

export interface QuestLuxoConfigValidationItem {
  readonly name: string;
  readonly scope: QuestLuxoConfigScope;
  readonly requirement: QuestLuxoConfigRequirement;
  readonly status: QuestLuxoConfigStatus;
  readonly message?: string;
}

export interface QuestLuxoServerConfigValidation {
  readonly isProduction: boolean;
  readonly validForProduction: boolean;
  readonly items: readonly QuestLuxoConfigValidationItem[];
  readonly missingRequiredForProduction: readonly string[];
  readonly unsupportedConfiguration: readonly string[];
  readonly productionWarnings: readonly string[];
}

export interface QuestLuxoConfigSummaryItem {
  readonly name: string;
  readonly scope: QuestLuxoConfigScope;
  readonly requirement: QuestLuxoConfigRequirement;
  readonly status: QuestLuxoConfigStatus;
  readonly message?: string;
}

export interface QuestLuxoConfigSummary {
  readonly isProduction: boolean;
  readonly validForProduction: boolean;
  readonly items: readonly QuestLuxoConfigSummaryItem[];
  readonly missingRequiredForProduction: readonly string[];
  readonly unsupportedConfiguration: readonly string[];
  readonly productionWarnings: readonly string[];
}

export type QuestLuxoEnv = Readonly<
  Record<string, string | boolean | undefined>
>;

const getBuildEnv = (): QuestLuxoEnv =>
  (import.meta as ImportMeta & { readonly env?: QuestLuxoEnv }).env ?? {};

const getEnvValueSource = (
  name: string,
  env?: QuestLuxoEnv
): string | boolean | undefined => {
  if (env) return env[name];

  const runtimeValue =
    typeof process !== "undefined" ? process.env[name] : undefined;

  return runtimeValue !== undefined ? runtimeValue : getBuildEnv()[name];
};

const getEnvValue = (name: string, env?: QuestLuxoEnv): string | undefined => {
  const value = getEnvValueSource(name, env);

  return typeof value === "string" && value.trim() ? value.trim() : undefined;
};

const getEnvBoolean = (name: string, env?: QuestLuxoEnv): boolean => {
  const value = getEnvValueSource(name, env);

  return value === true || value === "true";
};

const parseRecipients = (value?: string): readonly string[] =>
  Object.freeze(
    value
      ? value
          .split(",")
          .map((recipient) => recipient.trim())
          .filter(Boolean)
      : []
  );

const createValidationItem = (
  name: string,
  scope: QuestLuxoConfigScope,
  requirement: QuestLuxoConfigRequirement,
  configured: boolean,
  defaulted = false,
  statusOverride?: QuestLuxoConfigStatus,
  message?: string
): QuestLuxoConfigValidationItem =>
  Object.freeze({
    name,
    scope,
    requirement,
    status:
      statusOverride ?? (configured ? "configured" : defaulted ? "defaulted" : "missing"),
    ...(message ? { message } : {}),
  });

const isLeadStorageProvider = (value: string): value is LeadStorageProvider =>
  leadStorageProviderValues.includes(value as LeadStorageProvider);

const resolveLeadStorageProvider = (
  env?: QuestLuxoEnv
): Pick<
  QuestLuxoServerConfig["leadStorage"],
  "provider" | "providerSource" | "providerStatus"
> => {
  const configuredProvider = getEnvValue(
    "LEAD_STORAGE_PROVIDER",
    env
  )?.toLowerCase();

  if (!configuredProvider) {
    return Object.freeze({
      provider: "jsonl",
      providerSource: "default",
      providerStatus: "defaulted",
    });
  }

  if (isLeadStorageProvider(configuredProvider)) {
    return Object.freeze({
      provider: configuredProvider,
      providerSource: "LEAD_STORAGE_PROVIDER",
      providerStatus: "configured",
    });
  }

  return Object.freeze({
    provider: "jsonl",
    providerSource: "LEAD_STORAGE_PROVIDER",
    providerStatus: "unsupported",
  });
};

const isValidHttpUrl = (value: string): boolean => {
  try {
    const url = new URL(value);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

export function createQuestLuxoServerConfig(
  env: QuestLuxoEnv
): QuestLuxoServerConfig {
  const emailProviderApiUrl = getEnvValue("EMAIL_PROVIDER_API_URL", env);
  const emailProviderEndpoint = getEnvValue("EMAIL_PROVIDER_ENDPOINT", env);
  const providerApiUrl =
    emailProviderApiUrl ?? emailProviderEndpoint ?? DEFAULT_EMAIL_PROVIDER_API_URL;
  const configuredStorageDirectory = getEnvValue(
    "LEAD_STORAGE_DIRECTORY",
    env
  );
  const storageDirectoryIsAbsolute = configuredStorageDirectory
    ? isAbsolute(configuredStorageDirectory)
    : false;
  const leadStorageProvider = resolveLeadStorageProvider(env);

  return Object.freeze({
    isProduction:
      getEnvBoolean("PROD", env) ||
      getEnvValue("NODE_ENV", env) === "production",
    leadEmail: Object.freeze({
      to: parseRecipients(getEnvValue("LEAD_EMAIL_TO", env)),
      from: getEnvValue("LEAD_EMAIL_FROM", env) ?? null,
      providerApiKey: getEnvValue("EMAIL_PROVIDER_API_KEY", env) ?? null,
      providerApiUrl,
      providerApiUrlSource: emailProviderApiUrl
        ? "EMAIL_PROVIDER_API_URL"
        : emailProviderEndpoint
          ? "EMAIL_PROVIDER_ENDPOINT"
          : "default",
      providerApiUrlStatus: isValidHttpUrl(providerApiUrl)
        ? "configured"
        : "invalid",
    }),
    brokerConsole: Object.freeze({
      accessKey: getEnvValue("BROKER_CONSOLE_ACCESS_KEY", env) ?? null,
    }),
    leadStorage: Object.freeze({
      ...leadStorageProvider,
      directory: configuredStorageDirectory
        ? storageDirectoryIsAbsolute
          ? configuredStorageDirectory
          : resolve(process.cwd(), configuredStorageDirectory)
        : resolve(process.cwd(), ".quest-luxo"),
      directorySource: configuredStorageDirectory
        ? "LEAD_STORAGE_DIRECTORY"
        : "default",
      directoryStatus: configuredStorageDirectory
        ? storageDirectoryIsAbsolute
          ? "configured"
          : "invalid"
        : "defaulted",
    }),
  });
}

export function getQuestLuxoServerConfig(): QuestLuxoServerConfig {
  const runtimeEnv =
    typeof process !== "undefined"
      ? ({ ...getBuildEnv(), ...process.env } as QuestLuxoEnv)
      : getBuildEnv();

  return createQuestLuxoServerConfig(runtimeEnv);
}

export function validateQuestLuxoServerConfig(
  config: QuestLuxoServerConfig = getQuestLuxoServerConfig()
): QuestLuxoServerConfigValidation {
  const items = [
    createValidationItem(
      "LEAD_EMAIL_TO",
      "lead-email",
      "required-for-production",
      config.leadEmail.to.length > 0
    ),
    createValidationItem(
      "LEAD_EMAIL_FROM",
      "lead-email",
      "required-for-production",
      Boolean(config.leadEmail.from)
    ),
    createValidationItem(
      "EMAIL_PROVIDER_API_KEY",
      "lead-email",
      "required-for-production",
      Boolean(config.leadEmail.providerApiKey)
    ),
    createValidationItem(
      "EMAIL_PROVIDER_API_URL",
      "lead-email",
      "optional",
      config.leadEmail.providerApiUrlSource === "EMAIL_PROVIDER_API_URL",
      false,
      config.leadEmail.providerApiUrlSource === "EMAIL_PROVIDER_API_URL" &&
      config.leadEmail.providerApiUrlStatus === "invalid"
        ? "unsupported"
        : undefined,
      config.leadEmail.providerApiUrlSource === "EMAIL_PROVIDER_API_URL" &&
      config.leadEmail.providerApiUrlStatus === "invalid"
        ? "Configured email provider endpoint must be a valid HTTP(S) URL."
        : undefined
    ),
    createValidationItem(
      "EMAIL_PROVIDER_ENDPOINT",
      "lead-email",
      "optional",
      config.leadEmail.providerApiUrlSource === "EMAIL_PROVIDER_ENDPOINT",
      config.leadEmail.providerApiUrlSource === "default",
      config.leadEmail.providerApiUrlSource === "EMAIL_PROVIDER_ENDPOINT" &&
      config.leadEmail.providerApiUrlStatus === "invalid"
        ? "unsupported"
        : undefined,
      config.leadEmail.providerApiUrlSource === "EMAIL_PROVIDER_ENDPOINT" &&
      config.leadEmail.providerApiUrlStatus === "invalid"
        ? "Configured legacy email provider endpoint must be a valid HTTP(S) URL."
        : undefined
    ),
    createValidationItem(
      "BROKER_CONSOLE_ACCESS_KEY",
      "broker-console",
      "required-for-production",
      Boolean(config.brokerConsole.accessKey)
    ),
    createValidationItem(
      "LEAD_STORAGE_PROVIDER",
      "lead-storage",
      "required-for-production",
      config.leadStorage.providerStatus === "configured",
      config.leadStorage.providerStatus === "defaulted",
      config.leadStorage.providerStatus === "unsupported"
        ? "unsupported"
        : undefined,
      config.leadStorage.providerStatus === "unsupported"
        ? "Unsupported lead storage provider configured."
        : config.leadStorage.providerStatus === "defaulted"
          ? "Defaults to JSONL for local development."
          : undefined
    ),
    createValidationItem(
      "LEAD_STORAGE_DIRECTORY",
      "lead-storage",
      "required-for-production",
      config.leadStorage.directoryStatus === "configured",
      config.leadStorage.directoryStatus === "defaulted",
      config.leadStorage.directoryStatus === "invalid"
        ? "unsupported"
        : undefined,
      config.leadStorage.directoryStatus === "invalid"
        ? "Lead storage directory must be an absolute filesystem path."
        : config.leadStorage.directoryStatus === "defaulted"
          ? "Defaults to <process.cwd()>/.quest-luxo for local development only."
          : undefined
    ),
  ];

  const frozenItems = Object.freeze(items);
  const missingRequiredForProduction = Object.freeze(
    frozenItems
      .filter(
        (item) =>
          item.requirement === "required-for-production" &&
          (item.status === "missing" || item.status === "defaulted")
      )
      .map((item) => item.name)
  );
  const unsupportedConfiguration = Object.freeze(
    frozenItems
      .filter((item) => item.status === "unsupported")
      .map((item) => item.name)
  );
  const productionWarnings = Object.freeze(
    frozenItems
      .filter((item) => item.status === "production-warning")
      .map((item) => item.name)
  );

  return Object.freeze({
    isProduction: config.isProduction,
    validForProduction:
      missingRequiredForProduction.length === 0 &&
      unsupportedConfiguration.length === 0 &&
      productionWarnings.length === 0,
    items: frozenItems,
    missingRequiredForProduction,
    unsupportedConfiguration,
    productionWarnings,
  });
}

export function createQuestLuxoConfigSummary(
  config: QuestLuxoServerConfig = getQuestLuxoServerConfig()
): QuestLuxoConfigSummary {
  const validation = validateQuestLuxoServerConfig(config);

  return Object.freeze({
    isProduction: validation.isProduction,
    validForProduction: validation.validForProduction,
    items: Object.freeze(
      validation.items.map((item) =>
        Object.freeze({
          name: item.name,
          scope: item.scope,
          requirement: item.requirement,
          status: item.status,
          ...(item.message ? { message: item.message } : {}),
        })
      )
    ),
    missingRequiredForProduction: validation.missingRequiredForProduction,
    unsupportedConfiguration: validation.unsupportedConfiguration,
    productionWarnings: validation.productionWarnings,
  });
}
