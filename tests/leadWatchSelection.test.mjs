import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";
import * as intake from "../src/lib/leads/leadIntakeContext.ts";
import * as capture from "../src/lib/leads/leadCapture.ts";
import * as selection from "../src/lib/leads/leadWatchSelection.ts";

const patek = { intent: "request-this-watch", brand: "Patek Philippe", collection: "Nautilus", reference: "5726/1A" };
const omega = { ...patek, brand: "Omega", collection: "Speedmaster", reference: "310.32.42.50.01.002" };
const query = context => "?" + new URLSearchParams(context);

class Element {
  value = "";
  defaultValue = "";
  textContent = "";
  hidden = false;
  disabled = false;
  attributes = new Map();
  listeners = new Map();
  classList = { add() {}, remove() {} };
  addEventListener(type, callback) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), callback]); }
  async fire(type) { for (const callback of this.listeners.get(type) ?? []) await callback({ preventDefault() {} }); }
  setAttribute(key, value) { this.attributes.set(key, value); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  removeAttribute(key) { this.attributes.delete(key); }
  focus() {}
}

// Execute each real Astro client script in an isolated DOM facade. Only an in-memory
// POST mock exists; no server, storage, email, CRM or browser session is involved.
async function formHarness(route, context = patek, restoredWatch = "") {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, new Element());
    return elements.get(selector);
  };
  const fields = Object.fromEntries(["name", "email", "phone", "desiredWatch", "budget", "timeline", "message", "website", "formStartedAt"].map(key => [key, new Element()]));
  Object.entries({ name: "Offline fixture", email: "fixture@example.invalid", phone: "fixture-phone", budget: "$20k–50k", timeline: "Within 30 days", message: "Keep these details.", desiredWatch: restoredWatch }).forEach(([key, value]) => { fields[key].value = value; });
  const form = new Element();
  form.querySelector = selector => fields[selector.match(/name="(\w+)"/)?.[1]] ?? null;
  form.checkValidity = () => true;
  form.reportValidity = () => { throw Error("Unexpected invalid form"); };
  form.reset = () => Object.values(fields).forEach(field => { field.value = field.defaultValue; });
  elements.set(route === "begin-your-quest" ? "[data-lead-capture-form]" : "[data-lead-form]", form);
  elements.set("[data-form-started]", fields.formStartedAt);
  const window = new Element();
  window.location = { search: query(context) };
  const events = [];
  window.dispatchEvent = event => { events.push(event.type); return true; };
  const requests = [];
  let success = true;
  const modules = {
    "../lib/leads/leadIntakeContext": intake,
    "../lib/leads/leadIntakeContext.ts": intake,
    "../lib/leads/leadCapture.ts": capture,
    "../lib/leads/leadWatchSelection.ts": selection,
  };
  const source = await readFile(new URL(`../src/pages/${route}.astro`, import.meta.url), "utf8");
  const script = source.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script, "Actual form script must be exercised");
  const compiled = ts.transpileModule(script, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  vm.runInNewContext(compiled.outputText, {
    exports: {},
    require: path => { assert.ok(modules[path], `Unexpected import: ${path}`); return modules[path]; },
    document: { querySelector: element }, window, URLSearchParams, Event,
    FormData: class {
      constructor(candidate) { assert.equal(candidate, form); }
      get(key) { return fields[key]?.value ?? null; }
      entries() { return Object.entries(fields).map(([key, field]) => [key, field.value]); }
    },
    fetch: async (url, options) => {
      assert.equal(url, "/api/leads/submit", "All external requests are blocked");
      assert.equal(options.method, "POST");
      requests.push(JSON.parse(options.body));
      return { ok: success, json: async () => success ? { success: true } : { error: "Mock failure" } };
    },
  });
  return { fields, window, requests, events, element, submit: () => form.fire("submit"), fail: () => { success = false; } };
}

function assertNoCatalogIdentity(payload) {
  for (const key of ["brand", "collection", "reference"]) assert.ok(!payload[key], `${key} must not identify a different watch`);
}

for (const route of ["begin-your-quest", "contact"]) {
  test(`${route}: unchanged visible selection retains exact catalog identity`, async () => {
    const h = await formHarness(route);
    assert.equal(h.fields.desiredWatch.value, intake.buildLeadContextLabel(patek));
    await h.submit();
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].brand, patek.brand);
    assert.equal(h.requests[0].collection, patek.collection);
    assert.equal(h.requests[0].reference, patek.reference);
    assert.equal(h.requests[0].desiredWatch, intake.buildLeadContextLabel(patek));
    assert.equal(h.events.filter(x => x === "questluxo:lead-submitted").length, 1);
  });

  test(`${route}: Patek selection edited to Breitling preserves text without Patek fields`, async () => {
    const h = await formHarness(route);
    h.fields.desiredWatch.value = "Breitling Navitimer";
    await h.fields.desiredWatch.fire("input");
    const summary = h.element(route === "contact" ? "[data-contact-intro]" : "[data-brokerage-message]").textContent;
    assert.ok(!summary.includes("Nautilus"));
    if (route === "contact") assert.ok(!h.element("[data-contact-link]").href.includes("Nautilus"));
    await h.submit();
    const payload = h.requests[0];
    assertNoCatalogIdentity(payload);
    assert.equal(payload.desiredWatch, "Breitling Navitimer");
    for (const [key, value] of Object.entries({ name: "Offline fixture", email: "fixture@example.invalid", phone: "fixture-phone", message: "Keep these details.", budget: "$20k–50k", timeline: "Within 30 days" })) assert.equal(payload[key], value);
  });

  test(`${route}: no URL context does not guess an exact reference from manual text`, async () => {
    const h = await formHarness(route, {});
    h.fields.desiredWatch.value = "Breitling Navitimer, blue dial";
    await h.submit();
    assert.equal(h.requests[0].desiredWatch, "Breitling Navitimer, blue dial");
    assertNoCatalogIdentity(h.requests[0]);
  });

  test(`${route}: fresh reference URL is reconciled at submission without an input event`, async () => {
    const h = await formHarness(route);
    h.window.location.search = query(omega);
    await h.submit();
    assert.equal(h.requests[0].desiredWatch, intake.buildLeadContextLabel(omega));
    assert.equal(h.requests[0].brand, omega.brand);
    assert.equal(h.requests[0].reference, omega.reference);
  });

  test(`${route}: history restores the current reference but preserves an edited description`, async () => {
    const h = await formHarness(route);
    h.window.location.search = query(omega);
    await h.window.fire("popstate");
    assert.equal(h.fields.desiredWatch.value, intake.buildLeadContextLabel(omega));
    h.fields.desiredWatch.value = "Breitling Navitimer";
    h.window.location.search = query(patek);
    await h.window.fire("pageshow");
    assert.equal(h.fields.desiredWatch.value, "Breitling Navitimer");
    await h.submit();
    assertNoCatalogIdentity(h.requests[0]);
  });

  test(`${route}: autofill/clearing is rechecked at submit and failed mock retains the draft`, async () => {
    const h = await formHarness(route);
    h.fields.desiredWatch.value = "Breitling Navitimer";
    h.fail();
    await h.submit();
    assertNoCatalogIdentity(h.requests[0]);
    assert.equal(h.fields.desiredWatch.value, "Breitling Navitimer");
    assert.equal(h.events.length, 0);
    h.fields.desiredWatch.value = "";
    await h.submit();
    assertNoCatalogIdentity(h.requests[1]);
  });

  test(`${route}: restored user text is not replaced by initial URL prefill`, async () => {
    const h = await formHarness(route, patek, "Breitling Navitimer");
    assert.equal(h.fields.desiredWatch.value, "Breitling Navitimer");
    await h.submit();
    assertNoCatalogIdentity(h.requests[0]);
  });
}

test("description formatting does not discard an unchanged selection or mutate source context", () => {
  const result = selection.reconcileLeadWatchContext(patek, " PATEK   PHILIPPE Nautilus Ref. 5726/1A ");
  assert.deepEqual(result, patek);
  const changed = selection.reconcileLeadWatchContext(patek, "Patek Philippe Nautilus Ref. 5726/1A or a Breitling");
  assert.deepEqual(changed, { intent: patek.intent });
  assert.equal(patek.brand, "Patek Philippe");
});
