# CRM reconciliation interface v1

`src/lib/command/crmReconciliationPlan.ts` is a pure metadata planner for Luxury Advisory, Capital Advisory and Realty. It compares bounded, caller-supplied snapshots and returns internal review recommendations. It has no provider client, credential handling, network transport, persistence, model calls or record writes. Its overall status is always `HOLD` and its evidence attestation is always `CALLER_SUPPLIED_UNVERIFIED`.

This interface supplements `enterpriseIntakeReconciliation.ts`, which compares retained Capital/Realty receipt metadata against the existing process-local pipelines. Neither planner replaces the canonical intake stores, authorizes a migration or treats a synthetic demonstration as permission to process business data. Runtime connectors and independently verified durable recovery remain separate integration requirements.

## Workflow and ownership

The explicit sequence is Capture → Verify → Qualify → Route → FollowUp → Advance → Measure → Report, represented by the immutable `CRM_HANDOFF_STAGES` tuple:

`CAPTURE`, `VERIFY`, `QUALIFY`, `ROUTE`, `FOLLOW_UP`, `ADVANCE`, `MEASURE`, `REPORT`.

The planner does not execute these stages or advance a workflow. `stage` identifies the internal review context: qualification gaps use `QUALIFY`, matched metadata and revision review use `ROUTE`, explicit consent denial uses `FOLLOW_UP` for suppression review, and other findings use `VERIFY`. A follow-up review never authorizes contact.

| Division | Owning team | Reconciliation support |
| --- | --- | --- |
| `LUXURY_ADVISORY` | `technology-luxury` | `enterprise-operations` |
| `CAPITAL_ADVISORY` | `capital-advisory` | `enterprise-operations` |
| `REALTY` | `property-acquisitions` | `enterprise-operations` |

The six-team architecture retains historical logical roles; these ownership labels do not create or activate independent deployed agents.

## Envelope

Call `planCRMReconciliation(input, now)` with an explicit canonical UTC ISO timestamp for `now`. Unknown fields, malformed identifiers, oversized collections, invalid timestamp formats and future observations throw a generic error without echoing input values. Every object has an exact field allowlist.

| Field | v1 requirement |
| --- | --- |
| `schemaVersion` | Exactly `1` |
| `mode` | Exactly `INTERNAL_METADATA_PLAN_ONLY` |
| `maxAgeSeconds` | Integer 1–86,400; applies to source, CRM, event, checkpoint, mapping review and readiness evidence |
| `sources` | At most 12 source registrations |
| `events` | At most 100 handoff event metadata objects |
| `crm` | `{ connection, capturedAt, cases }`; at most 1,000 case metadata objects |
| `checkpoint` | `{ revision, capturedAt, entries }`; at most 1,000 retained dedupe entries |
| `readiness` | `{ verifiedAt, durableCheckpointVerified, independentRecoveryVerified, keyRecoveryVerified }` |

`connection` is `CONNECTED`, `UNCONNECTED` or `FAILED`. Connected snapshots require `capturedAt`; unavailable snapshots may use `null`. Checkpoint and readiness timestamps are always required. The planner does not connect to a source or verify a caller's readiness claims independently.

Source registration fields are `division`, `sourceId`, `connection`, `capturedAt`, and `mapping`. A `sourceId` is a non-personal configuration token matching `[a-z][a-z0-9-]{0,79}`, unique across the registration list. Events must match a registered source and its division. Historical checkpoint sources may remain after a registration is removed; history is not silently reassigned.

All record IDs, case IDs, canonical IDs, evidence references, checkpoint revisions, CRM revisions and fingerprints are opaque 64-character lowercase hexadecimal references. Adapters must derive non-reversible, appropriately scoped identifiers before calling the planner, using a protected keyed derivation where the original identifiers have low entropy. Syntax validation alone does not prove anonymity, provenance or consent. Never pass names, email addresses, telephone numbers, addresses, URLs, message content, financial information or source payloads. `sourceId` must not encode customer data.

## Reviewed mappings

Each source's `mapping` has exactly `state`, `evidenceRef`, `verifiedFields`, `reviewedAt` and `expiresAt`. `state` is `REVIEWED` or `UNREVIEWED`; the reference and timestamps may be null while unavailable. Processing recommendations require a non-null evidence reference, fresh review timestamp, future expiry later than review time and all six immutable logical mapping requirements:

| Logical mapping | Review requirement |
| --- | --- |
| `DIVISION` | Isolated case/opportunity division; no implicit default division |
| `SOURCE_IDENTITY` | Stable source-system and record association |
| `CANONICAL_IDENTITY` | Association back to the preserved canonical record |
| `SOURCE_REVISION` | Monotonic source revision and conflict interpretation |
| `PROCESSING_CONSENT` | Approved processing basis and denial handling; distinct from outreach consent |
| `PIPELINE_STAGE` | Reviewed source-to-CRM workflow mapping, including terminal and suppression semantics |

These are logical requirements, not assumed provider property names. A connected CRM, a native creation-mechanism label, an owner field, default deal stages or tracking-consent properties do not establish these mappings. Do not invent custom properties or infer stage equivalence. The current provider schema must be inspected and a mapping reviewed before an adapter may claim `REVIEWED`. Missing or partial mappings produce `HOLD_MAPPING_REVIEW_REQUIRED`. No schema changes or account upgrade are performed by this module.

## Event, CRM and checkpoint shapes

An event has exactly:

```text
division, sourceId, sourceRecordId, sourceRevision,
canonicalRecordId, payloadFingerprint, observedAt,
provenanceState, evidenceRef, qualificationState, processingConsent
```

`sourceRevision` is an integer from 1 through 1,000,000,000. `canonicalRecordId` and `evidenceRef` may be null while unknown. `provenanceState` and `qualificationState` are `VERIFIED` or `UNKNOWN`. `processingConsent` is `VERIFIED`, `UNKNOWN` or `DENIED`. Evidence references are links into a separately controlled verification process; these labels are caller claims, not cryptographic attestations. A verified processing basis does not establish permission for marketing, messaging, applications, offers or other external actions.

A CRM case has exactly:

```text
division, sourceId, sourceRecordId, canonicalRecordId,
crmCaseId, crmRevision, sourceRevision, metadataFingerprint
```

`crmCaseId` identifies a division-specific case or opportunity, not a shared contact. A person may participate in multiple divisions; that must not cause their distinct cases to collapse into one cross-division case. Reusing a case ID across divisions produces `HOLD_CROSS_DIVISION_CONFLICT`. Matches use the full `(division, sourceId, sourceRecordId)` identity. Zero matches hold for review; multiple matches hold as ambiguous. Canonical-link disagreement also holds. The planner never guesses a match, creates a record or merges records.

A checkpoint entry has exactly:

```text
division, sourceId, sourceRecordId, sourceRevision,
idempotencyKey, metadataFingerprint
```

Duplicate checkpoint keys, invalid keys and malformed history reject the envelope. Checkpoint contents are neither updated nor returned as a replacement store. `checkpointRevision` is an opaque reference supplied by the caller, not an independently authenticated version or a lock.

## Identity, replay and conflict rules

`crmHandoffIdempotencyKey(event)` hashes the JSON array of the domain separator `quest-luxo-crm-handoff-v1`, division, source token, opaque source record ID and source revision. Content is deliberately excluded: changing metadata at the same revision creates a conflict instead of a new logical event. A v2 contract must use a different domain separator and an explicitly reviewed checkpoint migration.

`crmHandoffMetadataFingerprint(event)` hashes the canonical reference, payload fingerprint, observation timestamp, provenance state, evidence reference, qualification state and processing-consent state in that fixed order. Identical retry delivery must retain its original observation timestamp. Capturing a new observation requires a new source revision.

Identical batch deliveries coalesce with a duplicate counter; conflicting same-key batch metadata holds. Exact retained checkpoint replay is `REPLAY_NOOP`; changed replay is `HOLD_REVISION_CONFLICT`. Lower revisions are held out of order and revision gaps hold. A later event in the same unacknowledged batch cannot advance the checkpoint for another event. Only the next revision after retained history can receive a new comparison recommendation.

An existing CRM case with a higher source revision holds out of order. Equal revisions with unequal fingerprints hold as conflicts. An older CRM revision produces `REVIEW_CRM_REVISION`; it is not a write instruction. Cross-division history collisions are held before ordinary comparison.

## Evidence age and readiness

All observed and verified timestamps must be at or before `now`; an event cannot be newer than its source snapshot. Future observations reject the envelope consistently. A stale source, CRM snapshot, event, checkpoint, readiness verification or non-null mapping review produces `HOLD_STALE_EVIDENCE`. Evidence exactly at the age limit remains fresh. Mapping expiry is an explicit future validity bound, not a future observation; expiry at `now` or earlier holds mapping review.

Before any new internal processing recommendation, all three readiness claims must be true and fresh: durable checkpoint integrity verified, independent backup recovery verified, and key recovery verified. False claims produce `HOLD_DURABLE_RECOVERY_REQUIRED`. This gate records prerequisites only; fixture booleans cannot certify actual persistence, encryption, restore success or business activation. Independently verified encrypted storage, restoration of dedupe history, recovery key custody, runtime credentials and source authorization must be established outside this function before an execution adapter is considered.

## Output and activation boundary

The immutable report contains sorted findings, division summaries, the input checkpoint reference and the stage sequence. Matched metadata yields `PREPARE_INTERNAL_FOLLOW_UP_REVIEW`; replay yields `NO_ACTION`; all other findings yield `REVIEW_HELD_METADATA`. Consent denial is explicitly `SUPPRESSED_CONSENT_DENIED`. These strings are internal recommendations, never executable CRM operations.

Unconnected, failed or stale division sources and unavailable CRM snapshots produce `UNKNOWN` summary observation state, with null observed counts. Connected snapshots may report bounded observed metadata counts only. `businessPipelineCount` is always null and `sourceCompletenessVerified` is always false: an empty fixture is not an empty business pipeline.

The following flags are always false, including for a fully matched synthetic fixture: `checkpointAdvancementAllowed`, `replacesCanonicalStores`, `durableReconciliationVerified`, `businessDataExecutionAllowed`, `writesCRM`, `sendsMessages`, `activatesGmail`, `submitsApplications`, `makesOffers`, and `modelApiRequestsAllowed`.

The contract does not implement a durable outbox, authenticated evidence verification, encryption, backup storage, recovery orchestration, optimistic CRM updates, a contact-consent service or unattended provider authorization. Future execution requires a separately reviewed adapter with atomic dedupe and revision checks, independently demonstrated recovery, explicit source/mapping authority and the applicable business-action permission. A successful planner test cannot enable that adapter.

## Fixture validation

Run `node --test tests/crmReconciliationPlan.test.mjs`. Tests cover all three owners, immutable requirements, exact duplicate delivery, retained replay, conflicting replay, out-of-order events, gaps, CRM conflicts, missing/ambiguous links, cross-division isolation, unknown connections, missing mappings, recovery prerequisites, consent suppression, stale/future evidence, bounded shape validation and input preservation. They use synthetic metadata only and make no paid API requests.
