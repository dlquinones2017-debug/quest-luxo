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

const recurringState={...state,preparationRevision:'c'.repeat(64)};
const recurringProof=()=>({version:1,clientId:'windows-recovery-primary',firstSuccessAt:'2026-10-21T21:15:08.602Z',lastSuccessAt:now,successfulCycles:2,
  archives:[['intake',state.intakeRevision],['pipeline',state.pipelineRevision],['preparation',recurringState.preparationRevision]].map(([kind,revision])=>({kind,revision,sha256:'d'.repeat(64)})),
  checkpointAuthenticated:true,recurringIndependentRetentionVerified:true,businessDataExecutionAllowed:false});
test('fresh recurring proof binds all current revisions and supersedes a stale one-time receipt while retaining business hold',()=>{
  const report=assessPilotRecovery(recurringState,{...receipt(),verifiedAt:'2026-10-19T00:00:00.000Z'},now,recurringProof());
  assert.equal(report.independentBackupVerified,true);assert.equal(report.keyRecoveryVerified,true);
  assert.equal(report.retention,'RECURRING_INDEPENDENT_COPIES');assert.equal(report.recurringOffsiteRetentionVerified,true);
  assert.equal(report.recoveryValidUntil,'2026-10-22T09:16:08.602Z');assert.deepEqual(report.requiredActions,['AUTHORIZED_BUSINESS_SOURCE']);
  for(const key of ['businessDataExecutionAllowed','changesProduction','dispatchesWork','sendsMessages','writesCRM','activatesGmail'])assert.equal(report[key],false);
  for(const key of ['pipelineRevision','intakeRevision','preparationRevision']){
    const mismatch=assessPilotRecovery({...recurringState,[key]:'e'.repeat(64)},null,now,recurringProof());
    assert.equal(mismatch.independentBackupVerified,false);assert.equal(mismatch.recurringOffsiteRetentionVerified,false);
  }
  for(const time of ['2026-10-22T09:16:08.603Z','2026-10-21T21:16:08.601Z'])
    assert.equal(assessPilotRecovery(recurringState,null,time,recurringProof()).recurringOffsiteRetentionVerified,false);
  for(const key of ['storageVerified','localBackupVerified'])assert.equal(assessPilotRecovery({...recurringState,[key]:false},null,now,recurringProof()).recurringOffsiteRetentionVerified,false);
});
test('recurring assessor rejects fabricated shape, short cycles and absent preparation binding',()=>{
  for(const patch of [{checkpointAuthenticated:false},{recurringIndependentRetentionVerified:false},{successfulCycles:1},{successfulCycles:2.5},
    {clientId:'other-device'},{businessDataExecutionAllowed:true},{extra:true},{firstSuccessAt:'2026-10-21T21:15:09.000Z'},
    {lastSuccessAt:'2026-10-21T21:16:08Z'},{archives:recurringProof().archives.slice(0,2)},
    {archives:recurringProof().archives.map(a=>({...a,extra:true}))},{archives:[...recurringProof().archives].reverse()}])
    assert.throws(()=>assessPilotRecovery(recurringState,null,now,{...recurringProof(),...patch}));
  assert.throws(()=>assessPilotRecovery(state,null,now,recurringProof()));
});
test('only authenticated private checkpoint reader supplies recurring evidence across the script trust boundary',async()=>{
  const {readRecurringCheckpoint}=await import('../scripts/pilot-backup-channel.mjs');
  const {signPayload}=await import('../scripts/pilot-backup-protocol.mjs');
  const root=await mkdtemp(join(tmpdir(),'recurring-recovery-'));await chmod(root,0o700);
  const key=Buffer.alloc(32,17),file=join(root,'recurring-backup-checkpoint.json');
  const {checkpointAuthenticated,recurringIndependentRetentionVerified,businessDataExecutionAllowed,...payload}=recurringProof();
  try{
    await writeFile(file,JSON.stringify({payload,signature:signPayload(key,payload)}),{mode:0o600});
    const proof=await readRecurringCheckpoint(root,key,Date.parse(now));
    assert.equal(assessPilotRecovery(recurringState,null,now,proof).recurringOffsiteRetentionVerified,true);
    await writeFile(file,JSON.stringify({payload:{...payload,lastSuccessAt:'2026-10-21T21:16:08.603Z'},signature:signPayload(key,payload)}));
    assert.equal(await readRecurringCheckpoint(root,key,Date.parse(now)),null);
    assert.equal(assessPilotRecovery(recurringState,null,now,await readRecurringCheckpoint(root,key,Date.parse(now))).independentBackupVerified,false);
  }finally{key.fill(0);await rm(root,{recursive:true,force:true});}
});

test('required fourth outbox profile never upgrades three-profile proof to recurring coverage',()=>{
 const withOutbox={...recurringState,outboxRevision:'e'.repeat(64)},old=assessPilotRecovery(withOutbox,null,now,recurringProof());
 assert.equal(old.independentBackupVerified,true);assert.equal(old.recurringOffsiteRetentionVerified,false);assert.equal(old.retention,'ONE_TIME_OFFSITE_COPY');
 assert.deepEqual(old.requiredActions,['RECURRING_OFFSITE_RETENTION','AUTHORIZED_BUSINESS_SOURCE']);
 const four=recurringProof();four.archives.push({kind:'outbox',revision:withOutbox.outboxRevision,sha256:'f'.repeat(64)});four.archives.sort((a,b)=>a.kind.localeCompare(b.kind));
 const current=assessPilotRecovery(withOutbox,null,now,four);assert.equal(current.recurringOffsiteRetentionVerified,true);assert.deepEqual(current.requiredActions,['AUTHORIZED_BUSINESS_SOURCE']);
 assert.equal(current.retention,'RECURRING_INDEPENDENT_COPIES');assert.equal(current.recoveryValidUntil,'2026-10-22T09:16:08.602Z');
 assert.equal(assessPilotRecovery({...withOutbox,outboxRevision:'f'.repeat(64)},null,now,four).recurringOffsiteRetentionVerified,false);
 assert.equal(assessPilotRecovery(withOutbox,null,'2026-10-22T09:16:08.603Z',four).independentBackupVerified,false);
 for(const patch of [{archives:four.archives.filter(a=>a.kind!=='preparation')},{archives:four.archives.map(a=>a.kind==='outbox'?{...a,kind:'intake'}:a)}])
  assert.throws(()=>assessPilotRecovery(withOutbox,null,now,{...four,...patch}));
 assert.throws(()=>assessPilotRecovery({...state,outboxRevision:'e'.repeat(64)},null,now,four));
});
test('health coverage count follows fresh required three/four-store recovery and withdraws expired proof',async()=>{
 for(const expected of [3,4]){
  let fresh=true;const server=createPilotHealthServer({healthy:()=>true},null,null,()=>({state:'CURRENT',report:{independentBackupVerified:true,recurringOffsiteRetentionVerified:fresh,recoveryValidUntil:new Date(Date.now()+60000).toISOString()}}),null,null,expected);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const get=async()=> (await fetch(`http://127.0.0.1:${server.address().port}/healthz`)).json();assert.equal((await get()).recurringBackupStoreCount,expected);fresh=false;assert.equal((await get()).recurringBackupStoreCount,0);}
  finally{await new Promise(resolve=>server.close(resolve));}
 }
 for(const bad of [0,5,'4',null])assert.throws(()=>createPilotHealthServer({healthy:()=>true},null,null,null,null,null,bad));
});
