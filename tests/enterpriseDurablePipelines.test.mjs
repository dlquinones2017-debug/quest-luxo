import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, copyFile, unlink, chmod, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { readDurablePipelines, commitDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";

const capital = { borrowerId:"fixture-capital", stage:"QUALIFY", status:"BLOCKED",
  reason:"Synthetic", updatedAt:"2026-10-19T12:00:00Z",
  evidenceIds:["fixture-evidence"], evidenceState:"UNKNOWN" };
const realty = { leadId:"fixture-realty", stage:"REVIEW", status:"REQUIRES_FOUNDER",
  reason:"Synthetic", updatedAt:"2026-10-19T12:00:00Z",
  evidenceIds:["fixture-evidence"], evidenceState:"REQUIRES_VERIFICATION" };
async function fixture(run) {
  const dir = await mkdtemp(join(tmpdir(),"quest-durable-pipeline-"));
  const key = randomBytes(32);
  try { await run({dir,key}); } finally { await rm(dir,{recursive:true,force:true}); }
}
test("opt-in encrypted Capital and Realty records survive independent reads", async () => fixture(async ({dir,key}) => {
  const empty = await readDurablePipelines(dir,key);
  assert.equal(empty.revision,"EMPTY");
  const saved = await commitDurablePipelines(dir,key,empty.revision,{capital:[capital],realty:[realty]});
  assert.equal(saved.sequence,1);
  const restored = await readDurablePipelines(dir,key);
  assert.deepEqual(restored.records.capital,[capital]);
  assert.deepEqual(restored.records.realty,[realty]);
  assert.equal(restored.revision,saved.revision);
  const bytes = await readFile(join(dir,"enterprise-pipelines-v1.enc.json"),"utf8");
  assert.doesNotMatch(bytes,/fixture-capital|fixture-realty|fixture-evidence/);
}));
test("stale revision fails without overwriting saved records", async () => fixture(async ({dir,key}) => {
  const saved = await commitDurablePipelines(dir,key,"EMPTY",{capital:[capital],realty:[]});
  await assert.rejects(() => commitDurablePipelines(dir,key,"EMPTY",{capital:[],realty:[]}),/revision conflict/);
  assert.equal((await readDurablePipelines(dir,key)).revision,saved.revision);
}));
test("incorrect key and tampering fail closed", async () => fixture(async ({dir,key}) => {
  await commitDurablePipelines(dir,key,"EMPTY",{capital:[capital],realty:[]});
  await assert.rejects(() => readDurablePipelines(dir,randomBytes(32)),/integrity\/authentication/);
  const path = join(dir,"enterprise-pipelines-v1.enc.json");
  const doc = JSON.parse(await readFile(path,"utf8"));
  doc.ciphertext = "AAAA" + doc.ciphertext.slice(4);
  await writeFile(path,JSON.stringify(doc),{mode:0o600});
  await chmod(path,0o600);
  await assert.rejects(() => readDurablePipelines(dir,key),/integrity\/authentication/);
}));
test("duplicate identities and unsafe fields are rejected", async () => fixture(async ({dir,key}) => {
  await assert.rejects(() => commitDurablePipelines(dir,key,"EMPTY",{capital:[capital,capital],realty:[]}),/Duplicate/);
  await assert.rejects(() => commitDurablePipelines(dir,key,"EMPTY",{capital:[{...capital,customerEmail:"hidden"}],realty:[]}),/Unexpected/);
}));

test("encrypted offline copy can restore after primary loss", async () => fixture(async ({dir,key}) => {
  const saved = await commitDurablePipelines(dir,key,"EMPTY",{capital:[capital],realty:[realty]});
  const primary = join(dir,"enterprise-pipelines-v1.enc.json");
  const backup = join(dir,"offline-backup.fixture.enc");
  await copyFile(primary,backup);
  await unlink(primary);
  assert.equal((await readDurablePipelines(dir,key)).revision,"EMPTY");
  await copyFile(backup,primary);
  const restored = await readDurablePipelines(dir,key);
  assert.equal(restored.revision,saved.revision);
  assert.deepEqual(restored.records.capital,[capital]);
  assert.deepEqual(restored.records.realty,[realty]);
}));
