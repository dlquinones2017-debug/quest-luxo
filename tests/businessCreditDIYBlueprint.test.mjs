import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBusinessCreditDIYBlueprint,
  listVerifiedBusinessCreditProducts,
} from "../src/lib/capital/businessCreditDIYBlueprint.ts";

const base = {
  productId: "EXAMPLE-PRODUCT-1",
  issuerName: "Example Issuer (fictional test fixture)",
  productName: "Example Business Credit",
  kind: "BUSINESS_CREDIT_CARD",
  consumerBureaus: ["EXPERIAN_CONSUMER"],
  commercialBureaus: ["DUN_BRADSTREET"],
  guaranteeRequirement: "REQUIRED",
  eligibilitySummary: "Test-only eligibility conditions; not actual lender terms.",
  evidenceStatus: "VERIFIED",
  consumerInquiryEvidenceConfirmed: true,
  commercialReportingEvidenceConfirmed: true,
  evidenceUrl: "https://example.org/fixture",
  verifiedAt: "2026-10-15",
  reviewDueAt: "2026-10-20",
};

const select = (records, day = "2026-10-18", kind, pg) =>
  listVerifiedBusinessCreditProducts(records, day, kind, pg);

test("verified, source-backed fixture remains an educational comparison entry", () => {
  const selected = select([base]);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].productId, base.productId);
  assert.equal(Object.isFrozen(selected), true);
});

test("malformed and impossible calendar days cannot create verification", () => {
  for (const bad of ["2026-02-30", "2026-13-01", "2026-00-01", "2026-2-03", "not-a-date"]) {
    assert.throws(() => select([base], bad), /Valid ISO calendar/);
    assert.deepEqual(select([{ ...base, verifiedAt: bad }]), []);
    assert.deepEqual(select([{ ...base, reviewDueAt: bad }]), []);
  }
});

test("future review evidence and stale evidence fail closed", () => {
  assert.deepEqual(select([{ ...base, verifiedAt: "2026-10-19" }]), []);
  assert.deepEqual(select([{ ...base, reviewDueAt: "2026-10-17" }]), []);
  assert.deepEqual(select([{ ...base, reviewDueAt: "2026-10-14" }]), []);
});

test("duplicate IDs suppress every version, including conflicting stale copy", () => {
  const selected = select([
    base,
    { ...base, issuerName: "Different Test Issuer", evidenceStatus: "STALE" },
  ]);
  assert.deepEqual(selected, []);
  assert.deepEqual(select([{ ...base, productId: "Same" }, { ...base, productId: "same" }]), []);
});

test("duplicate issuer/product identity suppresses entries despite distinct IDs", () => {
  assert.deepEqual(select([
    base,
    { ...base, productId: "EXAMPLE-PRODUCT-2" },
  ]), []);
});

test("unverified status and missing explicit bureau review are never published", () => {
  for (const changes of [
    { evidenceStatus: "UNVERIFIED" },
    { evidenceStatus: "STALE" },
    { consumerInquiryEvidenceConfirmed: undefined },
    { consumerInquiryEvidenceConfirmed: false },
    { commercialReportingEvidenceConfirmed: undefined },
    { commercialReportingEvidenceConfirmed: false },
    { evidenceUrl: "http://example.org/unsecured" },
    { evidenceUrl: "" },
    { guaranteeRequirement: "UNKNOWN" },
    { consumerBureaus: ["DUN_BRADSTREET"] },
    { commercialBureaus: ["EXPERIAN_CONSUMER"] },
  ]) assert.deepEqual(select([{ ...base, ...changes }]), []);
});

test("explicit reviewed absence of a consumer inquiry remains distinct from missing review", () => {
  const noInquiry = { ...base, consumerBureaus: [] };
  assert.equal(select([noInquiry]).length, 1);
  assert.deepEqual(select([{ ...noInquiry, consumerInquiryEvidenceConfirmed: false }]), []);
});

test("no-personal-guarantee preference only shows affirmatively verified no-PG terms", () => {
  assert.deepEqual(select([base], "2026-10-18", undefined, "PREFER_NO_PG"), []);
  assert.equal(select([{ ...base, guaranteeRequirement: "NOT_REQUIRED" }],
    "2026-10-18", "BUSINESS_CREDIT_CARD", "PREFER_NO_PG").length, 1);
  assert.deepEqual(select([base], "2026-10-18", "EQUIPMENT_FINANCING"), []);
});

test("DIY startup guidance cannot pull credit, submit applications or promise approval", () => {
  const bp = buildBusinessCreditDIYBlueprint({
    profileId: "NON-SENSITIVE-SESSION-1",
    stage: "NEW_BUSINESS",
    guaranteePreference: "PREFER_NO_PG",
    businessRegistered: false,
    einObtained: false,
    businessBankAccount: false,
    dunsFileLocated: false,
    hasVerifiedReportingTradeline: false,
    capacityToRepayReviewed: false,
  });
  assert.equal(bp.creditPullPermitted, false);
  assert.equal(bp.automatedApplicationPermitted, false);
  assert.equal(bp.guaranteedApproval, false);
  assert.ok(bp.steps.some(s => s.id === "NO_PG"));
  assert.ok(bp.steps.some(s => s.id === "STACKING_SAFETY"));
});
