import assert from 'node:assert/strict';
import test from 'node:test';
import { createGoogleOwnerGmailAuthorizationProvider, GoogleOwnerGmailAuthorizationUnavailable } from '../src/lib/command/googleOwnerGmailAuthorization.ts';
import { createGoogleOwnerGmailTransport } from '../src/lib/command/googleOwnerGmailTransport.ts';

// All credentials, account subjects and HTTP responses below are synthetic.
const NOW = Date.parse('2026-11-19T13:00:00Z');
const TOKEN = 'https://oauth2.googleapis.com/token';
const USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';
const DISCOVERY = 'https://accounts.google.com/.well-known/openid-configuration';
const GMAIL_PROFILE = 'https://gmail.googleapis.com/gmail/v1/users/me/profile';
const EMAIL = 'https://www.googleapis.com/auth/userinfo.email';
const READONLY = 'https://www.googleapis.com/auth/gmail.readonly';
const ACCESS = 'synthetic-access-token-never-real-111';
const REFRESH = 'synthetic-refresh-token-never-real-222';
const SECRET = 'synthetic-client-secret-never-real-333';
const credential = () => ({
  clientId: '12345678901-syntheticoauthclient123456789.apps.googleusercontent.com',
  clientSecret: SECRET, refreshToken: REFRESH,
  grantedScopes: ['openid', 'email', READONLY],
  binding: { accountId: '111111111111111111111', mailbox: 'denzel@questluxo.com' },
});
const tokens = () => ({ access_token: ACCESS, token_type: 'Bearer', expires_in: 3600, scope: `openid email ${READONLY}` });
const identity = () => ({ sub: credential().binding.accountId, email: credential().binding.mailbox, email_verified: true });
const unavailable = error => {
  assert.ok(error instanceof GoogleOwnerGmailAuthorizationUnavailable);
  assert.equal(error.code, 'GOOGLE_OWNER_GMAIL_AUTHORIZATION_UNAVAILABLE');
  assert.equal(error.message, 'Business Gmail authorization is unavailable.');
  assert.equal(error.cause, undefined);
  for (const secret of [ACCESS, REFRESH, SECRET, 'PRIVATE_PROVIDER_DETAIL']) {
    assert.ok(!`${String(error)} ${error.stack} ${JSON.stringify(error)}`.includes(secret));
  }
  return true;
};
function mock() {
  const calls = [], response = { token: tokens(), identity: identity() };
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    assert.equal(options.redirect, 'error');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal instanceof AbortSignal);
    assert.ok(!url.includes(ACCESS) && !url.includes(REFRESH) && !url.includes(SECRET));
    if (url === TOKEN) return Response.json(response.token);
    if (url === USERINFO) return Response.json(response.identity);
    if (url === DISCOVERY) return Response.json({ issuer: 'https://accounts.google.com', userinfo_endpoint: USERINFO });
    if (url === GMAIL_PROFILE) return Response.json({ emailAddress: credential().binding.mailbox });
    throw Error('Unexpected HTTP destination');
  };
  return { calls, response, fetcher };
}
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}

test('construction and absent credentials perform no HTTP, file or environment lookup', async () => {
  let calls = 0;
  const p = createGoogleOwnerGmailAuthorizationProvider(undefined, async () => { calls++; throw Error(); });
  assert.equal(calls, 0);
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(calls, 0);
  p.close();
});

test('invalid configuration cannot create a provider or issue HTTP', () => {
  let calls = 0;
  const request = async () => { calls++; throw Error(); };
  const bad = [null, {}, { ...credential(), clientId: 'https://attacker.example/token' },
    { ...credential(), clientSecret: '' }, { ...credential(), clientSecret: 'bad\nsecret' },
    { ...credential(), refreshToken: 'short' }, { ...credential(), refreshToken: 'r'.repeat(8193) },
    { ...credential(), grantedScopes: `openid email ${READONLY}` },
    { ...credential(), binding: { ...credential().binding, accountId: 'mailbox-history-id' } },
    { ...credential(), binding: { ...credential().binding, mailbox: 'other@example.com' } }];
  for (const value of bad) assert.throws(() => createGoogleOwnerGmailAuthorizationProvider(value, request), unavailable);
  assert.equal(calls, 0);
});

test('broad, missing, duplicate and case-shifted grant scopes fail before HTTP', () => {
  for (const grantedScopes of [[], ['openid', 'email'], ['openid', 'email', READONLY, 'profile'],
    ['openid', EMAIL, 'email'], ['OPENID', 'email', READONLY], ['openid', 'email', 'https://mail.google.com/']]) {
    assert.throws(() => createGoogleOwnerGmailAuthorizationProvider({ ...credential(), grantedScopes }), unavailable);
  }
});

test('refresh uses only a fixed HTTPS POST and the exact form fields; secrets never enter a URL', async () => {
  const m = mock(), input = credential();
  const p = createGoogleOwnerGmailAuthorizationProvider(input, m.fetcher, () => NOW);
  assert.equal(m.calls.length, 0);
  const auth = await p.getAuthorization();
  assert.equal(m.calls.length, 2);
  assert.equal(m.calls[0].url, TOKEN);
  const options = m.calls[0].options;
  assert.equal(options.method, 'POST');
  assert.equal(options.headers['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal(options.headers.Authorization, undefined);
  assert.deepEqual(Object.fromEntries(new URLSearchParams(options.body)), {
    client_id: input.clientId, client_secret: SECRET, refresh_token: REFRESH, grant_type: 'refresh_token',
  });
  assert.equal(m.calls[1].url, USERINFO);
  assert.equal(m.calls[1].options.method, 'GET');
  assert.equal(m.calls[1].options.headers.Authorization, `Bearer ${ACCESS}`);
  assert.equal(m.calls[1].options.body, undefined);
  assert.equal(auth.accessToken, ACCESS);
  assert.equal(auth.expiresAt, NOW + 3600000);
  assert.deepEqual(auth.grantedScopes, [READONLY, EMAIL, 'openid'].sort());
  assert.deepEqual(auth.binding, input.binding);
  assert.equal(auth.refreshToken, undefined);
  assert.equal(auth.clientSecret, undefined);
});

test('credential, scope and account configuration are copied before caller mutation', async () => {
  const m = mock(), input = credential();
  const p = createGoogleOwnerGmailAuthorizationProvider(input, m.fetcher, () => NOW);
  input.clientId = 'changed'; input.clientSecret = 'changed'; input.refreshToken = 'changed';
  input.grantedScopes.push('profile'); input.binding.accountId = 'changed'; input.binding.mailbox = 'changed';
  const auth = await p.getAuthorization();
  const body = new URLSearchParams(m.calls[0].options.body);
  assert.equal(body.get('client_secret'), SECRET);
  assert.equal(body.get('refresh_token'), REFRESH);
  assert.equal(auth.binding.accountId, credential().binding.accountId);
  assert.equal(auth.binding.mailbox, credential().binding.mailbox);
});

test('issued authorization, binding and scope list are immutable', async () => {
  const m = mock(), p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
  const auth = await p.getAuthorization();
  for (const value of [p, auth, auth.binding, auth.grantedScopes]) assert.ok(Object.isFrozen(value));
  assert.throws(() => { auth.binding.mailbox = 'other@example.com'; }, TypeError);
  assert.throws(() => { auth.grantedScopes.push('profile'); }, TypeError);
});

test('a valid cached token is reused without another HTTP request', async () => {
  const m = mock(), p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
  const first = await p.getAuthorization();
  assert.equal(await p.getAuthorization(), first);
  assert.equal(m.calls.length, 2);
});

test('the sixty-second boundary triggers one refresh and a fresh identity check', async () => {
  const m = mock(); let time = NOW;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => time);
  const first = await p.getAuthorization();
  time = first.expiresAt - 60001;
  assert.equal(await p.getAuthorization(), first);
  assert.equal(m.calls.length, 2);
  time++;
  m.response.token.access_token = 'synthetic-second-access-token-444';
  const next = await p.getAuthorization();
  assert.notEqual(first, next);
  assert.equal(next.accessToken, m.response.token.access_token);
  assert.equal(m.calls.length, 4);
});

test('concurrent callers share one refresh and one identity validation', async () => {
  const m = mock(), gate = deferred();
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async (url, options) => {
    if (url === TOKEN) await gate.promise;
    return m.fetcher(url, options);
  }, () => NOW);
  const pending = Array.from({ length: 20 }, () => p.getAuthorization());
  gate.resolve();
  const results = await Promise.all(pending);
  assert.equal(m.calls.length, 2);
  assert.ok(results.every(value => value === results[0]));
});

test('missing, broad or duplicate refreshed scopes stop before UserInfo and latch unavailable', async () => {
  for (const scope of [undefined, '', ['openid', 'email', READONLY], 'openid email', `openid email ${READONLY} profile`,
    `openid email ${EMAIL}`, `openid email https://mail.google.com/`]) {
    const m = mock(); m.response.token.scope = scope;
    const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
    await assert.rejects(p.getAuthorization(), unavailable);
    await assert.rejects(p.getAuthorization(), unavailable);
    assert.equal(m.calls.length, 1);
  }
});

test('equivalent email scope aliases and ordering are accepted without widening access', async () => {
  const m = mock(); m.response.token.scope = `${READONLY} openid ${EMAIL}`;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
  assert.deepEqual((await p.getAuthorization()).grantedScopes, [READONLY, EMAIL, 'openid'].sort());
});

test('malformed token, token type and lifetime evidence fail before UserInfo', async () => {
  const changes = [
    { access_token: '' }, { access_token: 'short' }, { access_token: 'bad\n' + ACCESS }, { access_token: 'a'.repeat(4097) },
    { token_type: 'DPoP' }, { token_type: undefined }, { expires_in: 60 }, { expires_in: -1 },
    { expires_in: 3600.1 }, { expires_in: '3600' }, { expires_in: null }, { expires_in: 86401 },
  ];
  for (const change of changes) {
    const m = mock(); Object.assign(m.response.token, change);
    const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
    await assert.rejects(p.getAuthorization(), unavailable);
    assert.equal(m.calls.length, 1);
  }
});

test('an unexpected rotated refresh credential is not silently dropped or persisted', async () => {
  const m = mock(); m.response.token.refresh_token = 'synthetic-rotated-refresh-token';
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(m.calls.length, 1);
});

test('an identical echoed refresh credential does not appear in returned authorization', async () => {
  const m = mock(); m.response.token.refresh_token = REFRESH;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
  assert.ok(!JSON.stringify(await p.getAuthorization()).includes(REFRESH));
});

test('different subject, mailbox, casing or verification evidence cannot authorize a token', async () => {
  for (const change of [{ sub: '222222222222222222222' }, { sub: undefined }, { email: 'other@example.com' },
    { email: 'Denzel@questluxo.com' }, { email_verified: false }, { email_verified: 'true' }]) {
    const m = mock(); Object.assign(m.response.identity, change);
    const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
    await assert.rejects(p.getAuthorization(), unavailable);
    await assert.rejects(p.getAuthorization(), unavailable);
    assert.equal(m.calls.length, 2);
  }
});

test('expired or revoked grant fails without automatic retry or provider detail in errors', async () => {
  let calls = 0;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async () => {
    calls++; return Response.json({ error: 'invalid_grant', error_description: SECRET + REFRESH }, { status: 400 });
  }, () => NOW);
  await assert.rejects(p.getAuthorization(), unavailable);
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(calls, 1);
});

test('transport timeout, redirect denial and provider exceptions all remain sanitized and latched', async () => {
  for (const message of ['AbortError PRIVATE_PROVIDER_DETAIL', 'redirect blocked ' + SECRET, REFRESH]) {
    let calls = 0;
    const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async () => { calls++; throw Error(message); }, () => NOW);
    await assert.rejects(p.getAuthorization(), unavailable);
    await assert.rejects(p.getAuthorization(), unavailable);
    assert.equal(calls, 1);
  }
});

test('HTTP denial, redirects, invalid content type, UTF-8, JSON and response shapes are rejected', async () => {
  const responses = [
    () => new Response('PRIVATE_PROVIDER_DETAIL', { status: 401 }),
    () => new Response(null, { status: 302, headers: { location: 'https://attacker.example/' } }),
    () => new Response('{}', { headers: { 'content-type': 'text/html' } }),
    () => new Response(new Uint8Array([0xff]), { headers: { 'content-type': 'application/json' } }),
    () => new Response('{bad', { headers: { 'content-type': 'application/json' } }),
    () => Response.json([]), () => Response.json(null),
    () => new Response(null, { status: 200, headers: { 'content-type': 'application/json' } }),
  ];
  for (const response of responses) {
    const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async () => response(), () => NOW);
    await assert.rejects(p.getAuthorization(), unavailable);
  }
});

test('oversized or malformed content length cancels the unread body', async () => {
  for (const length of ['32769', '-1', 'not-a-number']) {
    let cancelled = false;
    const body = new ReadableStream({ cancel() { cancelled = true; } });
    const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async () =>
      new Response(body, { headers: { 'content-type': 'application/json', 'content-length': length } }), () => NOW);
    await assert.rejects(p.getAuthorization(), unavailable);
    assert.equal(cancelled, true);
  }
});

test('streaming response bound cancels oversized data without trusting content length', async () => {
  let cancelled = false;
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(32769)); }, cancel() { cancelled = true; } });
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async () =>
    new Response(body, { headers: { 'content-type': 'application/json' } }), () => NOW);
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(cancelled, true);
});

test('slow refresh cannot extend expiry by the duration of the request', async () => {
  const m = mock(); let time = NOW;
  m.response.token.expires_in = 120;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async (url, options) => {
    if (url === TOKEN) time += 61000;
    return m.fetcher(url, options);
  }, () => time);
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(m.calls.length, 1);
});

test('identity verification that consumes the remaining lifetime cannot populate the cache', async () => {
  const m = mock(); let time = NOW;
  m.response.token.expires_in = 120;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async (url, options) => {
    if (url === USERINFO) time += 61000;
    return m.fetcher(url, options);
  }, () => time);
  await assert.rejects(p.getAuthorization(), unavailable);
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(m.calls.length, 2);
});

test('invalid or backward clock values discard authorization without HTTP retry', async () => {
  for (const value of [NaN, Infinity, -1, NOW + 0.5]) {
    const m = mock(), p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => value);
    await assert.rejects(p.getAuthorization(), unavailable);
    assert.equal(m.calls.length, 0);
  }
  const m = mock(); let time = NOW;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => time);
  await p.getAuthorization(); time--;
  await assert.rejects(p.getAuthorization(), unavailable);
  time = NOW;
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(m.calls.length, 2);
});

test('identity drift at the next refresh discards the prior cache', async () => {
  const m = mock(); let time = NOW;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => time);
  const first = await p.getAuthorization(); time = first.expiresAt - 60000;
  m.response.identity.sub = '222222222222222222222';
  await assert.rejects(p.getAuthorization(), unavailable);
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(m.calls.length, 4);
});

test('close prevents later refreshes and retires the in-memory cache', async () => {
  const m = mock(), p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
  await p.getAuthorization(); p.close(); p.close();
  await assert.rejects(p.getAuthorization(), unavailable);
  assert.equal(m.calls.length, 2);
});

test('closing during refresh aborts its signal and cannot produce authorization or UserInfo calls', async () => {
  const gate = deferred(); let signal, calls = 0;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async (_url, options) => {
    calls++; signal = options.signal; await gate.promise; return Response.json(tokens());
  }, () => NOW);
  const pending = p.getAuthorization();
  assert.ok(signal); p.close(); assert.equal(signal.aborted, true); gate.resolve();
  await assert.rejects(pending, unavailable);
  assert.equal(calls, 1);
});

test('closing during UserInfo cannot publish a pending authorization', async () => {
  const m = mock(), gate = deferred(), arrived = deferred();
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), async (url, options) => {
    if (url === USERINFO) { arrived.resolve(); await gate.promise; }
    return m.fetcher(url, options);
  }, () => NOW);
  const pending = p.getAuthorization(); await arrived.promise;
  p.close(); gate.resolve(); await assert.rejects(pending, unavailable);
});

test('unknown provider fields and ID tokens are not copied into the transport capability', async () => {
  const m = mock(); Object.assign(m.response.token, { id_token: 'synthetic-id-token', private_provider_detail: SECRET });
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
  const auth = await p.getAuthorization();
  assert.deepEqual(Object.keys(auth).sort(), ['accessToken', 'binding', 'expiresAt', 'grantedScopes']);
  assert.ok(!JSON.stringify(auth).includes(SECRET));
  assert.ok(!JSON.stringify(auth).includes('synthetic-id-token'));
});

test('verified authorization composes with the existing main-branch Gmail transport', async () => {
  const m = mock(), p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => NOW);
  const auth = await p.getAuthorization();
  const transport = createGoogleOwnerGmailTransport(auth, m.fetcher, () => NOW);
  assert.deepEqual(await transport.getProfile(), { id: credential().binding.accountId, email: credential().binding.mailbox });
  assert.equal(m.calls.filter(call => call.url === TOKEN).length, 1);
  assert.equal(m.calls.filter(call => call.url === USERINFO).length, 2);
  assert.equal(m.calls.filter(call => call.url === GMAIL_PROFILE).length, 1);
  assert.ok(m.calls.every(call => !call.url.includes('/messages/') && !call.url.includes('/watch')));
});

test('refresh never silently updates an old transport; a new verified capability is required', async () => {
  const m = mock(); let time = NOW;
  const p = createGoogleOwnerGmailAuthorizationProvider(credential(), m.fetcher, () => time);
  const auth = await p.getAuthorization(), oldTransport = createGoogleOwnerGmailTransport(auth, m.fetcher, () => time);
  await oldTransport.getProfile(); time = auth.expiresAt;
  const count = m.calls.length;
  await assert.rejects(oldTransport.getProfile());
  assert.equal(m.calls.length, count);
  const fresh = await p.getAuthorization();
  const newTransport = createGoogleOwnerGmailTransport(fresh, m.fetcher, () => time);
  assert.equal((await newTransport.getProfile()).email, credential().binding.mailbox);
  assert.equal(m.calls.filter(call => call.url === TOKEN).length, 2);
});
