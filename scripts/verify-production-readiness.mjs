import { verifyProductionReadiness } from "../src/lib/config/productionReadiness.ts";

const readiness = await verifyProductionReadiness();

console.log(
  JSON.stringify(
    {
      healthy: readiness.healthy,
      productionMode: readiness.productionMode,
      requiredConfigurationPresent:
        readiness.requiredConfigurationPresent,
      storageProviderConfigured: readiness.storageProviderConfigured,
      storageDirectoryConfigured: readiness.storageDirectoryConfigured,
      storageWritable: readiness.storageWritable,
      notificationProviderConfigured:
        readiness.notificationProviderConfigured,
      brokerConsoleProtected: readiness.brokerConsoleProtected,
      issues: readiness.issues,
    },
    null,
    2
  )
);

if (!readiness.healthy) process.exitCode = 1;
