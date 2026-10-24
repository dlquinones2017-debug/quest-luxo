import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm,chmod,symlink,link,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {readCRMDeliveryOutbox,enqueueCRMDeliveryObservations,claimCRMDeliveryAttempt,confirmCRMDelivery} from '../src/lib/command/crmDeliveryOutbox.ts';
import {exportCRMDeliveryOutboxBackup,restoreCRMDeliveryOutboxBackup} from '../src/lib/command/crmDeliveryOutboxBackup.ts';
import {withLeadStorageLock} from '../src/lib/leads/leadStorageLock.ts';
const file='crm-delivery-outbox-v1.enc.json',marker='crm-delivery-outbox-v1.initialized',sha=b=>createHash('sha256').update(b).digest('hex');
const time=(minute,second=0)=>`2026-10-24T00:${String(minute).padStart(2,'0')}:${String(second).padStart(2,'0')}.000Z`;
const observation=n=>({division:'LUXURY_ADVISORY',sourceId:'luxury-fixed-fixture',sourceRecordId:sha('source-'+n),canonicalRecordId:sha('canonical-'+n),payloadFingerprint:sha('payload-'+n),observedAt:'2026-10-23T23:00:00.000Z'});
async function fixture(fn){
 const root=await mkdtemp(join(tmpdir(),'outbox-backup-')),key=randomBytes(32),primary=join(root,'primary'),retained=join(root,'retained'),recovery=join(root,'recovery');
 try{for(const path of [primary,retained,recovery])await mkdir(path,{mode:0o700});
  let state=await enqueueCRMDeliveryObservations(primary,key,'EMPTY',[0,1,2,3].map(observation));
  state=await claimCRMDeliveryAttempt(primary,key,state.revision,state.observations[2].idempotencyKey,time(0));state=await claimCRMDeliveryAttempt(primary,key,state.revision,state.observations[2].idempotencyKey,time(2));
  const claim=await claimCRMDeliveryAttempt(primary,key,state.revision,state.observations[0].idempotencyKey,time(3));
  const receipt={idempotencyKey:claim.observations[0].idempotencyKey,attemptToken:claim.attemptToken,crmCaseId:sha('fixture-case'),providerRevision:sha('fixture-version'),responseFingerprint:sha('fixture-response'),acknowledgedAt:time(3,30)};
  state=await confirmCRMDelivery(primary,key,claim.revision,receipt,time(3,30));state=await claimCRMDeliveryAttempt(primary,key,state.revision,state.observations[1].idempotencyKey,time(4));
  await fn({root,key,primary,retained,recovery,state,receipt,archive:join(retained,'outbox.backup.json'),target:join(recovery,'restored')});
 }finally{key.fill(0);await rm(root,{recursive:true,force:true});}
}
const metadataKeys=['sequence','observationCount','pendingCount','activeCount','uncertainCount','acknowledgedCount'];
test('consistent backup restores complete ACK, PENDING, ACTIVE and UNCERTAIN state with exact pair and no inferred permission',()=>fixture(async({key,primary,archive,target,state,receipt})=>{
 const report=await exportCRMDeliveryOutboxBackup(primary,archive,key);assert.equal(report.authenticated,true);assert.equal(report.observationCount,4);for(const name of ['pendingCount','activeCount','uncertainCount','acknowledgedCount'])assert.equal(report[name],1);
 const bundle=JSON.parse(await readFile(archive));assert.deepEqual(Object.keys(bundle).sort(),['version','kind','revision','createdAt','encrypted','marker',...metadataKeys].sort());assert.equal(bundle.kind,'QUEST_CRM_DELIVERY_OUTBOX_ENCRYPTED_BACKUP');assert.deepEqual(Buffer.from(bundle.encrypted,'base64'),await readFile(join(primary,file)));assert.deepEqual(Buffer.from(bundle.marker,'base64'),await readFile(join(primary,marker)));
 const restored=await restoreCRMDeliveryOutboxBackup(archive,target,key),readback=await readCRMDeliveryOutbox(target,key);for(const name of metadataKeys)assert.equal(restored[name],report[name]);assert.equal(readback.revision,state.revision);assert.deepEqual(readback.observations,state.observations);assert.deepEqual(readback.deliveries,state.deliveries);
 for(const name of ['businessDataExecutionAllowed','writesCRM','providerAcknowledgementIndependentlyVerified','independentRetentionVerified'])assert.equal(restored[name],false);assert.equal(restored.receiptAttestation,'CALLER_SUPPLIED_UNVERIFIED');
 assert.equal((await confirmCRMDelivery(target,key,readback.revision,receipt,time(4,30))).outcome,'NOOP');
 const changed=await enqueueCRMDeliveryObservations(target,key,readback.revision,[{...observation(0),payloadFingerprint:sha('payload-0-new'),observedAt:'2026-10-23T23:01:00.000Z'}]);assert.equal(changed.observations.at(-1).sourceRevision,2);assert.equal(changed.deliveries.at(-1).state,'PENDING');
 if(process.platform!=='win32')for(const p of [archive,join(target,file),join(target,marker)])assert.equal((await stat(p)).mode&0o777,0o600);
}));
test('wrong key and manifest metadata/cipher/marker tampering fail without publishing or leaking staging',()=>fixture(async({key,primary,archive,target,recovery})=>{
 await exportCRMDeliveryOutboxBackup(primary,archive,key);const original=await readFile(archive),bundle=JSON.parse(original),wrong=randomBytes(32);
 try{await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,wrong),/held/);}finally{wrong.fill(0);}assert.deepEqual(await readdir(recovery),[]);
 const edits=[b=>b.sequence++,b=>{b.pendingCount++;b.activeCount--;},b=>b.revision='a'.repeat(64),b=>b.marker=Buffer.from('different marker').toString('base64'),b=>b.extra='private',b=>b.kind='QUEST_CRM_PREPARATION_ENCRYPTED_BACKUP',b=>b.createdAt='2050-01-01T00:00:00.000Z',b=>b.observationCount='4',b=>b.encrypted+='\n',b=>{const encrypted=JSON.parse(Buffer.from(b.encrypted,'base64'));encrypted.tag=(encrypted.tag[0]==='a'?'b':'a')+encrypted.tag.slice(1);const bytes=Buffer.from(JSON.stringify(encrypted));b.encrypted=bytes.toString('base64');b.revision=sha(bytes);}];
 for(const edit of edits){const changed=structuredClone(bundle);edit(changed);await writeFile(archive,JSON.stringify(changed));await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,key),/held/);assert.deepEqual(await readdir(recovery),[]);}
 await writeFile(archive,original);assert.equal((await restoreCRMDeliveryOutboxBackup(archive,target,key)).authenticated,true);
}));
test('existing targets and archives are preserved, including empty directories and symlinks',()=>fixture(async({key,primary,archive,target,recovery})=>{
 await exportCRMDeliveryOutboxBackup(primary,archive,key);const original=await readFile(archive);await assert.rejects(()=>exportCRMDeliveryOutboxBackup(primary,archive,key));assert.deepEqual(await readFile(archive),original);
 await mkdir(target,{mode:0o700});await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,key));assert.deepEqual(await readdir(target),[]);
 await writeFile(join(target,'custom'),'preserve',{mode:0o600});await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,key));assert.equal(await readFile(join(target,'custom'),'utf8'),'preserve');await rm(target,{recursive:true});
 await writeFile(target,'custom target',{mode:0o600});await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,key));assert.equal(await readFile(target,'utf8'),'custom target');await rm(target);
 if(process.platform!=='win32'){const custom=join(recovery,'custom-directory');await mkdir(custom,{mode:0o700});await symlink(custom,target);await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,key));assert.deepEqual(await readdir(custom),[]);}
}));
test('concurrent cooperating restores publish one complete target and hold the other without overwrite',()=>fixture(async({key,primary,archive,target,state,recovery})=>{
 await exportCRMDeliveryOutboxBackup(primary,archive,key);const results=await Promise.allSettled([restoreCRMDeliveryOutboxBackup(archive,target,key),restoreCRMDeliveryOutboxBackup(archive,target,key)]);assert.equal(results.filter(x=>x.status==='fulfilled').length,1);assert.equal(results.filter(x=>x.status==='rejected').length,1);
 assert.deepEqual((await readCRMDeliveryOutbox(target,key)).deliveries,state.deliveries);assert.deepEqual(await readdir(recovery),['restored']);
}));
test('export honors source lock and concurrent source changes produce a self-consistent archive',()=>fixture(async({key,primary,archive,state,target})=>{
 let enter,release;const entered=new Promise(resolve=>enter=resolve),blocked=new Promise(resolve=>release=resolve);
 const lock=withLeadStorageLock(join(primary,file),async()=>{enter();await blocked;});await entered;let settled=false;
 const exporting=exportCRMDeliveryOutboxBackup(primary,archive,key).finally(()=>settled=true);await delay(40);assert.equal(settled,false);release();await lock;await exporting;
 await restoreCRMDeliveryOutboxBackup(archive,target,key);assert.equal((await readCRMDeliveryOutbox(target,key)).revision,state.revision);
 const concurrentArchive=archive+'.concurrent',sourceChange=enqueueCRMDeliveryObservations(primary,key,state.revision,[observation(4)]),backup=exportCRMDeliveryOutboxBackup(primary,concurrentArchive,key);
 await Promise.all([sourceChange,backup]);const nextTarget=target+'-concurrent';const r=await restoreCRMDeliveryOutboxBackup(concurrentArchive,nextTarget,key);assert([4,5].includes(r.observationCount));assert.equal((await readCRMDeliveryOutbox(nextTarget,key)).observations.length,r.observationCount);
}));
test('restore honors the fixed target reservation lock before creating staging',()=>fixture(async({key,primary,archive,target,recovery})=>{
 await exportCRMDeliveryOutboxBackup(primary,archive,key);let enter,release;const entered=new Promise(resolve=>enter=resolve),blocked=new Promise(resolve=>release=resolve),lock=withLeadStorageLock(target,async()=>{enter();await blocked;});await entered;
 let settled=false;const restoring=restoreCRMDeliveryOutboxBackup(archive,target,key).finally(()=>settled=true);await delay(40);assert.equal(settled,false);assert.deepEqual(await readdir(recovery),['restored.lock']);release();await lock;await restoring;
}));
test('invalid keys, missing parents and archive-inside-source reject without creating paths',()=>fixture(async({root,key,primary,archive,target})=>{
 const missingParent=join(root,'must-not-create');await assert.rejects(()=>exportCRMDeliveryOutboxBackup(join(missingParent,'primary'),join(missingParent,'archive'),key));await assert.rejects(()=>stat(missingParent),{code:'ENOENT'});
 await assert.rejects(()=>exportCRMDeliveryOutboxBackup(primary,join(missingParent,'archive'),key));await assert.rejects(()=>stat(missingParent),{code:'ENOENT'});
 await assert.rejects(()=>exportCRMDeliveryOutboxBackup(primary,join(primary,'forbidden.backup'),key));await assert.rejects(()=>stat(join(primary,'forbidden.backup')),{code:'ENOENT'});
 await assert.rejects(()=>exportCRMDeliveryOutboxBackup(primary,archive,Buffer.alloc(33)));await assert.rejects(()=>stat(archive),{code:'ENOENT'});
 await exportCRMDeliveryOutboxBackup(primary,archive,key);await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,join(missingParent,'target'),key));await assert.rejects(()=>stat(missingParent),{code:'ENOENT'});await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,Buffer.alloc(31)));await assert.rejects(()=>stat(target),{code:'ENOENT'});
}));
test('unsafe source or archive ancestry, symlinks, hardlinks, permissions and oversized input hold',()=>fixture(async({root,key,primary,archive,target,recovery})=>{
 await exportCRMDeliveryOutboxBackup(primary,archive,key);
 if(process.platform!=='win32'){
  const alias=join(root,'source-alias');await symlink(primary,alias);await assert.rejects(()=>exportCRMDeliveryOutboxBackup(alias,archive+'.alias',key));
  const archiveAlias=archive+'.alias';await symlink(archive,archiveAlias);await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archiveAlias,target,key));await rm(archiveAlias);await link(archive,archiveAlias);await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archiveAlias,target,key));await rm(archiveAlias);
  await chmod(archive,0o644);await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,key));await chmod(archive,0o600);
  await chmod(recovery,0o755);await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,target,key));await chmod(recovery,0o700);
  await chmod(join(primary,marker),0o644);await assert.rejects(()=>exportCRMDeliveryOutboxBackup(primary,archive+'.unsafe',key));await chmod(join(primary,marker),0o600);
  const recoveryAlias=join(root,'recovery-alias');await symlink(recovery,recoveryAlias);await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(archive,join(recoveryAlias,'unsafe'),key));
 }
 const huge=archive+'.huge';await writeFile(huge,Buffer.alloc(4_100_001),{mode:0o600});await assert.rejects(()=>restoreCRMDeliveryOutboxBackup(huge,target,key));assert.deepEqual(await readdir(recovery),[]);
}));
test('source loss, invalid initialization intent and wrong-key export never create an archive',()=>fixture(async({key,primary,archive})=>{
 const wrong=randomBytes(32);try{await assert.rejects(()=>exportCRMDeliveryOutboxBackup(primary,archive,wrong));}finally{wrong.fill(0);}await assert.rejects(()=>stat(archive),{code:'ENOENT'});
 const markerPath=join(primary,marker),markerBytes=await readFile(markerPath);await writeFile(markerPath,'wrong');await assert.rejects(()=>exportCRMDeliveryOutboxBackup(primary,archive,key));await writeFile(markerPath,markerBytes);await rm(join(primary,file));await assert.rejects(()=>exportCRMDeliveryOutboxBackup(primary,archive,key));await assert.rejects(()=>stat(archive),{code:'ENOENT'});
}));
