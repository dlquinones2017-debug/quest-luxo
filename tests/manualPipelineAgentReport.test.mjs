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
