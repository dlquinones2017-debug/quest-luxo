# Owner inbox receipt option — isolated review candidate

This delta targets draft PR110 at `07bc6e92ea24a6d503312353e5c1843cc7ecd043`,
on main `f7530471aa68de5c416d25d5afc367f37a300dc9`. It implements a separately
typed positive owner-inbox receipt path using the existing delivery engine and
journal schema. It does not wire an authenticated Gmail transport into production.

## Implemented behavior

`createWorkforceOwnerInboxReceiptReader()` defaults to `UNAVAILABLE` until an
existing authenticated read-only Gmail transport is bound by trusted server code.
The transport contract maps the observed native connector methods: `get_profile`
returns `id` and `email`; `read_email(format:"full")` returns `id`, `label_ids`,
`internal_date`, and the snake_case `payload.headers/parts/body.content` tree.
These methods must be fixed to the existing business connection and an explicit
`AuthenticatedOwnerGmailBinding` from trusted server configuration, with the
expected account identity and mailbox `denzel@questluxo.com`. Missing or invalid
binding is unavailable before a native source read. The account cannot be
inferred from the returned profile. Copied profile objects,
JSON receipts, caller headers, or request-provided reader implementations do not
authenticate a transport. The application currently has no such runtime binding.

The reader requires the named native message to remain in INBOX, pins sender,
recipient and Delivered-To, compares the exact current subject and both plain and
HTML bodies (only CRLF normalization), and checks native Google-delivered/auth
headers and timestamps. Exact content includes canonical event/fingerprint and
both native CRM links. It rejects duplicate/conflicting headers, unread MIME
parts, attachments, partial/mutated content and mismatched account identity.
Header results are evidence reported by the trusted Gmail source; this module
does not independently perform DNS or DKIM cryptographic verification. Imported
or caller-supplied messages must never be presented as native delivered evidence.

`WorkforceContactTaskDelivery.reconcileOwnerInboxReceipt(event, messageId, reader)`
checks the existing journal binding and re-reads the native contact and exact
single-contact task association/owner before and after mailbox receipt verification.
It requires an in-process, fresh, request-bound proof issued by the reader. Copied
JSON, stale proof and cross-event/native-ID substitution cannot authorize a write.
An exact journal comparison prevents intervening owner changes from being lost.
Restored-journal HOLD stops receipt processing. Sequential verified replay does
not change the journal revision. No contact, task, owner email or provider GET is
created by reconciliation.

The only journal-field change is `inboxReceipt: "VERIFIED"`. A COMPLETE entry
keeps its existing provider acceptance and provider ID. An ambiguous NOTIFY entry
with unknown provider ID remains UNCERTAIN with its existing operation and
notification state. Its positively observed owner inbox receipt is independent
evidence; it cannot invent a Resend ID, authorize a resend or satisfy the provider
GET contract. Human action is preserved, never inferred.

Sending and receipt comparison share one exact notification-content factory.
The internal-validation send payload and idempotency key are unchanged. Genuine
intake now follows the distinct existing-intake-only branch documented in
[LUXURY_GENUINE_ADMISSION_2026-11-15.md](LUXURY_GENUINE_ADMISSION_2026-11-15.md); it sends no workforce owner email. Provider GET now throws a
sanitized typed `WorkforceNotificationReadUnavailable` on inaccessible reads;
401 `restricted_api_key` is specifically `RESTRICTED_SEND_ONLY_KEY`. Missing,
timeout and malformed read responses also remain unavailable. They cannot become
negative delivery evidence, positive receipts or fallback POSTs.

## Current evidence and remaining integration

The owner retains the exact controlled-execution and independent native-mailbox
receipts privately. Those records identify the existing entry and its original
native contact, task and owner message. This candidate neither imports those
records as authority nor changes their journal inbox field. An SES RFC Message-ID
is not a Resend email ID. No production journal was accessed or mutated for this
candidate; the prior approved test is consumed. Execution/account identifiers
and test markers are intentionally absent from this public implementation handoff.

The current approved runner still calls provider GET at its NATIVE_READBACK gate.
It must remain HELD under its current contract. The existing runtime owner must
review and integrate an explicit alternative owner-inbox gate, bind the actual
read-only authenticated business transport, and authorize any real journal-field
reconciliation separately. This patch supplies neither an automatic production
Gmail binding nor permission to run the consumed test again. No broader Resend
key, new email, source fixture, public route, store, subscription or deploy is
needed or included. Production business HOLD and genuine-intake gates remain.

## Official Resend behavior checked November15

| Mechanism | Supported meaning | Limit for this task |
| --- | --- | --- |
| Sending-only key | Can send; other API operations are restricted. | Current 401 retrieval is unavailable, not evidence of non-delivery. [API permissions](https://resend.com/docs/api-reference/api-keys/create-api-key), [errors](https://resend.com/docs/api-reference/errors). |
| Retrieve sent email | GET by email ID returns content and event metadata. | Current credential cannot use it; the adapter keeps that limitation explicit. [Retrieve](https://resend.com/docs/api-reference/emails/retrieve-email). |
| `email.sent` / `email.delivered` | Successful send request / delivery to recipient mailserver. | Neither proves owner INBOX nor human completion. [Event definitions](https://resend.com/docs/webhooks/event-types). |
| Signed webhook | Raw body and Svix headers must be verified using the endpoint signing secret. | Current code/dependency/route inspection found no Resend/Svix verifier, route or binding. A public intake or broker-console key is not a webhook verifier. No webhook receipt is manufactured here. [Verification](https://resend.com/docs/webhooks/verify-webhooks-requests). |
| Webhook retries/replays | Resend retries; owners can replay webhook deliveries. | No replay or endpoint mutation was requested or performed. [Retries](https://resend.com/docs/webhooks/retries-and-replays). |
| RFC `message_id` | Resend exposes it in relevant webhook/GET payloads for correlation. | Correlation needs that authenticated mapping; never derive Resend `email_id` from an SES/Gmail ID. [Message-ID update](https://resend.com/changelog/message-id-for-sent-emails), [delivered payload](https://resend.com/docs/webhooks/emails/delivered). |
| Idempotency | Same request/key can return original result during a 24-hour retention window. | It is not an unlimited historical receipt lookup or authorization to resend. This candidate performs no POST recovery. [Idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys). |

## Validation

Eleven new test cases include adversarial subcases for missing/invalid trusted
account binding, wrong account, mailbox drift,
SENT-only/spam/trash, auth/header spoofing and duplicates, content/fingerprint/native
link substitution, unread/oversized MIME, wrong profile mode, malformed/time-invalid
messages, JSON proof forgery, cross-task proof replay, expired observation,
association changes during read, journal CAS races and restored HOLD. COMPLETE
and ambiguous NOTIFY cases preserve native notification state and issue zero
provider writes. Current 401,404,network failure and malformed retrieval responses
are typed unavailable with no credential text or fallback send.

All tests use in-memory synthetic unit data and temporary encrypted test journals;
they do not create a canonical inquiry fixture or access a production journal.
Repository test, check and build results are recorded in the adjacent review
receipt; local success does not establish deployed integration or release.
