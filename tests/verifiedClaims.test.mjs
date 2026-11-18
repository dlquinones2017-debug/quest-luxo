import test from "node:test";
import assert from "node:assert/strict";
import {
  reviewClaimForPublication,
  selectPublicClaims,
} from "../src/lib/trust/verifiedClaims.ts";

// Synthetic records exercise structural safeguards, not real-world fact verification.
const example = {
  id: "EXAMPLE-CLAIM-1",
  division: "CAPITAL_ADVISORY",
  category: "INSTITUTION_ELIGIBILITY",
  text: "Synthetic eligibility assertion for internal verification testing.",
  sourceKind: "ISSUER_OFFICIAL",
  sourceUrl: "https://example.org/synthetic-source",
  sourceEvidenceId: "INTERNAL-FIXTURE-1",
  evidenceState: "VERIFIED",
  humanReviewerId: "TEST-REVIEWER",
  verifiedOn: "2026-10-17",
  reviewDueOn: "2026-10-20",
  sourceChangedAfterVerification: false,
  editorialApproved: true,
  approvedForPublicDisclosure: true,
};

test("structurally complete current claim is only publication eligible, never auto-published", () => {
  const review = reviewClaimForPublication(example, "2026-10-18");
  assert.equal(review.status, "PUBLICATION_ELIGIBLE");
  assert.equal(review.autonomousPublishAllowed, false);
  const publicClaims = selectPublicClaims([example], "2026-10-18");
  assert.equal(publicClaims.length, 1);
  assert.equal(publicClaims[0].isFinancingApprovalOrCreditOffer, false);
});

test("expired, unverified, changed, or undisclosed claims are suppressed", () => {
  for (const change of [
    { reviewDueOn: "2026-10-16" },
    { verifiedOn: "2026-10-19" },
    { evidenceState: "UNVERIFIED" },
    { evidenceState: "CONFLICT" },
    { evidenceState: "RETRACTED" },
    { sourceChangedAfterVerification: true },
    { editorialApproved: false },
    { approvedForPublicDisclosure: false },
    { sourceEvidenceId: "" },
    { humanReviewerId: "" },
    { sourceUrl: "http://example.org/insecure" },
    { verifiedOn: "2026-02-30" },
  ]) {
    assert.deepEqual(selectPublicClaims([{ ...example, ...change }], "2026-10-18"), []);
  }
});

test("two claims sharing the same ID are both held pending reconciliation", () => {
  const conflicting = { ...example, text: "Contradictory synthetic issuer assertion." };
  assert.deepEqual(selectPublicClaims([example, conflicting], "2026-10-18"), []);
});

test("excessive review intervals and reversed dates fail closed", () => {
  assert.equal(reviewClaimForPublication({
    ...example, reviewDueOn: "2026-11-01",
  }, "2026-10-18").status, "HOLD_FOR_REVIEW");
  assert.equal(reviewClaimForPublication({
    ...example, reviewDueOn: "2026-10-16",
  }, "2026-10-18").status, "HOLD_FOR_REVIEW");
});

test("legal or regulatory assertions require counsel clearance", () => {
  const legal = { ...example, category: "LEGAL_OR_REGULATORY" };
  assert.equal(reviewClaimForPublication(legal, "2026-10-18").status, "HOLD_FOR_REVIEW");
  assert.equal(reviewClaimForPublication({
    ...legal, counselApproved: true,
  }, "2026-10-18").status, "PUBLICATION_ELIGIBLE");
});
