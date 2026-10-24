import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, chmod, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomBytes, createHash } from 'node:crypto';
import { commitDurablePipelines } from '../src/lib/command/enterpriseDurablePipelines.ts';
import { commitTrustedIntakeBatch } from '../src/lib/command/enterpriseIntakeJournal.ts';
import { exportPipelineBackup, exportIntakeJournalBackup } from '../src/lib/command/enterprisePipelineBackup.ts';
import { syntheticRecords } from '../scripts/factory-agent-runtime.mjs';
import { syntheticIntakeBatch, SYNTHETIC_INTAKE_TIME } from '../scripts/synthetic-intake-fixture.mjs';
import { recoverSyntheticArchives, authenticateSyntheticRecovery } from '../scripts/pilot-independent-recovery.mjs';

test('independent recovery authenticates both actual archive formats and replay checkpoints without a primary store', async () => {
  const root=await mkdtemp(join(tmpdir(),'independent-recovery-')); await chmod(root,0o700);
  const key=randomBytes(32), now=new Date('2026-10-21T13:00:00Z');
  try {
    const manifest=[];
    for(const kind of ['pipeline','intake']) {
      const primary=join(root,'source-'+kind);
      if(kind==='pipeline') await commitDurablePipelines(primary,key,'EMPTY',syntheticRecords());
      else await commitTrustedIntakeBatch({directory:primary,key,expectedRevision:'EMPTY',batch:syntheticIntakeBatch(),observedAt:SYNTHETIC_INTAKE_TIME},now);
      const retained=join(root,'retained-'+kind);await mkdir(retained,{mode:0o700});
      const provisional=join(retained,kind+'.json');
      const result=await (kind==='pipeline'?exportPipelineBackup:exportIntakeJournalBackup)(primary,provisional,key);
      const bytes=await readFile(provisional), filename=(kind==='pipeline'?'snapshot-':'intake-')+result.revision+'.backup.json';
      await writeFile(join(root,filename),bytes,{mode:0o600});
      manifest.push({kind,filename,sha256:createHash('sha256').update(bytes).digest('hex')});
      await rm(primary,{recursive:true});
      const wrong=Buffer.from(key);wrong[0]^=1;
      assert.throws(()=>authenticateSyntheticRecovery(bytes,wrong,kind));wrong.fill(0);
      assert.throws(()=>authenticateSyntheticRecovery(bytes,key,kind==='intake'?'pipeline':'intake'));
      const altered=JSON.parse(bytes);altered.revision='0'.repeat(64);
      assert.throws(()=>authenticateSyntheticRecovery(Buffer.from(JSON.stringify(altered)),key,kind));
    }
    await writeFile(join(root,'transfer-manifest.json'),JSON.stringify(manifest),{mode:0o600});
    const restored=recoverSyntheticArchives(root,key,'restore');
    assert.equal(restored.restoredStores.length,2);assert.equal(restored.businessDataReady,false);
    assert.equal(recoverSyntheticArchives(root,key,'verify').status,'VERIFIED');
    assert.throws(()=>recoverSyntheticArchives(root,key,'restore'),/EEXIST/);
    await writeFile(join(root,'restored-intake','formsubmit-intake-journal.enc.json'),'damaged');
    assert.throws(()=>recoverSyntheticArchives(root,key,'verify'));
  } finally {key.fill(0);await rm(root,{recursive:true,force:true});}
});
