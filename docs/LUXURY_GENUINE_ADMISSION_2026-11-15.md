# Bounded genuine inquiry admission

This candidate implements first-batch internal handling, not continuous autonomous
admission. It retains the original runtime owner, JSONL source, lock, journal key,
broker-console authentication and bounded release gate. It creates no policy
store, new owner, paid dependency or customer-marketing authority.

## Explicit operator review in the existing record

A protected POST to `/api/broker/leads/internal-handling` records a signed typed
`internalHandlingReviews` history on the same canonical inquiry, outside its
immutable thirteen-field payload. The caller must have the explicitly configured
existing broker credential; development auth-disabled mode cannot issue reviews.
The server owns actor, time, ID, event/email binding, scope and seal. The operator
supplies the exact displayed fingerprint, previous-review ID, deliberate decision,
referenced existing native sources and an explicit source-review attestation.
This authenticates the operator's reviewed decision; a reference is not automated
proof that the external source is correct. Installation makes no actual decision.

The scope is only `LUXURY_INTERNAL_CONTACT_TASK_ONLY`, with customer communication
`NOT_GRANTED`. Unknown/blocked suppression, missing evidence, stale identity,
invalid seal, expiry or latest revocation deny admission. A signed CLEAR means an
explicit reviewed decision for this bounded internal purpose, not global consent,
newsletter/SMS opt-in or permission to contact the customer. Notes, tags,
`hs_email_optout=false`, enrichment opt-out and legal-basis fields cannot mint it.
No native global DND field is assumed. Actual source review remains the operator's
required work before recording a positive decision.

The existing canonical lock provides prior-review compare-and-swap. Reviews last
fifteen minutes, remain through other known record updates, and preserve unrelated
raw root metadata during the review write. Legacy missing IDs, partial source or
invalid history cannot be normalized into policy authority.

## Original release and revocation

`createGenuineInquiryReleaseReader()` reads a bounded owner-installed manifest
from trusted server configuration. It is disabled when absent, revoked, expired,
replaced or malformed. The manifest names one to five exact inquiry fingerprints
and current canonical-review references, existing destination/owner, original
release/recovery/runtime evidence and validity window. Every write rechecks that
same current manifest and review. No new universal user approval is introduced;
implementation is already authorized, while the original actual release gate is
preserved. This candidate sets no environment value or live flag.

`createConfiguredGenuineInquiryContext()` exposes the source, admission, release
and existing-intake-notice readers. `runLuxuryGenuineInquiryFromConfiguredRelease()` now combines them with the
existing delivery engine and owner-supplied journal/CRM lifecycle. Importing it
installs no startup hook, schedule or additional worker. The source context
itself performs no journal/provider operation.

## Reuse the original intake notification

Genuine inquiry handling must not send another owner email. Its notification
policy is always `EXISTING_INTAKE_NOTICE_ONLY`; no additional-notice approval gate
exists. `getExistingIntakeNotification(event)` re-reads the matching canonical
record and returns only one of:

- `ACCEPTANCE_RECORDED`, with actual parsed intake provider ID or null, and exact
  source-record ID, saved time and fingerprint; or
- `UNVERIFIED`.

Recorded acceptance requires the existing server-owned `emailDelivery` result to
be sent/configured/HTTP2xx with unchanged event and email binding. It is not
workforce-email acceptance, native provider GET, inbox placement or human action.
Malformed or absent provider ID stays null. The original intake result remains in
the canonical store. Missing acceptance holds admission before CRM work. No send,
retry, message ID or acknowledgment is fabricated.

The delivery engine uses `EXISTING_INTAKE_ACCEPTANCE_RECORDED`, leaves workforce
`notificationId` null, and never calls `notifyOwner` in genuine mode. The native
adapter also rejects a direct genuine-mode notification send. Existing intake
evidence is checked before enqueue and before completion. Inbox and human-action
fields remain UNKNOWN. The original internal-validation notification behavior
remains separate. The workforce-email receipt reader cannot attest this distinct
intake-notice state.

## Verification and remaining work

The new admission tests use synthetic local source files, random temporary keys,
mock operator decisions and no live provider calls. They cover authenticated
review, immutable identity, no inference from marketing/notes/tags, source-review
requirements, blocked/unknown decisions, revocation/CAS, tampering/expiry, source
integrity, current bounded release, typed intake evidence and missing-evidence
holds. Actual source review, accepted first-batch release and integrated deployed
acceptance are not claimed. Integrated tests cover the real configured source-to-review-to-journal flow
with synthetic local records and mocked providers, including replay, no second
email, missing/substituted intake evidence and populated synthetic restore HOLD.
These are implementation checks, not deployed acceptance.


## Release and rollback limits

The actual original email-trigger account binding, accepted deployed event run,
production receipt capability and populated production recovery are still separate
live gates. Missing release configuration is OFF; this patch does not change a
runtime flag or clear Business HOLD. The existing controlled test authorization
is consumed and cannot be used to send another validation email.

For a bounded release, the existing owner must review the exact current canonical
inquiry and suppression sources, record the protected typed decision, and bind
that exact review/fingerprint to the original release decision. The configured
callable receives the existing managed key and journal lifecycle in memory; it
must not be exposed through a public endpoint or caller-supplied dependencies.
The protected review endpoint only records a decision and never runs the worker.

Stop by removing/revoking the bounded release configuration first. Preserve source
records, native IDs and journal bytes. The added intake-notice enum requires this
compatible journal reader; an older reader fails closed on that state and must
not be used to reset, rewrite or drain it. Never restore over the production
journal to make a rollback appear clean. Isolated populated recovery remains a
required live acceptance step with the existing protected retention path.
