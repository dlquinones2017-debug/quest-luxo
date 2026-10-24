import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash,createCipheriv,randomBytes} from 'node:crypto';
import {mkdtemp,writeFile,readFile,rm,stat,chmod,symlink,link,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {authenticateOutboxArchive,recoverSyntheticOutbox} from '../scripts/crm-outbox-independent-recovery.mjs';

const FILE='crm-delivery-outbox-v1.enc.json',MARKER='crm-delivery-outbox-v1.initialized';
const marker=Buffer.from('QUEST_LUXO_CRM_DELIVERY_OUTBOX_V1_INITIALIZED\n');
const hash=b=>createHash('sha256').update(b).digest('hex');
function stored(){
 const observations=[1,2].map(sourceRevision=>({division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),canonicalRecordId:'b'.repeat(64),payloadFingerprint:(sourceRevision===1?'c':'d').repeat(64),observedAt:sourceRevision===1?'2026-10-23T23:00:00.000Z':'2026-10-23T23:01:00.000Z',sourceRevision,idempotencyKey:hash(JSON.stringify(['quest-luxo-crm-handoff-v1','LUXURY_ADVISORY','synthetic-luxury','a'.repeat(64),sourceRevision]))}));
 return {version:1,scope:'INTERNAL_DELIVERY_METADATA_ONLY',sequence:4,observations,deliveries:[
  {idempotencyKey:observations[0].idempotencyKey,state:'ACKNOWLEDGED',attempt:{tokenHash:randomBytes(32).toString('hex'),claimedAt:'2026-10-23T23:00:10.000Z',expiresAt:'2026-10-23T23:02:10.000Z'},receipt:{crmCaseId:'e'.repeat(64),providerRevision:'f'.repeat(64),responseFingerprint:'1'.repeat(64),acknowledgedAt:'2026-10-23T23:00:11.000Z'}},
  {idempotencyKey:observations[1].idempotencyKey,state:'PENDING',attempt:null,receipt:null}
 ]};
}
function archive(key,state=stored(),aad='QUEST_LUXO_CRM_INTERNAL_DELIVERY_OUTBOX_V1'){
 const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv);c.setAAD(Buffer.from(aad));const plain=Buffer.from(JSON.stringify(state));let encrypted;
 try{const cipher=Buffer.concat([c.update(plain),c.final()]);encrypted=Buffer.from(JSON.stringify({version:1,iv:iv.toString('hex'),tag:c.getAuthTag().toString('hex'),ciphertext:cipher.toString('base64')}));}finally{plain.fill(0);}
 return Buffer.from(JSON.stringify({version:1,kind:'QUEST_CRM_DELIVERY_OUTBOX_ENCRYPTED_BACKUP',revision:hash(encrypted),createdAt:'2026-10-24T12:00:00.000Z',encrypted:encrypted.toString('base64'),marker:marker.toString('base64'),sequence:4,observationCount:2,pendingCount:1,activeCount:0,uncertainCount:0,acknowledgedCount:1}));
}
async function fixture(run){const root=await mkdtemp(join(tmpdir(),'outbox-independent-')),key=randomBytes(32),bytes=archive(key),path=join(root,'archive.json');try{await writeFile(path,bytes,{mode:0o600});await run({root,key,bytes,path,target:join(root,'new recovery')});}finally{key.fill(0);await rm(root,{recursive:true,force:true});}}
const cli=(args,input)=>spawnSync(process.execPath,['scripts/crm-outbox-independent-recovery.mjs',...args],{input,encoding:'utf8'});
test('standalone authenticator checks both exact synthetic records without attesting CRM execution',()=>fixture(async({key,bytes})=>{
 const before=Buffer.from(key),proof=authenticateOutboxArchive(bytes,key);assert.equal(proof.revision,JSON.parse(bytes).revision);assert.equal(proof.archiveSha256,hash(bytes));assert.deepEqual(proof.marker,marker);assert.deepEqual(key,before);before.fill(0);
 assert(authenticateOutboxArchive(archive(key),key));
}));
test('fresh process restores and verifies the exact ciphertext and initialization marker pair',()=>fixture(async({root,key,path,target,bytes})=>{
 const restored=cli(['restore',path,target],key.toString('hex')+'\n');assert.equal(restored.status,0,restored.stderr);const proof=JSON.parse(restored.stdout);
 assert.equal(proof.status,'VERIFIED');for(const flag of ['businessDataExecutionAllowed','writesCRM','providerAcknowledgementIndependentlyVerified','recurringIndependentRetentionVerified'])assert.equal(proof[flag],false);
 for(const flag of ['exactFixtureVerified','wrongKeyRejected','tamperRejected','markerVerified'])assert.equal(proof[flag],true);
 assert.deepEqual(await readFile(join(target,FILE)),Buffer.from(JSON.parse(bytes).encrypted,'base64'));assert.deepEqual(await readFile(join(target,MARKER)),marker);
 assert.equal(cli(['verify',path,target],key.toString('hex')).status,0);
 if(process.platform!=='win32')for(const name of [FILE,MARKER])assert.equal((await stat(join(target,name))).mode&0o777,0o600);
 assert.equal((await stat(root)).isDirectory(),true);
}));
test('wrong keys, changed ciphertext and incorrect GCM scope are rejected',()=>fixture(async({key,bytes})=>{
 const wrong=randomBytes(32);try{assert.throws(()=>authenticateOutboxArchive(bytes,wrong),/held/);}finally{wrong.fill(0);}
 const b=JSON.parse(bytes),w=JSON.parse(Buffer.from(b.encrypted,'base64'));w.tag=(w.tag[0]==='0'?'1':'0')+w.tag.slice(1);const altered=Buffer.from(JSON.stringify(w));b.encrypted=altered.toString('base64');b.revision=hash(altered);assert.throws(()=>authenticateOutboxArchive(Buffer.from(JSON.stringify(b)),key),/held/);
 assert.throws(()=>authenticateOutboxArchive(archive(key,stored(),'QUEST_LUXO_CRM_INTERNAL_PREPARATION_V1'),key),/held/);
}));
test('manifest count, marker, encoding and unknown fields fail authentication',()=>fixture(async({key,bytes})=>{
 for(const patch of [{sequence:5},{observationCount:3},{pendingCount:0},{activeCount:1},{uncertainCount:1},{acknowledgedCount:2},{kind:'QUEST_CRM_PREPARATION_ENCRYPTED_BACKUP'},{marker:Buffer.from('wrong').toString('base64')},{marker:marker.toString('base64')+'\n'},{extra:'private-marker'},{createdAt:'yesterday'},{encrypted:JSON.parse(bytes).encrypted+'\n'}])assert.throws(()=>authenticateOutboxArchive(Buffer.from(JSON.stringify({...JSON.parse(bytes),...patch})),key),/held/);
 assert.throws(()=>authenticateOutboxArchive(Buffer.alloc(20_001),key),/held/);
}));
test('authenticated nonfixture business content, changed receipt and invalid token metadata are rejected generically',()=>fixture(async({key})=>{
 for(const mutate of [s=>s.observations[0].sourceId='private-customer-marker',s=>s.observations[1].payloadFingerprint='c'.repeat(64),s=>s.deliveries[0].receipt.crmCaseId='2'.repeat(64),s=>s.deliveries[0].attempt.tokenHash='invalid',s=>s.deliveries[1].state='ACKNOWLEDGED',s=>s.sequence=5,s=>s.observations.reverse()]){
  const state=stored();mutate(state);assert.throws(()=>authenticateOutboxArchive(archive(key,state),key),e=>e.message==='Independent synthetic outbox recovery held.');
 }
}));
test('restore never overwrites existing recovery state and verify detects either missing or changed pair member',()=>fixture(async({key,path,target})=>{
 recoverSyntheticOutbox(path,target,key,'restore');const original=await readFile(join(target,FILE));assert.throws(()=>recoverSyntheticOutbox(path,target,key,'restore'),/held/);assert.deepEqual(await readFile(join(target,FILE)),original);
 await writeFile(join(target,MARKER),'altered');assert.throws(()=>recoverSyntheticOutbox(path,target,key,'verify'),/held/);await writeFile(join(target,MARKER),marker);await rm(join(target,FILE));assert.throws(()=>recoverSyntheticOutbox(path,target,key,'verify'),/held/);
}));
test('unsafe permissions, hardlinks and symlink ancestry are held without altering existing targets',()=>fixture(async({root,key,path,target})=>{
 if(process.platform==='win32')return;
 await chmod(path,0o644);assert.throws(()=>recoverSyntheticOutbox(path,target,key,'restore'),/held/);await assert.rejects(()=>stat(target),{code:'ENOENT'});await chmod(path,0o600);
 const alias=join(root,'alias');await symlink(root,alias);assert.throws(()=>recoverSyntheticOutbox(path,join(alias,'not-created'),key,'restore'),/held/);await assert.rejects(()=>stat(join(root,'not-created')),{code:'ENOENT'});
 await link(path,join(root,'archive-hardlink'));assert.throws(()=>recoverSyntheticOutbox(path,target,key,'restore'),/held/);await rm(join(root,'archive-hardlink'));
 recoverSyntheticOutbox(path,target,key,'restore');await rm(join(target,MARKER));await symlink(path,join(target,MARKER));assert.throws(()=>recoverSyntheticOutbox(path,target,key,'verify'),/held/);
}));
test('CLI accepts only raw bounded ASCII hexadecimal key through stdin and emits generic errors',()=>fixture(async({key,path,target})=>{
 for(const input of [Buffer.alloc(0),Buffer.from('private-key-marker'),Buffer.from(key.toString('hex')+'\r\n'),Buffer.from('a'.repeat(66)),Buffer.alloc(64,0xe1)]){
  const r=cli(['restore',path,target],input);assert.equal(r.status,1);assert.equal(r.stdout,'');assert.equal(r.stderr,'Independent synthetic outbox recovery held.\n');assert(!r.stderr.includes(path));
 }
 const extra=cli(['restore',path,target,key.toString('hex')],key.toString('hex'));assert.equal(extra.status,1);
 await mkdir(target,{mode:0o700});const r=cli(['restore',path,target],key.toString('hex'));assert.equal(r.status,1);assert.equal(r.stdout,'');
}));
