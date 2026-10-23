# Capital Advisory Expansion — Controlled Implementation Specification
Date: 2026-10-18
Status: Founder-authorized scope; implementation in increments. NOT production-ready or legal approval.

## Existing assets to preserve
- Existing Quest Luxo websites and GitHub repository. Do not replace or duplicate websites or enterprise workstreams.
- Existing `src/lib/capital/fundingAgents.ts` funding stages, verified-source ranking, hard-pull consent and founder gates.
- Existing `src/lib/agents/fundabilityAgent.ts` scoring; review compatibility before adding the expanded QCRS.
- Existing Airtable Quest Luxo Intelligence tables: Capital Sources, Fundability Assessments, Funding Compliance Gate. Do not replicate lender records or store SSNs and full consumer credit files in Airtable.
- Existing approved lenders and relationship lifecycle. Unknown facts remain unknown.

## Client journeys
1. Free Financial Advancement: free, self-reported readiness snapshot, credit education and goals; no credit pull. Optional referral to suitably qualified independent credit counseling.
2. Business growth/fundability advisory: permitted scope, clear engagements and pricing, no promise to qualify or fund.
3. Capital qualification: universal business-purpose application with dynamic sections for business-only, personal-plus-business, and investment-real-estate/guarantor products.
4. Capital brokerage: verified lender fit, consent, authorized reporting, compliance and human approval, controlled application submission, documented outcomes.

## Architecture gates
- Website front end collects minimum necessary information; minimize sensitive data and maintain authenticated session security, retention, data subject controls and consent version history.
- Validate business and product requirements from evidence before scheduling any paid credit report.
- Credit reporting integration is vendor-neutral. Target capabilities: optional consumer Experian/Equifax/TransUnion, commercial Experian Business/D&B/Equifax; a unified UX does not presume one vendor contract or API.
- Any consumer credit pull requires demonstrated FCRA permissible purpose independently of mere consent, vendor eligibility, explicit applicant authorization as applicable, disclosures, appropriate licensing/jurisdiction and security review.
- Any commercial bureau order requires authorized use and vendor contract, documented necessity, applicant/entity authorization and applicable legal review.
- `planCreditReporting` performs *planning only*: never imports vendor secrets, contacts a bureau or approves an actual query. External execution is a separately gated service after counsel and vendor approval.
- Identity documents, SSNs, financial statements and credit reports must not be placed in unrestricted Airtable records or plaintext logs.
- Lending match engine consumes verified lender criteria. A match and Quest Luxo readiness score are **not** approvals or predictions of approval; founder/human reviews external submissions.
- Proposed QCRS weights pending independent assessment: credit 20, financial 25, stability 15, financing capacity 20, documentation 10, transaction 10. Product-specific treatment required; evidence quality visible, missing data not treated as verified zero, fairness/accuracy testing required. Avoid creating a competing second score without reconciling existing `fundabilityAgent` and Airtable scores.
- No automatic lender submissions, money movement, acceptance of offers, or advertising of guaranteed outcomes.

## Client advisory, promotion and financial advancement boundaries
- Separate advisory contracts and compensation from permitted capital placement/referral work.
- Advisory package working prices ($149, $499, $799, $1,499) are proposed, not approved compliance-wise. Paid personal credit repair or dispute services remain DISABLED unless legally cleared, particularly for Georgia.
- Financial Advancement includes free education and third-party qualified counseling connections. Keep the consumer relationship while allowing independent provider choice. No undisclosed commissions.
- Capital Rewards: no incentives for financing referrals, approvals or restricted settlement services. Potential advisory-service-only rewards must pass counsel review before activation.
- Capital Opportunities: authentic, dated promotional offers; no fake scarcity, misleading countdowns, inaccurate savings or automatic recurring charges.
- Capital Access: free self-reported snapshot and optional legally reviewed advisory installment payments. Never pay-to-qualify or guarantee a loan.
- Client marketing requires opt-in/out handling and relevant email/SMS rules; avoid sensitive credit-based targeting.
- Three branches must be tested: verified-ready, incomplete-documentation, and not-ready with educational follow-up.

## Delivery milestones and acceptance criteria
1. **Foundation**: audit active site/repo/Airtable, preserve assets; add vendor-neutral credit-report plan and fail-closed tests (draft PR #63).
2. **Application**: versioned minimal-data universal intake UX and back-end validation, purpose-based conditional fields, privacy notices, consent events, and secure document upload design.
3. **Readiness**: reconcile scoring sources, implement explanation and progress views, no loan-approval claims; test missing/unverified data cases.
4. **Matching**: field-level mapping to verified Airtable lender boxes, stale-data hold, ranking rationale, human exception gate, no autonomous transmission.
5. **Advisory + access**: separate services, client resource library, legitimate offers, advisory billing only after reviewed agreements.
6. **Vendors**: obtain written quotes and authorized-use terms for iSoftpull, Soft Pull Solutions, CRS and direct commercial reporting providers. Evaluate one UX/multiple APIs and cost at 100/500/1000 monthly applications.
7. **Security/legal**: legal opinions by state and service, FCRA/consumer-report provider approvals, privacy and security review, vendor sandbox testing; only then implement live integrations behind disabled feature flags.
8. **Release**: independent review, CI, preview/staging QA, founder approval, confirmed Render workspace/service, controlled deployment and production smoke checks.

## Current boundaries
This specification is engineering planning, not a compliance finding, lender approval, or statement that features are deployed. No production config/deployments, paid vendor account activations, live consumer/commercial pulls, actual loan submissions, or regulated repair are authorized by this document.
