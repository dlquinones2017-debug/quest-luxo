# Sprint 03 — Founder intake reliability console and activation readiness

## Checkpoint

Continuation of the existing Enterprise Agentic Team project, authorized by the founder's instruction to continue development. Base: PR #65 merge `6af97d35ad2987d549020a60dfae1219bf908a38`, verified on `main`. Work uses the existing isolated clean checkout on `codex/sprint03-intake-readiness`; the unrelated dirty Desktop checkout remains untouched. No repeated website/mail audit was needed.

Scope: expose the existing Sprint 02 reliability report through the authenticated Founder Revenue Brief, correct its access-key transport, and prepare concrete decisions for intake activation/recovery. No new agent, CRM, opportunity store, revenue queue, background reader, credentials or public form integration is introduced. Stop after this bounded sprint; merge and production deployment require approval of the resulting PR.

## Problem and resulting behavior

The Founder Revenue panel fetched `/api/broker/revenue` without forwarding the access key used to open the console. In a protected production session, the panel could fail even while the rest of the broker console was authorized. Its response displayed revenue totals but did not surface Sprint 02's three-division intake coverage.

The panel now sends the existing key in an HTTP header to the fixed same-origin endpoint. It adds no token to that request's URL, refuses redirects, and prevents referrer and cache propagation. Existing query-key API clients remain compatible. The console response and the read endpoint set private/no-store and no-referrer headers. Anonymous/invalid credentials cannot invoke source readers. Only GET/HEAD are supported. Source read failures preserve the existing HTTP 500 error contract, expose no fabricated zero response and omit exception contents from logs. The endpoint moves from `revenue.astro` to the conventional `revenue.ts` API route while preserving `/api/broker/revenue`.

The existing JSONL adapter gains a read snapshot with COMPLETE, PARTIAL or MISSING plus an unreadable-row count. Existing array readers preserve their contract. Snapshot and records come from one file read; neither reader repairs, deletes nor rewrites source data. A present empty source is distinct from a missing source. Malformed rows remain excluded from the normalized record projection but are now visible as a partial source rather than silently healthy coverage.

The stored Enterprise Revenue Brief reads Luxury once for both canonical revenue and reliability. New report fields are additive. Capital/Realty retain DISABLED collection status by default; pre-existing commercial pipeline records do not prove that website inquiries are centrally collected. Plain intake batches are deltas, so they report partial coverage unless a trusted source supplies an observation snapshot. The existing canonical queue and commercial calculations are unchanged.

The same Founder panel shows three division rows with source coverage, observed receipt count, email-provider acceptance, failed/unknown notifications and evidence review guidance. Missing/unconnected counts stay Unknown. Partial totals are labeled observed lower bounds; financial totals stay Unknown when the saved source is incomplete. Old receipt dates do not imply overdue work. The UI distinguishes provider acceptance from inbox delivery, retention, recovery and qualification. It contains no start-ingestion button and opening the panel does not initiate Gmail access.

## Validation and review

- Deterministic tests cover missing versus empty source, malformed/partial source, byte preservation, one source read, Capital/Realty unconnected state, separate delivery statuses, unknown/future/old timestamps, partial/stale/failed observations, non-mutation, canonical identity reuse, actual authenticated client-to-handler flow, query compatibility, no reads on unauthorized requests, method restrictions, cache/referrer protections and private error redaction.
- Existing revenue calculations, Founder actions and the Sprint 02 ingestion/provenance/replay acceptance tests remain in regression coverage.
- The local browser preview uses an isolated fixture directory and a disposable local-only access key. A failed notification, partial source, missing source and present empty source were checked; no production client record or form was used. The real local endpoint returned HTTP 200 for authorized reads and 401 anonymously. Desktop layout was visually inspected. At a 390-pixel viewport, the page remained within its viewport and the wide table scrolled inside its container; keyboard focus and a scroll hint are provided. The scoped-style issue for dynamically generated table cells was found and corrected during visual review.
- Privacy review: new reliability DTOs contain aggregate counts/statuses only. Original client payloads, notes, provider responses and exception text are not projected into this report. Existing private revenue DTO behavior is preserved. No live mailbox access, test submission, production backup copy, recovery command or source-mapping change was performed.

Final test counts, CI, PR identity and release status are recorded in the command-chat execution report. Known pre-existing `robots.txt` build warning and unresolved photo-clearance gaps remain separate from intake readiness.

## Founder decisions prepared for the next operational step

These are proposals, not granted permissions or evidence of completion. Merge approval for this console does not authorize the operations below.

| Decision | Proposed bounded operation | Evidence/stop conditions |
| --- | --- | --- |
| Isolated recovery validation | Use the existing backup/restore operator against the actual Luxury lead source; copy and restore only into a unique, access-restricted recovery-validation directory. Never target the active lead file or restore a Render disk snapshot in place. | Before execution, approve exact source/backup/restore paths and cleanup/retention. Record only counts, permissions and SHA-256 equality; abort on source changes, unreadable rows or any path collision. An on-disk test proves this copy/restore path only, not independent backup or disaster recovery. |
| Independent backup and recovery objectives | Select an approved independently retained encrypted backup destination, accountable owner, retention period, RPO and RTO, then test restoration in isolation. | No existing independent backup or actual production recovery test is asserted. Credentials, destination, retention and data transfer require specific approval before provisioning or copying. Platform snapshots alone do not close the gate. |
| Read-only Gmail pilot | Corporate mailbox `denzel@questluxo.com`, Gmail metadata-only scope, first run manually triggered; no sending, bodies, attachments or mailbox mutations. | Verify the actual credential's granted scope and mailbox identity before use. Existing chat connector access is not permission for a production worker. No production credential or schedule is configured in this sprint. |
| Source attribution | Begin with reviewed mappings for specific authenticated submission receipts; exclude activation notices and historical test-like messages from genuine opportunities. | Pin the hashed Gmail resource identity and RFC Message-ID with division and approval evidence. Shared recipient endpoints, subjects, hidden fields and body URLs cannot establish trusted form origin. Any provider-authenticated alternative must be verified separately. |
| Retention and handoff | Define minimal encrypted checkpoint/evidence retention, ownership and atomic handoff using the existing canonical architecture. | Do not activate a cursor that can advance before successful canonical handoff. Do not prune replay history without a bounded rescan policy. No parallel lead/opportunity store is authorized. |
| Collection cadence and notification policy | After a successful manual pilot, approve a bounded cadence, operator and escalation threshold; suggest 15 minutes for collection review subject to founder choice. | A suggested cadence is not a schedule. Notify on meaningful read/delivery failure or required action; absence of observed submissions is not a form failure. No autonomous outreach or qualification. |
| End-to-end live submissions | Founder approves a clearly labeled controlled submission per website, destination and permitted source retention/cleanup. | No submission is sent without that approval. Compare provider acceptance, mailbox placement, source retention and canonical receipt separately. |

## Next checkpoint

After this PR is reviewed, request explicit merge approval because main auto-deploys to Render. Then verify the merge commit, required checks, Render deployment and read-only protected route behavior. Continue to hold Gmail activation, live submissions and production recovery testing for their specific decisions. Do not begin Finance/Risk or Chief-of-Staff expansion until intake readiness gates are resolved or the founder explicitly reprioritizes them.
