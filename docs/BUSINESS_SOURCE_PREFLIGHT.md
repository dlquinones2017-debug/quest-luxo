# Business source preflight

This bounded preview prepares the first read-only source contract without enabling a live adapter. It has no network calls, encryption-key dependency, persistent writes or connector credentials. It does not import records into the encrypted pipeline. The existing isolated service remains synthetic-only.

## Input contract

An operator supplies three private JSON files to:

```sh
npm run agent:source-preflight -- CONTRACT_FILE METADATA_FILE EVIDENCE_FILE
```

Files must be regular, private (0600 on Unix), no larger than 512 KiB and have real paths with no symlink ancestry. Error output is generic and does not echo rejected input. Keep inputs outside the repository and remove temporary exports under the reviewed retention policy.

Contract version 1 has exactly these fields:

| Field | Requirement |
|---|---|
| `schemaVersion` | `1` |
| `sourceId` | Reviewed lowercase identifier; no URLs or credentials |
| `mode` | `PREVIEW_ONLY` |
| `divisions` | One or both of `CAPITAL_ADVISORY`, `REALTY`, no duplicates |
| `maxRecords` | Integer from 1 through 1,000 |
| `maxAgeSeconds` | Integer from 1 through 86,400 |
| `expiresAt` | Future UTC timestamp, with milliseconds |

The envelope has exactly `schemaVersion: 1`, matching `sourceId`, `capturedAt` and `records`. Capture and record times must be valid UTC timestamps with milliseconds, within the approved age window and never in the future. A record cannot be newer than its export capture.

Each record contains only `recordId`, `division`, `status`, `evidenceState`, `updatedAt`. `recordId` is a source-assigned opaque 64-character lowercase hex identifier; do not derive it by hashing names, email, phone numbers or other guessable personal information. Identifiers must be unique across the entire export. The preflight checks format; it cannot prove an identifier's provenance. This needs review at the eventual source adapter.

Status is `READY`, `BLOCKED` or `REQUIRES_FOUNDER`. Evidence state is `VERIFIED`, `UNKNOWN` or `REQUIRES_VERIFICATION`. Contact details, names, free-text notes, reasons, actions, documents, financial details, credentials and any extra fields are rejected. An explicitly empty export yields zero counts; a missing export or records field is rejected.

The evidence file uses the existing seven-check readiness schema. This is caller-supplied evidence, explicitly marked `CALLER_SUPPLIED_UNVERIFIED`, not an independent attestation. Missing, stale or conflicting evidence yields `HOLD`; complete evidence yields only `READY_FOR_FOUNDER_REVIEW`. Both outcomes retain `businessDataExecutionAllowed: false`.

## Output and enforcement

The preview returns counts for approved divisions, readiness requirements and disabled execution/communications flags. It omits record identifiers and source rows. It cannot persist records, send messages, dispatch work, write CRM or activate Gmail. Successful preview does not modify pilot configuration or attest key recovery.

The existing synthetic team checks a valid bounded preview and rejection of an unexpected contact field at startup and during each monitoring cycle. This is a guardrail evaluation, not a fourth generated agent or a live integration.

## Activation prerequisites

Before building or enabling an actual source adapter, independently verify recoverable key custody, a recurring offsite backup destination and retention policy, first-source ownership and field mapping, record provenance and incident ownership. A synthetic restore or local retained backup cannot establish those changing-data guarantees. No business source or retention policy has been selected by this implementation.
