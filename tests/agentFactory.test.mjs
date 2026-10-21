import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { loadFactoryRoster, validateFactorySpec, generateAgentPackage } from "../src/lib/agents/agentFactory.ts";
import { runFactoryAgent } from "../scripts/factory-agent-runtime.mjs";

const spec = JSON.parse(await readFile(new URL("../config/agents/operations-pilot.spec.json", import.meta.url), "utf8"));
test("factory reuses all 57 architecture roles without promoting proposed roles", async () => {
  const roles = await loadFactoryRoster();
  assert.equal(roles.length, 57);
  assert.equal(roles.filter(r => r.status === "PROPOSED").length, 31);
  assert.equal(roles.find(r => r.id === "lead-operations").status, "EXISTING_CAPABILITY");
});
test("factory holds unknown roles, unsupported templates, path traversal and missing provenance", async () => {
  for (const change of [{ roleId: "unknown" }, { roleId: "capital-revenue" }, { id: "../../escape" }, { evidence: {} }, { owner: "" }, { extra: true }])
    await assert.rejects(() => validateFactorySpec({ ...spec, ...change }));
});
test("factory cannot grant email, CRM, production, credential or arbitrary tools", async () => {
  for (const field of ["externalWrites", "gmail", "crm", "production"])
    await assert.rejects(() => validateFactorySpec({ ...spec, permissions: { ...spec.permissions, [field]: true } }), /permissions/);
  await assert.rejects(() => validateFactorySpec({ ...spec, authorizedTools: ["shell.execute"] }));
  await assert.rejects(() => validateFactorySpec({ ...spec, permissions: { ...spec.permissions, credential: "secret" } }));
  await assert.rejects(() => validateFactorySpec({ ...spec, inputs: ["gmail"] }));
});
test("generated runtime returns useful aggregate exceptions from reviewed synthetic evidence", async () => {
  const result = await runFactoryAgent(spec);
  assert.deepEqual(result.report.divisions.map(r => [r.total, r.blocked, r.founderReview]), [[1,1,0],[1,0,1]]);
  assert.equal(result.report.writesCRM, false);
  assert.equal(result.report.activatesGmail, false);
  assert.doesNotMatch(JSON.stringify(result), /borrowerId|leadId|synthetic-proof|synthetic-capital/);
});
test("factory produces executable code/config/tests/runbook and refuses existing package replacement", async () => {
  const id = "factory-evaluation-" + process.pid;
  const path = new URL("../agent-packages/" + id, import.meta.url);
  try {
    const result = await generateAgentPackage({ ...spec, id });
    assert.equal(result.filesGenerated, 4);
    assert.equal(result.deployed, false);
    const run = spawnSync(process.execPath, ["agent-packages/" + id + "/run.mjs"], { encoding: "utf8" });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).source, "SYNTHETIC_FIXTURE_ONLY");
    const tests = spawnSync(process.execPath, ["--test", "agent-packages/" + id + "/agent.test.mjs"], { encoding: "utf8" });
    assert.equal(tests.status, 0, tests.stdout + tests.stderr);
    await assert.rejects(() => generateAgentPackage({ ...spec, id }), /EEXIST/);
  } finally { await rm(path, { recursive: true, force: true }); }
});
