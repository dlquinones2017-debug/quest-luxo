import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir, symlink, chmod, stat, copyFile, rename, link } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { retainCRMPreparation, readCRMPreparationJournal } from '../src/lib/command/crmPreparationJournal.ts';
const file='crm-preparation-v1.enc.json';
const e=(patch={})=>({division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),sourceRevision:1,canonicalRecordId:'b'.repeat(64),payloadFingerprint:'c'.repeat(64),observedAt:'2026-10-23T23:00:00.000Z',provenanceState:'UNKNOWN',evidenceRef:null,qualificationState:'UNKNOWN',processingConsent:'UNKNOWN',...patch});
async function fixture(fn){const dir=await mkdtemp(join(tmpdir(),'crm-journal-')),key=randomBytes(32);try{await fn(dir,key);}finally{key.fill(0);await rm(dir,{recursive:true,force:true});}}
test('encrypted append retains only preparation fingerprints and cannot acknowledge CRM actions',()=>fixture(async(dir,key)=>{
 assert.equal((await readCRMPreparationJournal(dir,key)).revision,'EMPTY');
 const r=await retainCRMPreparation(dir,key,'EMPTY',[e()]);assert.equal(r.sequence,1);assert.equal(r.entries.length,1);
 for(const k of ['writesCRM','advancesCRMCheckpoint','businessDataExecutionAllowed','independentRecoveryVerified'])assert.equal(r[k],false);
 const bytes=await readFile(join(dir,file),'utf8');assert(!bytes.includes('synthetic-luxury'));assert(!bytes.includes('UNKNOWN'));assert(!bytes.includes('a'.repeat(64)));
 assert.deepEqual(await readCRMPreparationJournal(dir,key),r);assert.throws(()=>r.entries.push({}));
 if(process.platform!=='win32')assert.equal((await stat(join(dir,file))).mode&0o777,0o600);
}));
test('exact replay is no-op and changed content or stale compare-and-swap cannot overwrite history',()=>fixture(async(dir,key)=>{
 const a=await retainCRMPreparation(dir,key,'EMPTY',[e(),e()]);const bytes=await readFile(join(dir,file));
 const b=await retainCRMPreparation(dir,key,a.revision,[e()]);assert.equal(b.revision,a.revision);assert.equal(b.sequence,1);
 await assert.rejects(()=>retainCRMPreparation(dir,key,a.revision,[e({payloadFingerprint:'d'.repeat(64)})]));
 await assert.rejects(()=>retainCRMPreparation(dir,key,'EMPTY',[e({sourceRevision:2})]));
 assert.deepEqual(await readFile(join(dir,file)),bytes);
 const c=await retainCRMPreparation(dir,key,a.revision,[e({sourceRevision:2})]);assert.equal(c.entries.length,2);
 assert.equal((await retainCRMPreparation(dir,key,c.revision,[e()])).revision,c.revision);
}));
test('revision gaps, cross-division source collisions and invalid or raw fields fail before retention',()=>fixture(async(dir,key)=>{
 await assert.rejects(()=>retainCRMPreparation(dir,key,'EMPTY',[e({sourceRevision:2})]));
 const a=await retainCRMPreparation(dir,key,'EMPTY',[e()]);
 for(const patch of [{division:'REALTY'},{email:'private@example.test'},{sourceRecordId:'customer-123'},{sourceRevision:0}])await assert.rejects(()=>retainCRMPreparation(dir,key,a.revision,[e(patch)]));
 await assert.rejects(()=>retainCRMPreparation(dir,key,a.revision,Array(101).fill(e())));
 assert.equal((await readCRMPreparationJournal(dir,key)).revision,a.revision);
}));
test('concurrent writers preserve one winner and hold the stale writer',()=>fixture(async(dir,key)=>{
 const result=await Promise.allSettled([retainCRMPreparation(dir,key,'EMPTY',[e()]),retainCRMPreparation(dir,key,'EMPTY',[e({sourceRecordId:'d'.repeat(64)})])]);
 assert.equal(result.filter(x=>x.status==='fulfilled').length,1);assert.equal(result.filter(x=>x.status==='rejected').length,1);
 assert.equal((await readCRMPreparationJournal(dir,key)).entries.length,1);
}));
test('wrong keys and ciphertext tampering hold without rewriting the original',()=>fixture(async(dir,key)=>{
 await retainCRMPreparation(dir,key,'EMPTY',[e()]);const path=join(dir,file),bytes=await readFile(path);
 const bad=randomBytes(32);try{await assert.rejects(()=>readCRMPreparationJournal(dir,bad),/held/);}finally{bad.fill(0);}
 const wrapped=JSON.parse(bytes);wrapped.tag=(wrapped.tag[0]==='a'?'b':'a')+wrapped.tag.slice(1);await writeFile(path,JSON.stringify(wrapped),{mode:0o600});
 await assert.rejects(()=>readCRMPreparationJournal(dir,key),/held/);await assert.rejects(()=>retainCRMPreparation(dir,key,'EMPTY',[e()]),/held/);
}));
test('independent directory and fresh process restore ciphertext exactly without passing key in argv or environment',()=>fixture(async(dir,key)=>{
 const a=await retainCRMPreparation(dir,key,'EMPTY',[e()]);const recovery=join(dir,'independent-copy');await mkdir(recovery,{mode:0o700});await copyFile(join(dir,file),join(recovery,file));await chmod(join(recovery,file),0o600);
 const script=`import{readFileSync}from'node:fs';import{readCRMPreparationJournal}from${JSON.stringify(new URL('../src/lib/command/crmPreparationJournal.ts',import.meta.url).href)};const k=Buffer.from(readFileSync(0,'utf8').trim(),'hex');try{const s=await readCRMPreparationJournal(process.argv[1],k);console.log(JSON.stringify({revision:s.revision,entries:s.entries.length,writesCRM:s.writesCRM}));}finally{k.fill(0);}`;
 const child=spawnSync(process.execPath,['--input-type=module','-e',script,recovery],{input:key.toString('hex'),encoding:'utf8'});
 assert.equal(child.status,0,child.stderr);assert.deepEqual(JSON.parse(child.stdout),{revision:a.revision,entries:1,writesCRM:false});
}));
test('symlink ancestry, symlink files, public permissions and missing files with expected history stay held',()=>fixture(async(dir,key)=>{
 const a=await retainCRMPreparation(dir,key,'EMPTY',[e()]);
 if(process.platform!=='win32'){
  const alias=join(dir,'alias');await symlink(dir,alias);await assert.rejects(()=>readCRMPreparationJournal(alias,key));
  const actual=join(dir,'retained-original');await rename(join(dir,file),actual);await symlink(actual,join(dir,file));await assert.rejects(()=>readCRMPreparationJournal(dir,key));await rm(join(dir,file));await link(actual,join(dir,file));await assert.rejects(()=>readCRMPreparationJournal(dir,key));await rm(join(dir,file));await rename(actual,join(dir,file));
  await chmod(join(dir,file),0o644);await assert.rejects(()=>readCRMPreparationJournal(dir,key));await chmod(join(dir,file),0o600);
 }
 await rm(join(dir,file));await assert.rejects(()=>retainCRMPreparation(dir,key,a.revision,[e({sourceRevision:2})]));
}));

test('unsafe missing-path ancestry is rejected before creating any directory',()=>fixture(async(dir,key)=>{
 if(process.platform==='win32')return;
 const target=join(dir,'target');await mkdir(target,{mode:0o700});const alias=join(dir,'unsafe-parent');await symlink(target,alias);
 await assert.rejects(()=>retainCRMPreparation(join(alias,'must-not-be-created'),key,'EMPTY',[e()]));
 await assert.rejects(()=>stat(join(target,'must-not-be-created')),{code:'ENOENT'});
 const safe=await retainCRMPreparation(join(target,'safe-leaf'),key,'EMPTY',[e()]);assert.equal(safe.entries.length,1);
}));
