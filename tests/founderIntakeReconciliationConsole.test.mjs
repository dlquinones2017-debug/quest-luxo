import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { founderRevenueReadModel } from "../src/lib/command/founderRevenueReadModel.ts";
import { founderRevenueResponse } from "../src/lib/broker/founderRevenueEndpoint.ts";
import {
  founderReconciliationRows, loadFounderRevenueModel,
} from "../src/lib/broker/founderRevenueClient.ts";

const now = new Date("2026-10-19T23:30:00Z");
const source = {
  division: "CAPITAL_ADVISORY",
  provider: "FORMSUBMIT",
  sourceRecordId: "gmail:synthetic-reconciliation-receipt",
  canonicalRecordId: "approved-canonical-case",
  receivedAt: "2026-10-19T23:15:00Z",
  evidenceIds: ["evidence:approved-source"],
  receiptVerification: "VERIFIED",
  qualificationVerification: "UNKNOWN",
  notification: "UNKNOWN",
};
async function model(extra = {}) {
  return founderRevenueReadModel(now, {
    readBrokerage: async () => [],
    readBrokerageSnapshot: async () => ({
      records: [], status: "COMPLETE", malformedRows: 0,
    }),
    readCapital: () => [],
    readRealty: () => [],
    ...extra,
  });
}
async function response(payload) {
  return loadFounderRevenueModel("https://console.example.invalid/broker?key=fixture-key",
    async () => Response.json(payload));
}

test("authenticated read model exposes aggregate gaps but never receipt identity", async () => {
  const result = await model({
    readIntakeSnapshot: async () => ({
      receipts: [source],
      observations: {
        CAPITAL_ADVISORY: { status: "PARTIAL" },
        REALTY: { status: "SOURCE_MISSING" },
      },
    }),
  });
  assert.deepEqual(result.intakeReconciliation.map(row => row.division), [
    "CAPITAL_ADVISORY", "REALTY",
  ]);
  assert.equal(result.intakeReconciliation[0].missingCanonicalRecords, 1);
  assert.equal(result.intakeReconciliation[0].durableReconciliationVerified, false);
  assert.doesNotMatch(JSON.stringify(result), /synthetic-reconciliation-receipt|approved-canonical-case/);
  assert.equal(result.intakeReconciliation[1].retainedReceipts, 0);
  assert.equal(result.queue.length, 1);
});

test("unconnected and missing sources display unknown, not healthy zero", async () => {
  const absent = await model();
  const rows = founderReconciliationRows(absent);
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.receipts === "Unknown"));
  assert.ok(rows.every(row => row.missingRecords === "Unknown"));
  assert.match(rows[0].review, /zero is not proof/);
  const missing = await model({
    readIntakeSnapshot: async () => ({
      receipts: [],
      observations: {
        CAPITAL_ADVISORY: { status: "SOURCE_MISSING" },
        REALTY: { status: "SOURCE_MISSING" },
      },
    }),
  });
  assert.ok(founderReconciliationRows(missing).every(row => row.receipts === "Unknown"));
});

test("partial saved receipt shows actionable count and in-memory match warning", async () => {
  const result = await model({
    readCapital: () => [{
      borrowerId: "approved-canonical-case",
      stage: "SOURCE_MATCH", status: "REQUIRES_FOUNDER",
      reason: "Synthetic verification", updatedAt: now.toISOString(),
      evidenceIds: [source.evidenceIds[0]], evidenceState: "UNKNOWN",
    }],
    readIntakeSnapshot: async () => ({
      receipts: [source],
      observations: {
        CAPITAL_ADVISORY: { status: "PARTIAL" },
        REALTY: { status: "DISABLED" },
      },
    }),
  });
  const rows = founderReconciliationRows(result);
  assert.equal(rows[0].inMemoryOnly, "1");
  assert.equal(rows[0].receipts, "1 observed");
  assert.match(rows[0].review, /durable CRM recovery is not verified/);
  assert.equal(rows[1].missingLinks, "Unknown");
});

test("client refuses fabricated durable status, negative or missing reconciliation data", async () => {
  const original = await model();
  for (const invalid of [
    { ...original, intakeReconciliation: undefined },
    { ...original, intakeReconciliation: original.intakeReconciliation.slice(0, 1) },
    { ...original, intakeReconciliation: original.intakeReconciliation.map(r => ({
      ...r, durableReconciliationVerified: true,
    })) },
    { ...original, intakeReconciliation: original.intakeReconciliation.map(r => ({
      ...r, missingCanonicalRecords: -1,
    })) },
    { ...original, intakeReconciliation: original.intakeReconciliation.map(r => ({
      ...r, matchedInMemoryOnly: 0.5,
    })) },
  ]) await assert.rejects(() => response(invalid), /Unable to load enterprise revenue state/);
  assert.deepEqual(await response(original), original);
});

test("protected endpoint exposes read-only totals only after authorization", async () => {
  const expected = await model({
    readIntakeSnapshot: async () => ({
      receipts: [source],
      observations: { CAPITAL_ADVISORY: { status: "PARTIAL" } },
    }),
  });
  const endpoint = request => founderRevenueResponse(request, {
    authorize: req => ({ allowed: req.headers.get("x-broker-console-key") === "fixture-key" }),
    read: async () => expected,
  });
  const unauthorized = await endpoint(new Request("https://example.invalid/api/broker/revenue"));
  assert.equal(unauthorized.status, 401);
  const authenticated = await loadFounderRevenueModel(
    "https://example.invalid/broker?key=fixture-key",
    (path, init) => endpoint(new Request("https://example.invalid" + path, init)));
  assert.equal(authenticated.intakeReconciliation[0].missingCanonicalRecords, 1);
  assert.doesNotMatch(JSON.stringify(authenticated), /synthetic-reconciliation-receipt/);
});

test("Founder panel renders reconciliation as text-only, without any mutation path", async () => {
  const panel = await readFile(new URL("../src/components/FounderRevenuePanel.astro", import.meta.url), "utf8");
  assert.match(panel, /founderReconciliationRows\(model\)/);
  assert.match(panel, /data-founder-reconciliation-rows/);
  assert.match(panel, /CRM reconciliation unavailable/);
  assert.match(panel, /td\.textContent=value/);
  assert.doesNotMatch(panel, /innerHTML|method:\s*["'](?:POST|PATCH|PUT|DELETE)/);
});
