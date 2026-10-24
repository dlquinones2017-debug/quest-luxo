import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runFactoryAgent } from "../../scripts/factory-agent-runtime.mjs";
const spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));
test("generated agent preserves reviewed outcomes and read-only boundaries", async () => {
  const result = await runFactoryAgent(spec);
  assert.equal(result.source, "SYNTHETIC_FIXTURE_ONLY");
  assert.equal(result.report.mode, "PILOT_LOCAL_READ_ONLY");
  assert.equal(result.report.status, "HOLD");
  assert.equal(result.report.recoveryReceipt, "MISSING");
  assert.equal(result.report.independentBackupVerified, false);
  assert.equal(result.report.businessDataExecutionAllowed, false);
  assert.equal(result.report.sendsMessages, false);
  assert.equal(result.report.writesCRM, false);
  assert.equal(result.report.activatesGmail, false);
});
