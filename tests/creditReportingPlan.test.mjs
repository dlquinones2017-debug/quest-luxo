import test from "node:test";
import assert from "node:assert/strict";
import { planCreditReporting } from "../src/lib/capital/creditReportingPlan.ts";

const base = {
  assessmentId: "ASSESSMENT-TEST-1",
  pathway: "PERSONAL_AND_BUSINESS",
  freeReadinessSnapshot: false,
  consumerBureaus: ["EXPERIAN"],
  commercialBureaus: ["EXPERIAN_BUSINESS"],
  lenderFitEvidenceId: "FIT-1",
  reportNeedEvidenceId: "NEED-1",
  providerContractEvidenceId: "CONTRACT-1",
  authorizedUseEvidenceId: "AUTHORIZED-1",
  consumerPermissiblePurposeEvidenceId: "FCRA-PURPOSE-1",
  applicantAuthorizationEvidenceId: "CONSENT-1",
  complianceClearanceEvidenceId: "CONTROLS-1",
};

test("free capital-readiness snapshot never requires or requests credit reports", () => {
  const plan = planCreditReporting({ ...base, freeReadinessSnapshot: true });
  assert.equal(plan.status, "SELF_ASSESSMENT_ONLY");
  assert.deepEqual(plan.consumerBureaus, []);
  assert.deepEqual(plan.commercialBureaus, []);
  assert.equal(plan.apiCallsPermitted, false);
});

test("personal reports cannot be ordered on business-credit-only pathway", () => {
  const plan = planCreditReporting({ ...base, pathway: "BUSINESS_ONLY" });
  assert.equal(plan.status, "BLOCKED");
  assert.match(plan.reason, /personal reports/i);
});

test("commercial-only pathway can reach founder review with full evidence", () => {
  const { consumerPermissiblePurposeEvidenceId, ...business } = base;
  const plan = planCreditReporting({
    ...business, pathway: "BUSINESS_ONLY", consumerBureaus: [],
    commercialBureaus: ["DUN_BRADSTREET", "EQUIFAX_COMMERCIAL"],
  });
  assert.equal(plan.status, "REQUIRES_FOUNDER");
  assert.deepEqual(plan.consumerBureaus, []);
  assert.deepEqual(plan.commercialBureaus, ["DUN_BRADSTREET", "EQUIFAX_COMMERCIAL"]);
  assert.equal(plan.apiCallsPermitted, false);
});

test("consumer credit report requires independently verified FCRA purpose", () => {
  const plan = planCreditReporting({ ...base, consumerPermissiblePurposeEvidenceId: "" });
  assert.equal(plan.status, "BLOCKED");
  assert.match(plan.reason, /FCRA permissible purpose/i);
});

test("unverified reporting contract blocks requests", () => {
  assert.equal(planCreditReporting({ ...base, providerContractEvidenceId: undefined }).status, "BLOCKED");
});

test("authorization alone cannot substitute for a reporting purpose", () => {
  assert.equal(planCreditReporting({
    ...base, authorizedUseEvidenceId: "", consumerPermissiblePurposeEvidenceId: "",
  }).status, "BLOCKED");
});

test("report necessity and lender fit must be evidenced before costs", () => {
  assert.equal(planCreditReporting({ ...base, lenderFitEvidenceId: "" }).status, "BLOCKED");
  assert.equal(planCreditReporting({ ...base, reportNeedEvidenceId: "" }).status, "BLOCKED");
});

test("privacy and disclosure clearance required", () => {
  assert.equal(planCreditReporting({ ...base, complianceClearanceEvidenceId: "" }).status, "BLOCKED");
  assert.equal(planCreditReporting({ ...base, applicantAuthorizationEvidenceId: "" }).status, "BLOCKED");
});

test("blank assessment, missing reports, unknown bureaus, and duplicates block", () => {
  assert.equal(planCreditReporting({ ...base, assessmentId: "" }).status, "BLOCKED");
  assert.equal(planCreditReporting({ ...base, consumerBureaus: [], commercialBureaus: [] }).status, "BLOCKED");
  assert.equal(planCreditReporting({ ...base, consumerBureaus: ["UNKNOWN"] }).status, "BLOCKED");
  assert.equal(planCreditReporting({ ...base, consumerBureaus: ["EXPERIAN", "EXPERIAN"] }).status, "BLOCKED");
});

test("three-bureau consumer selection does not execute a credit pull", () => {
  const plan = planCreditReporting({
    ...base, consumerBureaus: ["EXPERIAN", "EQUIFAX", "TRANSUNION"], commercialBureaus: [],
  });
  assert.equal(plan.status, "REQUIRES_FOUNDER");
  assert.equal(plan.apiCallsPermitted, false);
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(Object.isFrozen(plan.consumerBureaus), true);
});
