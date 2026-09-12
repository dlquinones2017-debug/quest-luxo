import { constants } from "node:fs";
import { access, mkdir, open, unlink } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import {
  createLeadConfig,
  validateProductionLeadConfig,
} from "./leadConfig.mjs";

const verifyWritable = async (directory) => {
  if (!directory) return false;
  const probe = join(directory, `.write-probe-${randomUUID()}.tmp`);
  let created = false;

  try {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await access(directory, constants.W_OK);
    const handle = await open(probe, "wx", 0o600);
    created = true;
    try {
      await handle.writeFile("quest-luxo-readiness\n", "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    return true;
  } catch {
    return false;
  } finally {
    if (created) await unlink(probe).catch(() => undefined);
  }
};

export const verifyProductionReadiness = async (
  env = process.env,
  options = {}
) => {
  const config = createLeadConfig(env);
  const validation = validateProductionLeadConfig(config);
  const storageWritable = await (options.verifyWritable ?? verifyWritable)(
    config.storageDirectory
  );
  const issues = new Set(validation.issues);
  if (!storageWritable) issues.add("LEAD_STORAGE_WRITABLE");

  return Object.freeze({
    healthy: validation.healthy && storageWritable,
    productionMode: config.production,
    storageWritable,
    notificationConfigured: Boolean(
      config.emailApiKey && config.emailFrom && config.emailTo.length
    ),
    issues: Object.freeze([...issues].sort()),
  });
};

export const assertProductionReadiness = async (env = process.env) => {
  const result = await verifyProductionReadiness(env);
  if (!result.healthy) {
    throw new Error(
      `Quest Luxo production readiness failed: ${result.issues.join(", ")}`
    );
  }
  return result;
};
