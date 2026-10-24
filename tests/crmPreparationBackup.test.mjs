import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,readFile,writeFile,rm,chmod,symlink,stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { retainCRMPreparation,readCRMPreparationJournal } from '../src/lib/command/crmPreparationJournal.ts';
import { exportCRMPreparationBackup,restoreCRMPreparationBackup } from '../src/lib/command/enterprisePipelineBackup.ts';
const event={division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),sourceRevision:1,canonicalRecordId:'b'.repeat(64),payloadFingerprint:'c'.repeat(64),observedAt:'2026-10-23T23:00:00.000Z',provenanceState:'UNKNOWN',evidenceRef:null,qualificationState:'UNKNOWN',processingConsent:'UNKNOWN'};
async function fixture(fn){const root=await mkdtemp(join(tmpdir(),'crm-backup-')),key=randomBytes(32),primary=join(root,'primary'),retained=join(root,'retained'),target=join(root,'recovered');try{await mkdir(retained,{mode:0o700});await mkdir(target,{mode:0o700});const saved=await retainCRMPreparation(primary,key,'EMPTY',[event]);await fn({root,key,primary,retained,target,backup:join(retained,'backup.json'),saved});}finally{key.fill(0);await rm(root,{recursive:true,force:true});}}
const cli=(args,key)=>spawnSync(process.execPath,['scripts/crm-preparation-backup.mjs',...args],{input:key.toString('hex')+'\n',encoding:'utf8'});
test('archive retains ciphertext and restores exact preparation state after primary loss in a fresh process',()=>fixture(async({key,primary,target,backup,saved})=>{
 const exported=await exportCRMPreparationBackup(primary,backup,key);assert.equal(exported.independentRetentionVerified,false);
 const archive=await readFile(backup,'utf8');assert(!archive.includes('synthetic-luxury'));assert(!archive.includes(key.toString('hex')));assert.equal(JSON.parse(archive).kind,'QUEST_CRM_PREPARATION_ENCRYPTED_BACKUP');
 await rm(primary,{recursive:true});const r=cli(['restore',backup,target],key);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).authenticated,true);
 const recovered=await readCRMPreparationJournal(target,key);assert.equal(recovered.revision,saved.revision);assert.deepEqual(recovered.entries,saved.entries);
 const duplicate=await retainCRMPreparation(target,key,recovered.revision,[event]);assert.equal(duplicate.revision,recovered.revision);
 for(const k of ['writesCRM','advancesCRMCheckpoint','businessDataExecutionAllowed'])assert.equal(JSON.parse(r.stdout)[k],false);
}));
test('wrong key, mutated manifest and damaged ciphertext cannot publish restored state',()=>fixture(async({key,primary,target,backup})=>{
 await exportCRMPreparationBackup(primary,backup,key);const original=await readFile(backup),bundle=JSON.parse(original);
 const bad=randomBytes(32);try{await assert.rejects(()=>restoreCRMPreparationBackup(backup,target,bad));}finally{bad.fill(0);}
 for(const patch of [{sequence:2},{retainedPreparationCount:2},{kind:'QUEST_PIPELINE_ENCRYPTED_BACKUP'},{encrypted:Buffer.from('invalid').toString('base64')},{extra:'private@example.test'}]){
  await writeFile(backup,JSON.stringify({...bundle,...patch}));await assert.rejects(()=>restoreCRMPreparationBackup(backup,target,key));assert.equal((await readCRMPreparationJournal(target,key)).revision,'EMPTY');
 }
}));
test('archive and restore never overwrite an existing destination',()=>fixture(async({key,primary,target,backup,saved})=>{
 await exportCRMPreparationBackup(primary,backup,key);await assert.rejects(()=>exportCRMPreparationBackup(primary,backup,key),/EEXIST/);
 await restoreCRMPreparationBackup(backup,target,key);await assert.rejects(()=>restoreCRMPreparationBackup(backup,target,key),/no overwrite/);
 assert.equal((await readCRMPreparationJournal(target,key)).revision,saved.revision);
}));
test('missing source, unsafe directories and archive permissions hold without creating paths',()=>fixture(async({root,key,primary,target,backup})=>{
 const absent=join(root,'missing');await assert.rejects(()=>exportCRMPreparationBackup(absent,backup,key));await assert.rejects(()=>stat(absent),{code:'ENOENT'});
 await assert.rejects(()=>restoreCRMPreparationBackup(backup,join(root,'missing-target'),key));await assert.rejects(()=>stat(join(root,'missing-target')),{code:'ENOENT'});
 await assert.rejects(()=>exportCRMPreparationBackup(primary,join(primary,'backup.json'),key),/outside/);
 await exportCRMPreparationBackup(primary,backup,key);await chmod(backup,0o644);await assert.rejects(()=>restoreCRMPreparationBackup(backup,target,key));
 if(process.platform!=='win32'){const alias=join(root,'alias');await symlink(target,alias);await assert.rejects(()=>restoreCRMPreparationBackup(backup,alias,key));}
}));
test('operator export accepts a bounded key only through stdin and errors do not echo private inputs',()=>fixture(async({key,primary,backup})=>{
 const success=cli(['export',backup,primary],key);assert.equal(success.status,0,success.stderr);assert.equal(JSON.parse(success.stdout).scope,'INTERNAL_PREPARATION_ONLY');
 for(const input of ['','secret-marker','a'.repeat(66)]){const r=spawnSync(process.execPath,['scripts/crm-preparation-backup.mjs','restore','private-marker','private-target'],{input,encoding:'utf8'});assert.equal(r.status,1);if(input)assert(!r.stdout.includes(input));assert(!r.stderr.includes('private-marker'));assert(!r.stderr.includes('secret-marker'));}
}));
