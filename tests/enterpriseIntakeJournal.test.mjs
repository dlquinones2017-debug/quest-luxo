import test from "node:test";
import assert from "node:assert/strict";
import {createHash,randomBytes} from "node:crypto";
import {mkdtemp,readFile,readdir,writeFile,chmod,stat,rm,mkdir} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
import {readEncryptedIntakeJournal,commitTrustedIntakeBatch} from "../src/lib/command/enterpriseIntakeJournal.ts";

const now=new Date("2026-10-19T23:30:00.000Z");
const key=()=>randomBytes(32);
const sha=s=>createHash("sha256").update(s).digest("hex");
const receipt=(n=1,division="CAPITAL_ADVISORY")=>({
  division,provider:"FORMSUBMIT",sourceRecordId:`gmail:${sha("message"+n)}`,
  receivedAt:"2026-10-19T23:15:00.000Z",
  evidenceIds:[`gmail:${sha("message"+n)}`,`approval:case-${n}`],
  receiptVerification:"VERIFIED",qualificationVerification:"UNKNOWN",notification:"UNKNOWN",
});
const checkpoint=(receipts,previous={seen:{}})=>({
  seen:{...previous.seen,...Object.fromEntries(receipts.flatMap((r,i)=>[
    [r.sourceRecordId,sha("fingerprint"+r.sourceRecordId)],
    [`rfc:${sha("rfc"+r.sourceRecordId)}`,sha("fingerprint"+r.sourceRecordId)],
  ]))},
});
const batch=(receipts,prev)=>({status:"COMPLETE",receipts,checkpoint:checkpoint(receipts,prev),counts:{examined:receipts.length,rejected:0,unmapped:0,replayed:0,conflicts:0,retentionWarnings:0}});
async function temporary(fn){const dir=await mkdtemp(join(tmpdir(),"quest-luxo-intake-"));try {return await fn(join(dir,"secure"));} finally {await rm(dir,{recursive:true,force:true});}}
const commit=(directory,secret,expectedRevision,data,overrides={})=>commitTrustedIntakeBatch({
 directory,key:secret,expectedRevision,batch:data,observedAt:"2026-10-19T23:20:00.000Z",...overrides
},now);

test("no journal and no directory read as empty without provisioning",async()=>temporary(async dir=>{
 const x=await readEncryptedIntakeJournal(dir,key(),now);
 assert.equal(x.revision,"EMPTY");
 assert.deepEqual(x.checkpoint,{seen:{}});
 assert.equal(x.retainedReceiptCount,0);
}));

test("atomic metadata checkpoint and receipts persist after re-read; file is encrypted",async()=>temporary(async dir=>{
 const secret=key(),first=receipt();
 const before=await readEncryptedIntakeJournal(dir,secret,now);
 const saved=await commit(dir,secret,before.revision,batch([first]));
 assert.notEqual(saved.revision,"EMPTY");
 assert.equal(saved.retainedReceiptCount,1);
 assert.equal(saved.receipts[0].sourceRecordId,first.sourceRecordId);
 const again=await readEncryptedIntakeJournal(dir,secret,now);
 assert.deepEqual(again,saved);
 const bytes=await readFile(join(dir,"formsubmit-intake-journal.enc.json"),"utf8");
 assert.doesNotMatch(bytes,/CAPITAL_ADVISORY|approval:case|gmail:|receivedAt|sourceRecordId|FORM/);
 assert.equal(JSON.parse(bytes).alg,"aes-256-gcm");
 assert.deepEqual(await readdir(dir),["formsubmit-intake-journal.enc.json"]);
}));

test("append a second division without dropping the first checkpoint or receipt",async()=>temporary(async dir=>{
 const secret=key(),a=receipt(),b=receipt(2,"REALTY");
 const first=await commit(dir,secret,"EMPTY",batch([a]));
 const second=await commit(dir,secret,first.revision,batch([b],first.checkpoint));
 assert.equal(second.retainedReceiptCount,2);
 assert.deepEqual(new Set(second.receipts.map(r=>r.division)),new Set(["CAPITAL_ADVISORY","REALTY"]));
 assert.equal(Object.keys(second.checkpoint.seen).length,4);
}));

test("an identical replay is idempotent when the checkpoint is retained",async()=>temporary(async dir=>{
 const secret=key(),a=receipt();
 const first=await commit(dir,secret,"EMPTY",batch([a]));
 const replay=await commit(dir,secret,first.revision,batch([a],first.checkpoint));
 assert.equal(replay.retainedReceiptCount,1);
 assert.equal(replay.revision,first.revision);
}));

test("two concurrent writers with a stale revision cannot lose work",async()=>temporary(async dir=>{
 const secret=key(),a=receipt(),b=receipt(2,"REALTY");
 const results=await Promise.allSettled([commit(dir,secret,"EMPTY",batch([a])),commit(dir,secret,"EMPTY",batch([b]))]);
 assert.equal(results.filter(x=>x.status==="fulfilled").length,1);
 assert.equal(results.filter(x=>x.status==="rejected").length,1);
 const persisted=await readEncryptedIntakeJournal(dir,secret,now);
 assert.equal(persisted.retainedReceiptCount,1);
 const loser=results[0].status==="rejected"?a:b;
 const second=await commit(dir,secret,persisted.revision,batch([loser],persisted.checkpoint));
 assert.equal(second.retainedReceiptCount,2);
}));

test("a lost or modified checkpoint fingerprint is refused with no changed bytes",async()=>temporary(async dir=>{
 const secret=key(),a=receipt(),b=receipt(2);
 const first=await commit(dir,secret,"EMPTY",batch([a]));
 const before=await readFile(join(dir,"formsubmit-intake-journal.enc.json"));
 for(const next of [
   batch([b]), {...batch([b],first.checkpoint),checkpoint:{seen:{...first.checkpoint.seen,[a.sourceRecordId]:sha("different")}}},
 ]) {
  await assert.rejects(commit(dir,secret,first.revision,next),/cannot discard or alter/);
  assert.deepEqual(await readFile(join(dir,"formsubmit-intake-journal.enc.json")),before);
 }
}));

test("wrong key, tamper and malformed envelope fail closed without rewriting data",async()=>temporary(async dir=>{
 const secret=key(),a=receipt();
 await commit(dir,secret,"EMPTY",batch([a]));
 const file=join(dir,"formsubmit-intake-journal.enc.json");
 const saved=await readFile(file);
 await assert.rejects(readEncryptedIntakeJournal(dir,key(),now),/authentication\/integrity/);
 assert.deepEqual(await readFile(file),saved);
 const wrapper=JSON.parse(saved.toString("utf8"));
 wrapper.ciphertext=wrapper.ciphertext.slice(0,-4)+"AAAA";
 await writeFile(file,JSON.stringify(wrapper));
 await assert.rejects(readEncryptedIntakeJournal(dir,secret,now),/authentication\/integrity/);
}));

test("failed or disabled collection cannot advance a checkpoint",async()=>temporary(async dir=>{
 for (const status of ["READ_ERROR","DISABLED","SOURCE_MISSING"]) {
  await assert.rejects(commit(dir,key(),"EMPTY",{...batch([receipt()]),status}),/cannot advance/);
 }
 const missing=await readEncryptedIntakeJournal(dir,key(),now);
 assert.equal(missing.revision,"EMPTY");
}));

test("unverified or ambiguous receipts are rejected, not recorded",async()=>temporary(async dir=>{
 const secret=key(),a=receipt();
 for(const invalid of [
  {...a,receiptVerification:"UNKNOWN"},
  {...a,division:"WATCH_BROKERAGE"},
  {...a,provider:"BEGIN_YOUR_QUEST"},
  {...a,qualificationVerification:"VERIFIED"},
  {...a,receivedAt:"2027-01-01T00:00:00Z"},
  {...a,evidenceIds:["source-only"]},
  {...a,sourceRecordId:"person@example.com"},
  {...a,customerEmail:"person@example.com"},
 ]) await assert.rejects(commit(dir,secret,"EMPTY",batch([invalid])),/(?:mapped verified opaque|checkpoint requires verified opaque bounded entries)/);
 const missing=await readEncryptedIntakeJournal(dir,secret,now);
 assert.equal(missing.retainedReceiptCount,0);
}));

test("conflicting duplicate source IDs remain uncommitted",async()=>temporary(async dir=>{
 const secret=key(),a=receipt();
 const first=await commit(dir,secret,"EMPTY",batch([a]));
 const conflict={...a,division:"REALTY"};
 await assert.rejects(commit(dir,secret,first.revision,batch([conflict],first.checkpoint)),/Conflicting intake receipt/);
 const next=await readEncryptedIntakeJournal(dir,secret,now);
 assert.deepEqual(next,first);
}));

test("bad key, observation or checkpoint format is rejected",async()=>temporary(async dir=>{
 const secret=key(),a=receipt();
 await assert.rejects(commit(dir,Buffer.alloc(8),"EMPTY",batch([a])),/256-bit/);
 await assert.rejects(commit(dir,secret,"EMPTY",batch([a]),{observedAt:"2027-01-01T00:00:00Z"}),/observation/);
 await assert.rejects(commit(dir,secret,"EMPTY",{...batch([a]),checkpoint:{seen:{"person@example.com":"0"}}}),/verified opaque bounded/);
}));

test("ordinary user directory with group read permission is refused", {skip:process.platform==="win32"}, async()=>temporary(async dir=>{
 await mkdir(dir,{mode:0o700});await chmod(dir,0o755);
 await assert.rejects(commit(dir,key(),"EMPTY",batch([receipt()])),/private/);
}));

test("file and directory remain mode 0600 and 0700 on POSIX", {skip:process.platform==="win32"}, async()=>temporary(async dir=>{
 const secret=key();await commit(dir,secret,"EMPTY",batch([receipt()]));
 const file=join(dir,"formsubmit-intake-journal.enc.json");
 assert.equal((await stat(dir)).mode & 0o777,0o700);
 assert.equal((await stat(file)).mode & 0o777,0o600);
}));

test("source input remains unmodified and reading needs no mailbox or customer body",async()=>temporary(async dir=>{
 const secret=key(),data=batch([receipt()]);
 const before=JSON.stringify(data);
 await commit(dir,secret,"EMPTY",data);
 assert.equal(JSON.stringify(data),before);
 const snapshot=await readEncryptedIntakeJournal(dir,secret,now);
 assert.equal(snapshot.receipts.length,1);
 assert.equal(snapshot.receipts[0].qualificationVerification,"UNKNOWN");
}));

test("no overlapping source records are allowed to acquire extra PII fields",async()=>temporary(async dir=>{
 const secret=key(),a=receipt();
 await assert.rejects(commit(dir,secret,"EMPTY",batch([{...a,notes:"client secret"}])),/mapped verified opaque/);
}));
