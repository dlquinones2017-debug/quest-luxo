import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {randomBytes} from "node:crypto";
import {commitDurablePipelines} from "../src/lib/command/enterpriseDurablePipelines.ts";

test("manual agent end-to-end reads encrypted fixture and emits only useful aggregate exceptions", async()=>{
 const dir=await mkdtemp(join(tmpdir(),"quest-manual-agent-e2e-"));
 const key=randomBytes(32);
 try {
  const capital={borrowerId:"secret-borrower-fixture",stage:"QUALIFY",status:"BLOCKED",reason:"Synthetic",updatedAt:"2026-10-19T12:00:00Z",evidenceIds:["opaque-proof"],evidenceState:"UNKNOWN"};
  const realty={leadId:"secret-property-fixture",stage:"REVIEW",status:"REQUIRES_FOUNDER",reason:"Synthetic",updatedAt:"2026-10-19T12:00:00Z",evidenceIds:["opaque-proof"],evidenceState:"REQUIRES_VERIFICATION"};
  await commitDurablePipelines(dir,key,"EMPTY",{capital:[capital],realty:[realty]});
  const outcome=spawnSync(process.execPath,["--experimental-strip-types","scripts/manual-pipeline-agent-report.mjs"],{
   cwd:process.cwd(),encoding:"utf8",
   env:{...process.env,QUEST_PIPELINE_DIRECTORY:dir,QUEST_PIPELINE_KEY_HEX:key.toString("hex")}
  });
  assert.equal(outcome.status,0,outcome.stderr);
  const report=JSON.parse(outcome.stdout);
  assert.equal(report.mode,"MANUAL_READ_ONLY");
  assert.equal(report.divisions[0].blocked,1);
  assert.equal(report.divisions[1].founderReview,1);
  assert.equal(report.divisions[1].unverifiedEvidence,1);
  assert.equal(report.writesCRM,false);
  assert.equal(report.activatesGmail,false);
  assert.doesNotMatch(outcome.stdout,/secret-borrower-fixture|secret-property-fixture|opaque-proof/);
 } finally {await rm(dir,{recursive:true,force:true});}
});
