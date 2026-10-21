import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { verifyPilotEnvironment, runPersistentSyntheticPilot } from "../scripts/start-agent-pilot.mjs";
import { commitDurablePipelines, readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";

const env = { RENDER_SERVICE_ID: "srv-dbbkmb0n74is73d111hg", QUEST_AGENT_PILOT_MODE: "SYNTHETIC_ONLY",
  QUEST_PIPELINE_DIRECTORY: "/var/data/quest-agent-pilot", QUEST_PIPELINE_KEY_HEX: "a".repeat(64), QUEST_ENABLE_GMAIL: "false", QUEST_ENABLE_CRM: "false" };
const mount = "42 1 8:0 / /var/data rw - ext4 /dev/pilot rw\n";
test("runtime requires isolated identity, actual persistent mount, managed key and disabled integrations", async () => {
  assert.equal(await verifyPilotEnvironment(env, mount), true);
  for (const change of [{ RENDER_SERVICE_ID: "srv-d9h9btsvikkc73ahrff0" }, { QUEST_AGENT_PILOT_MODE: "LIVE" },
    { QUEST_PIPELINE_KEY_HEX: "invalid" }, { QUEST_PIPELINE_DIRECTORY: "/tmp" }, { QUEST_ENABLE_GMAIL: "true" },
    { QUEST_ENABLE_CRM: undefined }, { OPENAI_API_KEY: "never-used" }])
    await assert.rejects(() => verifyPilotEnvironment({ ...env, ...change }, mount));
  await assert.rejects(() => verifyPilotEnvironment(env, ""), /mount/);
});
test("synthetic pilot recovers its exact snapshot on restart without duplicate records", async () => {
  const directory = await mkdtemp(join(tmpdir(), "quest-pilot-runtime-")), key = randomBytes(32);
  try {
    const first = await runPersistentSyntheticPilot(directory, key);
    const second = await runPersistentSyntheticPilot(directory, key);
    assert.equal(first.recoveredExisting, false);
    assert.equal(second.recoveredExisting, true);
    assert.deepEqual(first.report, second.report);
    assert.equal(second.independentBackupVerified, false);
    const snapshot = await readDurablePipelines(join(directory, "synthetic"), key);
    assert.equal(snapshot.sequence, 1);
    await commitDurablePipelines(join(directory, "synthetic"), key, snapshot.revision, { capital: [], realty: [] });
    await assert.rejects(() => runPersistentSyntheticPilot(directory, key), /conflicts/);
  } finally { key.fill(0); await rm(directory, { recursive: true, force: true }); }
});
