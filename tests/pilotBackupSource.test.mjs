import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,rm,readFile,writeFile,chmod } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { runPersistentSyntheticPilot } from '../scripts/start-agent-pilot.mjs';
import { maintainPilotStorage } from '../scripts/pilot-storage-maintenance.mjs';
import { maintainSyntheticIntake } from '../scripts/pilot-intake-maintenance.mjs';
import { verifySyntheticCRMPreparation } from '../scripts/pilot-crm-preparation.mjs';
import { readSyntheticBackupBundle } from '../scripts/pilot-backup-source.mjs';
test('export authenticates all exact fixtures, matches primaries and rejects insecure/tampered archive',async()=>{
  const root=await mkdtemp(join(tmpdir(),'pilot-export-')),key=randomBytes(32);
  try {
    await runPersistentSyntheticPilot(root,key);await maintainPilotStorage(root,key);await maintainSyntheticIntake(root,key);await verifySyntheticCRMPreparation(root,key,true);
    const bundle=await readSyntheticBackupBundle(root,key);
    assert.deepEqual(bundle.map(a=>a.kind),['pipeline','intake','preparation']);
    assert.equal(JSON.stringify(bundle).includes(key.toString('hex')),false);
    const file=join(root,'retained','snapshot-'+bundle[0].revision+'.backup.json'),original=await readFile(file);
    await chmod(file,0o644);await assert.rejects(()=>readSyntheticBackupBundle(root,key));await chmod(file,0o600);
    await writeFile(file,'{}');await assert.rejects(()=>readSyntheticBackupBundle(root,key));await writeFile(file,original);
    await rm(join(root,'synthetic-crm-preparation'),{recursive:true});await assert.rejects(()=>readSyntheticBackupBundle(root,key));
  } finally {key.fill(0);await rm(root,{recursive:true,force:true});}
});
