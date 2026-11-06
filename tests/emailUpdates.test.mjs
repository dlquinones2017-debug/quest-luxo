import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const script = readFileSync(new URL('../public/email-updates.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../public/updates.html', import.meta.url), 'utf8');

// Execute the actual browser script with a fake DOM and a fully mocked fetch.
// No test in this file can contact Klaviyo or create a live subscription.
function setup({ topic = 'luxury', consent = true, valid = true, website = '', fetchImpl } = {}) {
  const calls = [];
  const status = { textContent: '' };
  const button = { disabled: false };
  let submit;
  let resets = 0;
  const form = {
    elements: {
      topic: { value: topic }, consent: { checked: consent },
      email: { value: '  offline-test@example.invalid  ' }, website: { value: website },
    },
    querySelector: () => button,
    reportValidity: () => valid,
    addEventListener: (name, listener) => { assert.equal(name, 'submit'); submit = listener; },
    reset: () => { resets += 1; },
  };
  vm.runInNewContext(script, {
    document: { querySelector: selector => selector === '#email-updates' ? form : status },
    location: { origin: 'https://questluxo.com', pathname: '/updates.html' },
    AbortController, setTimeout, clearTimeout,
    fetch: async (...args) => { calls.push(args); return fetchImpl ? fetchImpl(...args) : { status: 202 }; },
  });
  return { calls, status, button, form, submit: () => submit({ preventDefault() {} }), resets: () => resets };
}

test('signup offers only Luxury and Property while keeping consent and confirmation disclosures', () => {
  assert.deepEqual([...html.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]), ['luxury', 'property']);
  assert.match(html, /value="luxury" selected/);
  assert.doesNotMatch(html, /Capital Advisory|business-purpose financing|financing readiness/);
  assert.doesNotMatch(script, /VyesVT|capital/i);
  assert.match(html, /type="checkbox" name="consent" required/);
  assert.match(html, /confirm by email/);
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /Signing up is optional and separate from submitting an inquiry/);
});

for (const [topic, list, division, label] of [
  ['luxury', 'Y9Yjy2', 'luxury', 'Luxury Advisory'],
  ['property', 'WtKwMz', 'realty', 'Property Acquisitions'],
]) {
  test(`${topic} keeps its existing list and confirmation-request payload`, async () => {
    const view = setup({ topic });
    await view.submit();
    assert.equal(view.calls.length, 1);
    const [url, request] = view.calls[0];
    assert.equal(url, 'https://a.klaviyo.com/client/subscriptions?company_id=WjLFUt');
    assert.equal(request.method, 'POST');
    assert.equal(request.credentials, 'omit');
    assert.equal(request.referrerPolicy, 'no-referrer');
    const payload = JSON.parse(request.body).data;
    assert.equal(payload.relationships.list.data.id, list);
    assert.equal(payload.attributes.custom_source, `Quest Luxo ${label} website email updates — consent v1`);
    assert.deepEqual(payload.attributes.profile.data.attributes, {
      email: 'offline-test@example.invalid',
      properties: { ql_signup_division: division, ql_signup_source: 'https://questluxo.com/updates.html', ql_consent_version: '2026-10-26-v1' },
      subscriptions: { email: { marketing: { consent: 'SUBSCRIBED' } } },
    });
    assert.match(view.status.textContent, /only after confirming/);
    assert.equal(view.resets(), 1);
    assert.equal(view.button.disabled, false);
  });
}

for (const topic of ['capital', 'Capital', 'CAPITAL', ' capital ', '', 'unknown', '__proto__', 'constructor', 'toString']) {
  test(`unsupported topic ${JSON.stringify(topic)} fails closed without a fallback list`, async () => {
    const view = setup({ topic });
    await view.submit();
    assert.equal(view.calls.length, 0);
    assert.equal(view.resets(), 0);
    assert.equal(view.button.disabled, false);
    assert.match(view.status.textContent, /Choose an available/);
  });
}

for (const options of [{ consent: false }, { valid: false }, { website: 'bot.invalid' }]) {
  test(`existing consent, validation and anti-bot guard ${JSON.stringify(options)}`, async () => {
    const view = setup(options);
    await view.submit();
    assert.equal(view.calls.length, 0);
    assert.equal(view.resets(), 0);
  });
}

test('repeated clicks do not send duplicate requests and controls recover', async () => {
  let finish;
  const view = setup({ fetchImpl: () => new Promise(resolve => { finish = resolve; }) });
  const first = view.submit();
  assert.equal(view.button.disabled, true);
  await view.submit();
  assert.equal(view.calls.length, 1);
  finish({ status: 202 });
  await first;
  assert.equal(view.button.disabled, false);
  assert.equal(view.resets(), 1);
});

for (const statusCode of [400, 429, 503]) {
  test(`HTTP ${statusCode} retains the form for a deliberate retry`, async () => {
    const view = setup({ fetchImpl: async () => ({ status: statusCode }) });
    await view.submit();
    assert.equal(view.resets(), 0);
    assert.equal(view.button.disabled, false);
    assert.doesNotMatch(view.status.textContent, /Request received/);
    await view.submit();
    assert.equal(view.calls.length, 2);
  });
}

test('uncertain network outcome asks the visitor to check email before retrying', async () => {
  const view = setup({ fetchImpl: async () => { throw new Error('Mock network failure'); } });
  await view.submit();
  assert.equal(view.resets(), 0);
  assert.equal(view.button.disabled, false);
  assert.match(view.status.textContent, /Check your inbox before trying again/);
});

test('pages without the signup form remain untouched', () => {
  vm.runInNewContext(script, { document: { querySelector: () => null } });
});
