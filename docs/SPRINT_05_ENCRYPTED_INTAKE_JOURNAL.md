# Sprint 05 — Encrypted FormSubmit Intake Journal and Founder Read Bridge

**Date:** 2026-10-19 Eastern. **Release:** draft-only, pending review and explicit approval. **Baseline:** PR #67 merged on main (`b3443f2d1a1f849a3e196fa23a20949980cb008d`). This is part of the existing Quest Luxo Enterprise Agentic Team workstream; it does not replace or merge draft PR #68.

## Why

The Capital and Realty websites submit inquiries to the shared corporate Gmail address via FormSubmit. Sprint 02 introduced a conservative, founder-gated, metadata-only reader which can verify sender authentication and map individually reviewed message identities to an approved division. It returned receipts and a checkpoint but did not retain both durably. A cursor saved without its corresponding receipt can permanently suppress a revenue opportunity after a crash. A receipt saved without its cursor can repeat (which must be safe).

The new **journal** retains the verified opaque receipt metadata and its checkpoint in **one encrypted, atomic file replacement**, and exposes them to the existing Founder Revenue Brief through an optional read-only adapter. It does not fetch Gmail, read borrower documents, collect contact data or create a second CRM.

## Source boundaries

- Luxury Advisory continues using the original, canonical lead store and Founder queue. Its public form and storage are **not** changed here.
- Capital Advisory and Realty **continue using their existing Sites/FormSubmit forms**; this release does not install an always-on mailbox collector or change site hosting.
- No live source is assigned a division from subject line, raw email content, or user-entered form fields. Only separately founder-approved, verified metadata source mappings can produce eligible records.
- The journal accepts only `FORMSUBMIT` opaque receipts from the existing trusted adapter. All new receipts stay `qualificationVerification: UNKNOWN`, `notification: UNKNOWN`, `expectedRevenue: null`; no lender introduction, email reply or approval is inferred.
- The on-disk state must never be used to replace original borrower documentation or an independently managed accounting/CRM system.

## Implemented behavior

1. `enterpriseIntakeJournal.ts` validates 256-bit encryption keys, provenance-shaped metadata, opaque Gmail and RFC fingerprints, timestamps, division, approval identifiers and bounded storage.
2. AES-256-GCM encrypts all journal state with authenticated context, a random IV, ciphertext integrity verification and error redaction. Keys are **not created, saved or printed** by the library and must come from an approved secret manager on future activation.
3. Journal directory and file have private POSIX modes, exclusive shared-writer lock, temporary-file write, file sync, atomic rename and directory sync. A crashed writer can leave a lock; it must be operator-reviewed, not automatically stolen.
4. Revision/CAS check protects against stale concurrent commits. The retained checkpoint cannot discard or change older replay fingerprints. Malformed, tampered, conflicting or nondecrypted state fails closed without automatic reset/repair.
5. A metadata page and its checkpoint commit together; on any failed commit, consumers must replay from the previously persisted checkpoint. The journal retains receipts until a founder-approved archival/retention policy exists; it fails closed on capacity limits.
6. `enterpriseIntakeJournalBriefAdapter.ts` is an **opt-in** internal reader supplying existing `EnterpriseIntakeSnapshot` shapes. Presence of a retained journal is classified `PARTIAL` rather than a false complete inbox/source claim. Missing data is `SOURCE_MISSING`. The existing Founder model and canonical queue are reused.
7. No route, scheduler, Gmail token, automatic reader, public frontend, external message, mutation of lead sources, or production journal path was added. No live production account was accessed by tests.

## QA and release gate

- Automated unit/security tests: isolated concurrent writers and CAS, cross-division accumulation, key mismatch, encryption tamper, duplicate replay, original checkpoint preservation, malformed/PII rejection, POSIX modes, and no write when disabled.
- Founder-brief acceptance tests: missing journal, both divisions, unknown revenue, partial observations, wrong key failure, no read mutation.
- Required GitHub Quality: full regression, Astro/TypeScript validation, photography integrity checks and production build. Required Enterprise Command acceptance: existing command and lead safety tests. Read the specific **latest head SHA** before declaring these passed.
- **Release status: unmerged draft.** Even after a future merge, simply shipping these dormant modules will **not** activate Gmail or make Capital/Realty inquiry capture production-complete.
- Rollback: revert the specific PR; retain any separately authorized evidence journal for operator-directed backup/recovery. Never run a generic cleanup that removes active customer records or company email.

## Approval-dependent activation backlog

1. Approve an independent, encrypted backup destination, RPO/RTO, retention period, owner and tested isolated restore; the journal on a local disk is **not** independent disaster recovery.
2. Confirm source mapping policy for each verified FormSubmit receipt; exclude activation notices, ambiguous sender claims and historical tests.
3. Explicitly authorize and provision the correctly scoped corporate Gmail `gmail.metadata` credential to the production worker, separate from any chat connector. Confirm mailbox identity and authorization expiry.
4. Provision a stable AES-256-GCM key in approved secret storage with rotation/recovery plan and a private persistent mount; **never** commit secrets, tokens, messages or business PII.
5. Confirm first manual pilot, bounded number of pages/receipts, operator, error escalation, legitimate-business retention and live rollback. The intake read, journal commit and canonical evidence/revenue projection must be separately verified. No automatic cadence until after pilot approval.
6. Reconcile Capital/Realty in-memory commercial pipeline records before asserting restart-safe business lifecycle or three-division CRM completeness.
7. Only after successful live manual operation: review rate/cadence, alerts, observability, source repair protocols and cancellation/suspension mechanism for a production automation.

## Known limitations

- Journal is **locally atomic**, not an independently retained backup and not a distributed multi-host database.
- The first-run directory path must be owned and provisioned securely; code checks final directory/file permissions but does not certify every ancestor or filesystem.
- Tampering, a wrong key, truncated files, damaged checkpoints, and retention limits intentionally block further mutation pending verified operator recovery.
- Protected operation depends on authorized callers providing genuine trusted adapter output; **do not expose** `commitTrustedIntakeBatch` directly on a public endpoint or accept arbitrary user-supplied VERIFIED assertions.
- The existing metadata reader handles one bounded page; no continuous reader or encrypted key management is included in this sprint.

## Read-only Capital/Realty CRM reconciliation checkpoint

The stored intake journal confirms a verified *metadata receipt*, not a qualified borrower, completed diligence or a durable CRM case. `enterpriseIntakeReconciliation.ts` now compares those receipts against the existing **volatile in-memory** Capital and Realty pipeline snapshots without creating a new system of record. The Founder Revenue Brief exposes the detailed internal metadata-only findings and its authenticated Console exposes **aggregate counts only**.

| Classification | Meaning | Required operator action |
| --- | --- | --- |
| `SOURCE_REVIEW_REQUIRED` | Unverified, conflicting or invalid source evidence | Resolve provenance before identity linking. |
| `CANONICAL_LINK_MISSING` | Verified receipt is not linked to a reviewed case ID | Verify identity, source evidence and consent before linking. |
| `CANONICAL_RECORD_MISSING` | Canonical ID exists but no current division pipeline record matches | Investigate lost or uncreated case; review restoration plan. |
| `CANONICAL_EVIDENCE_MISSING` | A same-division case ID exists but lacks receipt/source proof | Reconcile proof before claiming match. |
| `MATCHED_VOLATILE_ONLY` | Receipt and matching case share evidence, but the current case is in memory | Persist and restore-test the canonical CRM record separately. |

The Founder Console refuses malformed counts or any reported `durableReconciliationVerified: true`, and shows `Unknown` for unconnected/unreadable sources instead of presenting absent observations as clean zero. Counters cannot establish inbox completeness, consumer identity, accounting accuracy, CRM durability, or a legal basis to disclose client information. No bank statements, watch details, email bodies, customer contact details, tokens, borrower data or payment instructions are added to the report.

**Operational gate to graduate Sprint 05:** separately authorize a durable canonical Capital/Realty CRM store and approved credential/backup configuration; establish a case identity and source-linking procedure; prove crash-safe replay and isolated restore; verify cross-division segregation; review errors and exceptions; conduct a bounded founder-authorized Gmail metadata pilot; then approve a production rollout with defined rollback. Never turn on automatic external dispatch, lender referral, credit pulls, or marketing because reconciliation counts look healthy. The current draft branch makes no production change and does not merge the separate enterprise 57-role blueprint PR #68.
