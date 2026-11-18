import test from "node:test";
import assert from "node:assert/strict";
import { reviewUniversalCapitalIntake } from "../src/lib/capital/universalCapitalIntake.ts";

const base = {
  intakeId: "INTAKE-TEST-1",
  pathway: "PERSONAL_AND_BUSINESS",
  program: "WORKING_CAPITAL",
  requestedAmount: 50000,
  timeInBusinessMonths: 36,
  revenueBand: "100K_TO_499K",
};

test("complete self-reported business intake routes to internal review only", () => {
  const review = reviewUniversalCapitalIntake(base);
  assert.equal(review.status, "READY_FOR_INTERNAL_REVIEW");
  assert.deepEqual(review.missingFields, []);
  assert.equal(review.creditPullPermitted, false);
  assert.equal(review.lenderSubmissionPermitted, false);
  assert.equal(review.approvalOrPrequalificationGranted, false);
  assert.equal(Object.isFrozen(review), true);
});

test("business-only option never enables a personal credit pull", () => {
  const review = reviewUniversalCapitalIntake({
    ...base, pathway: "BUSINESS_ONLY", program: "BUSINESS_LINE_OF_CREDIT",
  });
  assert.equal(review.status, "READY_FOR_INTERNAL_REVIEW");
  assert.match(review.warnings.join(" "), /does not authorize consumer reports/i);
  assert.equal(review.creditPullPermitted, false);
});

test("startup with no reported revenue can be reviewed without invented history", () => {
  const review = reviewUniversalCapitalIntake({
    ...base, pathway: "BUSINESS_ONLY", program: "BUSINESS_STARTUP",
    timeInBusinessMonths: 0, revenueBand: "NONE",
  });
  assert.equal(review.status, "READY_FOR_INTERNAL_REVIEW");
  assert.match(review.warnings.join(" "), /startup-eligible/i);
});

test("investment real estate pathway requires location and investment intent", () => {
  const missing = reviewUniversalCapitalIntake({
    ...base, pathway: "REAL_ESTATE_GUARANTOR",
    program: "INVESTMENT_PROPERTY_PURCHASE",
  });
  assert.equal(missing.status, "NEEDS_INFORMATION");
  assert.ok(missing.missingFields.includes("propertyState"));
  assert.ok(missing.missingFields.includes("investmentUseConfirmed"));
  const complete = reviewUniversalCapitalIntake({
    ...base, pathway: "REAL_ESTATE_GUARANTOR",
    program: "INVESTMENT_PROPERTY_PURCHASE",
    propertyState: "GA", investmentUseConfirmed: true,
  });
  assert.equal(complete.status, "READY_FOR_INTERNAL_REVIEW");
  assert.equal(complete.lenderSubmissionPermitted, false);
});

test("rejects personal/consumer real estate use on investment workflow", () => {
  const review = reviewUniversalCapitalIntake({
    ...base, pathway: "REAL_ESTATE_GUARANTOR",
    program: "INVESTMENT_PROPERTY_REFINANCE",
    propertyState: "GA", investmentUseConfirmed: false,
  });
  assert.equal(review.status, "NEEDS_INFORMATION");
  assert.ok(review.missingFields.includes("investmentUseConfirmed"));
});

test("real estate pathway cannot be routed as a general business program", () => {
  const review = reviewUniversalCapitalIntake({
    ...base, pathway: "REAL_ESTATE_GUARANTOR",
    program: "WORKING_CAPITAL",
  });
  assert.equal(review.status, "NEEDS_INFORMATION");
  assert.ok(review.missingFields.includes("realEstateProgram"));
});

test("invalid program, amount, months, and revenue band require correction", () => {
  const review = reviewUniversalCapitalIntake({
    ...base, program: "UNKNOWN", requestedAmount: Number.NaN,
    timeInBusinessMonths: -1, revenueBand: "GUESS",
  });
  assert.equal(review.status, "NEEDS_INFORMATION");
  for (const key of ["program", "requestedAmount", "timeInBusinessMonths", "revenueBand"]) {
    assert.ok(review.missingFields.includes(key));
  }
  assert.equal(review.creditPullPermitted, false);
});

test("no intake identifier or pathway creates a valid submission", () => {
  const review = reviewUniversalCapitalIntake({
    ...base, intakeId: " ", pathway: "UNRECOGNIZED",
  });
  assert.equal(review.status, "NEEDS_INFORMATION");
  assert.ok(review.missingFields.includes("intakeId"));
  assert.ok(review.missingFields.includes("pathway"));
});

test("out-of-region and malformed property codes are blocked", () => {
  for (const propertyState of ["ZZ", "G", "ga", "USA"]) {
    const review = reviewUniversalCapitalIntake({
      ...base, pathway: "REAL_ESTATE_GUARANTOR",
      program: "INVESTMENT_PROPERTY_REHAB",
      propertyState, investmentUseConfirmed: true,
    });
    assert.ok(review.missingFields.includes("propertyState"));
  }
});
