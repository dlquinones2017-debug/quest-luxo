import { verifyProductionReadiness } from "../src/lib/config/productionReadiness.ts";

const readiness = await verifyProductionReadiness();

if (!readiness.healthy) {
  console.error("Quest Luxo production startup blocked.", {
    issues: readiness.issues,
  });
  process.exitCode = 1;
} else {
  console.log("Quest Luxo production lead infrastructure is ready.", {
    storageProviderConfigured: readiness.storageProviderConfigured,
    storageDirectoryConfigured: readiness.storageDirectoryConfigured,
    storageWritable: readiness.storageWritable,
    notificationProviderConfigured:
      readiness.notificationProviderConfigured,
    brokerConsoleProtected: readiness.brokerConsoleProtected,
  });
  await import("../dist/server/entry.mjs");
}
