import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateDivisionDecision, syntheticDivisionDecision, DIVISION_TEMPLATES } from "../src/lib/agents/divisionDecisionAgents.ts";
import { validateFactorySpec } from "../src/lib/agents/agentFactory.ts";
import { runFactoryAgent } from "../scripts/factory-agent-runtime.mjs";
import { validateSyntheticAgentTeam } from "../scripts/pilot-agent-team.mjs";
const luxury = () => ({ evidenceState: "VERIFIED", brand: "Synthetic", reference: "TEST", budget: 2000, timelineDays: 30, conditionTolerance: "Preowned", boxPapers: "Required" });
const realty = () => ({ evidenceState: "VERIFIED", purchasePrice: 100000, rehab: 25000, closingCosts: 5000, arv: 160000, annualNetIncome: null });
const capital = () => ({ evidenceState: "VERIFIED", requestedAmount: 50000, useOfFunds: "WORKING_CAPITAL", documents: ["REVENUE_RECORDS"] });
const fixtures = { "luxury-qualification": luxury, "realty-economics": realty, "capital-package": capital };

test("mandates require all six fields; partial completeness cannot become qualified", () => {
  assert.equal(evaluateDivisionDecision("luxury-qualification", luxury()).status, "READY_FOR_FOUNDER_REVIEW");
  for (const field of Object.keys(luxury()).filter(k => k !== "evidenceState")) {
    const r = evaluateDivisionDecision("luxury-qualification", { ...luxury(), [field]: null });
    assert.equal(r.status, "HOLD"); assert(r.missing.includes(field));
  }
  assert.equal(syntheticDivisionDecision("luxury-qualification").missing.length, 3);
});
test("property screen computes spread and optional yield without representing spread as profit", () => {
  const r = evaluateDivisionDecision("realty-economics", realty());
  assert.deepEqual(r.calculations, { allInCost: 130000, equitySpreadBeforeUnmodeledCosts: 30000, yieldOnCost: null });
  assert(r.limitations.includes("SPREAD_IS_NOT_PROFIT"));
  assert.equal(evaluateDivisionDecision("realty-economics", { ...realty(), annualNetIncome: 13000 }).calculations.yieldOnCost, 0.1);
  assert.equal(evaluateDivisionDecision("realty-economics", { ...realty(), annualNetIncome: -13000 }).calculations.yieldOnCost, -0.1);
  for (const arv of [100000, 130000]) assert.equal(evaluateDivisionDecision("realty-economics", { ...realty(), arv }).status, "NEGATIVE_OR_ZERO_SPREAD");
  const cents = evaluateDivisionDecision("realty-economics", { ...realty(), purchasePrice: 100000.01, rehab: 25000.02, closingCosts: 5000.03, arv: 160000.07 });
  assert.equal(cents.calculations.allInCost, 130000.06); assert.equal(cents.calculations.equitySpreadBeforeUnmodeledCosts, 30000.01);
});
test("package preview accepts only document categories and never equates presence with approval", () => {
  const r = evaluateDivisionDecision("capital-package", capital());
  assert.equal(r.status, "READY_FOR_FOUNDER_REVIEW"); assert(r.limitations.includes("LENDER_SPECIFIC_REQUIREMENTS_NOT_ASSESSED"));
  assert.deepEqual(syntheticDivisionDecision("capital-package").missing, ["documents"]);
  for (const documents of [["BANK_STATEMENTS", "BANK_STATEMENTS"], ["PRIVATE_DOCUMENT_CONTENT"], "BANK_STATEMENTS", [null]])
    assert.throws(() => evaluateDivisionDecision("capital-package", { ...capital(), documents }));
  assert.throws(() => evaluateDivisionDecision("capital-package", { ...capital(), useOfFunds: "PERSONAL" }));
});
test("unverified evidence suppresses economics and each template preserves every execution boundary", () => {
  for (const template of DIVISION_TEMPLATES) for (const evidenceState of ["VERIFIED", "UNKNOWN", "REQUIRES_VERIFICATION"]) {
    const r = evaluateDivisionDecision(template, { ...fixtures[template](), evidenceState });
    if (evidenceState !== "VERIFIED") { assert.equal(r.status, "HOLD"); assert(r.missing.includes("VERIFIED_EVIDENCE")); assert.equal(r.calculations, null); }
    for (const k of ["businessDataExecutionAllowed", "dispatchesWork", "sendsMessages", "writesCRM", "activatesGmail", "changesProduction", "modelApiRequestsAllowed", "submitsApplications", "makesOffers"]) assert.equal(r[k], false);
    assert(Object.isFrozen(r)); assert(Object.isFrozen(r.missing));
  }
});
test("unknown fields, raw personal data, nonfinite numbers, fractional cents and malformed inputs fail closed", () => {
  for (const template of DIVISION_TEMPLATES) {
    for (const input of [null, [], { ...fixtures[template](), email: "private@example.test" }, { ...fixtures[template](), evidenceState: "APPROVED" }])
      assert.throws(() => evaluateDivisionDecision(template, input));
  }
  for (const n of [NaN, Infinity, -1, 0, 1.001, 1e10, "2000"])
    assert.throws(() => evaluateDivisionDecision("luxury-qualification", { ...luxury(), budget: n }));
  for (const field of ["brand", "reference", "conditionTolerance", "boxPapers"])
    for (const value of ["", " ", "bad\nfield", {}, "a".repeat(101)]) assert.throws(() => evaluateDivisionDecision("luxury-qualification", { ...luxury(), [field]: value }));
  assert.throws(() => evaluateDivisionDecision("unsupported", {}));
});
test("factory binds all three division templates to synthetic fixtures and refuses role, tool or permission escalation", async () => {
  for (const template of DIVISION_TEMPLATES) {
    const spec = JSON.parse(await readFile(new URL(`../config/agents/${template}-pilot.spec.json`, import.meta.url)));
    await validateFactorySpec(spec);
    const r = await runFactoryAgent(spec); assert.equal(r.source, "SYNTHETIC_FIXTURE_ONLY"); assert.equal(r.report.template, template);
    for (const edit of [{ roleId: "command-orchestrator" }, { authorizedTools: ["gmail.read"] }, { inputs: ["live-business-source"] },
      { permissions: { ...spec.permissions, mode: "PILOT_LOCAL_READ_ONLY" } }, { permissions: { ...spec.permissions, externalWrites: true } },
      { evaluation: { expectedStatus: "APPROVED" } }, { outputSchema: "pilot-command-queue-v1" }])
      await assert.rejects(() => validateFactorySpec({ ...spec, ...edit }));
  }
});
test("shared pilot evaluates six fixtures while business data remains disconnected", async () => {
  const r = await validateSyntheticAgentTeam(); assert.equal(r.validatedTemplates, 6); assert.equal(r.businessDataReady, false);
  assert.equal(r.agents.filter(a => DIVISION_TEMPLATES.includes(a.template)).length, 3);
});
