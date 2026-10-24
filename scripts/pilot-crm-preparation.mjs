import { mkdir, mkdtemp, rm, lstat, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { crmHandoffIdempotencyKey,crmHandoffMetadataFingerprint } from '../src/lib/command/crmReconciliationPlan.ts';
import { readCRMPreparationJournal,retainCRMPreparation } from '../src/lib/command/crmPreparationJournal.ts';
import { exportCRMPreparationBackup,restoreCRMPreparationBackup } from '../src/lib/command/enterprisePipelineBackup.ts';
import { verifyPilotEnvironment } from './start-agent-pilot.mjs';
const event=Object.freeze({division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),sourceRevision:1,canonicalRecordId:'b'.repeat(64),payloadFingerprint:'c'.repeat(64),observedAt:'2026-10-23T23:00:00.000Z',provenanceState:'UNKNOWN',evidenceRef:null,qualificationState:'UNKNOWN',processingConsent:'UNKNOWN'});
const expected={division:event.division,sourceId:event.sourceId,sourceRecordId:event.sourceRecordId,sourceRevision:1,idempotencyKey:crmHandoffIdempotencyKey(event),metadataFingerprint:crmHandoffMetadataFingerprint(event)};
/** Explicit fixed-fixture operation; caller supplies only the approved private root and key. Never accepts business input. */
export async function verifySyntheticCRMPreparation(root,key,initialize=false){
 if(await realpath(root)!==resolve(root) || (await lstat(root)).mode & 0o077)throw Error('Private canonical pilot root required.');
 const primary=join(root,'synthetic-crm-preparation'),retained=join(root,'retained-crm-preparation');
 let snapshot=await readCRMPreparationJournal(primary,key);
 if(snapshot.revision==='EMPTY'){
  if(!initialize)throw Error('Synthetic preparation requires explicit initialization or recovery.');
  try{await lstat(retained);throw Error('Retained history exists; recover primary instead of reseeding.');}catch(e){if(e?.code!=='ENOENT')throw e;}
  snapshot=await retainCRMPreparation(primary,key,'EMPTY',[event]);
 }
 if(snapshot.sequence!==1 || snapshot.entries.length!==1 || JSON.stringify(snapshot.entries[0])!==JSON.stringify(expected))throw Error('Fixed synthetic preparation identity mismatch.');
 await mkdir(retained,{mode:0o700}).catch(e=>{if(e?.code!=='EEXIST')throw e;});
 const retainedStat=await lstat(retained);if(!retainedStat.isDirectory() || retainedStat.isSymbolicLink() || retainedStat.mode & 0o077 || await realpath(retained)!==resolve(retained))throw Error('Unsafe retained preparation directory.');
 const name='preparation-'+snapshot.revision+'.backup.json',archive=join(retained,name);
 try{await lstat(archive);}catch(e){if(e?.code!=='ENOENT')throw e;await exportCRMPreparationBackup(primary,archive,key);}
 const temporary=await mkdtemp(join(retained,'.verify-'));
 try{
  await restoreCRMPreparationBackup(archive,temporary,key);
  const recovered=await readCRMPreparationJournal(temporary,key);
  if(recovered.revision!==snapshot.revision || JSON.stringify(recovered.entries)!==JSON.stringify(snapshot.entries))throw Error('Synthetic recovery mismatch.');
 }finally{await rm(temporary,{recursive:true,force:true});}
 return Object.freeze({event:'CRM_PREPARATION_SYNTHETIC_VERIFIED',scope:'SYNTHETIC_FIXTURE_ONLY',journalRevision:snapshot.revision,retainedPreparationCount:1,localBackupVerified:true,archiveFilename:name,independentRetentionVerified:false,businessDataExecutionAllowed:false,writesCRM:false,advancesCRMCheckpoint:false,modelApiRequestsAllowed:false});
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
 let key;
 try{
  const action=process.argv[2];if(process.argv.length!==3 || !['initialize','verify'].includes(action))throw Error();
  await verifyPilotEnvironment();key=Buffer.from(process.env.QUEST_PIPELINE_KEY_HEX,'hex');
  console.log(JSON.stringify(await verifySyntheticCRMPreparation(process.env.QUEST_PIPELINE_DIRECTORY,key,action==='initialize')));
 }catch{console.error('Synthetic CRM preparation held; verify isolated identity, private storage and authenticated recovery.');process.exitCode=1;}
 finally{key?.fill(0);}
}
