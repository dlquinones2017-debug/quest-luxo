# Read-only HubSpot provider and uncertain-delivery review

Status: implemented and fixture-tested source component. No runtime credential, native case map, customer query, CRM write, environment mutation or production caller is added. The live pilot's four-store recovery and five operational roles remain separate from this source-only integration.

## Restricted reader

`createHubSpotDealMetadataReader({ key, portalId, token, request, clock })` supplies a read-only known-DEAL lookup. `portalId` and native DEAL IDs must be positive canonical decimal strings. The reader pins the documented legacy v3 contract at `https://api.hubapi.com/crm/v3/objects/0-3/{dealId}`; there is no API-version fallback, search, external-ID lookup, write method or arbitrary URL. Keep this explicit version pin under review against HubSpot's published API lifecycle before production activation.

The query explicitly requests `ql_division`, `ql_originating_website`, `ql_inquiry_category`, `ql_provider_sharing_consent`, `ql_factoring_referral_stage`, and `hs_object_id`. It validates the known enum values, normalizes valid UTC timestamps including responses without milliseconds, and discards unrequested freeform response properties. Missing values become unknown nulls. Native identity, archive-state or timestamp conflicts hold. Archived lookups are explicit; an archived result is never silently substituted for an active record.

The bearer credential is supplied only by an injected approved token provider and placed only in the authorization header. The full credential acquisition, fetch and response-read operation has a 15-second deadline. Redirects, automatic retries, oversized bodies, invalid UTF-8 and raw provider errors are rejected or reduced to generic held states. The response body is bounded at 256 KiB. No token, native DEAL ID, names, contact details, freeform fields or raw response/errors appear in returned results.

`deriveHubSpotCRMCaseId(key, nativeID, portalId)` uses a separate purpose-derived HMAC of the configured portal and native ID. Provider revision and response fingerprints use separate purposes and sanitized metadata. The caller must independently verify that the credential belongs to the configured portal; passing a portal ID is not token-account verification. The opaque case hash cannot reconstruct its native ID. Maintain an approved protected native-ID-to-local-case binding rather than attempting to reverse a hash or infer identity from names.

## Current schema and outcome evidence

The connected portal's read-only property-definition audit found 132 DEAL properties, including the five existing `ql_` enum fields. No reviewed source-event identity, canonical identity, source revision or event fingerprint field is present. The connector does not expose all uniqueness flags, so absence of such metadata must not be treated as proof of uniqueness. No properties are created by this change.

A successful GET establishes an observed metadata snapshot, not that a particular pending or uncertain operation was applied. `updatedAt`, division and website values are insufficient to associate an event or revision. A 404 is explicitly `NOT_FOUND_NONDEFINITIVE`; it cannot prove non-delivery. Search absence is also insufficient because provider search can lag and excludes archived records.

`reviewUncertainCRMDelivery(input, now)` accepts a bounded metadata snapshot of an already-uncertain delivery, its original attempt, an explicit case-binding review, and the sanitized reader result. It validates identity, timing and scope. Stale evidence, unknown/expired bindings, conflicting cases/divisions, archived records, missing metadata, authorization failures and rate limits hold. Even a matching current case yields `HOLD_OPERATION_EVIDENCE_REQUIRED` until an operation-specific evidence contract exists. Every result preserves uncertainty and explicitly disallows acknowledgement, retry, checkpoint advancement, business execution, CRM writes, messages and model API calls. It never mutates the outbox or supplies a reset path.

## Runtime credential release

| Item | Required scope or boundary |
|---|---|
| Account | Explicit reviewed HubSpot portal matching `portalId` |
| Permission | `crm.objects.deals.read` only for this first lookup integration |
| Scope meaning | Deal-read authorization is broader than a field-level restriction; this adapter requests only the listed metadata fields |
| Credential | Reuse an existing approved account-bound credential if available; otherwise use HubSpot's current Service Key flow with the required authorization |
| Custody | Existing approved secret store and injected token provider; no token in source, argv, reports or chat |
| Native identity | Explicit protected native DEAL ID binding; no invented case/source association |
| Activation | Independently verify account/scope, selected source and case mapping before a live call |

The ChatGPT HubSpot connection is not an exportable backend credential. A names-only production diagnostic found no variables containing `HUBSPOT` or `CRM`; it did not inspect secret values or claim that no credential could exist elsewhere. No credential was retrieved or provisioned.

Current official documentation recommends **Development → Keys → Service keys** for in-account REST integrations, requiring Super Admin or Developer tools access. Existing legacy private apps continue working, but new legacy private-app creation is being disabled. Inspect existing integration metadata first. Creating a new Service Key or adding scopes is a real access grant and must follow the applicable authorization requirement. No paid upgrade or onboarding prerequisite has been established for this read-only lookup.

## Verification

Run `node --test tests/hubspotDealMetadataReader.test.mjs tests/crmUncertainDeliveryReview.test.mjs tests/crmProviderReviewE2E.test.mjs` and `node scripts/demo-crm-provider-review.mjs`.

The end-to-end demonstration creates an ephemeral encrypted outbox, expires an attempt to `UNCERTAIN`, then uses injected synthetic 200 and 404 responses. Both outcomes preserve the exact ledger ciphertext and revision. It makes zero real provider requests and reads no runtime credential. Synthetic results do not establish live provider authorization or a recovered business pipeline.

Primary references verified for this change:

- [Documented v3 known-DEAL read](https://developers.hubspot.com/docs/api-reference/legacy/crm/objects/deals/get-deal)
- [Current versioned known-DEAL read](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deal)
- [Account Service Keys](https://developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/account-service-keys)
- [Legacy private-app creation change](https://developers.hubspot.com/changelog/legacy-private-app-creation-sunset)
- [Service Key permission model](https://developers.hubspot.com/changelog/service-keys)
