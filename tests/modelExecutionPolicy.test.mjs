import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { assessModelExecutionPolicy, assertModelExecutionAllowed } from '../src/lib/agents/modelExecutionPolicy.ts';
const policy={version:1,mode:'DISABLED_ZERO_BUDGET',enabled:false,dailyBudgetUsd:0};
test('zero budget refuses execution and positive or forged policy changes fail closed',()=>{
  const result=assessModelExecutionPolicy(policy);
  assert.equal(result.dailyBudgetUsd,0);assert.equal(result.modelExecutionAllowed,false);
  assert.equal(result.providerSessionCreationAllowed,false);assert.equal(result.credentialsRead,false);
  assert.throws(()=>assertModelExecutionAllowed(policy),/disabled/);
  for(const patch of [{enabled:true},{dailyBudgetUsd:1},{dailyBudgetUsd:'0'},{mode:'ENABLED'},{approval:'assume-approved'}])
    assert.throws(()=>assertModelExecutionAllowed({...policy,...patch}));
  for(const invalid of [null,[],undefined,{}])assert.throws(()=>assertModelExecutionAllowed(invalid));
});
test('model entry point reports hold and refuses a run even when credentials and enable flags are supplied',()=>{
  const env={...process.env,OPENAI_API_KEY:'sk-synthetic-secret-marker-not-a-real-key',QUEST_LLM_ENABLED:'true',QUEST_LLM_DAILY_BUDGET_USD:'999'};
  const status=spawnSync(process.execPath,['scripts/model-execution.mjs','status'],{encoding:'utf8',env});
  assert.equal(status.status,0,status.stderr);assert.equal(JSON.parse(status.stdout).networkRequestsAllowed,false);
  const attempted=spawnSync(process.execPath,['scripts/model-execution.mjs','run'],{encoding:'utf8',env});
  assert.equal(attempted.status,2);assert.match(attempted.stderr,/held/);
  assert.doesNotMatch(status.stdout+status.stderr+attempted.stdout+attempted.stderr,/synthetic-secret-marker/);
});
