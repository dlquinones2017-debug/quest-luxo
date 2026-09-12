import { constants } from "node:fs";
import { access, mkdir, open, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  getQuestLuxoServerConfig,
  validateQuestLuxoServerConfig,
  type QuestLuxoServerConfig,
} from "./questLuxoConfig.ts";

export interface ProductionReadinessResult {
  readonly healthy: boolean;
  readonly productionMode: boolean;
  readonly requiredConfigurationPresent: boolean;
  readonly storageProviderConfigured: boolean;
  readonly storageDirectoryConfigured: boolean;
  readonly storageWritable: boolean;
  readonly notificationProviderConfigured: boolean;
  readonly brokerConsoleProtected: boolean;
  readonly issues: readonly string[];
}

export class ProductionReadinessError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(
      `Quest Luxo production lead infrastructure is not ready: ${issues.join(
        ", "
      )}`
    );
    this.name = "ProductionReadinessError";
    this.issues = Object.freeze([...issues]);
  }
}

const verifyDirectoryWritable = async (directory: string): Promise<boolean> => {
  const probeFile = join(
    directory,
    `.quest-luxo-write-probe-${randomUUID()}.tmp`
  );
  let probeCreated = false;

  try {
    await mkdir(directory, { recursive: true });
    await access(directory, constants.W_OK);
    const handle = await open(probeFile, "wx", 0o600);
    probeCreated = true;

    try {
      await handle.writeFile("quest-luxo-storage-probe\n", "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }

    return true;
  } catch {
    return false;
  } finally {
    if (probeCreated) {
      await unlink(probeFile).catch(() => undefined);
    }
  }
};

export async function verifyProductionReadiness(
  config: QuestLuxoServerConfig = getQuestLuxoServerConfig()
): Promise<ProductionReadinessResult> {
  const validation = validateQuestLuxoServerConfig(config);
  const issues = new Set<string>([
    ...validation.missingRequiredForProduction,
    ...validation.unsupportedConfiguration,
    ...validation.productionWarnings,
  ]);
  const storageProviderConfigured =
    config.leadStorage.providerStatus === "configured";
  const storageDirectoryConfigured =
    config.leadStorage.directoryStatus === "configured";
  const canProbeStorage =
    config.isProduction &&
    config.leadStorage.provider === "jsonl" &&
    storageProviderConfigured &&
    storageDirectoryConfigured;
  const storageWritable = canProbeStorage
    ? await verifyDirectoryWritable(config.leadStorage.directory)
    : false;

  if (!config.isProduction) issues.add("NODE_ENV");
  if (!storageWritable) issues.add("LEAD_STORAGE_WRITABLE");

  const notificationProviderConfigured =
    config.leadEmail.to.length > 0 &&
    Boolean(config.leadEmail.from) &&
    Boolean(config.leadEmail.providerApiKey) &&
    config.leadEmail.providerApiUrlStatus === "configured";
  const brokerConsoleProtected = Boolean(config.brokerConsole.accessKey);
  const requiredConfigurationPresent =
    validation.missingRequiredForProduction.length === 0 &&
    validation.unsupportedConfiguration.length === 0 &&
    validation.productionWarnings.length === 0;

  return Object.freeze({
    healthy:
      config.isProduction &&
      requiredConfigurationPresent &&
      storageWritable,
    productionMode: config.isProduction,
    requiredConfigurationPresent,
    storageProviderConfigured,
    storageDirectoryConfigured,
    storageWritable,
    notificationProviderConfigured,
    brokerConsoleProtected,
    issues: Object.freeze([...issues].sort()),
  });
}

let cachedReadyDirectory: string | null = null;

export async function assertProductionReadiness(
  config: QuestLuxoServerConfig = getQuestLuxoServerConfig()
): Promise<void> {
  if (!config.isProduction) return;
  if (cachedReadyDirectory === config.leadStorage.directory) return;

  const readiness = await verifyProductionReadiness(config);

  if (!readiness.healthy) {
    throw new ProductionReadinessError(readiness.issues);
  }

  cachedReadyDirectory = config.leadStorage.directory;
}

export function resetProductionReadinessCacheForTests(): void {
  cachedReadyDirectory = null;
}
