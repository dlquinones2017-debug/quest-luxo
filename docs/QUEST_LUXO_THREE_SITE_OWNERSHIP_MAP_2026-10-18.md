# QLux Enterprises — Three-Site Ownership and Verification Map
Updated: 2026-10-18
Status: Working architecture register; not a deployment declaration.

## Confirmed canonical public properties (founder supplied)
- Luxury Advisory: https://www.questluxo.com — watches / luxury advisory.
- Capital Advisory: https://capital.questluxo.com — capital advisory, funding discovery, readiness, and planned DIY credit education.
- Property Acquisitions: https://realty.questluxo.com — real-estate acquisitions and seller inquiry.
All three are separate, parallel workstreams within the Quest Luxo / QLux Enterprises brand universe. The founder reports creating Capital and Realty via ChatGPT Work.

## Connected infrastructure verified so far
- GitHub repository dlquinones2017-debug/quest-luxo is tied to Render service quest-luxo-production, appropriate to Luxury Advisory.
- Existing capital-agent planning code in that repository is **not** evidence that this repo deploys capital.questluxo.com.
- The separate source-of-truth repos, site project IDs, and hosting/deployment routes for capital.questluxo.com and realty.questluxo.com remain UNCONFIRMED. Do not guess a Render service, copy source into a new repo, or modify Luxury deployment for either subdomain.

## Enterprise-wide content-trust contract (to implement in each confirmed deployment)
Every externally displayed changing assertion (credit bureau inquiry and reporting, underwriting eligibility, rates, provider programs, luxury pricing/availability, realty/local rules) must have an attributable primary source or independently documented direct issuer confirmation, verification timestamp, next review deadline, content owner, and disclosure clearance. Unknown, disputed or stale details MUST NOT be presented as current facts. Separate provider facts from suggestions, estimates, educational information and lender decisions. Regulated statements need applicable legal review. No guaranteed approvals, false bureau-pull assertions, or fabricated inventories/data.

The `src/lib/trust/verifiedClaims.ts` module in this feature branch provides a fail-closed review utility for recorded evidence. It does NOT monitor websites, automatically refresh claims, prove sources are true, or deploy to the other two sites. Connected-site integration will require their authoritative ChatGPT Work artifacts and confirmed deploy mechanisms. Scheduled checking, source-change detection, human review, and audit logs are follow-on implementation requirements.

## Deployment separation
1. Luxury code may change only through its established repo and verified production pipeline.
2. Capital service and credit-learning features belong only in the independently confirmed Capital codebase/project after its source-of-truth is located.
3. Realty acquisition features belong only in the independently confirmed Realty codebase/project.
4. Shared brand standards may be copied/adapted after each site's source and CI are confirmed; never silently duplicate an entire site or merge unrelated deployment pipelines.

## Current constraints
- The Capital DIY learning path and consumer self-help educational module are draft code in PR #63, not live on any public property.
- Consumer credit pulls, lender submissions, paid or managed credit repair and credit-product applications remain DISABLED without appropriate legal, vendor, security and founder review.
- Do not present the three subdomains as technically connected until integration and deploy evidence exists.
