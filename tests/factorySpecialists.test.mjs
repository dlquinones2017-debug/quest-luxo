import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { validateFactorySpec, generateAgentPackage } from "../src/lib/agents/agentFactory.ts";
import { runFactoryAgent } from "../scripts/factory-agent-runtime.mjs";
import { validateSyntheticAgentTeam } from "../scripts/pilot-agent-team.mjs";
const readiness = JSON.parse(await readFile(new URL("../config/agents/reliability-pilot.spec.json", import.meta.url), "utf8"));
const brief = JSON.parse(await readFile(new URL("../config/agents/founder-brief-pilot.spec.json", import.meta.url), "utf8"));
test("distinct templates produce readiness holds and founder aggregate recommendations", async () => {
  const a = await runFactoryAgent(readiness), b = await runFactoryAgent(brief);
  assert.equal(a.report.mode, "READ_ONLY_ASSESSMENT");
  assert.equal(b.report.mode, "RECOMMENDATION_ONLY");
  assert.equal(b.report.dispatchesWork, false);
  for (const r of [a, b]) {
    assert.equal(r.source, "SYNTHETIC_FIXTURE_ONLY");
    assert.equal(r.report.status, "HOLD");
    assert.deepEqual(r.report.requiredActions, ["KEY_RECOVERY", "RETENTION_POLICY", "SOURCE_SCOPE"]);
    assert.equal(r.report.businessDataExecutionAllowed, false);
  }
});
test("specialist generation rejects template-role mismatch, unapproved tool and desired-success fixtures", async () => {
  for (const s of [{ ...readiness, roleId: brief.roleId }, { ...readiness, template: "shell" },
    { ...readiness, authorizedTools: ["gmail.read"] }, { ...readiness, outputSchema: brief.outputSchema },
    { ...readiness, evaluation: { expectedStatus: "READY", requiredActions: [] } }, { ...readiness, permissions: { ...readiness.permissions, gmail: true } }])
    await assert.rejects(() => validateFactorySpec(s));
});
test("all checked-in generated specialist packages pass their independent golden evaluations", () => {
  const p = spawnSync(process.execPath, ["--test", "agent-packages/reliability-pilot/agent.test.mjs", "agent-packages/founder-brief-pilot/agent.test.mjs"], { encoding: "utf8" });
  assert.equal(p.status, 0, p.stdout + p.stderr);
});
test("newly generated specialist package runs and retains its held scope", async () => {
  const id = "specialist-eval-" + process.pid;
  try {
    const p = await generateAgentPackage({ ...readiness, id });
    assert.equal(p.filesGenerated, 4);
    const check = spawnSync(process.execPath, ["--test", p.packagePath + "/agent.test.mjs"], { encoding: "utf8" });
    assert.equal(check.status, 0, check.stdout + check.stderr);
  } finally { await rm(new URL("../agent-packages/" + id, import.meta.url), { recursive: true, force: true }); }
});
test("one bounded team validates six synthetic templates while preserving real-data and dispatch holds", async () => {
  const r = await validateSyntheticAgentTeam();
  assert.equal(r.validatedTemplates, 6);
  assert.equal(r.businessDataReady, false);
  assert.equal(r.dispatchesWork, false);
  assert.equal(new Set(r.agents.map(a => a.roleId)).size, 6);
  assert.deepEqual(r.agents.map(a => a.template), ["operations", "readiness", "founder-brief", "luxury-qualification", "realty-economics", "capital-package"]);
});
test("operations version 1 cannot be relabeled as a specialist role", async () => {
  const operation = JSON.parse(await readFile(new URL("../config/agents/operations-pilot.spec.json", import.meta.url), "utf8"));
  for (const roleId of [readiness.roleId, brief.roleId])
    await assert.rejects(() => validateFactorySpec({ ...operation, roleId }), /registered role/);
});
