# Sprint 04 — Live intake validation and existing storage write safety

## Scope and authorization

Continuation of the primary Quest Luxo enterprise project from merged Sprint 03 commit `be64e484dffa1301e204253adee1869f5dbf532b`. One isolated change stream: `codex/sprint04-intake-write-safety`. The unrelated dirty checkout is untouched.

The founder expressly approved a manual corporate Gmail header-only pilot, one clearly labeled test inquiry through each of the three existing websites, and an isolated copy/restore of `/var/data/leads.jsonl` beneath `/var/data/recovery-validation/sprint04-20261019/`, including cleanup of only the new copies. Realty subsequently required and received separate action-time CAPTCHA approval. No form configuration, credentials, mailbox contents, genuine opportunity or authoritative commercial field was changed. No ongoing mailbox automation was approved or enabled.

## Live acceptance evidence — 2026-10-19 UTC

| Division | Website result | Corporate inbox receipt | Canonical retention / integration |
| --- | --- | --- | --- |
| Luxury | Existing Begin Your Quest success message | 20:16:59; INBOX; aligned Quest Luxo DKIM and DMARC pass | Exactly one labeled test in existing JSONL at 20:16:59.256, status `new`, notification `sent`; complete source with zero unreadable rows |
| Capital | Existing `/thanks` confirmation | 20:18:37; INBOX; exact FormSubmit sender; Google SPF, DKIM and DMARC pass | Existing adapter and Founder queue exercised manually in memory; no production retained receipt or cursor |
| Realty | Existing `?submitted=true#property-form` thank-you after approved CAPTCHA | 20:24:04; INBOX; exact FormSubmit sender; Google SPF, DKIM and DMARC pass | Existing adapter and Founder queue exercised manually in memory; no production retained receipt or cursor |

Test markers are `QLUX-S04-20261019-LUXURY`, `QLUX-S04-20261019-CAPITAL` and `QLUX-S04-20261019-REALTY`. Payloads explicitly identified internal tests, no client, purchase/property/financing request, credit consent or follow-up request. No actual property address, personal phone, financial documents or client data was submitted. The three inquiries are retained as unqualified tests; no production inquiry was deleted or auto-qualified.

The corporate connector was verified as `denzel@questluxo.com`. Only metadata representations were read; no MIME body, attachment, raw message or activation link was fetched. Searches for the unique controlled test markers located exactly one matching message per division. Search matching and subject text do not authenticate arbitrary form origin: source mapping for these two tests is an operator attestation tied to the directly observed, founder-approved submissions and their unique labels. It is not a standing rule for future messages.

The two observed FormSubmit metadata snapshots were passed to the existing adapter with explicit test mappings. Both were VERIFIED receipts, qualification UNKNOWN. The existing Founder queue returned two UNKNOWN items with null expected revenue. Replaying the same snapshots returned zero receipts and two replay detections. This was a manual, non-persistent adapter exercise; its COMPLETE result covers only those two supplied messages. It does not establish complete mailbox coverage, a production OAuth token's granted scopes, scheduled operation or central retention.

Minimal hashed source identities for the controlled tests:

- Capital: `gmail:917b781958557640d5afa6eef58aa6ba10801f5235f50cdc785b7048e2b6ccde`
- Realty: `gmail:7870904a16f6b645391418de307461d5ded390ad4456de7fe11e6bff5e90337f`
- Luxury canonical record SHA-256: `d8ff92102f7b9dc9b42885d856d6357963e85562bd4fd699cca0177efd8af36f`

No raw mailbox identifiers, headers, client payloads or secrets are committed with this evidence. Screenshots remain outside the repository in the command-chat deliverables.

## Production copy/restore result

The existing deployed operator helpers were used from the actual running Render service. Checks confirmed the source's resolved path `/var/data/leads.jsonl`, an actual `/var/data` mount, COMPLETE source, five records and 4,108 bytes. These counts include the approved Luxury test and do not identify five genuine clients.

The new validation directory was created exclusively (collision abort), with mode 0700. The source and the two new files had mode 0600. The backup and restored file SHA-256 values matched the source. Source verification before and after copying matched. Neither the active file nor any Render disk snapshot was restored or replaced. The two new copies were unlinked by exact path and the now-empty sprint validation directory removed. The parent `recovery-validation` directory remains. No recursive cleanup or source-record cleanup was run.

This closes only the observed file copy/isolated restore mechanics gate. It does not establish independently retained backup, full-disk restoration, restart survival, approved retention, RPO or RTO. The test used the currently deployed Sprint 03 helpers plus explicit before/after and path/mode guards, not the new unmerged locking code. Render's current disk reference was consulted: <https://render.com/docs/disks>.

## Concrete production write risk and fix

The active TypeScript JSONL adapter previously appended submissions while status, notes, tags, economics and delivery updates independently read/replaced the whole file. A later replacement could discard another acknowledged submission or update. Rewrites shared one fixed temporary file. A partially readable source was normalized to fewer records and could then overwrite unreadable rows.

The existing adapter now serializes its complete read/modify/write operations with an adjacent exclusive filesystem lock, shared across adapter instances and Node processes. The existing backup and exact labeled-smoke cleanup operators use that same lock. No new lead store, revenue math, queue or agent is introduced.

- Lock creation is exclusive, mode 0600, with at most ten seconds waiting. A failed acquisition never removes another owner's lock or enters its transaction.
- Locks release after successful or failed callbacks. A process crash can leave a lock; there is deliberately no speculative timeout-based lock stealing.
- All application mutations first require a non-partial source. Malformed rows preserve the original bytes and fail the operation. Source reads remain read-only and retain COMPLETE/PARTIAL/MISSING reporting.
- Appending to a valid legacy last line without a final newline inserts a record boundary rather than joining two JSON objects.
- Replacement uses an exclusively created unique private temporary file, file sync and rename, followed by cleanup of that operation's temporary path.
- Backup also re-verifies the source after copying. A source change or mismatched copy fails verification.

Acknowledgment and notification behavior is preserved: persistence failure returns the existing 503 outcome before notification; email failure after a saved inquiry does not erase the inquiry. The patch does not retry notifications or promise inbox delivery. Read-only snapshots may observe an append in progress as PARTIAL and must retain that honest state.

## Operator limits and recovery

This is a single-disk local filesystem protocol for cooperating writers. Do not run legacy `.mjs` storage writers, older deployed writers, manual edits or alternate-path writers concurrently with it. Do not use it as a distributed lock or change to multiple service instances/shared network storage without another design. The current Capital and Realty canonical pipeline stores are in-memory arrays; this sprint does not make them persistent or imply they retain website inquiries.

If the lock survives a crash or a request times out, investigate the existing sanitized storage failure logs. Keep the lock in place until an operator verifies that every writer has stopped, inspects the source's integrity and approves recovery. Do not remove a lock merely because it is old. An incomplete source requires an approved recovery operation; never normalize/rewrite it as automatic repair. Source-read completeness alone does not certify write availability. No unattended failure alert or operator ownership is asserted.

## Validation and release checkpoint

Ten new deterministic tests cover concurrent adapters, four simultaneous Node processes, source reads during lock ownership, bounded lock refusal, owner-lock preservation, callback failure/release, every mutation against malformed data, final newline compatibility, persistence-before-notification, backup/cleanup concurrency and private POSIX permissions. Windows local runs skip only POSIX mode assertions; Linux CI must execute them.

Local full regression: 315 total, 314 passed, one POSIX-only skip, zero failures. Enterprise Command acceptance: 155 total, 154 passed, same one skip, zero failures. Astro/TypeScript: zero errors and warnings, 18 existing hints. Production build and repository photography-integrity checks passed. Existing build warnings and photo-clearance gaps remain outside this change. The focused suite was rerun after making its backup/cleanup fixture independent of lock acquisition order.

Security/privacy review: no new credential, email access permission, public endpoint, log payload, committed production data or external outreach. The existing submission and read contracts remain intact. CI includes the new suite and triggers on its helper/fixture changes. Record the PR, exact tested head, CI and merge/deploy status in the primary command report; no new patch is called deployed before merge and live deployment verification.

## Prioritized next operational checkpoint — prepared, not started

1. Review and release this write-safety fix, then verify its exact main commit and Render deployment without another live submission.
2. Implement atomic retained receipt/checkpoint handoff within the existing canonical architecture, with encryption, explicit retention/owner and replay recovery. Do not add a parallel CRM or persist synthetic tests as commercial opportunities. Reconcile the existing in-memory Capital/Realty stores before claiming restart-safe operation.
3. Provision and verify an explicitly approved corporate metadata-only Gmail credential. Run a manual production pilot using reviewed source mappings and safe canonical identities. Existing chat connector access is not credential delegation to a worker. Future source claims need independent evidence; controlled test mappings do not authorize arbitrary inbound messages.
4. After that pilot, seek approval for collection cadence and meaningful failure/action alerts. Keep missing observations separate from failed submissions and preserve Founder approval on all external actions.
5. Select an independent encrypted backup destination, accountable owner, retention and recovery objectives; test that recovery separately.
6. Only after shared intake is operational, phase Luxury sourcing/aftercare, Realty diligence and Capital preparation through existing evidence gates. Shared Finance/Risk verifies economics and constraints; Chief-of-Staff consolidates existing recommendations. No outreach, offer, payment, credit pull, lender introduction or binding action without Founder approval.

Stop at this release checkpoint. These priorities do not silently authorize or start another sprint.
