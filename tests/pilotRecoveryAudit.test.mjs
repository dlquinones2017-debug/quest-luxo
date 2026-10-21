import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, chmod, writeFile, symlink, link, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assessPilotRecovery } from '../src/lib/agents/pilotRecoveryAudit.ts';
import { readPilotRecoveryReceipt } from '../scripts/pilot-recovery-audit.mjs';
import { validateFactorySpec } from '../src/lib/agents/agentFactory.ts';
import { runApprovedPilotRecoveryAgent } from '../scripts/factory-agent-runtime.mjs';
import { createPilotHealthServer } from '../scripts/start-agent-pilot.mjs';
const now='2026-10-21T21:16:08.602Z';
const state={storageVerified:true,localBackupVerified:true,pipelineRevision:'a'.repeat(64),intakeRevision:'b'.repeat(64)};
const receipt=()=>({version:1,mode:'SYNTHETIC_ONLY',verifiedAt:now,pipelineRevision:state.pipelineRevision,intakeRevision:state.intakeRevision,
  keyRecoveryVerified:true,archiveRecoveryVerified:true,retention:'ONE_TIME_OFFSITE_COPY',verificationMethod:'OPERATOR_OBSERVED_DPAPI_FRESH_PROCESS',evidenceRef:'operator-observed-drill'});
test('current exact-revision recovery records the drill but holds recurring retention and business source',()=>{
  const report=assessPilotRecovery(state,receipt(),now);
  assert.equal(report.independentBackupVerified,true);assert.equal(report.keyRecoveryVerified,true);assert.equal(report.status,'HOLD');
  assert.deepEqual(report.requiredActions,['RECURRING_OFFSITE_RETENTION','AUTHORIZED_BUSINESS_SOURCE']);
  assert.equal(report.recurringOffsiteRetentionVerified,false);assert.equal(report.businessDataExecutionAllowed,false);
  assert.equal(assessPilotRecovery(state,null,now).independentBackupVerified,false);
  for(const patch of [{pipelineRevision:'c'.repeat(64)},{intakeRevision:'c'.repeat(64)},{verifiedAt:'2026-10-21T21:16:09Z'},{verifiedAt:'2026-10-20T21:16:08Z'}])
    assert.equal(assessPilotRecovery(state,{...receipt(),...patch},now).independentBackupVerified,false);
  for(const patch of [{storageVerified:false},{localBackupVerified:false}])assert.equal(assessPilotRecovery({...state,...patch},receipt(),now).independentBackupVerified,false);
  for(const patch of [{keyRecoveryVerified:false},{mode:'BUSINESS_DATA'},{retention:'RECURRING'},{privateField:'secret-marker'},{verifiedAt:3}])
    assert.throws(()=>assessPilotRecovery(state,{...receipt(),...patch},now));
});
test('receipt reader rejects unsafe files, links, oversize and corrupt contents; absent receipt remains missing',async()=>{
  const root=await mkdtemp(join(tmpdir(),'recovery-receipt-'));await chmod(root,0o700);
  const path=join(root,'independent-recovery-receipt.json'), outside=join(root,'outside');
  try {
    assert.equal(await readPilotRecoveryReceipt(root),null);
    await writeFile(path,JSON.stringify(receipt()),{mode:0o600});assert.deepEqual(await readPilotRecoveryReceipt(root),receipt());
    await chmod(path,0o644);await assert.rejects(()=>readPilotRecoveryReceipt(root));await chmod(path,0o600);
    await link(path,outside);await assert.rejects(()=>readPilotRecoveryReceipt(root));await rm(outside);await rm(path);
    await writeFile(outside,JSON.stringify(receipt()),{mode:0o600});await symlink(outside,path);await assert.rejects(()=>readPilotRecoveryReceipt(root));await rm(path);
    await writeFile(path,'x'.repeat(4097),{mode:0o600});await assert.rejects(()=>readPilotRecoveryReceipt(root));
    await writeFile(path,'{broken');await assert.rejects(()=>readPilotRecoveryReceipt(root));
  } finally {await rm(root,{recursive:true,force:true});}
});
test('factory recovery role cannot request network, swap roles or run outside isolated pilot',async()=>{
  const spec=JSON.parse(await readFile(new URL('../config/agents/pilot-recovery-audit.spec.json',import.meta.url)));
  await validateFactorySpec(spec);
  for(const patch of [{roleId:'enterprise-risk'},{authorizedTools:['public-http.head']},{permissions:{...spec.permissions,production:true}},{evaluation:{expectedStatus:'HOLD',expectedReceipt:'VERIFIED'}}])
    await assert.rejects(()=>validateFactorySpec({...spec,...patch}));
  await assert.rejects(()=>runApprovedPilotRecoveryAgent(spec));
});
test('health withdraws recovery claims on audit staleness, receipt expiration or failed storage without exposing receipts',async()=>{
  let healthy=true, current=true, expired=false;
  const server=createPilotHealthServer({healthy:()=>healthy},{snapshot:()=>({state:'CURRENT'})},()=> 'CURRENT',()=>({state:current?'CURRENT':'CHECK_FAILED',
    report:{independentBackupVerified:true,recoveryValidUntil:new Date(Date.now()+(expired?-1000:60000)).toISOString()}}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const url=`http://127.0.0.1:${server.address().port}/healthz`, get=async()=> (await fetch(url)).json();
    let r=await get();assert.equal(r.independentBackupVerified,true);assert.equal(r.liveOperationalAgents,4);
    assert.equal(r.businessDataReady,false);assert.equal(r.recurringOffsiteRetentionVerified,false);assert(!JSON.stringify(r).includes('evidenceRef'));
    expired=true;assert.equal((await get()).independentBackupVerified,false);expired=false;
    current=false;r=await get();assert.equal(r.independentBackupVerified,false);assert.equal(r.liveOperationalAgents,3);
    current=true;healthy=false;r=await get();assert.equal(r.independentBackupVerified,false);assert.equal(r.recoveryAuditAgent,'HELD');
  } finally {await new Promise(resolve=>server.close(resolve));}
});
