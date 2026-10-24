import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { verifySyntheticCRMPreparation } from '../scripts/pilot-crm-preparation.mjs';
const fixture=async fn=>{const root=await mkdtemp(join(tmpdir(),'pilot-crm-')),key=randomBytes(32);try{await fn(root,key);}finally{key.fill(0);await rm(root,{recursive:true,force:true});}};
test('fixed synthetic ledger requires explicit initialization then verifies authentic retained recovery across restart',()=>fixture(async(root,key)=>{
 await assert.rejects(()=>verifySyntheticCRMPreparation(root,key));
 const a=await verifySyntheticCRMPreparation(root,key,true),b=await verifySyntheticCRMPreparation(root,key);
 assert.equal(a.journalRevision,b.journalRevision);assert.equal(b.localBackupVerified,true);assert.equal(b.retainedPreparationCount,1);
 for(const k of ['independentRetentionVerified','businessDataExecutionAllowed','writesCRM','advancesCRMCheckpoint','modelApiRequestsAllowed'])assert.equal(b[k],false);
}));
test('primary loss never silently reseeds over retained history',()=>fixture(async(root,key)=>{
 await verifySyntheticCRMPreparation(root,key,true);await rm(join(root,'synthetic-crm-preparation'),{recursive:true});
 await assert.rejects(()=>verifySyntheticCRMPreparation(root,key,true),/recover primary/);
}));
test('damaged archive or wrong key never reports a successful recovery',()=>fixture(async(root,key)=>{
 const r=await verifySyntheticCRMPreparation(root,key,true);const wrong=randomBytes(32);try{await assert.rejects(()=>verifySyntheticCRMPreparation(root,wrong));}finally{wrong.fill(0);}
 const archive=join(root,'retained-crm-preparation',r.archiveFilename);const b=JSON.parse(await readFile(archive));b.sequence+=1;await writeFile(archive,JSON.stringify(b));await assert.rejects(()=>verifySyntheticCRMPreparation(root,key));
}));
test('operator entrypoint refuses an unverified environment without touching data or exposing errors',()=>{
 const r=spawnSync(process.execPath,['scripts/pilot-crm-preparation.mjs','initialize'],{env:{PATH:process.env.PATH,RENDER_SERVICE_ID:'wrong'},encoding:'utf8'});assert.equal(r.status,1);assert.equal(r.stdout,'');assert.match(r.stderr,/held/);
});
