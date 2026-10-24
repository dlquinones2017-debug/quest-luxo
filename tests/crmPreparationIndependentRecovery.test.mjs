import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import{tmpdir}from'node:os';import{join}from'node:path';import{randomBytes}from'node:crypto';import{spawnSync}from'node:child_process';
import{verifySyntheticCRMPreparation}from'../scripts/pilot-crm-preparation.mjs';
import{authenticatePreparationArchive,recoverSyntheticPreparation}from'../scripts/crm-preparation-independent-recovery.mjs';
async function fixture(fn){const root=await mkdtemp(join(tmpdir(),'independent-crm-')),key=randomBytes(32);try{const r=await verifySyntheticCRMPreparation(root,key,true);await fn(root,key,join(root,'retained-crm-preparation',r.archiveFilename),r);}finally{key.fill(0);await rm(root,{recursive:true,force:true});}}
test('independent verifier authenticates exact fixture, restores once and rejects overwrite in a fresh process',()=>fixture(async(root,key,archive,r)=>{
 const args=['scripts/crm-preparation-independent-recovery.mjs','restore',archive,join(root,'recovered')];
 const child=spawnSync(process.execPath,args,{input:key.toString('hex')+'\n',encoding:'utf8'});assert.equal(child.status,0,child.stderr);const proof=JSON.parse(child.stdout);assert.equal(proof.revision,r.journalRevision);assert.equal(proof.wrongKeyRejected,true);assert.equal(proof.tamperRejected,true);assert.equal(proof.recurringIndependentRetentionVerified,false);
 assert.throws(()=>recoverSyntheticPreparation(archive,join(root,'recovered'),key,'restore'));
 assert.equal(recoverSyntheticPreparation(archive,join(root,'recovered'),key,'verify').status,'VERIFIED');
}));
test('independent verifier rejects wrong keys, altered metadata and an archive from another profile',()=>fixture(async(root,key,archive)=>{
 const bytes=await readFile(archive),wrong=randomBytes(32);try{assert.throws(()=>authenticatePreparationArchive(bytes,wrong));}finally{wrong.fill(0);}
 const b=JSON.parse(bytes);for(const patch of [{sequence:2},{retainedPreparationCount:2},{kind:'QUEST_PIPELINE_ENCRYPTED_BACKUP'},{extra:'untrusted'}])assert.throws(()=>authenticatePreparationArchive(Buffer.from(JSON.stringify({...b,...patch})),key));
}));
