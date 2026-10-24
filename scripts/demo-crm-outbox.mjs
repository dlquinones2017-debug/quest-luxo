import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {mkdtemp,mkdir,readdir,copyFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
import {createLuxuryCRMObservation} from '../src/lib/command/luxuryCRMSourceBinding.ts';
import {enqueueCRMDeliveryObservations,claimCRMDeliveryAttempt,confirmCRMDelivery} from '../src/lib/command/crmDeliveryOutbox.ts';

/** Ephemeral fixtures only: no environment credentials, network client or business source is opened. */
export async function demonstrateCRMOutbox() {
 const root=await mkdtemp(join(tmpdir(),'quest-crm-outbox-demo-')),key=randomBytes(32);
 try {
  const now=new Date(Date.now()-1000).toISOString(),dir=join(root,'outbox'),recovered=join(root,'recovered');
  const record={id:'lead_12345678-1234-4123-8123-123456789abc',status:'new',notes:'',notesUpdatedAt:null,tags:[],tagsUpdatedAt:null,economicsSnapshots:[],savedAt:now,
   payload:{name:'Synthetic Example',email:'synthetic@example.test',phone:null,intent:'request-this-watch',brand:null,collection:null,reference:null,desiredWatch:'Synthetic watch',budget:null,timeline:null,message:null,source:'begin-your-quest',createdAt:now}};
  const projection=createLuxuryCRMObservation(record,key,now);
  let state=await enqueueCRMDeliveryObservations(dir,key,'EMPTY',[projection.observation]);
  const original=state.revision;
  state=await enqueueCRMDeliveryObservations(dir,key,state.revision,[{...projection.observation,observedAt:new Date().toISOString()}]);
  assert.equal(state.revision,original);assert.equal(state.observations[0].sourceRevision,1);assert.equal(state.deliveries[0].state,'PENDING');
  state=await claimCRMDeliveryAttempt(dir,key,state.revision,state.observations[0].idempotencyKey,now);
  const token=state.attemptToken;
  assert.match(token,/^[a-f0-9]{64}$/);
  state=await confirmCRMDelivery(dir,key,state.revision,{idempotencyKey:state.observations[0].idempotencyKey,attemptToken:token,
   crmCaseId:'a'.repeat(64),providerRevision:'b'.repeat(64),responseFingerprint:'c'.repeat(64),acknowledgedAt:now},now);
  assert.equal(state.deliveries[0].state,'ACKNOWLEDGED');
  const changed=createLuxuryCRMObservation({...record,notes:'Synthetic internal update'},key,new Date().toISOString());
  state=await enqueueCRMDeliveryObservations(dir,key,state.revision,[changed.observation]);
  assert.deepEqual(state.observations.map(o=>o.sourceRevision),[1,2]);assert.equal(state.deliveries[1].state,'PENDING');
  await mkdir(recovered,{mode:0o700});
  // Preserve every recovery artifact, including initialization intent; never copy a transient writer lock.
  const files=await readdir(dir,{withFileTypes:true});assert(files.every(f=>f.isFile()&&!f.name.endsWith('.lock')));
  for(const f of files)await copyFile(join(dir,f.name),join(recovered,f.name));
  const moduleURL=new URL('../src/lib/command/crmDeliveryOutbox.ts',import.meta.url).href;
  const childSource=`import {readFileSync} from 'node:fs';import {readCRMDeliveryOutbox} from ${JSON.stringify(moduleURL)};const bytes=readFileSync(0);const key=Buffer.from(bytes.toString('ascii'),'hex');bytes.fill(0);try{const s=await readCRMDeliveryOutbox(process.argv[1],key);console.log(JSON.stringify({revision:s.revision,states:s.deliveries.map(d=>d.state),revisions:s.observations.map(o=>o.sourceRevision),providerAcknowledgementIndependentlyVerified:s.providerAcknowledgementIndependentlyVerified}));}finally{key.fill(0);}`;
  const child=spawnSync(process.execPath,['--input-type=module','-e',childSource,recovered],{input:key.toString('hex'),encoding:'utf8',timeout:15000,maxBuffer:4096,env:{PATH:process.env.PATH}});
  assert.equal(child.status,0);const proof=JSON.parse(child.stdout);assert.equal(proof.revision,state.revision);assert.deepEqual(proof.states,['ACKNOWLEDGED','PENDING']);assert.deepEqual(proof.revisions,[1,2]);assert.equal(proof.providerAcknowledgementIndependentlyVerified,false);
  return Object.freeze({status:'SYNTHETIC_DEMONSTRATION_PASSED',sourceBindingVerified:'FIXTURE_ONLY',exactReplayNoop:true,allocatedRevisions:2,simulatedProviderAcknowledgements:1,
   pendingDeliveriesRecovered:1,freshProcessCiphertextCopyRecovery:true,realCRMDeliveries:0,independentOffsiteOutboxRecoveryVerified:false,businessDataExecutionAllowed:false,writesCRM:false,modelApiRequestsAllowed:false});
 } finally {key.fill(0);await rm(root,{recursive:true,force:true});}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try {assert.equal(process.argv.length,2);console.log(JSON.stringify(await demonstrateCRMOutbox()));}
 catch {console.error('Synthetic CRM outbox demonstration held; no business source or CRM execution performed.');process.exitCode=1;}
}
