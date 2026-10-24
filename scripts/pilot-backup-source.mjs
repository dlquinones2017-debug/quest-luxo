import { open, constants, lstat, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { readDurablePipelines } from '../src/lib/command/enterpriseDurablePipelines.ts';
import { readEncryptedIntakeJournal } from '../src/lib/command/enterpriseIntakeJournal.ts';
import { readCRMPreparationJournal } from '../src/lib/command/crmPreparationJournal.ts';
import { authenticateSyntheticRecovery } from './pilot-independent-recovery.mjs';
import { readCRMDeliveryOutbox } from '../src/lib/command/crmDeliveryOutbox.ts';
import { authenticateOutboxArchive } from './crm-outbox-independent-recovery.mjs';
import { authenticatePreparationArchive } from './crm-preparation-independent-recovery.mjs';

async function privateRead(directory, filename) {
  const ds=await lstat(directory);
  if(!ds.isDirectory() || ds.isSymbolicLink() || ds.mode & 0o077 || await realpath(directory)!==resolve(directory)) throw Error('Private real source required.');
  const handle=await open(join(directory,filename),constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const s=await handle.stat();
    if(!s.isFile() || s.nlink!==1 || s.mode & 0o077 || s.size<1 || s.size>20000) throw Error('Private bounded archive required.');
    const bytes=Buffer.alloc(s.size+1),r=await handle.read(bytes);
    if(r.bytesRead!==s.size) throw Error('Archive changed.');
    return bytes.subarray(0,s.size);
  } finally { await handle.close(); }
}
/** Export only authenticated fixed synthetic fixtures that match their current primaries. */
export async function readSyntheticBackupBundle(root,key,{includeOutbox=false}={}) {
  if(typeof includeOutbox!=='boolean') throw Error('Explicit backup profile required.');
  const pipeline=await readDurablePipelines(join(root,'synthetic'),key);
  const intake=await readEncryptedIntakeJournal(join(root,'synthetic-intake'),key);
  const preparation=await readCRMPreparationJournal(join(root,'synthetic-crm-preparation'),key);
  const specs=[['pipeline',pipeline.revision,'retained','snapshot-'],['intake',intake.revision,'retained-intake','intake-'],['preparation',preparation.revision,'retained-crm-preparation','preparation-']];
  if(includeOutbox){const outbox=await readCRMDeliveryOutbox(join(root,'synthetic-crm-outbox'),key);specs.push(['outbox',outbox.revision,'retained-crm-outbox','outbox-']);}
  const archives=[];
  for(const [kind,revision,folder,prefix] of specs){
    if(!/^[a-f0-9]{64}$/.test(revision)) throw Error('Current retained primary required.');
    const bytes=await privateRead(join(root,folder),prefix+revision+'.backup.json');
    const proof=kind==='outbox'?authenticateOutboxArchive(bytes,key):kind==='preparation'?authenticatePreparationArchive(bytes,key):authenticateSyntheticRecovery(bytes,key,kind);
    if(proof.revision!==revision) throw Error('Current primary mismatch.');
    archives.push({kind,revision,sha256:createHash('sha256').update(bytes).digest('hex'),archive:bytes.toString('utf8')});
  }
  return archives;
}
