import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, readdir, symlink, chmod, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { previewBusinessSource } from "../src/lib/agents/businessSourcePreflight.ts";
import { main } from "../scripts/source-preflight.mjs";
import { READINESS_CHECKS } from "../src/lib/agents/agentReadinessPolicy.ts";
const now = "2026-10-21T12:00:00.000Z";
export const fixture = () => ({
  contract: { schemaVersion: 1, sourceId: "reviewed-export", mode: "PREVIEW_ONLY", divisions: ["CAPITAL_ADVISORY", "REALTY"],
    maxRecords: 2, maxAgeSeconds: 3600, expiresAt: "2026-10-22T12:00:00.000Z" },
  envelope: { schemaVersion: 1, sourceId: "reviewed-export", capturedAt: now, records: [
    { recordId: "a".repeat(64), division: "CAPITAL_ADVISORY", status: "BLOCKED", evidenceState: "UNKNOWN", updatedAt: now },
    { recordId: "b".repeat(64), division: "REALTY", status: "REQUIRES_FOUNDER", evidenceState: "REQUIRES_VERIFICATION", updatedAt: now }] },
  evidence: READINESS_CHECKS.map(check => ({ check, state: "VERIFIED", observedAt: now, evidenceRef: "synthetic-test" })) });
const preview = (f) => previewBusinessSource(f.contract, f.envelope, f.evidence, now);
test("bounded metadata yields aggregate preview without records, mutations or authorization", () => {
  const f = fixture(), before = structuredClone(f), r = preview(f);
  assert.deepEqual(f, before);
  assert.deepEqual(r.divisions.map(d => [d.total, d.blocked, d.founderReview]), [[1,1,0],[1,0,1]]);
  assert.equal(r.status, "READY_FOR_FOUNDER_REVIEW");
  assert.equal(r.evidenceAttestation, "CALLER_SUPPLIED_UNVERIFIED");
  for (const key of ["businessDataExecutionAllowed", "persistsRecords", "dispatchesWork", "sendsMessages", "writesCRM", "activatesGmail"])
    assert.equal(r[key], false);
  assert.ok(!JSON.stringify(r).includes("a".repeat(64)));
  assert.ok(Object.isFrozen(r.divisions[0]));
});
test("missing recovery evidence remains HOLD even with a valid source contract", () => {
  const f = fixture(); f.evidence = f.evidence.filter(e => e.check !== "KEY_RECOVERY");
  assert.equal(preview(f).status, "HOLD");
  assert.deepEqual(preview(f).readiness.requiredActions, ["KEY_RECOVERY"]);
});
test("rejects raw identifiers, free text, contact fields, credentials and extra fields", () => {
  for (const patch of [{ recordId: "name@example.test" }, { recordId: "person-name" }, { reason: "Private reason" },
    { email: "private@example.test" }, { apiKey: "sensitive-marker" }, { requiredHumanAction: "call customer" }]) {
    const f = fixture(); Object.assign(f.envelope.records[0], patch); assert.throws(() => preview(f));
  }
  for (const target of ["contract", "envelope"]) {
    const f = fixture(); f[target].extra = "sensitive-marker"; assert.throws(() => preview(f));
  }
});
test("rejects wrong source, unauthorized division, duplicate IDs and malformed state", () => {
  const mutations = [f => f.envelope.sourceId = "other-source", f => f.contract.divisions = ["CAPITAL_ADVISORY"],
    f => f.envelope.records[1].recordId = f.envelope.records[0].recordId,
    f => f.envelope.records[0].status = "SEND", f => f.envelope.records[0].evidenceState = "APPROVED",
    f => f.envelope.records.push(f.envelope.records[0])];
  for (const mutate of mutations) { const f = fixture(); mutate(f); assert.throws(() => preview(f)); }
});
test("rejects expiry, future or stale source times and impossible dates", () => {
  for (const value of ["2026-10-20T12:00:00.000Z", "2026-10-22T12:00:00.000Z", "2026-02-30T12:00:00.000Z", "invalid"]) {
    for (const target of ["capture", "record"]) {
      const f = fixture(); if (target === "capture") f.envelope.capturedAt = value; else f.envelope.records[0].updatedAt = value;
      assert.throws(() => preview(f));
    }
  }
  const f = fixture(); f.contract.expiresAt = now; assert.throws(() => preview(f));
  assert.throws(() => previewBusinessSource(f.contract, f.envelope, f.evidence, "2026-02-30T12:00:00.000Z"));
});
test("rejects unsupported activation modes and unbounded or malformed contracts", () => {
  for (const patch of [{ mode: "LIVE" }, { schemaVersion: 2 }, { maxRecords: 1001 }, { maxRecords: 0 }, { maxAgeSeconds: 86401 },
    { maxAgeSeconds: 1.5 }, { divisions: [] }, { divisions: ["REALTY", "REALTY"] }, { sourceId: "https://secret?token=x" }]) {
    const f = fixture(); Object.assign(f.contract, patch); assert.throws(() => preview(f));
  }
  for (const value of [null, [], "invalid", {}]) {
    const f = fixture(); assert.throws(() => previewBusinessSource(value, f.envelope, f.evidence, now));
    assert.throws(() => previewBusinessSource(f.contract, value, f.evidence, now));
  }
});
test("explicit empty export is zero cases, missing records is rejected", () => {
  const f = fixture(); f.envelope.records = [];
  assert.deepEqual(preview(f).divisions.map(d => d.total), [0,0]);
  delete f.envelope.records; assert.throws(() => preview(f));
});
test("private CLI inputs are read-only; rejected input never leaks into process output", async () => {
  const directory = await mkdtemp(join(tmpdir(), "quest-source-preflight-"));
  try {
    const f = fixture(), paths = ["contract", "envelope", "evidence"].map(n => join(directory, n + ".json"));
    for (let i = 0; i < paths.length; i++) await writeFile(paths[i], JSON.stringify(f[["contract", "envelope", "evidence"][i]]), { mode: 0o600 });
    const before = await Promise.all(paths.map(p => readFile(p, "utf8")));
    assert.equal((await main(paths, now)).divisions[0].total, 1);
    assert.deepEqual(await Promise.all(paths.map(p => readFile(p, "utf8"))), before);
    assert.equal((await readdir(directory)).length, 3);
    await chmod(paths[1], 0o644); await assert.rejects(() => main(paths, now)); await chmod(paths[1], 0o600);
    const link = join(directory, "link.json"); await symlink(paths[1], link);
    await assert.rejects(() => main([paths[0], link, paths[2]], now));
    await writeFile(paths[1], JSON.stringify({ secret: "private-marker-never-echo" }));
    const run = spawnSync(process.execPath, ["scripts/source-preflight.mjs", ...paths], { encoding: "utf8" });
    assert.equal(run.status, 1);
    assert.equal(run.stdout, ""); assert.ok(!run.stderr.includes("private-marker"));
    await writeFile(paths[1], "x".repeat(524289)); await assert.rejects(() => main(paths, now));
    await assert.rejects(() => main(paths.slice(0,2), now));
  } finally { await rm(directory, { recursive: true, force: true }); }
});
