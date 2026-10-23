import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConsolidatedWorkforce, resolveWorkforceOwnership, teamForLegacyRole } from '../src/lib/agents/workforceOperatingModel.ts';
import { buildWorkforceQueue, OPERATING_SEQUENCE } from '../src/lib/command/workforceQueue.ts';
const now='2026-10-23T22:00:00.000Z';
const hash=n=>n.toString(16).padStart(64,'0');
const event=(patch={})=>({schemaVersion:1,eventId:hash(1),sourceSystem:'fixture-source',sourceRevision:1,recordId:hash(2),division:'WATCH_BROKERAGE',stage:'VERIFY',operation:'LUXURY_QUALIFICATION',status:'READY',evidenceState:'VERIFIED',evidenceIds:[hash(3)],observedAt:now,...patch});
test('six accountable teams preserve exactly 57 historical capabilities without claiming worker deployments',async()=>{
 const m=await loadConsolidatedWorkforce();assert.equal(m.teams.length,6);assert.equal(m.historicalCapabilityCount,57);
 const roles=m.teams.flatMap(t=>t.capabilities);assert.equal(new Set(roles.map(r=>r.id)).size,57);
 for(const t of m.teams) for(const r of t.capabilities){assert.equal(teamForLegacyRole(r.id),t.id);assert.equal(r.runtimeDeliveryStage,null);assert.equal(r.independentWorkerRequired,false);}
 assert.equal(m.createsWorkers,false);assert.equal(m.paidModelExecutionAllowed,false);assert.equal(m.independentWorkerTarget,null);
 assert.throws(()=>teamForLegacyRole('invented-role'));
});
test('ownership isolates workstreams and rejects cross-division specialists',()=>{
 assert.equal(resolveWorkforceOwnership('SEO_IMPLEMENTATION','REALTY').executionWorkstream,'A');
 assert.equal(resolveWorkforceOwnership('LINKEDIN_SHOWCASE','CAPITAL_ADVISORY').executionWorkstream,'B');
 assert.equal(resolveWorkforceOwnership('CRM_RECONCILIATION','REALTY').teamId,'enterprise-operations');
 assert.equal(resolveWorkforceOwnership('INTERNAL_FOLLOWUP_PREPARATION','REALTY').founderApprovalRequired,false);
 assert.throws(()=>resolveWorkforceOwnership('LUXURY_QUALIFICATION','REALTY'));
});
test('all eight stages reuse the existing queue, with unmeasured revenue and effort metrics unknown',()=>{
 const r=buildWorkforceQueue(OPERATING_SEQUENCE.map((stage,i)=>event({eventId:hash(i+10),stage})),now);
 assert.equal(r.items.length,8);assert(r.items.every(i=>i.teamId==='technology-luxury'&&i.decision==='INTERNAL_PREPARATION_READY'));
 assert.equal(r.metrics.completedTasks,null);assert.equal(r.metrics.leadConversion,null);assert.equal(r.metrics.founderMinutesSaved,null);
 for(const field of ['writesCRM','sendsMessages','dispatchesWork','businessDataExecutionAllowed','replacesCanonicalStores'])assert.equal(r[field],false);
});
test('replay and duplicate delivery cannot create extra tasks or replace newer evidence',()=>{
 const e=event(),next=event({eventId:hash(4),sourceRevision:2});const r=buildWorkforceQueue([next,e,e],now);
 assert.equal(r.items.length,1);assert.equal(r.metrics.duplicateEvents,1);assert.equal(r.metrics.replayedRevisions,1);assert.equal(r.items[0].sourceRevision,2);
});
test('conflicting revisions and reused event identifiers fail closed across source records',()=>{
 assert.equal(buildWorkforceQueue([event(),event({eventId:hash(4),status:'BLOCKED'})],now).items[0].decision,'CONFLICT');
 const r=buildWorkforceQueue([event(),event({recordId:hash(9)})],now);assert.equal(r.items.length,2);assert.equal(r.metrics.conflicts,2);
 const backwards=event({eventId:hash(4),sourceRevision:2,observedAt:'2026-10-23T21:59:59.000Z'});
 assert.equal(buildWorkforceQueue([event(),backwards],now).items[0].decision,'CONFLICT');
});
test('stale or unknown evidence holds; external work routes to handoff and transactions require review',()=>{
 assert.equal(buildWorkforceQueue([event({observedAt:'2026-10-22T21:59:59.000Z'})],now).items[0].decision,'STALE');
 assert.equal(buildWorkforceQueue([event({evidenceState:'UNKNOWN',evidenceIds:[]})],now).items[0].decision,'VERIFY_SOURCE');
 assert.equal(buildWorkforceQueue([event({operation:'SOCIAL_PUBLISHING'})],now).items[0].decision,'HANDOFF_REQUIRED');
 assert.equal(buildWorkforceQueue([event({operation:'TRANSACTION_REVIEW'})],now).items[0].decision,'FOUNDER_REVIEW');
});
test('unbounded, future, PII-shaped or unsupported payloads rejected before projection',()=>{
 for(const patch of [{email:'private@example.test'},{observedAt:'2026-10-23T22:00:01.000Z'},{evidenceIds:[]},{sourceRevision:0},{sourceSystem:'private@example.test'},{division:'GROWTH_ENGINE'},{operation:'SEND_EMAIL'},{recordId:'customer-1'}])assert.throws(()=>buildWorkforceQueue([event(patch)],now));
 assert.throws(()=>buildWorkforceQueue(Array(1001).fill(event()),now));assert.throws(()=>buildWorkforceQueue([event()],'invalid'));
});
