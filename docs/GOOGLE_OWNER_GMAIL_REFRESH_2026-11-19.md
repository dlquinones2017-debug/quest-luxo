# Optional server Gmail token refresh — review candidate

Prepared against main commit `9836eb81114cd6031e9221461104f956fe171303`, tree `5cd35202f4d622ecf35fe605fb5d6a72952b8326`. This candidate adds one optional module and synthetic tests. It is not merged, deployed, wired into a runtime or supplied with real credentials.

## Problem and behavior

The existing Google Gmail transport takes a short-lived access token and correctly refuses it after expiry. It has no source of fresh authorization. `createGoogleOwnerGmailAuthorizationProvider` supplies the missing bounded refresh operation for later manual server-side composition.

Construction does no IO. A caller must supply a separately approved server-owned refresh credential, its original exact granted scopes and its already verified owner subject/mailbox. The provider copies that configuration, makes one fixed HTTPS form POST to Google's token endpoint, checks the explicit response scopes and lifetime, and verifies the returned token's owner through the fixed authenticated UserInfo endpoint. Only then does it return the existing transport's short-lived authorization shape.

The credential loader must validate the approved client/project binding from trusted custody. This module accepts no URL, file path, mailbox selector or token from an HTTP request and does not provide that loader. A client ID or email in an untrusted request is not evidence of founder authorization.

Only `openid`, `email`/`userinfo.email`, and `gmail.readonly` are accepted. Scope evidence is required both in the original trusted grant and in every refresh response. Missing refresh-response scopes fail even though some OAuth providers can omit this field. This deliberate restriction keeps scope evidence explicit. The underlying Google grant remains mailbox-wide read-only.

## Lifetime and failure handling

- Concurrent callers share one refresh and identity verification. A valid immutable authorization is cached in memory until sixty seconds before its conservative expiry, measured from request start.
- Account drift, unexpected scopes, malformed tokens/lifetimes, HTTP failures, response bounds, backward clocks and interrupted operations discard the cache and latch the provider unavailable. There is no automatic retry, background refresh or fallback to an expired token. The runtime owner must review the failure and reconstruct the provider before another attempt.
- Unexpected refresh-token rotation fails closed. No new persistent secret is silently dropped or written. Rotation needs a separately reviewed durable custody update.
- `close()` retires the cache, aborts pending requests and releases captured credential references. JavaScript strings are not guaranteed to be securely erased. Closing does not revoke the Google grant or invalidate a capability already handed to another server component; that capability remains bounded by its own expiry and checks.
- Responses are streamed with a 32 KiB bound and ten-second request timeout. Redirects fail. Secrets are sent only in the fixed token POST body or authenticated UserInfo header, never a URL. Errors expose one fixed code without provider bodies, raw tokens or chained exceptions.

The module returns an access-token capability only to trusted server code. That object must never be serialized into logs, a public response, a document or a browser. It contains no refresh/client secret, filesystem path, ID token or provider response.

## Composition boundary

The existing transport is unchanged. After an authorized runtime owner calls `getAuthorization()`, it can manually construct a new existing transport/receipt reader with the result. Refresh does not mutate an old transport or an old receipt proof. The existing transport independently repeats account/mailbox checks before message access.

This candidate adds no production caller, environment variable, HTTP endpoint, credential provisioning or persistence, consent flow, timer, scheduler, Gmail message/list/watch/send/modify call, inbox subscription, source fixture, journal write, CRM operation or HOLD release.

The founder's Windows-encrypted client copy remains on the owner laptop. The local consent helper still reports `existing_authorization:false`; this module cannot decrypt that Windows-bound file on Render. Google consent, secure server credential handoff/loader and verified subject capture remain prerequisites. No ChatGPT connector credential may be exported.

Original mailbox/subscription/event-run evidence and bounded genuine-inquiry acceptance remain separate Step 5 gates. The previous controlled test remains consumed. **Intake OFF. Business HOLD ON.**

## Validation and review

The review workspace is a dependency-complete mirror for these modules, not a full project checkout. Source blobs were checked against the immutable GitHub tree. All 41 targeted tests (30 new and 11 existing transport/receipt tests) passed on Linux Node 24.22.3 and Windows Node 24.18.0. Strict TypeScript 6.0.3 checking of the new module and its transitive dependencies passed on Windows. Validation uses synthetic credentials and HTTP only; no live token exchange or mailbox read is part of it. Full project build and hosted-check results must be verified on the exact proposed commit before merge/deploy review.

The three-file diff is additive: this document, `src/lib/command/googleOwnerGmailAuthorization.ts` and `tests/googleOwnerGmailAuthorization.test.mjs`. Publishing a draft PR does not authorize merge, deployment, credential provisioning or runtime activation.

## Official contracts checked November 19, 2026

- [Google desktop OAuth token refresh](https://developers.google.com/identity/protocols/oauth2/native-app#offline): fixed token endpoint, refresh-token grant and client fields.
- [Google server-side offline access](https://developers.google.com/identity/protocols/oauth2/web-server#offline): refresh lifecycle after an offline grant.
- The original transport documentation retains the UserInfo identity and Gmail receipt contracts. No new OAuth scope or consent flow is introduced here.
