import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {verifySyntheticCRMOutbox} from '../scripts/pilot-crm-outbox.mjs';
const fixture=async fn=>{const root=await mkdtemp(join(tmpdir(),'pilot-outbox-')),key=randomBytes(32);try{await fn(root,key);}finally{key.fill(0);await rm(root,{recursive:true,force:true});}};
test('explicit fixed fixture initialization and subsequent recovery retain simulated acknowledgement plus pending work',()=>fixture(async(root,key)=>{
 await assert.rejects(()=>verifySyntheticCRMOutbox(root,key));const first=await verifySyntheticCRMOutbox(root,key,true),second=await verifySyntheticCRMOutbox(root,key);
 assert.equal(first.journalRevision,second.journalRevision);assert.equal(second.pendingDeliveries,1);assert.equal(second.simulatedAcknowledgements,1);assert.equal(second.localBackupVerified,true);
 for(const k of ['independentRetentionVerified','providerAcknowledgementIndependentlyVerified','businessDataExecutionAllowed','writesCRM','modelApiRequestsAllowed'])assert.equal(second[k],false);
}));
test('missing primary pair with retained history holds instead of reseeding',()=>fixture(async(root,key)=>{
 await verifySyntheticCRMOutbox(root,key,true);await rm(join(root,'synthetic-crm-outbox'),{recursive:true});await assert.rejects(()=>verifySyntheticCRMOutbox(root,key,true),/recover primary/);
}));
test('wrong keys and corrupt retained artifacts cannot produce recovery success',()=>fixture(async(root,key)=>{
 const first=await verifySyntheticCRMOutbox(root,key,true);await assert.rejects(()=>verifySyntheticCRMOutbox(root,randomBytes(32)));
 const file=join(root,'retained-crm-outbox',first.archiveFilename),archive=JSON.parse(await readFile(file));archive.pendingCount=0;await writeFile(file,JSON.stringify(archive));await assert.rejects(()=>verifySyntheticCRMOutbox(root,key));
}));
test('operator refuses unverified service identity without echoing key or raw exceptions',()=>{
 const r=spawnSync(process.execPath,['scripts/pilot-crm-outbox.mjs','initialize'],{env:{PATH:process.env.PATH,RENDER_SERVICE_ID:'other'},encoding:'utf8'});assert.equal(r.status,1);assert.equal(r.stdout,'');assert.match(r.stderr,/held/);
});
