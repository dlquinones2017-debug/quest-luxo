import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {verifySyntheticCRMOutbox} from '../scripts/pilot-crm-outbox.mjs';
test('operator CLI exports and restores a full encrypted pair through stdin without disclosing keys or claiming offsite recovery',async()=>{
 const root=await mkdtemp(join(tmpdir(),'outbox-cli-')),key=randomBytes(32);
 try{const fixture=await verifySyntheticCRMOutbox(root,key,true),archive=join(root,'copy.backup.json'),target=join(root,'recovered');
  const run=(action,file,directory,input=key.toString('hex'))=>spawnSync(process.execPath,['scripts/crm-outbox-backup.mjs',action,file,directory],{input,encoding:'utf8',env:{PATH:process.env.PATH},timeout:10000});
  const exported=run('export',archive,join(root,'synthetic-crm-outbox'));assert.equal(exported.status,0);assert.equal(exported.stdout.includes(key.toString('hex')),false);
  const restored=run('restore',archive,target);assert.equal(restored.status,0);const result=JSON.parse(restored.stdout);assert.equal(result.revision,fixture.journalRevision);assert.equal(result.pendingCount,1);assert.equal(result.acknowledgedCount,1);assert.equal(result.independentRetentionVerified,false);assert.equal(result.writesCRM,false);
  const before=await readFile(join(target,'crm-delivery-outbox-v1.enc.json'));assert.equal(run('restore',archive,target).status,1);assert.deepEqual(await readFile(join(target,'crm-delivery-outbox-v1.enc.json')),before);
  const invalid=Buffer.alloc(64,0xb1);const held=run('export',join(root,'invalid.json'),join(root,'synthetic-crm-outbox'),invalid);assert.equal(held.status,1);assert.equal(held.stdout,'');assert.equal((await readdir(root)).includes('invalid.json'),false);
 }finally{key.fill(0);await rm(root,{recursive:true,force:true});}
});
