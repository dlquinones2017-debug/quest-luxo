import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { createCampaignLeadSource, readLuxuryCampaignAttribution, luxuryCampaignRules } from "../src/lib/leads/campaignAttribution.ts";

const paid = "?intent=request-this-watch&utm_source=chatgpt&utm_medium=paid&utm_campaign=quest_luxo_collector_sourcing_pilot";
const organic = "?utm_source=linkedin&utm_medium=organic_social&utm_campaign=rolling30_l14&utm_content=founder";

test("known ad and organic campaign tuples preserve only fixed declared codes", () => {
  assert.deepEqual(readLuxuryCampaignAttribution(paid), { source: "chatgpt", medium: "paid", name: "quest_luxo_collector_sourcing_pilot" });
  assert.deepEqual(readLuxuryCampaignAttribution(organic), { source: "linkedin", medium: "organic_social", name: "rolling30_l14", content: "founder" });
  assert.equal(createCampaignLeadSource("contact", organic), "contact;utm_source=linkedin&utm_medium=organic_social&utm_campaign=rolling30_l14&utm_content=founder");
});

test("arbitrary values, mismatched tuples, repeated keys and unknown content stay unrecorded", () => {
  for (const query of ["", "?utm_source=private@example.invalid", paid + "&utm_campaign=private", paid + "&utm_source=chatgpt", paid + "&utm_content=private@example.invalid", organic.replace("organic_social", "paid"), organic.replace("founder", "private-client"), organic + "&utm_content=founder", paid.replace("chatgpt", "CHATGPT")]) {
    assert.equal(readLuxuryCampaignAttribution(query), null);
    assert.equal(createCampaignLeadSource("begin-your-quest", query), "begin-your-quest");
  }
});

test("query context, arbitrary terms and click IDs cannot leak into the source string", () => {
  const source = createCampaignLeadSource("begin-your-quest", paid + "&utm_term=private@example.invalid&email=private@example.invalid&gclid=private-id&message=private-message#private-fragment");
  assert.equal(source, "begin-your-quest;utm_source=chatgpt&utm_medium=paid&utm_campaign=quest_luxo_collector_sourcing_pilot");
  assert.ok(!source.includes("private"));
});

// Execute the actual existing inline consent script against an isolated facade.
// Appended SDK URLs are collected only; no network, browser session or submission exists.
async function consentHarness(search, stored = "granted", pathname = "/begin-your-quest") {
  const source = await readFile(new URL("../src/components/AnalyticsConsent.astro", import.meta.url), "utf8");
  const script = source.match(/<script is:inline[^>]*>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  const storage = new Map(stored ? [["quest-luxo-analytics-consent-v2", stored]] : []);
  const clicks = new Map(), events = new Map(), scripts = [];
  const choice = { hidden: true, querySelector: selector => ({ addEventListener: (_name, fn) => clicks.set(selector, fn) }) };
  const window = { addEventListener: (name, fn) => events.set(name, fn) };
  const location = { origin: "https://questluxo.com", hostname: "questluxo.com", pathname, search, hash: "#private-fragment", reload() {} };
  vm.runInNewContext(script, {
    measurementId: "G-PJPDS9FJVT", luxuryCampaignRules, window, location, URL, URLSearchParams,
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    document: { getElementById: () => choice, referrer: "https://example.invalid/path?email=private@example.invalid#private", title: "Begin Your Quest", createElement: () => ({}), head: { appendChild: node => scripts.push(node.src) }, addEventListener() {} },
    Element: class {},
  });
  return { choice, scripts, calls: () => Array.from(window.dataLayer ?? [], args => Array.from(args)), event: () => events.get("questluxo:lead-submitted")?.(), allow: () => clicks.get("[data-ql-analytics-accept]")?.() };
}

test("known campaign is available to consented GA4 without exposing full query or inquiry data", async () => {
  const h = await consentHarness(paid + "&utm_term=private@example.invalid&phone=private-phone&gclid=private-id");
  const config = h.calls().find(row => row[0] === "config")[2];
  assert.equal(config.campaign_source, "chatgpt");
  assert.equal(config.campaign_medium, "paid");
  assert.equal(config.campaign_name, "quest_luxo_collector_sourcing_pilot");
  assert.equal(config.page_location, "https://questluxo.com/begin-your-quest");
  assert.equal(config.page_referrer, "https://example.invalid/");
  assert.equal(config.campaign_term, undefined);
  assert.equal(h.calls().filter(row => row[1] === "generate_lead").length, 0);
  h.event();
  assert.equal(h.calls().filter(row => row[1] === "generate_lead").length, 1);
  assert.ok(!JSON.stringify(h.calls()).includes("private"));
  assert.equal(h.scripts.length, 1);
});

test("no analytics or campaign transmission occurs before consent or after decline", async () => {
  for (const choice of [null, "declined"]) {
    const h = await consentHarness(paid, choice);
    h.event();
    assert.deepEqual(h.calls(), []);
    assert.deepEqual(h.scripts, []);
    if (choice === null) {
      assert.equal(h.choice.hidden, false);
      h.allow();
      assert.equal(h.calls().find(row => row[0] === "config")[2].campaign_name, "quest_luxo_collector_sourcing_pilot");
    }
  }
});

test("unknown/repeated campaign and private routes do not acquire campaign analytics", async () => {
  for (const query of [paid + "&utm_source=chatgpt", organic.replace("founder", "private@example.invalid"), "?utm_campaign=private@example.invalid"]) {
    const h = await consentHarness(query);
    assert.equal(h.calls().find(row => row[0] === "config")[2].campaign_name, undefined);
    assert.ok(!JSON.stringify(h.calls()).includes("private"));
  }
  const internal = await consentHarness(paid, "granted", "/broker-console");
  internal.event();
  assert.deepEqual(internal.calls(), []);
  assert.deepEqual(internal.scripts, []);
});
