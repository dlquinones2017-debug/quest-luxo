# Quest Luxo Watches MVP Audit

**Program:** PROGRAM-001 — Quest Luxo Watches MVP Completion

**Updated:** July 28, 2026

**Branch:** `codex/p0-collection-architecture`

**Scope:** Critical and High-priority launch remediation
**Current decision:** **CONDITIONAL NO-GO — external production and email verification pending**

## Executive Summary

All seven Critical findings from the initial audit now have repository-controlled
remediation and regression protection. Collection navigation is canonical and
route-safe, missing source image paths no longer ship, the public intake has
durable persistence and proportionate abuse controls, the legal foundation is
published and linked at collection, production startup fails closed, and the
development playground is excluded.

Two external release gates cannot be represented as complete by source code:

1. Apply the deployment to the confirmed Render workspace and validate the
   persistent disk, health checks, monitoring, backup destination, and restart
   persistence.
2. Configure the verified sending domain and recipients, then validate SPF,
   DKIM, DMARC, provider acceptance, inbox/spam placement, and operational
   ownership with a production smoke inquiry.

No Critical source-code blocker remains. The MVP remains a no-go for public
traffic until both external gates are evidenced and this audit is updated.

All eleven High-priority findings are also complete in repository-controlled
scope. The public experience now uses one collection architecture, one route
contract, a shared metadata and structured-data baseline, accessible global
interaction defaults, optimized launch assets, exhaustive route/link
regression coverage, and a CI quality gate.

## Critical Findings

### C-01 — Broken Collection and Reference Links

**Status:** Remediated and verified.

- Every collection and reference is generated from one registry.
- Shared route builders lowercase and encode all route segments.
- Factory cards use the shared reference builder.
- The dormant leaderboard no longer concatenates a hard-coded collection path.
- Production-route tests cover all 22 watch houses, every registered collection,
  every registered reference, CTA routes, redirects, and the custom 404.
- No `undefined` segment or uppercase reference route is emitted by the tested
  production build.

### C-02 — Watch Images Are Absent

**Status:** Remediated for launch integrity; reference-specific photography is a
post-launch content enhancement.

- All 44 dead Rolex image paths were removed from live asset records.
- Every record without verified, rights-cleared photography resolves to the
  intentional Quest Luxo reference illustration.
- The illustration is a local 960 × 960 SVG with accessible title and
  description.
- Reference cards declare intrinsic dimensions, lazy loading, and asynchronous
  decoding.
- Tests fail if the removed `/images/rolex/` paths return to current source data
  without an explicit asset migration.

This remediation prevents broken or misleading product photography while
preserving an honest, consistent launch presentation. Reference-specific
rights-cleared photography may replace the illustration only through the
existing `imageVerified` gate.

### C-03 — Production Environment Is Not Ready or Verified

**Status:** Repository remediation complete; external verification pending.

- `render.yaml` defines a Node web service, health check, paid persistent disk,
  production mode, and required secret boundaries.
- Production startup runs a synchronized storage write probe and refuses to
  start when any critical setting is absent.
- `/api/health` fails closed in a misconfigured production environment.
- The local production readiness probe passed with a writable isolated
  directory and complete non-secret test configuration.
- Backup verification, timestamped backup, protected restore, and pre-restore
  preservation are implemented and tested.
- Production operating guidance defines monitoring, backup, restore, and
  incident-response expectations.

**External evidence required:** confirmed Render target, live deployment,
persistent-disk mount, production secrets, restart persistence, monitoring,
backup copy, and restore drill.

### C-04 — Lead Notification and Contact Delivery Are Unverified

**Status:** Repository remediation complete; external verification pending.

- Lead records are synchronized to durable storage before notification begins.
- Provider delivery uses an explicit API URL, secret key, verified-from address,
  configured recipients, reply-to client address, and an eight-second timeout.
- Provider failure cannot discard a persisted lead and emits an operator-visible
  error containing the lead ID without logging the inquiry body.
- The client receives a one-business-day response expectation and a direct email
  fallback.
- Production startup requires provider, sender, recipient, and contact settings.

**External evidence required:** verified domain, SPF, DKIM, DMARC, provider log,
inbox and spam placement, reply-to behavior, confirmed recipients, failure
alert, and named daily owner.

### C-05 — Public Personal-Data Collection Lacks Legal Foundation

**Status:** Remediated.

- Privacy Policy and Terms of Use are published as canonical public routes.
- The Privacy Policy explains collected fields, technical abuse identifiers,
  purpose, service providers, security, retention, and request pathways.
- General inquiry retention is defined as up to 24 months, subject to active
  engagement, fraud, dispute, and legal requirements.
- The collection form links both notices immediately before submission.
- About and Transaction Standards pages clarify independent status, transaction
  boundaries, diligence, payment verification, and client authority.
- A global footer exposes legal, company, contact, and transaction links.

The content requires normal executive/legal ownership, but the prior absence of
public notice and collection-point disclosure is closed.

### C-06 — Lead Endpoint Abuse Protection Is Not Verified

**Status:** Remediated and locally verified.

- Production same-origin and Fetch Metadata validation.
- JSON-only requests.
- Declared and measured 16 KiB hard request-body limit.
- Hidden bot field and minimum/maximum form-completion window.
- Bounded input fields and server-side validation.
- Keyed SHA-256 client identifier; raw client addresses are not persisted.
- Five attempts per 15-minute in-process window with `429` and `Retry-After`.
- Bounded limiter cleanup, generic client errors, no-store responses, and
  operator logs.
- Operating guidance requires an edge/WAF rule if observed traffic exceeds the
  single-instance application control.

Local production smoke checks returned `403` for cross-origin submission and
`413` for an oversized body.

### C-07 — Development Route Is in the Production Artifact

**Status:** Remediated and verified.

- No `/dev/ask-quest-luxo` source route exists in this branch.
- The production server returns `404` for the prior route.
- Regression coverage fails if that source route returns.
- The dedicated development bundle is absent from the validated build.

## High-Priority Findings

| ID | Finding | Status | Verification |
| --- | --- | --- | --- |
| H-01 | Collection activation and route availability | Complete | All 22 watch houses, registered collections, and references resolve from the shared registry. |
| H-02 | Universal shared collection architecture | Complete | Only the brand, collection, and reference dynamic routes remain; all collections inherit the canonical shared experiences. |
| H-03 | Shared search, filter, and sorting behavior | Complete | Automated contracts and manual Daytona interaction checks passed. |
| H-04 | SEO baseline | Complete | Canonicals, descriptions, Open Graph, Twitter images, Organization/WebSite/page schema, breadcrumbs, sitemap, and robots are present and tested. |
| H-05 | Trust foundation | Complete | About, Contact, Transaction Standards, Privacy, Terms, and the global footer are published and linked. |
| H-06 | Accessibility contrast and touch targets | Complete | Low-contrast public text tokens were removed; focus, reduced-motion, control sizing, and responsive overflow contracts passed. |
| H-07 | Global styling foundation | Complete | Shared color, typography, form, image, focus, and motion defaults now govern public layouts. |
| H-08 | Performance baseline | Complete | The unused 1.39 MB legacy logo was removed; the active logo is under 10 KB and key images declare intrinsic dimensions and loading priority. |
| H-09 | Route conflicts and legacy navigation | Complete | Production build reports no conflicts; valid legacy URLs redirect to canonical destinations. |
| H-10 | Route, link, metadata, and browser regression | Complete | Exhaustive production-server traversal, internal-link validation, responsive browser QA, and CI gates passed. |
| H-11 | Transitional Broker Console authentication | Complete | No public Broker Console or query-key authentication route ships; `/broker`, `/broker-console`, and query-key variants return 404. |

No High-priority source-code launch item remains open.

## Milestone Validation

### Milestone 1 — Route and Navigation Integrity

- Production navigation regression: passed.
- Watch houses covered: 22 of 22.
- Registered collection and reference routes: passed.
- Lowercase reference URLs: passed.
- Legal/lead routes and legacy redirects: passed.
- Custom 404: passed.

### Milestone 2 — Lead, Legal, and Abuse Boundary

- Sanitization and bounded fields: passed.
- Persistence-before-notification: passed.
- Notification failure durability: passed.
- Same-origin rejection: passed.
- Rate limit: passed.
- Body-size rejection: passed.
- Privacy/Terms notice at collection: passed.
- Backup and restore: passed.

### Milestone 3 — Asset and Production Artifact Integrity

- Dead live image references removed: 44 of 44.
- Intentional fallback route: HTTP 200.
- Intrinsic image dimensions: present.
- Development route: HTTP 404.
- Production readiness with complete test configuration: healthy.

### Milestone 4 — Full Local Verification

| Check | Result |
| --- | --- |
| `astro check` | 115 files; 0 errors, 0 warnings, 0 hints |
| Full Node test runner | 32 passed, 0 failed |
| `npm run build` | Passed |
| Build route conflicts | None |
| Production root | HTTP 200 |
| Contact | HTTP 200 |
| Privacy | HTTP 200 |
| Terms | HTTP 200 |
| Transaction Standards | HTTP 200 |
| Health | HTTP 200 |
| Former development route | HTTP 404 |
| Cross-origin lead request | HTTP 403 |
| Oversized lead request | HTTP 413 |
| Browser console/hydration errors | None observed |
| Mobile horizontal overflow at 390 × 844 | None observed |
| Tablet horizontal overflow at 820 × 1180 | None observed |
| Daytona search, filter, and sort | Passed |
| GMT-Master II mobile experience | Passed |
| Hublot Big Bang tablet and CTA routing | Passed |

## High-Priority Milestone Commits

1. `7a09477` — shared collection navigation and UX hardening.
2. `8f1e592` — SEO, accessibility, and performance baseline.
3. `5280534` — exhaustive launch regression and CI quality gates.

## Remaining Launch Gates

The remaining items are external operational evidence, not additional
application implementation:

1. Confirm the Render workspace and apply the committed deployment.
2. Set production secrets without exposing them to source or logs.
3. Verify domain email authentication and a real production notification.
4. Verify persistent lead storage across a service restart.
5. Produce an encrypted off-service backup and complete one restore drill.
6. Confirm production monitoring and the daily lead owner.

Until these are complete, the launch decision remains **CONDITIONAL NO-GO**.
