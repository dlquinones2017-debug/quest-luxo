# Durable source bindings and internal delivery outbox

Status: implemented and fixture-tested source component. No production caller, source reader, CRM network client or business dispatcher is added. The explicit isolated-pilot operator added for recovery validation accepts only a fixed synthetic fixture. Existing canonical lead stores, capture, notifications and five operational pilot roles remain unchanged. The existing recurring backup channel supports an explicitly selected fourth synthetic profile.

## Source projection

`createLuxuryCRMObservation(record, identityKey, observedAt)` accepts the current normalized TypeScript Luxury canonical record shape. It requires the original `lead_<UUIDv4>` identifier and rejects fallback/truncated identifiers, legacy flat records, unexpected properties, invalid dates and bounded-serialization failures. It uses separate purpose-derived HMACs for source identity, canonical identity and content fingerprint. Names, email, phone, notes and financial details do not appear in the returned metadata. These are keyed pseudonymous identifiers, not proof of anonymity or authority.

Content revisions respond to actual canonical payload, status, notes, tags and economics changes. Notification-delivery changes are excluded. Reordering JSON keys does not create a revision. Changing the identity key changes bindings; key rotation requires a reviewed migration to prevent duplicate cases.

The pure projection neither opens the store nor authenticates its caller. Qualification, processing consent, provider-sharing consent, source completeness and website attribution remain unknown/unverified. A source `status` or customer-supplied `payload.source` never supplies those claims. Actual source reading must reject partial/malformed snapshots and reconcile source deletions separately; an omitted observation is not deletion. Revision allocation captures observed changes only and cannot recover changes that occurred between snapshots.

## Persistent state

`crmDeliveryOutbox.ts` stores a distinct AES-256-GCM encrypted metadata ledger, with purpose-specific authenticated context, private canonical paths, bounded reads/history, an exclusive writer lock, exact ciphertext compare-and-swap, and synced atomic replacement. It allocates per-binding monotonic revisions under the same lock that enqueues pending delivery. An unchanged latest fingerprint is a no-op that preserves the original observation time and ciphertext. Contradictory versions in a single input batch hold atomically. A later observed content reversion becomes a new revision.

The primary `crm-delivery-outbox-v1.enc.json` and private initialization-intent marker `crm-delivery-outbox-v1.initialized` form a recovery pair. First initialization writes and syncs the marker before the primary. A crash between them holds; neither missing half may be silently recreated by a restarted reader/writer. Restore both artifacts under an existing private canonical directory. Preserve the full ledger, including acknowledgements, attempt hashes and pending work. Do not copy an active lock or assume a stale lock is safe to delete. No history is pruned; capacity exhaustion holds for an explicit retention/migration decision.

## Delivery state and acknowledgement boundary

`enqueueCRMDeliveryObservations` retains observations and `PENDING` work. It does not deliver or suppress an outstanding provider write.

`claimCRMDeliveryAttempt` can claim only the oldest unacknowledged revision for one binding. It returns a transient random token; only its SHA-256 digest is stored. Attempts last 120 seconds. Expired attempts become durably `UNCERTAIN`, and later attempts for that binding hold. There is intentionally no automatic retry or reset. An operator/provider reconciliation adapter must establish whether the original external operation happened before resuming; timeouts cannot safely prove failure.

`confirmCRMDelivery` accepts only the current attempt token, matching idempotency key and an in-window receipt. Case bindings remain stable across revisions and cannot collide across source bindings/divisions. An exact acknowledgement replay is a no-op; conflicting receipts hold. These are caller-supplied receipt claims, explicitly `providerAcknowledgementIndependentlyVerified:false`. There is no authenticated HubSpot adapter in this change. `ACKNOWLEDGED` in a fixture or caller-supplied ledger is not verified CRM synchronization.

Every snapshot keeps `businessDataExecutionAllowed:false` and `writesCRM:false`. No function checks business consent or grants permission to contact customers, submit applications, share borrower data, make offers or spend API credits. A future dispatcher must independently verify source scope, mappings, consent, current recovery and provider authorization immediately before a network action.

## Existing CRM and website boundaries

Reuse the existing shared HubSpot DEAL fields: `ql_division`, `ql_originating_website`, `ql_inquiry_category`, `ql_provider_sharing_consent`, `ql_factoring_referral_stage`. No fields are created here. Internal `REALTY` corresponds to `property_acquisitions`; website attribution is populated only from verified source evidence. Provider-sharing consent is distinct from processing consent and outreach. A website inquiry cannot produce `granted_evidence_verified`, and analytics cannot advance a factoring referral stage.

Capital and Realty remain separate Sites projects, with their own form architecture; this Luxury projection does not parse their email or infer shared hosting. Their source bindings and canonical destinations need independent verification. Live website/CRM integrations belong to their established workstream; this component supplies internal durable coordination.

## Validation and next release gate

Run `node --test tests/crmDeliveryOutbox*.test.mjs tests/luxuryCRMSourceBinding.test.mjs` and `node scripts/demo-crm-outbox.mjs`. The demonstration uses an ephemeral private directory and random key, fixtures, a simulated acknowledgement, and a separate Node process reading a copy of the full encrypted recovery pair. It verifies pending work survives after one simulated acknowledgement. It makes zero network calls and reports zero real CRM deliveries; temporary fixture files are removed afterward.

This ledger has a dedicated fourth backup format. `exportCRMDeliveryOutboxBackup` captures the pair under the source lock and verifies ciphertext revision, initialization intent and state counts. `restoreCRMDeliveryOutboxBackup` authenticates a staged pair before publishing a new target under a target lock. Existing targets are preserved. Portable directory publication requires a trusted private parent against noncooperating filesystem changes; that boundary is documented in the implementation. Manifest creation time is informational; authenticated ledger-derived sequence/counts are checked against decrypted contents.

The optional pilot outbox profile and five-module Windows verifier can now independently recover the exact synthetic pair through the existing authenticated channel. Its scope must be operationally verified with two actual automatic cycles before counting it as recurring four-store recovery. Default three-store proof remains insufficient for the outbox. See `PILOT_RECURRING_BACKUP.md` for the explicit profile selection and task update requirements.

Business activation still requires reviewed source and target mappings, approved unattended provider credentials, an authenticated provider adapter, and uncertain-outcome reconciliation. Synthetic acknowledgement and backup recovery do not grant those permissions or establish real CRM delivery. The generic outbox remains unconnected to production capture.
