import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createJsonlLeadStorageAdapter } from "../src/lib/leads/leadStorage.ts";
import { founderRevenueReadModel } from "../src/lib/command/founderRevenueReadModel.ts";
import { founderRevenueResponse } from "../src/lib/broker/founderRevenueEndpoint.ts";
import { validateBrokerConsoleAccess } from "../src/lib/broker/brokerAuth.ts";
import { founderIntakeRows, loadFounderRevenueModel } from "../src/lib/broker/founderRevenueClient.ts";

const now=new Date("2026-10-19T12:00:00Z");
const lead=(extra={})=>({id:"lead_fixture",status:"new",notes:"PRIVATE_FIXTURE",notesUpdatedAt:null,tags:[],tagsUpdatedAt:null,economicsSnapshots:[],payload:{name:"PRIVATE_FIXTURE",email:"PRIVATE_FIXTURE@example.test",timeline:"researching"},savedAt:"2026-10-19T10:00:00Z",...extra});
const readers=(extra={})=>({readBrokerage:async()=>[],readCapital:()=>[],readRealty:()=>[],...extra});
const model=extra=>founderRevenueReadModel(now,readers(extra));
const receipt=extra=>({division:"CAPITAL_ADVISORY",provider:"FORMSUBMIT",sourceRecordId:"gmail:fixture",receivedAt:"2026-10-19T10:00:00Z",receiptVerification:"VERIFIED",qualificationVerification:"UNKNOWN",notification:"UNKNOWN",evidenceIds:["reviewed-fixture"],...extra});
async function temporary(action){
  const directory=await mkdtemp(join(tmpdir(),"ql-sprint03-"));
  try{return await action(directory);}finally{await rm(directory,{recursive:true,force:true});}
}
test("empty saved source and missing saved source remain distinct",async()=>temporary(async directory=>{
  const adapter=createJsonlLeadStorageAdapter(directory);
  assert.equal((await adapter.readLeadSubmissionSnapshot()).status,"MISSING");
  await writeFile(join(directory,"leads.jsonl"),"");
  const snapshot=await adapter.readLeadSubmissionSnapshot();assert.equal(snapshot.status,"COMPLETE");assert.deepEqual(snapshot.records,[]);assert.equal(snapshot.malformedRows,0);
}));
test("partial malformed source reports integrity loss and preserves source bytes",async()=>temporary(async directory=>{
  const file=join(directory,"leads.jsonl");const contents=JSON.stringify(lead())+'\n{"PRIVATE_FIXTURE": invalid}\n{"bad_shape":true}\n';
  await writeFile(file,contents);const original=console.error;const logs=[];
  try{
    console.error=(...args)=>logs.push(args);
    const snapshot=await createJsonlLeadStorageAdapter(directory).readLeadSubmissionSnapshot();
    assert.equal(snapshot.status,"PARTIAL");assert.equal(snapshot.records.length,1);assert.equal(snapshot.malformedRows,2);
    assert.equal(await readFile(file,"utf8"),contents);assert.doesNotMatch(JSON.stringify(logs),/PRIVATE_FIXTURE|bad_shape/);
  }finally{console.error=original;}
}));
test("one source read serves both reliability and canonical revenue projection",async()=>{
  let snapshots=0;
  const result=await model({readBrokerage:()=>{throw Error("must not reread");},readBrokerageSnapshot:async()=>{snapshots++;return {records:[lead({emailDelivery:{status:"sent",providerResponse:"PRIVATE_FIXTURE"}})],status:"COMPLETE",malformedRows:0};}});
  assert.equal(snapshots,1);assert.equal(result.totalRecords,1);assert.equal(result.intakeReliability[0].providerAccepted,1);
  assert.equal(result.intakeReliability[0].receipts,1);assert.doesNotMatch(JSON.stringify(result),/PRIVATE_FIXTURE|@example.test/);
});
test("Capital and Realty start unconnected, not failed or verified empty",async()=>{
  const result=await model();const rows=founderIntakeRows(result);
  for(const row of rows.slice(1)){assert.equal(row.coverage,"Not connected");assert.equal(row.receipts,"Unknown");assert.equal(row.failed,"Unknown");}
  assert.equal(rows[0].receipts,"0 observed");assert.equal(result.sourceRead.status,"COMPLETE");
});
test("missing and partial Luxury source never present a complete report",async()=>{
  for(const status of ["MISSING","PARTIAL"]){
    const result=await model({readBrokerageSnapshot:async()=>({records:status==="PARTIAL"?[lead()]:[],status,malformedRows:status==="PARTIAL"?1:0})});
    assert.equal(result.sourceRead.status,status);const row=founderIntakeRows(result)[0];
    assert.equal(row.coverage,status==="MISSING"?"Saved source not found":"Partial view");
    assert.equal(row.receipts,status==="MISSING"?"Unknown":"1+ observed");
  }
});
test("failed, accepted and unknown delivery stay separate without qualification claims",async()=>{
  const result=await model({readBrokerage:async()=>[lead({id:"sent",emailDelivery:{status:"sent"}}),lead({id:"failed",emailDelivery:{status:"failed"}}),lead({id:"unknown"})]});
  const row=founderIntakeRows(result)[0];assert.equal(row.accepted,"1");assert.equal(row.failed,"1");assert.equal(row.unknown,"1");
  assert.match(row.review,/failed notification/);assert.equal(result.verifiedExpectedRevenue,0);
});
test("invalid timestamps require verification and never become overdue claims",async()=>{
  const result=await model({readBrokerage:async()=>[lead({savedAt:"2026-10-20T00:00:00Z"})]});
  assert.equal(result.intakeReliability[0].timestampUnknown,1);assert.equal(result.intakeReliability[0].staleReceipts,0);
  assert.match(founderIntakeRows(result)[0].review,/time.*verification/);
});
test("older receipts are visible without inventing an overdue obligation",async()=>{
  const result=await model({readBrokerage:async()=>[lead({savedAt:"2026-10-16T10:00:00Z"})]});
  assert.equal(result.intakeReliability[0].staleReceipts,1);assert.match(founderIntakeRows(result)[0].review,/older.*does not establish overdue/);
});
test("plain intake deltas never imply complete mailbox coverage",async()=>{
  const result=await model({readIntake:async()=>[receipt()]});
  assert.equal(result.intakeReliability[1].coverage,"PARTIAL");assert.equal(founderIntakeRows(result)[1].receipts,"1+ observed");
});
test("explicit observations preserve stale and failed collection states",async()=>{
  const result=await model({readIntakeSnapshot:async()=>({receipts:[receipt()],observations:{CAPITAL_ADVISORY:{status:"COMPLETE",observedAt:"2026-10-16T00:00:00Z"},REALTY:{status:"READ_ERROR"}}})});
  const rows=founderIntakeRows(result);assert.equal(rows[1].coverage,"Observation needs refresh");assert.equal(rows[2].coverage,"Unable to read");assert.equal(rows[2].failed,"Unknown");
});
test("collection does not mutate source objects or duplicate commercial records",async()=>{
  const sources=[lead()];const before=JSON.stringify(sources);const result=await model({readBrokerage:async()=>sources});
  assert.equal(JSON.stringify(sources),before);assert.equal(result.queue.length,1);assert.equal(result.queue[0].recordId,"lead_fixture");assert.ok(Object.isFrozen(result.intakeReliability));
});
test("legacy canonical identifiers remain readable without entering reliability output",async()=>{
  const id="legacy lead/2020";
  const result=await model({readBrokerage:async()=>[lead({id})]});
  assert.equal(result.queue[0].recordId,id);assert.equal(result.intakeReliability[0].receipts,1);
  assert.doesNotMatch(JSON.stringify(result.intakeReliability),/legacy lead/);
});
test("client forwards console key in a same-origin header, never URL/referrer/cache",async()=>{
  const expected=await model();let captured;
  const result=await loadFounderRevenueModel("https://console.example.test/broker?key=fixture-console-key",async(url,options)=>{captured={url,options};return Response.json(expected);});
  assert.deepEqual(result,expected);assert.equal(captured.url,"/api/broker/revenue");assert.equal(captured.options.headers["x-broker-console-key"],"fixture-console-key");
  assert.equal(captured.options.method,"GET");assert.equal(captured.options.redirect,"error");assert.equal(captured.options.cache,"no-store");assert.equal(captured.options.referrerPolicy,"no-referrer");
  assert.doesNotMatch(captured.url,/key|fixture-console-key/);
});
test("authenticated client to protected handler returns the three-division report",async()=>{
  const expected=await model({readBrokerage:async()=>[lead()]});let calls=0;
  const config={isProduction:true,brokerConsole:{accessKey:"fixture-console-key"}};
  const result=await loadFounderRevenueModel("https://console.example.test/broker-console?key=fixture-console-key",(url,options)=>founderRevenueResponse(new Request(`https://console.example.test${url}`,options),{authorize:req=>validateBrokerConsoleAccess(req,config),read:async()=>{calls++;return expected;}}));
  assert.equal(calls,1);assert.equal(result.intakeReliability.length,3);assert.equal(founderIntakeRows(result)[0].receipts,"1 observed");
});
test("client errors cannot disclose provider responses, keys or fake zero models",async()=>{
  for(const request of [async()=>new Response("PRIVATE_FIXTURE fixture-console-key",{status:401}),async()=>{throw Error("PRIVATE_FIXTURE fixture-console-key");},async()=>Response.json({})]){
    await assert.rejects(()=>loadFounderRevenueModel("https://console.example.test/broker?key=fixture-console-key",request),{message:"Unable to load enterprise revenue state."});
  }
});
test("client rejects missing divisions, negative counts and malformed coverage",async()=>{
  const base=await model();
  const invalids=[{...base,intakeReliability:base.intakeReliability.slice(0,1)},{...base,totalRecords:-1},{...base,intakeReliability:base.intakeReliability.map(r=>({...r,coverage:"PRIVATE_FIXTURE"}))},{...base,sourceRead:{status:"healthy",unreadableRows:0}}];
  for(const invalid of invalids)await assert.rejects(()=>loadFounderRevenueModel("https://console.example.test/broker",async()=>Response.json(invalid)));
});
test("storage exceptions remain unavailable and never become a zero report",async()=>{
  await assert.rejects(()=>model({readBrokerageSnapshot:async()=>{throw Error("source inaccessible");}}));
});
