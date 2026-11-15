import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Exercise real configured JSONL persistence, run-once orchestration, the native
// adapter and encrypted phase journal together. Only provider transport is fake.
// Every process owns a temporary directory and fresh random key; no live data.
const modules = Object.fromEntries(['workforceValidationRuntime','workforcePhaseJournal','workforceContactTaskDelivery','luxuryWorkforceEvent'].map(n => [n,new URL('../src/lib/command/'+n+'.ts',import.meta.url).href]));
const storageUrl = new URL('../src/lib/leads/leadStorage.ts',import.meta.url).href;
const captureUrl = new URL('../src/lib/leads/leadCapture.ts',import.meta.url).href;
const script = `
import {mkdtemp,writeFile,appendFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomBytes} from 'node:crypto';
const scenario=process.argv[1],root=await mkdtemp(join(tmpdir(),'ql-orchestration-acceptance-'));
const key=randomBytes(32),counts={contact:0,task:0,email:0,providerGet:0,unexpected:0};
Object.assign(process.env,{LEAD_STORAGE_PROVIDER:'jsonl',LEAD_STORAGE_DIRECTORY:root,QUEST_WORKFORCE_VALIDATION_ENABLED:scenario==='disabled'?'false':'true',WORKFORCE_HUBSPOT_ACCESS_TOKEN:'synthetic-unit-token',WORKFORCE_JOURNAL_KEY_HEX:key.toString('hex'),LEAD_EMAIL_FROM:'unit@example.invalid',EMAIL_PROVIDER_API_KEY:'synthetic-unit-email-key'});
const {createLeadCapturePayload}=await import(${JSON.stringify(captureUrl)});
const {createJsonlLeadStorageAdapter}=await import(${JSON.stringify(storageUrl)});
const {WorkforcePhaseJournal}=await import(${JSON.stringify(modules.workforcePhaseJournal)});
const {WorkforceContactTaskDelivery}=await import(${JSON.stringify(modules.workforceContactTaskDelivery)});
const {APPROVED_VALIDATION_FIXTURE:F,WORKFORCE_PORTAL,WORKFORCE_OWNER,createLuxuryWorkforceEvent}=await import(${JSON.stringify(modules.luxuryWorkforceEvent)});
let journal;
try{
 const storage=createJsonlLeadStorageAdapter(root);
 const payload=createLeadCapturePayload({name:scenario==='excluded'?'Synthetic unrelated inquiry':F.name,email:F.email,source:scenario==='excluded'?'contact':F.source,message:F.marker+' SYNTHETIC ORCHESTRATION UNIT ONLY'});
 const saved=await storage.saveLeadSubmission(payload),record={...saved,payload};
 process.env.WORKFORCE_VALIDATION_LEAD_IDS=saved.id;
 if(scenario==='restored'){
  const seed=await WorkforcePhaseJournal.open(join(root,'seed-journal'),key,{initialize:true});
  WorkforceContactTaskDelivery.enqueueSavedEvent(seed,createLuxuryWorkforceEvent(record,key));
  const backup=join(root,'synthetic-backup.json');await seed.exportBackup(backup);seed.close();
  journal=await WorkforcePhaseJournal.restoreBackup(backup,join(root,'workforce-validation-v2'),key);journal.close();
 }else{journal=await WorkforcePhaseJournal.open(join(root,'workforce-validation-v2'),key,{initialize:true});journal.close();}
 let contact=null,task=null,sent=null;
 globalThis.fetch=async(url,init={})=>{
  const u=new URL(url),body=init.body?JSON.parse(init.body):null;
  if(init.redirect!=='error')throw Error('Redirect boundary absent');
  if(u.origin==='https://api.hubapi.com'){
   if(u.pathname==='/oauth/v2/private-apps/get/access-token-info')return Response.json({hubId:Number(WORKFORCE_PORTAL),scopes:['crm.objects.contacts.read','crm.objects.contacts.write']});
   if(u.pathname==='/crm/v3/objects/contacts'&&init.method==='POST'){counts.contact++;contact={id:'701',archived:false,properties:body.properties};return Response.json(contact,{status:201});}
   if(u.pathname.startsWith('/crm/v3/objects/contacts/')&&init.method==='GET')return contact?Response.json(contact):new Response('',{status:404});
   if(u.pathname==='/crm/v3/objects/tasks/search')return Response.json({total:task?1:0,results:task?[{id:task.id}]:[]});
   if(u.pathname==='/crm/v3/objects/tasks'&&init.method==='POST'){counts.task++;task={id:'801',archived:false,properties:body.properties,associations:{contacts:{results:[{id:body.associations[0].to.id,type:'task_to_contact'}]}}};return Response.json({id:task.id},{status:201});}
   if(u.pathname==='/crm/v3/objects/tasks/801')return Response.json(task);
  }
  if(u.origin==='https://api.resend.com'){
   if(init.method==='POST'){counts.email++;sent=body;if(body.to.length!==1||body.to[0]!==F.email||!init.headers['Idempotency-Key'])throw Error('Owner-only/idempotency contract');if(scenario==='lost-email')throw Error('SYNTHETIC successful write / lost response');return Response.json({id:'synthetic-email-901'});}
   if(init.method==='GET'){counts.providerGet++;if(scenario==='lost-email')return Response.json({name:'restricted_api_key'},{status:401});return Response.json({id:'synthetic-email-901',...sent});}
  }
  counts.unexpected++;throw Error('Unexpected fake transport operation');
 };
 const runtime=await import(${JSON.stringify(modules.workforceValidationRuntime)});
 let queued='NOT_CALLED',result,error=null;
 if(scenario==='partial'){await appendFile(join(root,'leads.jsonl'),'{malformed\\n');try{result=await runtime.runWorkforceValidationOnce();}catch{error='CANONICAL_PARTIAL_REJECTED';}}
 else{queued=await runtime.queueWorkforceValidationRecord(record);result=await runtime.runWorkforceValidationOnce();}
 const first={...counts};let replay=null,reconcileHeld=null;
 if(scenario==='complete')replay=await runtime.runWorkforceValidationOnce();
 if(scenario==='lost-email'){try{await runtime.reconcileWorkforceValidationNotification(saved.id,'synthetic-email-901');}catch{reconcileHeld=true;}replay=await runtime.runWorkforceValidationOnce();}
 journal=await WorkforcePhaseJournal.open(join(root,'workforce-validation-v2'),key);const state=journal.read().state;journal.close();
 console.log(JSON.stringify({scenario,queued,result,replay,error,first,counts,reconcileHeld,state:{entries:state.entries.map(e=>({state:e.state,operation:e.operation,contactId:e.contactId,taskId:e.taskId,notification:e.notification})),recoveryHold:state.recoveryHold},rawRecords:(await storage.readLeadSubmissions()).length}));
}finally{key.fill(0);await rm(root,{recursive:true,force:true});}
`;
async function run(scenario){const {stdout}=await promisify(execFile)(process.execPath,['--experimental-strip-types','--input-type=module','-e',script,scenario],{maxBuffer:1_000_000,timeout:20_000});return JSON.parse(stdout.trim().split('\n').at(-1));}

test('configured persistence-to-run-once path creates once and replays without provider writes',async()=>{
 const r=await run('complete');assert.equal(r.queued,'PENDING');assert.equal(r.result.results[0].status,'COMPLETE');assert.equal(r.replay.results[0].status,'COMPLETE');assert.deepEqual(r.counts,{contact:1,task:1,email:1,providerGet:0,unexpected:0});assert.equal(r.rawRecords,1);assert.equal(r.state.entries.length,1);
});
test('real run-once excludes an unrelated source even if its saved ID is allowlisted',async()=>{
 const r=await run('excluded');assert.equal(r.queued,'DISABLED_OR_EXCLUDED');assert.equal(r.result.processed,0);assert.equal(r.state.entries.length,0);assert.equal(r.counts.contact+r.counts.task+r.counts.email,0);
});
test('disabled configured orchestration dispatches no canonical record',async()=>{
 const r=await run('disabled');assert.equal(r.queued,'DISABLED_OR_EXCLUDED');assert.equal(r.result.processed,0);assert.equal(r.counts.contact+r.counts.task+r.counts.email,0);assert.equal(r.state.entries.length,0);
});
test('partial canonical snapshot holds before provider construction or writes',async()=>{
 const r=await run('partial');assert.equal(r.error,'CANONICAL_PARTIAL_REJECTED');assert.equal(r.counts.contact+r.counts.task+r.counts.email+r.counts.unexpected,0);
});
test('restored populated journal remains held through configured run-once orchestration',async()=>{
 const r=await run('restored');assert.equal(r.state.recoveryHold,true);assert.equal(r.result.results[0].status,'RESTORE_RECONCILIATION_REQUIRED');assert.equal(r.counts.contact+r.counts.task+r.counts.email,0);assert.equal(r.state.entries.length,1);
});
test('lost send response plus restricted native receipt retrieval never sends again',async()=>{
 const r=await run('lost-email');assert.equal(r.result.results[0].status,'UNCERTAIN');assert.equal(r.reconcileHeld,true);assert.equal(r.replay.results[0].status,'UNCERTAIN');assert.equal(r.counts.email,1);assert.equal(r.counts.providerGet,1);assert.equal(r.state.entries[0].notification,'UNCERTAIN');
});
