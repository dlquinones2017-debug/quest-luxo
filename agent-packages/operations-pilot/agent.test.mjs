import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runFactoryAgent } from "../../scripts/factory-agent-runtime.mjs";
const spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));
test("generated operational agent retains read-only boundaries and reviewed fixture counts", async () => {
  const result = await runFactoryAgent(spec);
  assert.equal(result.source, "SYNTHETIC_FIXTURE_ONLY");
  assert.deepEqual(result.report.divisions.map(r => [r.total, r.blocked, r.founderReview]), [[1,1,0],[1,0,1]]);
  assert.equal(result.report.sendsMessages, false);
  assert.equal(result.report.writesCRM, false);
  assert.equal(result.report.activatesGmail, false);
});
