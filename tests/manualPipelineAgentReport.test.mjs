import test from "node:test";
import assert from "node:assert/strict";
import {buildManualPipelineReport} from "../scripts/manual-pipeline-agent-report.mjs";

test("manual operations report is aggregate-only and read-only",()=>{
 const snapshot={sequence:4,records:{
  capital:[{borrowerId:"sensitive-opaque-id",status:"BLOCKED",evidenceState:"UNKNOWN"}],
  realty:[{leadId:"another-sensitive-id",status:"REQUIRES_FOUNDER",evidenceState:"VERIFIED"}],
 }};
 const before=structuredClone(snapshot);
 const report=buildManualPipelineReport(snapshot);
 assert.deepEqual(snapshot,before);
 assert.equal(report.divisions[0].blocked,1);
 assert.equal(report.divisions[1].founderReview,1);
 assert.equal(report.divisions[0].unverifiedEvidence,1);
 assert.equal(report.sendsMessages,false);
 assert.equal(report.writesCRM,false);
 assert.equal(report.activatesGmail,false);
 assert.doesNotMatch(JSON.stringify(report),/sensitive-opaque-id|another-sensitive-id/);
});

test("manual CLI refuses missing credentials without reporting zero cases", async()=>{
 const {spawnSync}=await import("node:child_process");
 const output=spawnSync(process.execPath,["--experimental-strip-types","scripts/manual-pipeline-agent-report.mjs"],{
  cwd:process.cwd(),encoding:"utf8",env:{...process.env,QUEST_PIPELINE_DIRECTORY:"",QUEST_PIPELINE_KEY_HEX:""}
 });
 assert.equal(output.status,2);
 assert.match(output.stderr,/requires QUEST_PIPELINE_DIRECTORY/);
 assert.equal(output.stdout,"");
});
test("manual CLI flags missing storage as unavailable, not as an empty report", async()=>{
 const {spawnSync}=await import("node:child_process");
 const {mkdtemp,rm}=await import("node:fs/promises");
 const {tmpdir}=await import("node:os");
 const {join}=await import("node:path");
 const dir=await mkdtemp(join(tmpdir(),"quest-missing-agent-"));
 try{
  const output=spawnSync(process.execPath,["--experimental-strip-types","scripts/manual-pipeline-agent-report.mjs"],{
   cwd:process.cwd(),encoding:"utf8",
   env:{...process.env,QUEST_PIPELINE_DIRECTORY:dir,QUEST_PIPELINE_KEY_HEX:"00".repeat(32)}
  });
  assert.equal(output.status,3);
  assert.match(output.stderr,/missing source is not a zero-count report/);
  assert.equal(output.stdout,"");
 }finally{await rm(dir,{recursive:true,force:true});}
});
