# Read-only intake source and recovery coverage

The existing encrypted FormSubmit intake journal is now covered by the authenticated backup workflow. Recovery preserves its opaque receipts, page cursor and replay fingerprints together. It does not create a new intake system or turn on Gmail collection. Production configuration remains unchanged.

## Operator commands

```sh
npm run agent:intake-backup -- export BACKUP_FILE JOURNAL_DIRECTORY
npm run agent:intake-backup -- restore BACKUP_FILE EMPTY_TARGET_DIRECTORY
```

`QUEST_INTAKE_KEY_HEX` must be injected as a managed 32-byte hex key through the environment, never as a command argument. The commands do not print it. This name is deliberately separate from the existing pipeline command's key variable. The isolated synthetic pilot reuses its existing managed key with the journal's distinct authenticated encryption context; no new credentials or subscriptions are provisioned.

The journal archive has a distinct kind, `QUEST_INTAKE_ENCRYPTED_BACKUP`. A pipeline archive cannot be substituted for it. Export authenticates the source and checks that its ciphertext revision did not change during capture. Backup output contains ciphertext, revision, observation time and receipt count, without plaintext records or a key. Restore checks the manifest against authenticated journal contents before publishing a file. Private regular files, real directory paths, bounded reads and exclusive writes are required. Wrong keys, modified ciphertext, altered counts/times, unknown manifest fields, hardlinks and nonprivate inputs fail closed. Existing snapshots cannot be overwritten. Existing pipeline version 1 archives remain supported.

A backup copy must leave the primary tree. That alone does not establish an independent failure domain. Both commands continue to report `independentRetentionVerified: false`; actual offsite destination verification, retention policy and external key retrieval remain separate requirements.

## Explicit source adapter

`previewIntakeJournalSource` reads an existing authenticated journal only when explicitly called with a key, source contract and readiness evidence. It does not read a mailbox, create OAuth tokens, invoke a CRM or write a pipeline. It is not wired into production routes or scheduled live collection.

The contract source ID is `encrypted-formsubmit-journal`. The existing source preflight enforces division scope, age, expiry and record limits. Missing state fails rather than becoming an empty report. The adapter uses the journal's observation time, not the current read time, so repeatedly reading an old checkpoint cannot make the source fresh. It never silently filters stale records or truncates a journal to fit the limit.

An authenticated receipt establishes receipt provenance only. Every projected receipt remains `BLOCKED` with qualification evidence `UNKNOWN`. The report explicitly states `RETAINED_RECEIPTS_ONLY`, `qualificationEstablished: false` and `sourceCompletenessVerified: false`. It omits source IDs, cursor values and raw receipts. Even complete caller-supplied readiness evidence cannot enable business-data execution.

Qualification-evidence metadata in the journal is now validated as a bounded array of opaque IDs and returned as an immutable copy, matching the treatment of receipt evidence. This closes an unchecked optional metadata field.

## Isolated pilot checks

On the next pilot release, a separate encrypted synthetic intake journal is initialized once, alongside the existing pipeline fixture. It contains exactly two synthetic receipts and synthetic replay evidence. No real mailbox, messages, customer information or credentials are used.

Startup and every existing monitoring cycle authenticate this journal, validate its exact fixture, exercise the source adapter, retain one immutable ciphertext checkpoint and restore that checkpoint into a temporary private directory. The recovered receipts and replay state must match. An existing but empty primary directory, changed journal, missing initialized state or corrupt retained checkpoint holds readiness; the system does not silently reseed it. Initializing the journal is a migration of the pilot fixture only.

Source-adapter evaluation uses an explicit fixed synthetic clock so the fixture remains repeatable. That clock is never evidence of live-source freshness. Monitoring freshness still uses the existing monotonic runtime check. These checks add recovery coverage, not another generated agent or proof of recurring offsite protection for business data.
