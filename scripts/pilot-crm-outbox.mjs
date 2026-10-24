import {mkdir,mkdtemp,rm,lstat,realpath,open,constants} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {crmHandoffIdempotencyKey} from '../src/lib/command/crmReconciliationPlan.ts';
import {readCRMDeliveryOutbox,enqueueCRMDeliveryObservations,claimCRMDeliveryAttempt,confirmCRMDelivery} from '../src/lib/command/crmDeliveryOutbox.ts';
import {exportCRMDeliveryOutboxBackup,restoreCRMDeliveryOutboxBackup} from '../src/lib/command/crmDeliveryOutboxBackup.ts';
import {authenticateOutboxArchive} from './crm-outbox-independent-recovery.mjs';
import {verifyPilotEnvironment} from './start-agent-pilot.mjs';

const first=Object.freeze({division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),canonicalRecordId:'b'.repeat(64),payloadFingerprint:'c'.repeat(64),observedAt:'2026-10-23T23:00:00.000Z'});
const second=Object.freeze({...first,payloadFingerprint:'d'.repeat(64),observedAt:'2026-10-23T23:01:00.000Z'});
async function privateDirectory(path){const s=await lstat(path);if(!s.isDirectory()||s.isSymbolicLink()||s.mode&0o077||await realpath(path)!==resolve(path))throw Error('Private real pilot storage required.');}
async function readArchive(path){
 if(await realpath(path)!==resolve(path))throw Error('Private real archive required.');
 const fd=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 try{const s=await fd.stat();if(!s.isFile()||s.nlink!==1||s.mode&0o077||s.size<1||s.size>20000)throw Error('Bounded fixed archive required.');const b=await fd.readFile();if(b.length!==s.size)throw Error();return b;}finally{await fd.close();}
}
/** Explicit fixed fixture only. A retained history or incomplete initialization always holds rather than reseeding. */
export async function verifySyntheticCRMOutbox(root,key,initialize=false){
 await privateDirectory(root);
 const primary=join(root,'synthetic-crm-outbox'),retained=join(root,'retained-crm-outbox');
 let state=await readCRMDeliveryOutbox(primary,key);
 if(state.revision==='EMPTY'){
  if(!initialize)throw Error('Explicit synthetic initialization or recovery required.');
  try{await lstat(retained);throw Error('Retained history exists; recover primary instead of reseeding.');}catch(e){if(e?.code!=='ENOENT')throw e;}
  state=await enqueueCRMDeliveryObservations(primary,key,'EMPTY',[first]);
  state=await claimCRMDeliveryAttempt(primary,key,state.revision,state.observations[0].idempotencyKey,'2026-10-23T23:00:10.000Z');
  const token=state.attemptToken;
  state=await confirmCRMDelivery(primary,key,state.revision,{idempotencyKey:state.observations[0].idempotencyKey,attemptToken:token,crmCaseId:'e'.repeat(64),providerRevision:'f'.repeat(64),responseFingerprint:'1'.repeat(64),acknowledgedAt:'2026-10-23T23:00:11.000Z'},'2026-10-23T23:00:11.000Z');
  state=await enqueueCRMDeliveryObservations(primary,key,state.revision,[second]);
 }
 if(state.sequence!==4||state.observations.length!==2||state.deliveries.length!==2)throw Error('Fixed synthetic ledger required.');
 const one={...first,sourceRevision:1},two={...second,sourceRevision:2};
 const firstKey=crmHandoffIdempotencyKey(one),secondKey=crmHandoffIdempotencyKey(two);
 assert.deepEqual(state.observations,[{...one,idempotencyKey:firstKey},{...two,idempotencyKey:secondKey}]);
 assert.match(state.deliveries[0].attempt?.tokenHash??'',/^[a-f0-9]{64}$/);
 assert.deepEqual(state.deliveries,[{idempotencyKey:firstKey,state:'ACKNOWLEDGED',attempt:{tokenHash:state.deliveries[0].attempt.tokenHash,claimedAt:'2026-10-23T23:00:10.000Z',expiresAt:'2026-10-23T23:02:10.000Z'},receipt:{crmCaseId:'e'.repeat(64),providerRevision:'f'.repeat(64),responseFingerprint:'1'.repeat(64),acknowledgedAt:'2026-10-23T23:00:11.000Z'}},{idempotencyKey:secondKey,state:'PENDING',attempt:null,receipt:null}]);
 await mkdir(retained,{mode:0o700}).catch(e=>{if(e?.code!=='EEXIST')throw e;});await privateDirectory(retained);
 const name='outbox-'+state.revision+'.backup.json',archive=join(retained,name);
 try{await lstat(archive);}catch(e){if(e?.code!=='ENOENT')throw e;await exportCRMDeliveryOutboxBackup(primary,archive,key);}
 const independent=authenticateOutboxArchive(await readArchive(archive),key);
 if(independent.revision!==state.revision)throw Error('Retained source mismatch.');
 const temporary=await mkdtemp(join(retained,'.verify-'));
 try{const target=join(temporary,'restored');await restoreCRMDeliveryOutboxBackup(archive,target,key);const restored=await readCRMDeliveryOutbox(target,key);
  if(restored.revision!==state.revision||JSON.stringify(restored.observations)!==JSON.stringify(state.observations)||JSON.stringify(restored.deliveries)!==JSON.stringify(state.deliveries))throw Error('Recovery pair mismatch.');
 }finally{await rm(temporary,{recursive:true,force:true});}
 return Object.freeze({event:'CRM_OUTBOX_SYNTHETIC_VERIFIED',scope:'SYNTHETIC_FIXTURE_ONLY',journalRevision:state.revision,retainedObservations:2,pendingDeliveries:1,simulatedAcknowledgements:1,archiveFilename:name,localBackupVerified:true,independentRetentionVerified:false,providerAcknowledgementIndependentlyVerified:false,businessDataExecutionAllowed:false,writesCRM:false,modelApiRequestsAllowed:false});
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let key;
 try{const action=process.argv[2];if(process.argv.length!==3||!['initialize','verify'].includes(action))throw Error();await verifyPilotEnvironment();key=Buffer.from(process.env.QUEST_PIPELINE_KEY_HEX,'hex');console.log(JSON.stringify(await verifySyntheticCRMOutbox(process.env.QUEST_PIPELINE_DIRECTORY,key,action==='initialize')));}
 catch{console.error('Synthetic CRM outbox held; verify isolated identity, fixed fixture and complete authenticated recovery pair.');process.exitCode=1;}
 finally{key?.fill(0);}
}
