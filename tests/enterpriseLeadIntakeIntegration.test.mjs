import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createLeadStorageBackup, restoreLeadStorageBackup } from "../src/lib/leads/leadStorageOperations.ts";
import { createJsonlLeadStorageAdapter } from "../src/lib/leads/leadStorage.ts";
import { createGmailMetadataReader, GMAIL_METADATA_SCOPE, gmailReceiptKey, readFormSubmitIntake, luxuryLeadReceipts } from "../src/lib/command/enterpriseLeadIntakeAdapter.ts";
import { enterpriseLeadIntelligence, enterpriseLeadFounderQueue } from "../src/lib/command/enterpriseLeadIntelligence.ts";
import { enterpriseLeadReliability } from "../src/lib/command/enterpriseLeadReliability.ts";
import { enterpriseLiveRevenueBrief } from "../src/lib/command/enterpriseLiveRevenueBrief.ts";
import { storedEnterpriseRevenueBrief } from "../src/lib/command/storedEnterpriseRevenueBrief.ts";

const now = new Date("2026-10-18T20:00:00Z");
const sha = s => createHash("sha256").update(s).digest("hex");
const message = (id = "abc1", overrides = {}) => ({
  id, internalDate: String(Date.parse("2026-10-18T18:00:00Z")), labelIds: ["INBOX"],
  payload: { headers: [
    {name:"From", value:"FormSubmit <submissions@formsubmit.co>"},
    {name:"To", value:"denzel@questluxo.com"},
    {name:"Delivered-To", value:"denzel@questluxo.com"},
    {name:"Message-ID", value:`<${id}@formsubmit.co>`},
    {name:"Received", value:"from mail.safenote.co by mx.google.com with ESMTPS id fixture for <denzel@questluxo.com>; fixture"},
    {name:"Authentication-Results", value:"mx.google.com; dkim=pass header.i=@formsubmit.co header.s=mail; spf=pass (receiver check) smtp.mailfrom=submissions@formsubmit.co; dmarc=pass (p=NONE) header.from=formsubmit.co"},
  ] }, ...overrides,
});
const mapping = (m, division="CAPITAL_ADVISORY", extra={}) => ({receiptKey:gmailReceiptKey(m.id), messageIdSha256:sha(m.payload.headers.find(h=>h.name==="Message-ID").value), division, approvalEvidenceId:"approved-source-fixture",kind:"SUBMISSION",...extra});
const policy = mappings => ({founderApproved:true,scopes:[GMAIL_METADATA_SCOPE],mappings});
const reader = (messages, extra={}) => ({profile:async()=>({emailAddress:"denzel@questluxo.com"}),list:async()=>({messages:messages.map(m=>({id:m.id}))}),get:async id=>messages.find(m=>m.id===id),...extra});
const run = (m, p=policy([mapping(m)]), checkpoint) => readFormSubmitIntake(reader([m]),p,checkpoint,now);
const alter = (m,name,value) => ({...m,payload:{headers:m.payload.headers.map(h=>h.name===name?{...h,value}:h)}});
const luxury = extra => ({id:"lead_fixture-1",savedAt:"2026-10-18T18:00:00Z",status:"new",notes:"",notesUpdatedAt:null,tags:[],tagsUpdatedAt:null,economicsSnapshots:[],payload:{timeline:""},...extra});

test("zero state reports no observed submissions and unknown coverage without form failure", async()=>{
  const batch=await readFormSubmitIntake(reader([]),policy([]),undefined,now);
  assert.equal(batch.status,"COMPLETE"); assert.deepEqual(batch.receipts,[]);
  const rows=enterpriseLeadReliability([],{},now);
  assert.ok(rows.every(r=>r.submissions==="NO_OBSERVED_SUBMISSIONS"&&r.coverage==="UNKNOWN"&&r.notificationFailed===0));
});
test("explicit approval and metadata-only scope required before any mailbox read",async()=>{
  const r=reader([],{profile:()=>{throw new Error("must never call");}});
  for(const p of [{...policy([]),founderApproved:false},{...policy([]),scopes:["https://www.googleapis.com/auth/gmail.modify"]},{...policy([]),scopes:[GMAIL_METADATA_SCOPE,"extra"]}]) {
    assert.equal((await readFormSubmitIntake(r,p,undefined,now)).status,"DISABLED");
  }
});
test("wrong corporate account fails closed before listing",async()=>{
  const result=await readFormSubmitIntake(reader([],{profile:async()=>({emailAddress:"other@example.test"}),list:()=>{throw Error("never list");}}),policy([]),undefined,now);
  assert.equal(result.status,"READ_ERROR"); assert.deepEqual(result.receipts,[]);
});
test("both FormSubmit divisions require independent approved source mappings",async()=>{
  const a=message("abc1"),b=message("abc2");
  const result=await readFormSubmitIntake(reader([a,b]),policy([mapping(a),mapping(b,"REALTY")]),undefined,now);
  assert.deepEqual(result.receipts.map(r=>r.division),["CAPITAL_ADVISORY","REALTY"]);
  const queue=enterpriseLeadFounderQueue(enterpriseLeadIntelligence(result.receipts,now),now);
  assert.equal(queue.length,2);assert.ok(queue.every(q=>q.status==="UNKNOWN"&&q.expectedRevenue===null));
});
test("authenticated activation email or subject/body source claims cannot map an inquiry",async()=>{
  const m=message();m.payload.body={content:"QUALIFIED capital.questluxo.com tax-id: private"};
  m.payload.headers.push({name:"Subject",value:"New Quest Luxo Capital Advisory inquiry"});
  const result=await run(m,policy([]));
  assert.equal(result.counts.unmapped,1);assert.deepEqual(result.receipts,[]);
  assert.doesNotMatch(JSON.stringify(result),/private|QUALIFIED|tax-id/);
});
test("invalid sender, lookalike domain and forwarded recipients cannot impersonate provider",async()=>{
  for(const [name,value] of [["From","FormSubmit <attacker@example.test>"],["From","submissions@formsubmit.co.evil.test"],["To","forwarded@example.test"],["Delivered-To","other@example.test"]]) {
    const m=alter(message(),name,value);const result=await run(m);
    assert.equal(result.counts.rejected,1);assert.deepEqual(result.receipts,[]);
  }
});
test("failed or spoofed receiver authentication cannot establish provenance",async()=>{
  const m=message();const auth=m.payload.headers.find(h=>h.name==="Authentication-Results").value;
  for(const value of [auth.replace("dkim=pass","dkim=fail"),auth.replace("spf=pass","spf=fail"),auth.replace("dmarc=pass","dmarc=fail"),auth.replace("mx.google.com;","mx.google.com.evil;"),auth.replace(/formsubmit.co/g,"formsubmit.co.evil")]) {
    const result=await run(alter(m,"Authentication-Results",value));assert.equal(result.counts.rejected,1);
  }
});
test("duplicate authentication or identity headers and absent Google receiver trace rejected",async()=>{
  for(const name of ["Authentication-Results","Message-ID","From"]) {
    const m=message();m.payload.headers.push({...m.payload.headers.find(h=>h.name===name)});
    assert.equal((await run(m)).counts.rejected,1);
  }
  assert.equal((await run(alter(message(),"Received","by attacker.test"))).counts.rejected,1);
});
test("contradictory authentication clauses cannot upgrade a failed result",async()=>{
  const m=message();const auth=m.payload.headers.find(h=>h.name==="Authentication-Results").value;
  for(const value of [auth+"; dkim=fail header.i=@formsubmit.co",auth+"; spf=fail smtp.mailfrom=submissions@formsubmit.co",auth+"; dmarc=fail header.from=formsubmit.co"]){
    assert.equal((await run(alter(m,"Authentication-Results",value))).counts.rejected,1);
  }
});
test("missing, future, malformed and invalid observation timestamps remain untrusted",async()=>{
  for(const internalDate of ["", "yesterday", "9999999999999999",String(now.getTime()+1000)]) {
    assert.equal((await run(message("abc1",{internalDate}))).counts.rejected,1);
  }
  await assert.rejects(()=>readFormSubmitIntake(reader([]),policy([]),undefined,new Date("invalid")));
});
test("message-ID mismatch and ambiguous division mappings quarantine the entire page",async()=>{
  const m=message();
  for(const maps of [[mapping(m,{})],[mapping(m),mapping(m,"REALTY")],[mapping(m,"REALTY",{messageIdSha256:sha("different")})]]) {
    const result=await run(m,policy(maps)); assert.equal(result.status,"READ_ERROR");assert.deepEqual(result.receipts,[]);assert.deepEqual(result.checkpoint.seen,{});
  }
});
test("duplicate resource IDs and RFC Message-ID replays produce one receipt",async()=>{
  const m=message();const first=await readFormSubmitIntake(reader([m,m]),policy([mapping(m)]),undefined,now);
  assert.equal(first.receipts.length,1);assert.equal(first.counts.replayed,1);
  const second=await run(m,policy([mapping(m)]),first.checkpoint);
  assert.deepEqual(second.receipts,[]);assert.equal(second.counts.replayed,1);
  const clone=alter(message("abc2"),"Message-ID","<abc1@formsubmit.co>");
  assert.equal((await run(clone,policy([mapping(clone)]),first.checkpoint)).counts.replayed,1);
});
test("conflicting replay does not overwrite a checkpoint or emit receipts",async()=>{
  const m=message(); const first=await run(m);
  const second=await run(m,policy([mapping(m,"REALTY")]),first.checkpoint);
  assert.equal(second.status,"READ_ERROR");assert.deepEqual(second.receipts,[]);assert.deepEqual(second.checkpoint,first.checkpoint);
});
test("pagination is explicit and read errors never advance a page checkpoint",async()=>{
  const m=message();const p=policy([mapping(m)]);
  const first=await readFormSubmitIntake(reader([m],{list:async()=>({messages:[{id:m.id}],nextPageToken:"next-fixture"})}),p,undefined,now);
  assert.equal(first.status,"PARTIAL");assert.equal(first.checkpoint.pageToken,"next-fixture");
  const fail=await readFormSubmitIntake(reader([m],{get:async()=>{throw Error("private provider failure body");}}),p,first.checkpoint,now);
  assert.equal(fail.status,"READ_ERROR");assert.deepEqual(fail.checkpoint,first.checkpoint);assert.doesNotMatch(JSON.stringify(fail),/private/);
});
test("transport resource substitution fails closed",async()=>{
  const m=message();const result=await readFormSubmitIntake(reader([m],{get:async()=>message("wrong")}),policy([mapping(m)]),undefined,now);
  assert.equal(result.status,"READ_ERROR");assert.deepEqual(result.receipts,[]);
});
test("Trash and Spam receipts retain a warning and never claim durable retention",async()=>{
  const m=message("abc1",{labelIds:["TRASH"]});const result=await run(m);
  assert.equal(result.counts.retentionWarnings,1);
  assert.equal(enterpriseLeadReliability(enterpriseLeadIntelligence(result.receipts,now),{},now)[1].retention,"REQUIRES_VERIFICATION");
});
test("only opaque metadata survives; email body, RFC ID and error text are not retained",async()=>{
  const m=message();m.snippet="sensitive";m.payload.body={content:"tax credit confidential"};
  const result=await run(m);
  assert.doesNotMatch(JSON.stringify(result),/sensitive|confidential|@|submissions|tax|credit/);
  assert.ok(Object.isFrozen(result.receipts[0]));assert.equal(result.receipts[0].qualificationVerification,"UNKNOWN");
});
test("source messages, policy and previous checkpoints are not mutated",async()=>{
  const m=message();const p=policy([mapping(m)]);const checkpoint={seen:{}};
  const before=JSON.stringify([m,p,checkpoint]);await run(m,p,checkpoint);
  assert.equal(JSON.stringify([m,p,checkpoint]),before);
});
test("custom Luxury receipts reuse canonical records and distinguish email delivery errors",()=>{
  for(const [status,expected] of [["sent","ACCEPTED_BY_PROVIDER"],["failed","FAILED"],["skipped","UNKNOWN"],[undefined,"UNKNOWN"]]) {
    const record=luxury({emailDelivery:status?{status,providerResponse:"private",reason:"secret"}:undefined});
    const receipts=luxuryLeadReceipts([record]);
    assert.equal(receipts[0].notification,expected);assert.equal(receipts[0].canonicalRecordId,record.id);
    assert.doesNotMatch(JSON.stringify(receipts),/private|secret/);
    if(status==="failed")assert.equal(enterpriseLeadIntelligence(receipts,now)[0].state,"NOTIFICATION_FAILURE");
  }
});
test("one shared Founder Revenue Brief integrates all divisions without duplicating Luxury",async()=>{
  const a=message("abc1"),b=message("abc2");const record=luxury({});
  const intake=await readFormSubmitIntake(reader([a,b]),policy([mapping(a),mapping(b,"REALTY")]),undefined,now);
  const receipts=[...luxuryLeadReceipts([record]),...intake.receipts];
  const result=await storedEnterpriseRevenueBrief(now,{readBrokerage:async()=>[record],readCapital:()=>[],readRealty:()=>[],readIntake:async()=>receipts});
  assert.equal(result.queue.length,3);assert.equal(result.queue.filter(q=>q.division==="WATCH_BROKERAGE").length,1);
  assert.ok(result.queue.every(q=>q.expectedRevenue===null));
});
test("canonical identity collisions are held as conflicts before queue dedupe",()=>{
  const base={division:"REALTY",provider:"FORMSUBMIT",sourceRecordId:"source-a",canonicalRecordId:"realty-fixture",receivedAt:"2026-10-18T18:00:00Z",evidenceIds:["ev1"],receiptVerification:"VERIFIED"};
  const findings=enterpriseLeadIntelligence([base,{...base,sourceRecordId:"source-b"}],now);
  assert.equal(findings.length,1);assert.equal(findings[0].state,"EVIDENCE_CONFLICT");assert.deepEqual(enterpriseLeadFounderQueue(findings,now),[]);
});
test("existing canonical commercial record takes precedence over intake metadata",()=>{
  const r=luxury({});
  const before=enterpriseLiveRevenueBrief({brokerage:[r]},now);
  const after=enterpriseLiveRevenueBrief({brokerage:[r],intake:luxuryLeadReceipts([r])},now);
  assert.deepEqual(after,before);
});
test("reliability separates unknown timestamps, collection errors, staleness and failed notification",()=>{
  const receipts=luxuryLeadReceipts([luxury({savedAt:"invalid",emailDelivery:{status:"failed"}})]);
  const rows=enterpriseLeadReliability(enterpriseLeadIntelligence(receipts,now),{WATCH_BROKERAGE:{status:"COMPLETE",observedAt:"2026-10-15T00:00:00Z"},CAPITAL_ADVISORY:{status:"READ_ERROR"},REALTY:{status:"PARTIAL"}},now);
  assert.equal(rows[0].timestampUnknown,1);assert.equal(rows[0].staleReceipts,0);assert.equal(rows[0].notificationFailed,1);
  assert.deepEqual(rows.map(r=>r.coverage),["STALE","READ_ERROR","PARTIAL"]);
  assert.equal(enterpriseLeadReliability([],{REALTY:{status:"COMPLETE",observedAt:"2027-01-01"}},now)[2].coverage,"UNKNOWN");
});
test("Gmail transport is GET-only and requests metadata headers with bounded pagination",async()=>{
  const calls=[];const r=createGmailMetadataReader(async()=>"fixture-token",async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({})};});
  await r.profile();await r.list("fixture-page");await r.get("abc1");
  assert.ok(calls.every(c=>c.url.startsWith("https://gmail.googleapis.com/gmail/v1/users/me/")&&c.options.method==="GET"&&c.options.redirect==="error"));
  const list=new URL(calls[1].url);assert.equal(list.searchParams.get("maxResults"),"100");assert.equal(list.searchParams.get("includeSpamTrash"),"true");assert.equal(list.searchParams.has("q"),false);
  assert.equal(new URL(calls[2].url).searchParams.get("format"),"metadata");
  assert.throws(()=>r.get("../send"));
});
test("transport failures redact secrets, raw provider responses and exception details",async()=>{
  const r=createGmailMetadataReader(async()=>"secret",async()=>{throw Error("secret provider response");});
  await assert.rejects(()=>r.profile(),{message:"Gmail metadata read failed."});
});
test("existing backup operator restores a synthetic fixture byte-for-byte without overwriting",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"ql-sprint02-restore-"));
  try {
    const file=join(directory,"synthetic.jsonl"); const target=join(directory,"restored.jsonl");
    const contents=JSON.stringify({id:"synthetic-fixture",payload:{source:"LOCAL_FIXTURE_ONLY"}})+"\n";
    await writeFile(file,contents,{mode:0o600});
    const backup=await createLeadStorageBackup({sourceFile:file,backupDirectory:join(directory,"backups"),timestamp:now});
    const restored=await restoreLeadStorageBackup({backupFile:backup.backupFile,restoreTargetFile:target});
    assert.equal(restored.sha256,backup.sha256);assert.equal(await readFile(target,"utf8"),contents);
    await assert.rejects(()=>restoreLeadStorageBackup({backupFile:backup.backupFile,restoreTargetFile:target}));
    assert.equal(await readFile(file,"utf8"),contents);
  } finally {await rm(directory,{recursive:true,force:true});}
});
test("malformed source records and parser errors never leak client fields to logs",async()=>{
  const directory=await mkdtemp(join(tmpdir(),"ql-sprint02-log-"));
  const original=console.error;const logs=[];
  try {
    await writeFile(join(directory,"leads.jsonl"),' {"email":"SENSITIVE_FIXTURE@example.test"}\n{"SENSITIVE_FIXTURE": invalid}\n');
    console.error=(...args)=>logs.push(args);
    assert.deepEqual(await createJsonlLeadStorageAdapter(directory).readLeadSubmissions(),[]);
    assert.equal(logs.length,2);assert.doesNotMatch(JSON.stringify(logs),/SENSITIVE_FIXTURE|example.test/);
  } finally {console.error=original;await rm(directory,{recursive:true,force:true});}
});
