import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createIntakeJournalBriefReader } from "../src/lib/command/enterpriseIntakeJournalBriefAdapter.ts";
import { commitTrustedIntakeBatch, readEncryptedIntakeJournal } from "../src/lib/command/enterpriseIntakeJournal.ts";
import { storedEnterpriseRevenueBrief } from "../src/lib/command/storedEnterpriseRevenueBrief.ts";

const now = new Date("2026-10-19T23:30:00.000Z");
const hash = s => createHash("sha256").update(s).digest("hex");
const time = "2026-10-19T23:15:00.000Z";
async function fixture(fn) {
 const base = await mkdtemp(join(tmpdir(),"qlux-journal-brief-"));
 try { return await fn(join(base,"private")); }
 finally { await rm(base,{recursive:true,force:true}); }
}
function receipt(division,n) {
 const id="gmail:"+hash("opaque-"+n);
 return {division,provider:"FORMSUBMIT",sourceRecordId:id,receivedAt:time,
   evidenceIds:[id,"approval:verified-"+n],receiptVerification:"VERIFIED",
   qualificationVerification:"UNKNOWN",notification:"UNKNOWN"};
}
function checkpoint(items) {
 const seen={};
 for(const r of items) {
   const fingerprint=hash("receipt-"+r.sourceRecordId);
   seen[r.sourceRecordId]=fingerprint;
   seen["rfc:"+hash("rfc-"+r.sourceRecordId)]=fingerprint;
 }
 return {seen};
}
async function prepare(dir,secret,receipts) {
 const original=await readEncryptedIntakeJournal(dir,secret,now);
 return commitTrustedIntakeBatch({
  directory:dir,key:secret,expectedRevision:original.revision,
  batch:{status:"COMPLETE",receipts,checkpoint:checkpoint(receipts),counts:{examined:receipts.length,rejected:0,unmapped:0,replayed:0,conflicts:0,retentionWarnings:0}},
  observedAt:"2026-10-19T23:20:00.000Z",
 },now);
}

test("unconfigured or missing journal cannot imply successful collection",async()=>fixture(async dir=>{
 const read=createIntakeJournalBriefReader(dir,randomBytes(32),()=>now);
 const x=await read();
 assert.equal(x.receipts.length,0);
 assert.equal(x.observations.CAPITAL_ADVISORY.status,"SOURCE_MISSING");
 assert.equal(x.observations.REALTY.status,"SOURCE_MISSING");
 assert.equal(x.observations.CAPITAL_ADVISORY.observedAt,undefined);
}));

test("mapped Capital and Realty receipts appear in one partial founder intake snapshot",async()=>fixture(async dir=>{
 const key=randomBytes(32),c=receipt("CAPITAL_ADVISORY",1),r=receipt("REALTY",2);
 await prepare(dir,key,[c,r]);
 const read=createIntakeJournalBriefReader(dir,key,()=>now);
 const snapshot=await read();
 assert.equal(snapshot.receipts.length,2);
 assert.equal(snapshot.observations.CAPITAL_ADVISORY.status,"PARTIAL");
 assert.equal(snapshot.observations.REALTY.status,"PARTIAL");
 assert.equal(snapshot.observations.CAPITAL_ADVISORY.observedAt,"2026-10-19T23:20:00.000Z");
 assert.deepEqual(new Set(snapshot.receipts.map(x=>x.division)),new Set(["CAPITAL_ADVISORY","REALTY"]));
}));

test("existing founder revenue queue remains canonical with unknown financial economics",async()=>fixture(async dir=>{
 const secret=randomBytes(32),c=receipt("CAPITAL_ADVISORY",1),r=receipt("REALTY",2);
 await prepare(dir,secret,[c,r]);
 const read=createIntakeJournalBriefReader(dir,secret,()=>now);
 const report=await storedEnterpriseRevenueBrief(now,{
  readBrokerage:async()=>[],readBrokerageSnapshot:async()=>({records:[],status:"COMPLETE",malformedRows:0}),
  readCapital:()=>[],readRealty:()=>[],readIntakeSnapshot:read
 });
 const intakeQueue=report.queue.filter(q=>q.division==="CAPITAL_ADVISORY"||q.division==="REALTY");
 assert.equal(intakeQueue.length,2);
 assert.ok(intakeQueue.every(q=>q.expectedRevenue===null));
 assert.deepEqual(report.intakeReliability.slice(1).map(x=>x.coverage),["PARTIAL","PARTIAL"]);
 assert.equal(report.intakeReliability[1].receipts,1);
 assert.equal(report.intakeReliability[2].receipts,1);
}));

test("incorrect encryption key is a hard failure, not a reported zero",async()=>fixture(async dir=>{
 const secret=randomBytes(32);
 await prepare(dir,secret,[receipt("REALTY",3)]);
 const read=createIntakeJournalBriefReader(dir,randomBytes(32),()=>now);
 await assert.rejects(read(),/authentication\/integrity failed/);
}));

test("journal read bridge never writes and does not need network access",async()=>fixture(async dir=>{
 const secret=randomBytes(32);
 await prepare(dir,secret,[receipt("CAPITAL_ADVISORY",4)]);
 const current=await readEncryptedIntakeJournal(dir,secret,now);
 const read=createIntakeJournalBriefReader(dir,secret,()=>now);
 const first=await read(),second=await read();
 const after=await readEncryptedIntakeJournal(dir,secret,now);
 assert.deepEqual(first,second);
 assert.equal(after.revision,current.revision);
 assert.equal(after.retainedReceiptCount,1);
}));
