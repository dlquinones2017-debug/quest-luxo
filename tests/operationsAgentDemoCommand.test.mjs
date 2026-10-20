import test from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";

test("the documented agent demo command runs and reports synthetic exceptions", () => {
  const run=spawnSync("npm",["run","agent:demo"],{cwd:process.cwd(),encoding:"utf8",timeout:30000});
  assert.equal(run.status,0,run.stderr);
  const marker=run.stdout.indexOf('{"source"');
  assert.notEqual(marker,-1,"Expected synthetic demo JSON output");
  const result=JSON.parse(run.stdout.slice(marker));
  assert.equal(result.source,"SYNTHETIC_DEMO_ONLY");
  assert.equal(result.mode,"MANUAL_READ_ONLY");
  assert.equal(result.divisions[0].blocked,1);
  assert.equal(result.divisions[1].founderReview,1);
  assert.equal(result.writesCRM,false);
  assert.equal(result.activatesGmail,false);
  assert.doesNotMatch(run.stdout,/demo-capital-001|demo-realty-001|demo-proof-001/);
});
