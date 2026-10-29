# Luxury workforce validation runtime

This release implements the callable delivery path requested in issue #70, comment 6493959682. It is disabled by default and cannot activate commercial processing. The existing Gmail registration and pilot stores are unchanged. Production business automation remains HOLD.

## Source and scope

The fallback runs inside the existing production Node process and persistent disk. A saved-record hook queues only explicitly allowlisted server-generated lead IDs. A bounded drain reads the existing canonical JSONL source to recover a crash between source persistence and queueing. This is a canonical saved-record adapter, not a Gmail webhook implementation or a replacement Gmail polling schedule. Partial or malformed source snapshots stop the drain.

The validation policy also requires the founder business email, exact internal-test name, approved marker and controlled-test source. An arbitrary customer, sender, body instruction, matching email alone, Tia, Sean or an ordinary synthetic record cannot enter. New fixture IDs need explicit owner approval and secure allowlisting. No audience imports, customer messages, commercial counts, qualification, deals or revenue are created by this lane.

The first bounded canonical text block parser accepts the released version-1 identity contract and safe persisted legacy IDs/ISO variants. Later labels cannot replace that identity. Source records remain unchanged. Missing-ID fallback hashes from source normalization are not approved fixture identities.

Fingerprint-v1 is SHA-256 of UTF-8 JSON for `['ql-intake-fingerprint-v1', 1, 'luxury-canonical-jsonl', leadId, savedAtNormalizedUTC, payloadRows]`. The thirteen displayed payload rows retain order and `Not provided`, normalize CRLF to LF, and trim outer whitespace. Signatures and transport data are excluded. The golden existing fixture matches `b586e7941e71d04681acc35d042417ca0a0d0e4d94e89e5ee2642035be565742`. Operational status, notes and notification changes do not alter the inquiry fingerprint.

## Durable phases and recovery

The purpose-separated v2 AES-256-GCM journal stores encrypted event/email bindings, immutable fingerprints, phase, attempt, lease, run ID, native contact/task IDs, association verification, record origin and notification outcome. It does not retain inquiry bodies. All old v1 synthetic files, archives, decoder profiles and independent backup evidence remain untouched.

SQLite uses short `BEGIN IMMEDIATE` transactions, a verified 100 ms busy timeout, DELETE journaling and EXTRA synchronization. No provider call or asynchronous operation runs inside a transaction. Claims serialize both canonical events and portal/email contact creation. Global revision changes from another event do not discard a valid receipt: the local merge rereads state and checks the event token/lease.

Provider writes have durable intent before dispatch. Known contact IDs are retained before task work. Native contact and task readback verify email, event/fingerprint metadata, owner, due date, task type/status and task-to-contact association. Empty search, a 404, timeout, malformed response or expired write claim cannot authorize another create. Ambiguous writes stay UNCERTAIN until positive native evidence resolves them. Changed content for an existing canonical event becomes HOLD.

Record origins distinguish runtime creation, existing records, bound-contact reuse, recovery after uncertainty and the operator baseline. The existing October 28/29 fixture is restricted to its known manual contact/task IDs and cannot create a replacement or send another owner notification. A separate read-only legacy validator pins its independently verified source fingerprint, contact identity/owner/lifecycle, task subject and exact historical notes, owner, association, type/status and original due time `2026-10-30T01:01:31Z`. It does not require or backfill new runtime metadata or recalculate the historical due time. Altered evidence stays UNCERTAIN. Successful reconciliation remains HOLD with `OPERATOR_BASELINE` origins and is never first-create automation proof.

The journal opens existing state by default. Missing files, an existing empty directory, or loss of both DB and marker fail closed. Only the explicit initialization command may initialize a newly created directory. This prevents source replay from silently rebuilding an empty dispatch-enabled journal after state loss.

Backups export the consistent authenticated encrypted envelope rather than copying an open SQLite file. Restore accepts only a new target and retains bindings and pending/uncertain intent. Restored journals impose a dispatch hold: an older backup might predate a successful provider write. Local export/restore tests do not establish independent retention or key recovery.

## Secure configuration and actual access

The existing production service is `quest-luxo-production`, with Node 24.18.0, JSONL storage and `/var/data`. No new capacity or dependency package is required. Read-only inspection found no CONTACT/TASK credential, journal key or validation allowlist among its direct environment variables. Inherited groups and secret files were not treated as proof of runtime access. Startup reports actual presence flags without values.

Required configuration names are:

- `WORKFORCE_HUBSPOT_ACCESS_TOKEN`: a runtime-authorized private-app credential for portal `247778505`, with `crm.objects.contacts.read` and `crm.objects.contacts.write`. No DEAL credential reuse or interactive connector token export. Token introspection pins the actual portal and required scopes before any CONTACT/TASK request. Owner `101804786` is fixed from the verified handoff.
- `WORKFORCE_JOURNAL_KEY_HEX`: a securely managed 32-byte encryption key represented by 64 hexadecimal characters, with independent recovery custody. Do not commit or send its value in chat.
- `WORKFORCE_VALIDATION_LEAD_IDS`: explicit comma-separated server-generated IDs for approved internal fixture events. This is an allowlist, not a wildcard.
- `QUEST_WORKFORCE_VALIDATION_ENABLED=true`: validation-only dispatch, applied only after secure configuration, initialization, source approval and acceptance-owner coordination. Absence or any other value remains disabled. Commercial processing stays unavailable.

The existing Resend configuration supplies owner notifications to `denzel@questluxo.com` only, with the exact Luxury signature once. Provider acceptance, inbox receipt and human acknowledgment/completion remain separate. Notification timeouts stay UNCERTAIN; explicit provider-ID reconciliation performs a read, not another send. It requires the exact expected recipient, subject, event metadata and journal-bound contact/task links in the returned message; mismatched native IDs do not release the hold. Provider read permission may be necessary for that optional recovery operation.

## Operator commands

Run from the repository root with Node 24 and securely injected environment settings. Commands never accept secret values as arguments.

```text
node --experimental-strip-types scripts/workforce-validation.mjs status
node --experimental-strip-types scripts/workforce-validation.mjs initialize
node --experimental-strip-types scripts/workforce-validation.mjs run-once
node --experimental-strip-types scripts/workforce-validation.mjs export-backup /private-existing-parent/phase-backup.json
node --experimental-strip-types scripts/workforce-validation.mjs restore-backup /private-existing-parent/phase-backup.json
node --experimental-strip-types scripts/workforce-validation.mjs reconcile-notification APPROVED_LEAD_ID POSITIVE_PROVIDER_EMAIL_ID
```

Initialization and restore never replace an existing journal. Stop the validation drain during operator recovery. Export archives must be retained through an independently verified existing backup channel; another file on the same disk is not independent protection. Existing four-store backup acceptance does not cover this v2 journal or its managed key. Restoring does not clear its dispatch hold, and no restore-to-live release operation is implemented in this validation lane.

## Acceptance boundary

Mock/fresh-process tests cover parsing, the exact golden fingerprint, duplicate and concurrent events, same-email separate inquiries, immutable-content holds, contact-success interruption, ambiguous contact/task writes, positive recovery, notification reconciliation, state loss and stale backup restore. They do not prove deployed CRM access, Gmail delivery, unattended event triggering or owner action.

The workforce owner retains actual acceptance: secure runtime access and independent recovery, a fresh separately authorized fixture with its actual server ID allowlisted, real worker run/time/journal revision, exactly one associated native contact/task pair, replay/concurrency and failure/restart evidence, owner inbox receipt, and human action reported separately. Existing manual records remain baseline evidence. Do not clear business HOLD from these implementation outputs alone.

Sources: [Node 24.18 SQLite](https://nodejs.org/download/release/v24.18.0/docs/api/sqlite.html), [SQLite durability](https://www.sqlite.org/pragma.html#pragma_synchronous), [HubSpot contacts](https://developers.hubspot.com/docs/api-reference/legacy/crm/objects/contacts/guide), [HubSpot tasks](https://developers.hubspot.com/docs/api-reference/legacy/crm/activities/tasks/guide), [private-token information](https://developers.hubspot.com/docs/apps/legacy-apps/private-apps/overview), [Render secure configuration](https://render.com/docs/configure-environment-variables).
