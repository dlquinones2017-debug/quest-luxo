# Server Gmail receipt transport — review candidate

The existing owner-inbox reader accepts a trusted transport, but production has
no implementation for Google's REST response shape. The ChatGPT Gmail connection
is available to the operator host; its credentials are not a Render credential
and must not be exported. This candidate supplies the HTTP transport and its
optional composition with the existing receipt reader. It does not connect an
account, add a runtime caller, reconcile a journal or activate intake.

## Implemented behavior

`createGoogleOwnerGmailTransport` receives one server-owned, short-lived OAuth
access token, its expiry/granted-scope metadata and an explicit expected account
subject/mailbox. Configuration is copied at construction. The token is held only
in the closure and sent only in an Authorization header to fixed Google HTTPS
endpoints. No response, exception or return value includes it. There is no token
refresh, persistence, environment lookup, authorization endpoint or consent flow.

The transport reads Google's discovery document without credentials and requires
the exact expected issuer and allowlisted UserInfo endpoint. Account checks use
authenticated UserInfo `sub`, verified email, and Gmail `emailAddress`. Gmail's
`users.getProfile` does not return Google's stable subject ID; that ID must not be
invented from a mailbox or history ID. Identity and mailbox must independently
match trusted configuration before any message body read. The existing receipt
reader repeats account checks after the message read.

Only GET is implemented: discovery, UserInfo, Gmail profile and one exact message
ID with `format=full`. There is no message listing/search, attachment fetch,
send, label mutation, subscription, watch or polling endpoint. Redirects fail,
HTTP calls time out, responses are bounded while streaming, and provider bodies
are omitted from sanitized errors. Declared expired credentials fail without a
refresh or retry.

Google's camelCase message fields and base64url MIME bodies are mapped to the
existing reader's snake_case, decoded-content contract. Mapping rejects unread
attachments, unsupported MIME structure, invalid UTF-8/base64url, inconsistent
byte counts, oversized data and invalid/path-injected IDs. Headers are preserved
for the existing strict sender, authentication, recipient, body and event checks;
the transport does not assert DKIM validation from a caller's JSON flags.

`createGoogleOwnerGmailReceiptReader()` remains unavailable with no authorization.
With valid server-owned authorization it composes the new transport with the
existing receipt reader and its same-process, request-bound proof. It does not
start a journal or change any entry. The existing controlled-test inbox receipt,
provider acceptance, uncertain-send rules and human-action state stay separate.

## Authorization and live acceptance still required

The authorization owner must supply a separately approved business-account OAuth
capability with **openid, email and gmail.readonly**, a verified expected Google
subject/mailbox and actual expiry/granted-scope metadata. The equivalent
`userinfo.email` scope URI is accepted for `email`. Broader or incomplete declared
scope sets are rejected as configuration. This metadata is supplied by the trusted
OAuth owner; the module does not introspect a token to independently prove its
granted scopes or implement an OAuth sign-in protocol.

**gmail.readonly permits reading the mailbox, not only one message.** This
adapter limits its own calls to an explicit known message ID; that application
limit does not narrow Google's OAuth grant. No production credential may be
copied from the operator's ChatGPT connection. A new credential/grant or broader
access needs its own concrete authorization before provisioning. This change
does not request one or add a secret to Render.

Before a live receipt check, the existing runtime owner must review the secure
token source/refresh lifecycle and instantiate this transport only server-side.
Then use a separately authorized read of the already existing message, without
sending another test. Any actual journal receipt reconciliation is a separate
write operation and must retain native contact/task, binding/CAS, restored-HOLD,
fresh-proof and no-provider-write checks. Passing mocked HTTP tests does not
establish a production account connection or authorize that reconciliation.

The original Inquiry Intake webhook's backend account/subscription/run evidence
is a separate unresolved requirement. This HTTP transport cannot discover or
repair ChatGPT webhook subscriptions. No original task is changed or replaced.
Intake remains OFF and Business HOLD remains ON. Deployment and genuine-inquiry
release are outside this candidate.

## Official contracts checked November 15, 2026

- [Gmail profile](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users/getProfile):
  mailbox identity is `emailAddress`; there is no stable Google `sub` field.
- [Full-message get](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages/get)
  and [format](https://developers.google.com/workspace/gmail/api/reference/rest/v1/Format):
  `full` supplies parsed payload; metadata scope cannot retrieve it.
- [Message body](https://developers.google.com/workspace/gmail/api/reference/rest/v1/users.messages.attachments):
  `data` is base64url and `size` counts decoded bytes; attachment bodies may be external.
- [Google identity](https://developers.google.com/identity/openid-connect/openid-connect):
  discovery supplies UserInfo; access tokens go in the authorization header and
  `sub` is the account identifier.
- [Gmail scopes](https://developers.google.com/workspace/gmail/api/auth/scopes):
  read-only mailbox access is a distinct scope from metadata, modification or send.

## Validation scope

Synthetic HTTP tests cover the full composed receipt path, absent authorization,
invalid/broad declarations, account drift, poisoned discovery, fixed URLs/GET,
credential/header safety, strict decoding, attachment/size limits, HTTP failures,
streaming bounds, expiry and copied-proof rejection. Existing receipt/journal
tests retain duplicate/replay, association, CAS, uncertain-send and recovery HOLD
coverage. No real token, mailbox, source fixture, CRM or production journal is
used in this candidate's tests. Exact test/check/build results are reported in
the pull request and private execution checkpoint.
