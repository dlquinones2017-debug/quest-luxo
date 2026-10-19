# Sprint 02 — Secure Enterprise Lead Intake Integration & Reliability

Primary command chat: PRIMARY Quest Luxo Enterprises — Enterprise Agentic Team Development & Command Work (`01a15231-d15e-7f81-936d-22f4aa7a8f91`). Continuation of Agentic Team Development, not a new enterprise project. Audit performed October 18, 2026 America/New_York (October 19 UTC). One active change stream; stop after this sprint.

## Preserved baseline

PR #64 is merged at `472d521bd268c4ecb2ea2457ec48af818b5f9fb9`, confirmed through GitHub and the clean main checkout. Render deploy `dep-dbaookp42hec73drl5cg` for that commit was live, finished `2026-10-19T03:20:38.304199Z`. Existing revenue/operations agents, canonical stores, revenue math, Founder Revenue Queue and evidence gates are reused. The dirty Desktop checkout was inspected and preserved; this sprint uses a clean branch `codex/sprint02-secure-lead-intake`.

## Evidence-backed hosting and forms inventory

| Division | Hosting/source identity | Live intake observed | Evidence limit |
| --- | --- | --- | --- |
| Luxury Advisory | GitHub `dlquinones2017-debug/quest-luxo`; Render service `srv-d9h9btsvikkc73ahrff0`, Quest Luxo workspace `tea-d9d67qb7uimc73fltuag`; main auto deploy enabled | `https://questluxo.com/begin-your-quest/`; browser DOM and existing source inspected; JavaScript posts JSON to `/api/leads/submit` | No submission sent; browser-native form attributes alone do not describe the JavaScript submission path |
| Capital Advisory | ChatGPT Sites project `appgprj_6ac99831460c8191a3f1551b92002b16`; version 4; source commit `b281f1ab03f2405b9ffa251e7dcc41af33746754`; deployment `appgdep_6ad11309359c819188bc2786f541c5e1` | `https://capital.questluxo.com/`; `inquiry-form`, POST to `https://formsubmit.co/denzel@questluxo.com`; hidden subject/template/captcha/next fields and contact fields observed | Separate Sites-managed source, not assumed to belong to the main GitHub repository or Render workspace |
| Realty/Property Acquisitions | ChatGPT Sites project `appgprj_6aca9f319bdc8191aa7508587e80c817`; version 3; source commit `b90648f2b8ae5a19d58aa5ec702c0b73fbda60e5`; deployment `appgdep_6ad112365da08191a082cd8f3df153f3` | `https://realty.questluxo.com/`; `leadForm`, POST to the same FormSubmit corporate mailbox endpoint; hidden subject/template/next/honeypot/market-source and property fields observed | Same separate-hosting boundary; no forms changed |

Sites native account inventory, version records, and the earlier website-update chat confirm the two original static projects and `.openai/hosting.json` manifests pointing to `dist`. Exact underlying Git transport URLs were not exposed by the read-only inventory; no new repository-write credentials were requested merely to inspect them. No independent GitHub repository binding is asserted for either project. The `www` URLs in the handoff were unavailable through the web-fetch tool; the apex URLs above were inspected successfully in the connected browser. This does not diagnose the `www` aliases as broken.

## Delivery, retention and runtime audit

- Corporate Gmail search `in:anywhere (formsubmit OR from:formsubmit.co)` returned four messages: a submission receipt and activation notice for each division, dated October 10. All four currently have the Trash label. Submission receipts reached Gmail at `2026-10-10T19:41:05Z` (Capital) and `2026-10-10T21:46:43Z` (Realty). Their Google receiver authentication reports DKIM/SPF/DMARC pass for `formsubmit.co`. These are historical test-like examples, not qualified client opportunities. Activation notices are excluded. Earlier limited searches did not establish non-delivery.
- A separate bounded search found four Luxury notification examples with Google authentication results including the Quest Luxo `resend` DKIM selector; three currently have Inbox labels and one Trash. No exact one-to-one correlation with stored production records is asserted from aggregate counts.
- Render environment inspection confirmed `LEAD_STORAGE_DIRECTORY=/var/data`; disk mount is `/var/data`, capacity 1 GB. A read-only command in the existing production web shell confirmed the resolved file is `/var/data/leads.jsonl`, actual mount present, mode `600`, 3,257 bytes, four records, zero malformed rows; delivery status counts: sent 4, failed 0, skipped 0, unknown 0. Email API host is `api.resend.com`. No source payloads, credentials or provider responses were printed by this runtime command.
- Startup readiness log at `2026-10-19T03:20:27.969989354Z` confirms the production readiness check ran. Source shows storage-first submission, notification result persistence, configured broker access protection and a writable-directory startup probe. Continuous monitoring and per-message inbox correlation remain separate checks.
- Render's disk dashboard showed seven selectable snapshots dated October 12–18. **No production snapshot was restored. Independent encrypted backup, retention policy, recovery point/recovery time objectives and an isolated restore of actual production backup remain unverified. Storage is not declared durable or recoverable.**
- The existing backup/restore operator is exercised with an isolated synthetic local fixture, byte/hash equality and overwrite refusal. This verifies code behavior only, not production backup recovery.

## Implemented contract and integration

`enterpriseLeadIntakeAdapter.ts` adds an optional Gmail metadata reader and a gated intake function. No credentials, timers, webhook, route, scheduler or default reader activation is installed. `founderApproved` and exactly the `gmail.metadata` scope are required before reading. The credential must actually be provisioned with that scope; a policy object cannot reduce an overprivileged OAuth token. The fixed Google transport performs GET only, rejects redirects, requests metadata headers, never fetches bodies/attachments, and sanitizes read failures. Gmail metadata scope cannot use the `q` search parameter; pages are bounded at 100 and pagination remains explicit. Metadata-only mailbox enumeration still needs specific founder authorization and an approved operating cadence.

Provider provenance requires the corporate account/profile and recipient, exact provider mailbox, a Google receiver trace, one unambiguous receiver authentication header with passing aligned DKIM/SPF/DMARC, a valid provider RFC Message-ID and nonfuture Gmail internal timestamp. Ambiguous/missing/failed headers are rejected. Parser checks are conservative receiver evidence over authenticated Gmail transport, not a home-grown DKIM cryptographic verifier. Arbitrary caller-supplied metadata must never reach this trusted adapter boundary in a public route.

Authentication does not prove which website originated the data. Current forms share one public recipient endpoint. Subjects, Referer/body URLs, hidden division fields and client text are not authoritative mappings. Each accepted message requires an independently reviewed internal mapping of hashed Gmail identity, hashed RFC Message-ID, division and opaque approval evidence. No real messages were automatically mapped or ingested. A provider-signed per-form source mechanism could replace the manual mapping only after verification and approval. Qualification always stays UNKNOWN; neither email content nor provider acceptance qualifies a borrower or seller.

Checkpoint output holds hashed resource/RFC identifiers and metadata fingerprints only. Duplicates/replays are suppressed across pages/polls. Division/identity/timestamp conflicts quarantine the page and preserve the prior checkpoint. Read failures emit no receipts and do not advance the page. Returned receipts and checkpoint must be consumed atomically by an authorized caller: persist the checkpoint only after successful handoff to the existing canonical system. A caller must retain already handed-off receipts through its approved canonical evidence path; each batch is a delta, not a complete historical snapshot. No separate CRM, opportunity ledger or action queue was created. Checkpoint persistence/encryption, access controls, expiry/retention and atomic handoff are external activation dependencies; pruning replay protection without a bounded rescan policy is unsafe.

Luxury metadata adapts existing stored records, retains canonical identity, strips payload/provider response/error text, and distinguishes provider acceptance, failure and unknown status. The existing live/stored Enterprise Revenue Brief accepts optional trusted intake receipts. Canonical commercial records take precedence, intake identities deduplicate without replacing authoritative economics, and new verified receipts enter the existing Founder Revenue Queue with unknown economics and qualification. Default production readers remain unchanged.

`enterpriseLeadReliability.ts` returns internal metadata reports for collection coverage/read error/partial/stale/unknown, receipt timestamps, failed/unknown notifications and provider acceptance. No observed submissions never implies form failure. Missing/future observation times are unknown, not overdue. Default 24-hour staleness is a configurable report threshold, not an approved SLA. Inbox delivery and retention require separate evidence. Reports are library functions, not an activated dashboard or alert service.

Privacy hardening removes raw malformed stored rows/parser messages and raw caller/provider exception text from the existing lead API logs. Public form behavior and response contracts are preserved. Existing stored client records/provider responses are not rewritten; access, minimization and retention of original source data require a separate approved policy. The audit's early email read exposed full historical messages/activation links in private chat tool output; none were copied into GitHub or repository files. Subsequent output was filtered.

## Security/privacy review and acceptance

Reviewed threat cases: forged display names and lookalike domains, duplicate/contradictory authentication headers, redirected transport, wrong corporate account, substituted message identities, activation mail, subject/body source claims, replay/cursor failure, conflicting source mappings, canonical identity collisions, future/missing timestamps, PII in provider failures and malformed records, and unauthorized token scopes. No autonomous external action or authoritative commercial record mutation is added. Founder gates remain required.

Deterministic tests cover honest zero state; both FormSubmit divisions; custom Luxury path; authenticated and spoofed provenance; duplicates/replays; conflicts; unknown evidence; delivery errors; privacy/non-mutation; shared cross-division brief; synthetic backup restore; and transport restrictions. Quality runs the full suite/check/build; Enterprise Command acceptance explicitly includes the new integration test.

Validation and deployment evidence are recorded in the PR and final command-chat report. Pre-sprint main and live deploy are listed above to distinguish them from the Sprint 02 release. Existing build warning: public `robots.txt` takes precedence over the same-name route. Existing photo clearance gaps remain reported rather than treated as approved assets.

## Activation dependencies — founder decision required

1. Authorize runtime Gmail metadata automation specifically for the corporate mailbox, scope, cadence and operator; provision/reuse suitable credentials through a secure approved process. Existing chat Gmail connector access does not authorize a background production reader.
2. Approve a trusted per-message source mapping process or verify a provider-authenticated per-form source mechanism. Historical test-like messages must not become genuine commercial opportunities.
3. Establish encrypted minimal checkpoint/evidence retention and atomic handoff using existing canonical systems; set an owner and access/expiry policy. No replay history silently deleted.
4. Verify independent backups and isolated restoration of actual source data, without overwriting production. Approve recovery objectives and schedule only after evidence.
5. Approve explicitly labeled controlled submissions if current end-to-end delivery/retention testing is desired. None were transmitted in this sprint.
6. Approve owner/SLA/notification policy before continuous reliability monitoring. No silent background schedule created.

## Prioritized future roadmap — proposed, not started

| Priority/phase | Organization | Bounded outcome and evidence gate |
| --- | --- | --- |
| P0: Intake activation/recovery | Enterprise lead intelligence + shared Risk | Resolve the six activation dependencies; prove receipt-to-canonical handoff, provider acceptance, mailbox placement, replay protection and isolated production-backup restore. Preserve separate evidence gates. |
| P1: Luxury operations | Luxury Advisory | Qualification/consent review, sourcing ownership and exception follow-up over existing lead records; recommendation-only until founder decisions; no duplicate CRM. |
| P1: Realty operations | Realty/Property Acquisitions | Property facts/title/ownership review and acquisition underwriting with documented evidence; no automatic offer, valuation promise, contract or seller outreach. |
| P1: Capital operations | Capital Advisory | Business-purpose intake/consent, documentation readiness and verified lender onboarding criteria; no lending decision, introduction, application or credit pull without explicit approvals. |
| P2: Finance + Risk | Shared Finance/Risk | Reconcile approved source records to cash/revenue evidence, controls and forecasts; preserve UNKNOWN and separate advisory intelligence from accounting authority. Resume finance-agent expansion only after intake readiness gates. |
| P3: Chief of Staff | Shared Chief-of-Staff/operations | Compact founder brief, owner/SLA exceptions and dependencies using the existing revenue queue and Waves 1–4; approve escalation policy before automation. |
| P4: Controlled delegation | Three divisions + enterprise command | Approve specific limited actions, monitoring, rollback and audit checkpoints individually; no general external-action authority inferred. |

Each future sprint begins with a compact checkpoint: approved scope, current source commit/deploy, evidence changes since the prior checkpoint, one active branch, tests/CI, deployment versus code-only status, remaining decisions, and a stop condition. Do not repeat this inventory unless hosting/forms/configuration changed.
