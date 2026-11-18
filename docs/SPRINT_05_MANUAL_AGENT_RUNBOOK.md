# Sprint 05 — Manual Operations Agent (controlled first use)

This is a **manual read-only capability**, not an autonomous or production-deployed agent. The existing production Capital and Realty stores remain in-memory. No real Gmail credentials, source messages or production customer records are required for the synthetic test.

## Verify before use

Run `node --test tests/manualPipelineAgentE2E.test.mjs tests/manualPipelineAgentReport.test.mjs tests/enterpriseDurablePipelines.test.mjs` on Node 22.12 or later with TypeScript strip support (or `node --experimental-strip-types --test ...` if required). Confirm latest-commit Quality, Enterprise Command and Watch Brokerage checks succeed.

## Manual execution, authorized encrypted snapshot only

Provision a 32-byte key in an approved secret manager, and a private (0700) directory containing an existing encrypted `enterprise-pipelines-v1.enc.json` snapshot. Provide the runner with `QUEST_PIPELINE_DIRECTORY` and `QUEST_PIPELINE_KEY_HEX` as controlled environment values, then run:

```sh
node --experimental-strip-types scripts/manual-pipeline-agent-report.mjs
```

Never put a production encryption key in command-line flags, GitHub, logs, or example commands. Output is JSON with totals and exception counts only; it does **not** expose IDs, send notifications, write CRM, or collect Gmail. Missing snapshot is an error, not a zero-count success.

## Release gates

1. QA and encrypted recovery tests on latest commit.
2. Approved key storage, private persistent filesystem and independently controlled encrypted backup/restore procedure.
3. Real source authorization/consent, trustworthy mappings, identity resolution, monitoring, rollback and founder approval before any live integration.
4. PR #69 must remain draft/unmerged until an explicit deployment decision. A Render main merge can deploy automatically.

No live activation is implied by test completion.
