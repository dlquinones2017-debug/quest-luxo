import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { checkPublicWebsites } from '../src/lib/agents/publicWebsiteHealth.ts';
import { triagePublicWebsiteReport, buildPublicOperationsBrief } from '../src/lib/agents/publicOperationsTeam.ts';
import { assessPilotRecovery } from '../src/lib/agents/pilotRecoveryAudit.ts';
import { coordinatePilotOperations } from '../src/lib/agents/pilotCommandOrchestrator.ts';
import { runApprovedPilotCommandAgent, runFactoryAgent } from '../scripts/factory-agent-runtime.mjs';
import { validateFactorySpec } from '../src/lib/agents/agentFactory.ts';
import { createPilotHealthServer } from '../scripts/start-agent-pilot.mjs';
const now='2026-10-21T21:50:00.000Z';
const modelPolicy={version:1,mode:'DISABLED_ZERO_BUDGET',enabled:false,dailyBudgetUsd:0};
const state={storageVerified:true,localBackupVerified:true,pipelineRevision:'a'.repeat(64),intakeRevision:'b'.repeat(64)};
const receipt=()=>({version:1,mode:'SYNTHETIC_ONLY',verifiedAt:now,pipelineRevision:state.pipelineRevision,intakeRevision:state.intakeRevision,
  keyRecoveryVerified:true,archiveRecoveryVerified:true,retention:'ONE_TIME_OFFSITE_COPY',verificationMethod:'OPERATOR_OBSERVED_DPAPI_FRESH_PROCESS',evidenceRef:'synthetic-coordination-evidence'});
async function sources(statuses=[200,200,200]) {
  let calls=0;const health=await checkPublicWebsites({now:()=>new Date(now),reader:async()=>new Response(null,{status:statuses[calls++]})});
  const brief=buildPublicOperationsBrief(health,triagePublicWebsiteReport(health,now),now);
  return {health,brief,recovery:assessPilotRecovery(state,receipt(),now),modelPolicy,calls};
}
const run=(s,time=now)=>coordinatePilotOperations(s.health,s.brief,s.recovery,s.modelPolicy,time);
test('orchestrator coordinates existing reports without extra HTTP calls, business counts, dispatch or paid-model activation',async()=>{
  const s=await sources();const r=run(s);
  assert.equal(s.calls,3);assert.equal(r.sourceCount,3);assert.equal(r.operationalState,'CURRENT');assert.equal(r.status,'HOLD');
  assert.equal(r.sitesResponding,3);assert.equal(r.independentRecoveryVerified,true);assert.equal(r.businessPipeline,'NOT_CONNECTED');
  assert.deepEqual(r.tasks.map(t=>t.action),['ESTABLISH_RECURRING_OFFSITE_RETENTION','REVIEW_BUSINESS_SOURCE_SCOPE']);
  assert.equal(r.modelExecution,'DISABLED_ZERO_BUDGET');assert.equal(r.dailyModelBudgetUsd,0);
  for(const k of ['businessDataExecutionAllowed','modelApiRequestsAllowed','changesProduction','dispatchesWork','sendsMessages','writesCRM','activatesGmail'])assert.equal(r[k],false);
  const incident=run(await sources([200,403,503]));assert.equal(incident.publicIncidentCount,2);assert.equal(incident.tasks[0].action,'REVIEW_PUBLIC_SITE_INCIDENTS');
  const missing=await sources();missing.recovery=assessPilotRecovery({...state,storageVerified:false,localBackupVerified:false},null,now);
  assert.deepEqual(run(missing).tasks.slice(0,2).map(t=>[t.action,t.priority]),[['RESTORE_STORAGE_HEALTH',0],['VERIFY_LOCAL_BACKUP_RECOVERY',0]]);
});
test('stale public data becomes unknown, stale recovery loses verification and expired independent receipts stay held',async()=>{
  const s=await sources();const recoveryStale=run(s,'2026-10-21T21:52:00.001Z');
  assert.equal(recoveryStale.operationalState,'STALE');assert.equal(recoveryStale.independentRecoveryVerified,false);
  assert(recoveryStale.tasks.some(t=>t.action==='VERIFY_FRESH_RECOVERY_ASSESSMENT'));
  const later='2026-10-21T21:56:00.000Z';s.recovery=assessPilotRecovery(state,receipt(),later);
  const publicStale=run(s,later);assert.equal(publicStale.sitesResponding,null);assert.equal(publicStale.publicIncidentCount,null);
  assert.equal(publicStale.tasks[0].action,'VERIFY_FRESH_PUBLIC_OBSERVATION');
  const t=await sources();t.recovery=assessPilotRecovery(state,{...receipt(),verifiedAt:'2026-10-20T21:50:01.000Z'},now);
  assert.equal(run(t,'2026-10-21T21:50:02.000Z').independentRecoveryVerified,false);
});
test('consumer rejects forged briefs, raw extra data, malformed recovery evidence and nonzero model policies',async()=>{
  const s=await sources();
  for(const edit of [s=>s.brief.sitesResponding=0,s=>s.health.observations[0].rawBody='secret-marker',s=>s.brief.instructions='send-email',
    s=>s.recovery.independentBackupVerified=false,s=>s.recovery.dispatchesWork=true,s=>s.recovery.requiredActions=['STORAGE'],
    s=>s.recovery.recoveryValidUntil='2099-01-01T00:00:00.000Z',s=>s.recovery.email='private@example.test',
    s=>s.recovery.assessedAt='2026-10-21T21:51:00.000Z',s=>s.modelPolicy.dailyBudgetUsd=1,s=>s.modelPolicy.enabled=true]){
    const bad=structuredClone(s);edit(bad);assert.throws(()=>run(bad));
  }
  assert.throws(()=>run(s,'2026-10-21T21:49:00.000Z'));
  assert.throws(()=>run({...s,recovery:null}));assert.throws(()=>run({...s,brief:null}));
});
test('factory binds the command role to report-only tools and refuses a live run without matching sources',async()=>{
  const spec=JSON.parse(await readFile(new URL('../config/agents/pilot-command-orchestrator.spec.json',import.meta.url)));
  await validateFactorySpec(spec);
  for(const patch of [{roleId:'website-product'},{authorizedTools:['public-http.head']},{permissions:{...spec.permissions,externalWrites:true}},
    {evaluation:{expectedStatus:'HOLD',expectedSourceCount:57}}])await assert.rejects(()=>validateFactorySpec({...spec,...patch}));
  await assert.rejects(()=>runApprovedPilotCommandAgent(spec));
  const s=await sources();const {calls,...input}=s;const live=await runApprovedPilotCommandAgent(spec,input,now);
  assert.equal(live.source,'DERIVED_VERIFIED_PILOT_REPORTS');assert.equal(live.report.dispatchesWork,false);
  assert.equal((await runFactoryAgent(spec)).source,'SYNTHETIC_FIXTURE_ONLY');
});
test('health counts a fifth role only with current source teams and withdraws it when their checks fail',async()=>{
  let healthy=true,publicState='CURRENT',recoveryState='CURRENT',commandState='CURRENT',reportState='CURRENT';
  const server=createPilotHealthServer({healthy:()=>healthy},{snapshot:()=>({state:publicState})},()=> 'CURRENT',()=>({state:recoveryState,
    report:{independentBackupVerified:true,recoveryValidUntil:new Date(Date.now()+60000).toISOString()}}),()=>({state:commandState,report:{operationalState:reportState}}));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}`, get=async()=> (await fetch(base+'/healthz')).json();
    let r=await get();assert.equal(r.liveOperationalAgents,5);assert.equal(r.commandOrchestrator,'CURRENT');assert.equal(r.paidModelExecution,'DISABLED_ZERO_BUDGET');
    commandState='CHECK_FAILED';assert.equal((await get()).liveOperationalAgents,4);commandState='CURRENT';reportState='STALE';assert.equal((await get()).commandOrchestrator,'HELD');reportState='CURRENT';
    publicState='CHECK_FAILED';r=await get();assert.equal(r.livePublicAgents,0);assert.equal(r.liveOperationalAgents,1);publicState='CURRENT';
    recoveryState='CHECK_FAILED';assert.equal((await get()).liveOperationalAgents,3);recoveryState='CURRENT';healthy=false;assert.equal((await get()).commandOrchestrator,'HELD');
    assert.equal((await fetch(base+'/command')).status,404);assert.equal((await fetch(base+'/healthz',{method:'POST'})).status,404);
  } finally {await new Promise(resolve=>server.close(resolve));}
});

test('command accepts only consistent recurring retention, expires it and keeps business execution held',async()=>{
  const s=await sources(),preparationRevision='c'.repeat(64);
  const proof={version:1,clientId:'windows-recovery-primary',firstSuccessAt:'2026-10-21T21:49:00.000Z',lastSuccessAt:now,successfulCycles:2,
    archives:[['intake',state.intakeRevision],['pipeline',state.pipelineRevision],['preparation',preparationRevision]].map(([kind,revision])=>({kind,revision,sha256:'d'.repeat(64)})),
    checkpointAuthenticated:true,recurringIndependentRetentionVerified:true,businessDataExecutionAllowed:false};
  s.recovery=assessPilotRecovery({...state,preparationRevision},null,now,proof);
  const report=run(s);assert.equal(report.independentRecoveryVerified,true);
  assert.deepEqual(report.tasks.map(t=>t.action),['REVIEW_BUSINESS_SOURCE_SCOPE']);
  for(const edit of [r=>r.retention='ONE_TIME_OFFSITE_COPY',r=>r.recurringOffsiteRetentionVerified=false,
    r=>r.requiredActions=['RECURRING_OFFSITE_RETENTION','AUTHORIZED_BUSINESS_SOURCE'],r=>r.requiredActions=[],
    r=>r.independentBackupVerified=false,r=>r.recoveryValidUntil='2026-10-22T09:50:00.001Z']){
    const bad=structuredClone(s);edit(bad.recovery);assert.throws(()=>run(bad));
  }
  const expired=run(s,'2026-10-22T09:50:00.001Z');assert.equal(expired.independentRecoveryVerified,false);
  assert(expired.tasks.some(t=>t.action==='ESTABLISH_RECURRING_OFFSITE_RETENTION'));
  for(const key of ['businessDataExecutionAllowed','modelApiRequestsAllowed','changesProduction','dispatchesWork','sendsMessages','writesCRM','activatesGmail'])assert.equal(report[key],false);
});
