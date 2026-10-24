import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,readdir,writeFile,rm,symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes,createHash} from 'node:crypto';
import {runRecurringBackup,parseStdinKey} from '../scripts/pilot-recurring-backup-client.mjs';
import {signPayload,signRequest} from '../scripts/pilot-backup-protocol.mjs';
import {commitDurablePipelines} from '../src/lib/command/enterpriseDurablePipelines.ts';
import {commitTrustedIntakeBatch} from '../src/lib/command/enterpriseIntakeJournal.ts';
import {exportPipelineBackup,exportIntakeJournalBackup} from '../src/lib/command/enterprisePipelineBackup.ts';
import {syntheticRecords} from '../scripts/factory-agent-runtime.mjs';
import {syntheticIntakeBatch,SYNTHETIC_INTAKE_TIME} from '../scripts/synthetic-intake-fixture.mjs';
import {verifySyntheticCRMPreparation} from '../scripts/pilot-crm-preparation.mjs';

const time='2026-10-24T02:00:00.000Z',sha=b=>createHash('sha256').update(b).digest('hex');
async function fixture(fn){
 const directory=await mkdtemp(join(tmpdir(),'recurring-client-')),root=join(directory,'private'),key=randomBytes(32);await mkdir(root,{mode:0o700});
 try{
  const archives=[];
  for(const kind of ['pipeline','intake']){
   const source=join(directory,'source-'+kind),backupRoot=join(directory,'backup-'+kind),archive=join(backupRoot,kind+'.backup.json');await mkdir(backupRoot,{mode:0o700});
   if(kind==='pipeline')await commitDurablePipelines(source,key,'EMPTY',syntheticRecords());
   else await commitTrustedIntakeBatch({directory:source,key,expectedRevision:'EMPTY',batch:syntheticIntakeBatch(),observedAt:SYNTHETIC_INTAKE_TIME},new Date('2026-10-21T13:00:00Z'));
   const report=await(kind==='pipeline'?exportPipelineBackup:exportIntakeJournalBackup)(source,archive,key),bytes=await readFile(archive);
   archives.push({kind,revision:report.revision,sha256:sha(bytes),archive:bytes.toString('utf8')});
  }
  const preparationRoot=join(directory,'preparation');await mkdir(preparationRoot,{mode:0o700});const prep=await verifySyntheticCRMPreparation(preparationRoot,key,true),bytes=await readFile(join(preparationRoot,'retained-crm-preparation',prep.archiveFilename));
  archives.push({kind:'preparation',revision:prep.journalRevision,sha256:sha(bytes),archive:bytes.toString('utf8')});
  const calls=[];let nonce=0;
  const options={root,key,clock:()=>new Date(time),nonceFactory:()=> (++nonce).toString(16).padStart(32,'0'),aclChecker:async()=>true};
  const signed=payload=>({status:200,body:Buffer.from(JSON.stringify({payload,signature:signPayload(key,payload)}))});
  options.transport=async request=>{
   calls.push(request);const h=request.headers;
   assert.equal(h['x-quest-client'],'windows-recovery-primary');assert.equal(h['x-quest-timestamp'],time);
   assert.equal(h['x-quest-signature'],signRequest(key,{method:request.method,path:request.path,clientId:h['x-quest-client'],timestamp:h['x-quest-timestamp'],nonce:h['x-quest-nonce'],body:request.body}));
   if(request.method==='GET'){assert.equal(request.path,'/pilot-backup/v1');assert.equal(request.body,'');return signed({version:1,nonce:h['x-quest-nonce'],generatedAt:time,archives});}
   assert.equal(request.path,'/pilot-backup/v1/ack');const ack=JSON.parse(request.body);
   assert.deepEqual(Object.keys(ack).sort(),['version','nonce','verifiedAt','archives','aclVerified','recoveryVerified','deviceId'].sort());
   assert.equal(ack.recoveryVerified,true);assert.equal(ack.aclVerified,true);assert.equal(ack.deviceId,'windows-recovery-primary');assert.notEqual(h['x-quest-nonce'],ack.nonce);
   assert.deepEqual(ack.archives,archives.map(({kind,revision,sha256})=>({kind,revision,sha256})));
   return signed({version:1,nonce:ack.nonce,acknowledgedAt:time,successfulCycles:1,recurringIndependentRetentionVerified:false});
  };
  await fn({root,key,archives,options,calls,signed});
 }finally{key.fill(0);await rm(directory,{recursive:true,force:true});}
}
test('stdin key accepts exact raw lowercase hex and optional LF only',()=>{
 const hex='ab'.repeat(32);assert.equal(parseStdinKey(Buffer.from(hex)).toString('hex'),hex);assert.equal(parseStdinKey(Buffer.from(hex+'\n')).toString('hex'),hex);
 for(const value of [' '+hex,hex+'\r\n',hex+'\n\n',hex.slice(1),hex.toUpperCase(),hex+'x'])assert.throws(()=>parseStdinKey(Buffer.from(value)));
 const high=Buffer.from(hex);high[0]|=128;assert.throws(()=>parseStdinKey(high));
});
test('signed synthetic triplet is exclusively retained, restored/read back and acknowledged with fresh request nonce',()=>fixture(async({root,key,options,calls})=>{
 let aclChecks=0;options.aclChecker=()=>{aclChecks++;return true;};const result=await runRecurringBackup(options);
 assert.equal(result.status,'VERIFIED');assert.equal(result.acknowledged,true);assert.equal(result.businessDataReady,false);assert.equal(result.recurringIndependentRetentionVerified,false);assert(aclChecks>=3);
 const runs=await readdir(join(root,'recurring-backups'));assert.equal(runs.length,1);assert.match(runs[0],/^run-[a-f0-9]{32}$/);const files=await readdir(join(root,'recurring-backups',runs[0]));
 for(const name of ['restored-pipeline','restored-intake','restored-preparation','local-recovery-receipt.json','server-acknowledgement.json'])assert(files.includes(name));
 assert.equal(calls.length,2);assert.doesNotMatch(JSON.stringify({result,calls}),new RegExp(key.toString('hex')));
}));
test('tampered signed content, wrong nonce, stale/future evidence and bounded response failures never ACK',()=>fixture(async({options,calls,signed,archives})=>{
 const valid=options.transport;
 const cases=[
  req=>{const response=signed({version:1,nonce:req.headers['x-quest-nonce'],generatedAt:time,archives});const parsed=JSON.parse(response.body);parsed.payload.archives[0].sha256='0'.repeat(64);return{status:200,body:Buffer.from(JSON.stringify(parsed))};},
  ()=>signed({version:1,nonce:'f'.repeat(32),generatedAt:time,archives}),
  req=>signed({version:1,nonce:req.headers['x-quest-nonce'],generatedAt:'2026-10-24T02:00:01.000Z',archives}),
  req=>signed({version:1,nonce:req.headers['x-quest-nonce'],generatedAt:'2026-10-24T01:57:59.000Z',archives}),
  ()=>({status:302,body:Buffer.from('{}')}),()=>({status:200,body:Buffer.alloc(4_000_001)}),()=>{throw Error('timeout');}
 ];
 for(const produce of cases){options.transport=async request=>{assert.equal(request.method,'GET');return produce(request);};await assert.rejects(runRecurringBackup(options));}
 options.transport=valid;assert.equal(calls.length,0);
}));
test('valid signatures cannot bypass missing kinds, revision/checksum errors or exact synthetic content authentication',()=>fixture(async({options,signed,archives})=>{
 for(const patch of [a=>a.pop(),a=>a[2].kind='intake',a=>a[0].revision='0'.repeat(64),a=>a[0].sha256='0'.repeat(64),a=>{const parsed=JSON.parse(a[0].archive);parsed.sequence=2;a[0].archive=JSON.stringify(parsed);a[0].sha256=sha(a[0].archive);}]){
  const changed=structuredClone(archives);patch(changed);options.transport=async request=>{assert.equal(request.method,'GET');return signed({version:1,nonce:request.headers['x-quest-nonce'],generatedAt:time,archives:changed});};
  await assert.rejects(runRecurringBackup(options));
 }
}));
test('post-restore ACL failure preserves retained files and never sends ACK',()=>fixture(async({root,options,calls})=>{
 let checked=0;options.aclChecker=()=>++checked===1;await assert.rejects(runRecurringBackup(options));assert.equal(calls.length,1);
 const runs=await readdir(join(root,'recurring-backups'));assert.equal(runs.length,1);assert((await readdir(join(root,'recurring-backups',runs[0]))).includes('restored-preparation'));
}));
test('a response signed for the request key still requires authenticated decryption of all three archives',()=>fixture(async({options,archives})=>{
 const wrong=randomBytes(32);try{
  options.key=wrong;let gets=0;
  options.transport=async request=>{assert.equal(request.method,'GET');gets++;const payload={version:1,nonce:request.headers['x-quest-nonce'],generatedAt:time,archives};return {status:200,body:Buffer.from(JSON.stringify({payload,signature:signPayload(wrong,payload)}))};};
  await assert.rejects(runRecurringBackup(options));assert.equal(gets,1);
 }finally{wrong.fill(0);}
}));
test('a damaged signed ACK is rejected after local recovery without asserting successful retention',()=>fixture(async({options,calls})=>{
 const valid=options.transport;options.transport=async request=>{const response=await valid(request);if(request.method==='POST'){const value=JSON.parse(response.body);value.payload.successfulCycles=999;response.body=Buffer.from(JSON.stringify(value));}return response;};
 await assert.rejects(runRecurringBackup(options));assert.equal(calls.filter(c=>c.method==='POST').length,1);
}));
test('ACK failure retains recovered state; a reused run identity never overwrites it',()=>fixture(async({root,options,calls})=>{
 const valid=options.transport;options.transport=async request=>request.method==='POST'?{status:503,body:Buffer.from('{}')}:valid(request);
 await assert.rejects(runRecurringBackup(options));const original=await readdir(join(root,'recurring-backups'));assert.equal(original.length,1);
 options.nonceFactory=()=> '1'.padStart(32,'0');options.transport=valid;await assert.rejects(runRecurringBackup(options));assert.deepEqual(await readdir(join(root,'recurring-backups')),original);
 assert.equal(calls.filter(c=>c.method==='POST').length,0);
}));
test('unsafe root, active lock and retention capacity hold before network traffic',()=>fixture(async({root,options,calls})=>{
 options.aclChecker=()=>false;await assert.rejects(runRecurringBackup(options));assert.equal(calls.length,0);options.aclChecker=()=>true;
 const retained=join(root,'recurring-backups');await mkdir(retained,{mode:0o700});await writeFile(join(retained,'.client.lock'),'existing',{mode:0o600});await assert.rejects(runRecurringBackup(options));assert.equal(calls.length,0);await rm(join(retained,'.client.lock'));
 for(let i=0;i<1000;i++)await mkdir(join(retained,'run-'+i.toString(16).padStart(32,'0')),{mode:0o700});
 await assert.rejects(runRecurringBackup(options));assert.equal(calls.length,0);assert.equal((await readdir(retained)).length,1000);
 if(process.platform!=='win32'){const alias=root+'-alias';await symlink(root,alias);await assert.rejects(runRecurringBackup({...options,root:alias}));await rm(alias);}
}));
