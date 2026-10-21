# Agent Factory and isolated pilot execution

Verified October 21, 2026. This branch extends PR #69 at `15cf2dfd090dba89b55fa8e744e46ec5da0931c4`. It imports only the architecture document from PR #68 at `a13f374b085b29127f86f29a43b79ee9b71bfbae`, pinned by SHA-256. It does not merge either PR into main or activate their integrations. Tracks Issue #70.

## Verified infrastructure baseline

| Resource | Observed state |
|---|---|
| Render workspace | Quest Luxo, `tea-d9d67qb7uimc73fltuag` |
| Isolated pilot | `srv-dbbkmb0n74is73d111hg`, free plan, no persistent disk, placeholder HTTP start command, auto-deploy off |
| Pilot live revision | `15cf2df`, deploy `dep-dbbkmb8n74is73d112l0` |
| Production | `srv-d9h9btsvikkc73ahrff0`, separate service, main auto-deploys, existing 1 GB disk at `/var/data` |
| Production live revision | `bdabcd734c4f32d6ba76ad2cc21363c0eb8e6be9`, deploy `dep-dbbk7vek1f9s73bum96g` |
| PR #69 | Draft, open, unmerged; exact-head Quality, Enterprise Command and Watch Brokerage workflows succeeded |

No production configuration, production record, mailbox or CRM was changed in this execution. Render's connector supports service reads and deploys, but not attaching a disk, upgrading the existing service or changing its branch/start command. The dashboard opened to sign-in. Provider configuration and independent backup retention therefore remain outstanding.

## Factory: implemented scope

`npm run agent:factory -- roster` reads the existing 26-role registry and the 31 proposed roles in the pinned blueprint, yielding 57 unique logical roles. These are architecture entries, not 57 running workers. Existing registry labels such as DEPLOYED are not promoted into an autonomy claim.

The first validated template generates the existing aggregate operations report for `lead-operations`, with bounded reuse for the reliability and chief-of-staff roles. Other roles hold for implementation review. No model/API credentials are needed for this deterministic template.

```sh
npm run agent:factory -- generate config/agents/operations-pilot.spec.json
node agent-packages/operations-pilot/run.mjs
node --test agent-packages/operations-pilot/agent.test.mjs
```

The checked-in package includes configuration, runnable code, an executable evaluation and a runbook. Generating again under the same ID refuses replacement. Specifications restrict inputs, tools, permissions, provenance, owner, output schema and hold behavior. A spec cannot authorize Gmail, CRM, production access or arbitrary code/tools. Approval references document provenance; they are not machine-verifiable authorization for business-data access. Outcomes are descriptive, never executed as instructions or code.

Initial measured generation: 5 ms for four files on this local host. This is template assembly time, not review, CI or deployment latency. Tests verify expected Capital/Realty counts, no record identifiers in output, no externally writable capabilities and rejection of unsupported roles and permissions. External PR creation is an operator action; generated agents cannot merge or deploy themselves.

## Recovery: implemented scope

The existing primary snapshot remains AES-256-GCM encrypted with a separately provisioned 32-byte key. New backup commands export only authenticated ciphertext plus revision, sequence and time. Keys and plaintext records are never included. Backups require private paths outside the primary directory tree, exclusive creation and filesystem sync. Restore authenticates ciphertext and manifest sequence before publishing into a destination without a snapshot. Existing backups and snapshots are never overwritten.

Supply `QUEST_PIPELINE_KEY_HEX` through approved secret storage, never command-line arguments, source control or logs:

```sh
npm run agent:backup -- export /approved-retained-store/snapshot.backup.json /var/data/quest-agent-pilot/synthetic
npm run agent:backup -- restore /approved-retained-store/snapshot.backup.json /private-empty-recovery
```

These paths are examples requiring an actual approved storage destination. A separate directory alone does not establish offsite or independently controlled retention. The recovery integration test deletes the entire primary directory and restores in a fresh Node process; wrong keys, tampering, insecure permissions, symlink destinations and attempted overwrites fail closed. This is local recovery evidence only. Every command truthfully returns `independentRetentionVerified=false`.

For independent verification, provision a founder-approved backup store with a failure domain and access policy separate from the pilot disk. Transfer an encrypted export, record its provider object/version and digest, recover it using independent access after simulated pilot loss, then compare authenticated revision, sequence and record contents. Record the retained object ID, verification time, recovery result, RPO/RTO, retention policy and responsible operator in a private recovery record. Keep key recovery/escrow separate from ciphertext and test key retrieval. Never put real records, credentials, backup URLs or keys in a public PR. Render disk snapshots are useful but do not satisfy this independent recovery gate.

## Exact proposed pilot configuration

Apply only to existing `quest-luxo-agent-pilot`; do not create a duplicate service or modify production. The paid instance/disk change needs any applicable founder spending approval before purchase.

| Setting | Proposed value |
|---|---|
| Branch | `codex/agent-storage-factory` after latest-head CI succeeds |
| Auto deploy | Off |
| Build | `npm ci` |
| Start | `npm run agent:pilot` |
| Health check | `/healthz` |
| Disk | Smallest suitable paid disk, proposed 1 GB, `/var/data` |
| `QUEST_AGENT_PILOT_MODE` | `SYNTHETIC_ONLY` |
| `QUEST_PIPELINE_DIRECTORY` | `/var/data/quest-agent-pilot` |
| `QUEST_PIPELINE_KEY_HEX` | Pilot-only random 32-byte key in approved provider secret storage; recoverable separately |
| `QUEST_ENABLE_GMAIL` / `QUEST_ENABLE_CRM` | Both literal `false` |

No live-source/API credentials belong in this synthetic environment. The runtime refuses the production service ID, a missing disk mount, missing/wrong key, mode mismatches or integration enablement. It writes only its fixed synthetic namespace and checks exact fixture recovery on subsequent starts. It serves readiness only; no report, record, backup, key or mutation endpoint is exposed.

After configuration: identify the accepted deploy ID, wait for LIVE, inspect the synthetic success log, request `/healthz`, and verify `businessDataReady=false`. Redeploy the same commit and confirm `recoveredExisting=true`, sequence remains 1 and fixture counts do not change. Then perform independent retained backup recovery in a separate environment. A successful HTTP placeholder or local test cannot substitute for these checks.

## Activation status and remaining gates

Business-data processing, Gmail and CRM automation remain disabled. Before any real-data trial: verified independent encrypted retention and key recovery, reviewed trusted source mappings and consent/access scope, data minimization/retention, per-run limits and audit IDs, exception ownership, monitoring and rollback, and explicit founder authorization for the selected source and purpose. No lender eligibility decisions, submissions, outreach, contracts, financial movement, scheduled ingestion or production release are authorized by this synthetic package.

References consulted directly: Render [persistent disks](https://render.com/docs/disks), [deploys](https://render.com/docs/deploys), and [health checks](https://render.com/docs/health-checks). Current docs confirm paid-service disk support, encrypted disks/snapshots, runtime-only disk access, single-instance constraints and disk deployment downtime. No price is asserted without a current account quote.
