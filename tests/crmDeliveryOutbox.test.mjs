import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm,chmod,symlink,rename,link,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,createHash,createCipheriv} from 'node:crypto';
import {readCRMDeliveryOutbox,enqueueCRMDeliveryObservations,claimCRMDeliveryAttempt,confirmCRMDelivery} from '../src/lib/command/crmDeliveryOutbox.ts';
const file='crm-delivery-outbox-v1.enc.json',marker='crm-delivery-outbox-v1.initialized',markerBytes=Buffer.from('QUEST_LUXO_CRM_DELIVERY_OUTBOX_V1_INITIALIZED\n'),now='2026-10-24T00:00:00.000Z',later='2026-10-24T00:00:30.000Z',expired='2026-10-24T00:02:00.000Z';
const hex=c=>c.repeat(64),sha=v=>createHash('sha256').update(v).digest('hex');
const observation=(patch={})=>({division:'LUXURY_ADVISORY',sourceId:'luxury-form-v1',sourceRecordId:hex('a'),canonicalRecordId:hex('b'),payloadFingerprint:hex('c'),observedAt:'2026-10-23T23:00:00.000Z',...patch});
const ack=(claim,patch={})=>({idempotencyKey:claim.observations[0].idempotencyKey,attemptToken:claim.attemptToken,crmCaseId:hex('d'),providerRevision:hex('e'),responseFingerprint:hex('f'),acknowledgedAt:later,...patch});
async function fixture(fn){const dir=await mkdtemp(join(tmpdir(),'crm-delivery-')),key=randomBytes(32);try{await fn(dir,key);}finally{key.fill(0);await rm(dir,{recursive:true,force:true});}}
async function enqueued(dir,key,extra=[]){return enqueueCRMDeliveryObservations(dir,key,'EMPTY',[observation(),...extra]);}
async function claimed(dir,key){const a=await enqueued(dir,key);return claimCRMDeliveryAttempt(dir,key,a.revision,a.observations[0].idempotencyKey,now);}
test('encrypted immutable observations stay separate from delivery claims and caller-supplied receipts',()=>fixture(async(dir,key)=>{
 assert.equal((await readCRMDeliveryOutbox(dir,key)).revision,'EMPTY');const a=await enqueued(dir,key);
 assert.equal(a.outcome,'ENQUEUED');assert.equal(a.observations[0].sourceRevision,1);assert.equal(a.deliveries[0].state,'PENDING');assert.equal(a.deliveries[0].attempt,null);assert.equal(a.deliveries[0].receipt,null);
 for(const name of ['businessDataExecutionAllowed','writesCRM','providerAcknowledgementIndependentlyVerified'])assert.equal(a[name],false);assert.equal(a.receiptAttestation,'CALLER_SUPPLIED_UNVERIFIED');
 assert.throws(()=>a.observations.push({}));assert.throws(()=>a.observations[0].canonicalRecordId=hex('f'));
 const disk=await readFile(join(dir,file),'utf8');for(const secret of ['luxury-form-v1',hex('a'),hex('b'),hex('c'),'PENDING'])assert(!disk.includes(secret));
 const r=await readCRMDeliveryOutbox(dir,key);assert.equal(r.revision,a.revision);assert.deepEqual(r.observations,a.observations);if(process.platform!=='win32')assert.equal((await stat(join(dir,file))).mode&0o777,0o600);
}));
test('revision allocation preserves original observation time on duplicate, appends changes and does not collapse a later content reversion',()=>fixture(async(dir,key)=>{
 const first=observation(),a=await enqueueCRMDeliveryObservations(dir,key,'EMPTY',[first,first]);const bytes=await readFile(join(dir,file));
 const noop=await enqueueCRMDeliveryObservations(dir,key,a.revision,[observation({observedAt:'2026-10-23T23:01:00.000Z'})]);assert.equal(noop.outcome,'NOOP');assert.equal(noop.revision,a.revision);assert.equal(noop.observations[0].observedAt,first.observedAt);assert.deepEqual(await readFile(join(dir,file)),bytes);
 const second=observation({payloadFingerprint:hex('d'),observedAt:'2026-10-23T23:01:00.000Z'}),b=await enqueueCRMDeliveryObservations(dir,key,a.revision,[second]);
 const c=await enqueueCRMDeliveryObservations(dir,key,b.revision,[observation({observedAt:'2026-10-23T23:02:00.000Z'})]);assert.deepEqual(c.observations.map(e=>e.sourceRevision),[1,2,3]);assert.equal(new Set(c.observations.map(e=>e.idempotencyKey)).size,3);assert.equal(c.deliveries.filter(e=>e.state==='PENDING').length,3);
 await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,c.revision,[observation({payloadFingerprint:hex('e'),observedAt:'2026-10-23T22:59:00.000Z'})]));
}));
test('concurrent enqueues and claims permit one CAS winner, preserving all prior history',()=>fixture(async(dir,key)=>{
 const input=observation(),enqueueResults=await Promise.allSettled([enqueueCRMDeliveryObservations(dir,key,'EMPTY',[input]),enqueueCRMDeliveryObservations(dir,key,'EMPTY',[input])]);assert.equal(enqueueResults.filter(r=>r.status==='fulfilled').length,1);
 const a=await readCRMDeliveryOutbox(dir,key),id=a.observations[0].idempotencyKey;
 const claimResults=await Promise.allSettled([claimCRMDeliveryAttempt(dir,key,a.revision,id,now),claimCRMDeliveryAttempt(dir,key,a.revision,id,now)]);assert.equal(claimResults.filter(r=>r.status==='fulfilled').length,1);
 const r=await readCRMDeliveryOutbox(dir,key);assert.equal(r.deliveries[0].state,'ACTIVE');assert.equal(r.observations.length,1);assert.equal(r.sequence,2);
}));
test('contradictory incoming batch is rejected atomically; duplicate timestamp ordering is deterministic',()=>fixture(async(dir,key)=>{
 await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,'EMPTY',[observation(),observation({payloadFingerprint:hex('d')})]));
 await assert.rejects(()=>stat(join(dir,file)),{code:'ENOENT'});await assert.rejects(()=>stat(join(dir,marker)),{code:'ENOENT'});
 const a=await enqueueCRMDeliveryObservations(dir,key,'EMPTY',[observation({observedAt:'2026-10-23T23:01:00.000Z'}),observation()]);assert.equal(a.observations.length,1);assert.equal(a.observations[0].observedAt,observation().observedAt);
 const bytes=await readFile(join(dir,file));await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,a.revision,[observation({payloadFingerprint:hex('d')}),observation({payloadFingerprint:hex('e')})]));assert.deepEqual(await readFile(join(dir,file)),bytes);
}));
test('claim oldest revision only, keep active attempts isolated and bind one consistent provider case across revisions',()=>fixture(async(dir,key)=>{
 let a=await enqueued(dir,key);a=await enqueueCRMDeliveryObservations(dir,key,a.revision,[observation({payloadFingerprint:hex('d'),observedAt:'2026-10-23T23:01:00.000Z'})]);const [first,second]=a.observations;
 await assert.rejects(()=>claimCRMDeliveryAttempt(dir,key,a.revision,second.idempotencyKey,now));
 const claim=await claimCRMDeliveryAttempt(dir,key,a.revision,first.idempotencyKey,now);assert.equal(claim.outcome,'CLAIMED');assert.match(claim.attemptToken,/^[a-f0-9]{64}$/);assert.equal(claim.deliveries[0].attempt.tokenHash,sha(claim.attemptToken));assert(!JSON.stringify(await readCRMDeliveryOutbox(dir,key)).includes(claim.attemptToken));
 await assert.rejects(()=>claimCRMDeliveryAttempt(dir,key,claim.revision,second.idempotencyKey,now));
 a=await confirmCRMDelivery(dir,key,claim.revision,ack(claim),later);assert.equal(a.outcome,'ACKNOWLEDGED');assert.equal(a.providerAcknowledgementIndependentlyVerified,false);
 const claim2=await claimCRMDeliveryAttempt(dir,key,a.revision,second.idempotencyKey,later);
 await assert.rejects(()=>confirmCRMDelivery(dir,key,claim2.revision,ack(claim2,{idempotencyKey:second.idempotencyKey,crmCaseId:hex('a')}),later));
 a=await confirmCRMDelivery(dir,key,claim2.revision,ack(claim2,{idempotencyKey:second.idempotencyKey}),later);assert.equal(a.deliveries.filter(d=>d.state==='ACKNOWLEDGED').length,2);
}));
test('wrong token, premature/future receipt, malformed ACK and conflicting exact replay hold without rewriting',()=>fixture(async(dir,key)=>{
 const claim=await claimed(dir,key),bytes=await readFile(join(dir,file));
 for(const patch of [{attemptToken:hex('a')},{acknowledgedAt:'2026-10-23T23:59:59.000Z'},{acknowledgedAt:'2026-10-24T00:00:31.000Z'},{crmCaseId:'raw-case-id'},{extra:'private'}])await assert.rejects(()=>confirmCRMDelivery(dir,key,claim.revision,ack(claim,patch),later));
 assert.deepEqual(await readFile(join(dir,file)),bytes);const receipt=ack(claim),a=await confirmCRMDelivery(dir,key,claim.revision,receipt,later),persisted=await readFile(join(dir,file));
 const replay=await confirmCRMDelivery(dir,key,a.revision,receipt,expired);assert.equal(replay.outcome,'NOOP');assert.equal(replay.revision,a.revision);assert.deepEqual(await readFile(join(dir,file)),persisted);
 await assert.rejects(()=>confirmCRMDelivery(dir,key,a.revision,{...receipt,responseFingerprint:hex('b')},expired));
 await assert.rejects(()=>confirmCRMDelivery(dir,key,claim.revision,receipt,later));
}));
test('restart preserves attempts; expiry durably becomes uncertain and can never automatically retry or acknowledge',()=>fixture(async(dir,key)=>{
 const claim=await claimed(dir,key),restart=await readCRMDeliveryOutbox(dir,key);assert.equal(restart.deliveries[0].state,'ACTIVE');
 const uncertain=await confirmCRMDelivery(dir,key,restart.revision,ack(claim),expired);assert.equal(uncertain.outcome,'HELD_UNCERTAIN');assert.equal(uncertain.deliveries[0].state,'UNCERTAIN');assert.equal(uncertain.deliveries[0].receipt,null);assert.notEqual(uncertain.revision,restart.revision);
 await assert.rejects(()=>claimCRMDeliveryAttempt(dir,key,uncertain.revision,claim.observations[0].idempotencyKey,expired));
 await assert.rejects(()=>confirmCRMDelivery(dir,key,uncertain.revision,ack(claim),expired));
 const queued=await enqueueCRMDeliveryObservations(dir,key,uncertain.revision,[observation({payloadFingerprint:hex('d'),observedAt:'2026-10-23T23:01:00.000Z'})]);assert.equal(queued.observations.length,2);await assert.rejects(()=>claimCRMDeliveryAttempt(dir,key,queued.revision,queued.observations[1].idempotencyKey,expired));
}));
test('claim observes expired work under the lock without generating another attempt token',()=>fixture(async(dir,key)=>{
 const claim=await claimed(dir,key),r=await claimCRMDeliveryAttempt(dir,key,claim.revision,claim.observations[0].idempotencyKey,expired);assert.equal(r.outcome,'HELD_UNCERTAIN');assert.equal(r.attemptToken,undefined);assert.equal(r.deliveries[0].state,'UNCERTAIN');
}));
test('source/canonical identity collisions and provider case reuse across source bindings are held',()=>fixture(async(dir,key)=>{
 let a=await enqueued(dir,key);
 for(const patch of [{division:'REALTY'},{sourceId:'other-source'},{sourceRecordId:hex('e')},{canonicalRecordId:hex('e')}])await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,a.revision,[observation(patch)]));
 const other=observation({division:'REALTY',sourceId:'realty-form-v1',sourceRecordId:hex('e'),canonicalRecordId:hex('f')});a=await enqueueCRMDeliveryObservations(dir,key,a.revision,[other]);
 const c1=await claimCRMDeliveryAttempt(dir,key,a.revision,a.observations[0].idempotencyKey,now);a=await confirmCRMDelivery(dir,key,c1.revision,ack(c1),later);
 const c2=await claimCRMDeliveryAttempt(dir,key,a.revision,a.observations[1].idempotencyKey,later);await assert.rejects(()=>confirmCRMDelivery(dir,key,c2.revision,ack(c2,{idempotencyKey:a.observations[1].idempotencyKey}),later));
 const r=await confirmCRMDelivery(dir,key,c2.revision,ack(c2,{idempotencyKey:a.observations[1].idempotencyKey,crmCaseId:hex('a')}),later);assert.equal(r.deliveries[1].state,'ACKNOWLEDGED');
}));
test('strict bounds reject raw/freeform fields, future observations and invalid key/revision before creating paths',()=>fixture(async(dir,key)=>{
 const target=join(dir,'not-created');
 for(const patch of [{email:'private@example.test'},{sourceRecordId:'actual-uuid'},{canonicalRecordId:null},{payloadFingerprint:'raw'},{observedAt:'2050-01-01T00:00:00.000Z'},{observedAt:'2026-10-23'}])await assert.rejects(()=>enqueueCRMDeliveryObservations(target,key,'EMPTY',[observation(patch)]));
 await assert.rejects(()=>enqueueCRMDeliveryObservations(target,key,'EMPTY',Array(101).fill(observation())));await assert.rejects(()=>enqueueCRMDeliveryObservations(target,Buffer.alloc(33),'EMPTY',[observation()]));await assert.rejects(()=>enqueueCRMDeliveryObservations(target,key,'raw-revision',[observation()]));await assert.rejects(()=>stat(target),{code:'ENOENT'});
}));
test('retention reaches a fixed limit without pruning or replacing an older binding',t=>fixture(async(dir,key)=>{
 let revision='EMPTY';for(let batch=0;batch<10;batch++){const records=Array.from({length:100},(_,offset)=>{const n=batch*100+offset;return observation({sourceRecordId:sha('source-'+n),canonicalRecordId:sha('canonical-'+n)});});revision=(await enqueueCRMDeliveryObservations(dir,key,revision,records)).revision;}
 const started=performance.now(),r=await readCRMDeliveryOutbox(dir,key);t.diagnostic(`1000-observation authenticated read: ${(performance.now()-started).toFixed(1)} ms`);assert.equal(r.observations.length,1000);await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,revision,[observation()]));assert.equal((await readCRMDeliveryOutbox(dir,key)).revision,revision);
}));
test('wrong key, tamper and authenticated malformed state cannot be rewritten or substituted for preparation',()=>fixture(async(dir,key)=>{
 const a=await enqueued(dir,key),path=join(dir,file),bytes=await readFile(path),wrong=randomBytes(32);try{await assert.rejects(()=>readCRMDeliveryOutbox(dir,wrong),/held/);}finally{wrong.fill(0);}
 const altered=JSON.parse(bytes);altered.tag=(altered.tag[0]==='a'?'b':'a')+altered.tag.slice(1);await writeFile(path,JSON.stringify(altered),{mode:0o600});await assert.rejects(()=>readCRMDeliveryOutbox(dir,key),/held/);await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,a.revision,[observation()]));
 const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from('QUEST_LUXO_CRM_INTERNAL_DELIVERY_OUTBOX_V1'));const ciphertext=Buffer.concat([cipher.update(JSON.stringify({version:1,scope:'INTERNAL_DELIVERY_METADATA_ONLY',sequence:1,observations:a.observations,deliveries:[]})),cipher.final()]);
 await writeFile(path,JSON.stringify({version:1,iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),ciphertext:ciphertext.toString('base64')}));await assert.rejects(()=>readCRMDeliveryOutbox(dir,key),/held/);
}));
test('unsafe directories, links, public files and missing expected history are never reseeded',()=>fixture(async(dir,key)=>{
 const a=await enqueued(dir,key),path=join(dir,file);
 if(process.platform!=='win32'){
  const alias=join(dir,'alias');await symlink(dir,alias);await assert.rejects(()=>readCRMDeliveryOutbox(alias,key));await assert.rejects(()=>enqueueCRMDeliveryObservations(join(alias,'new-leaf'),key,'EMPTY',[observation()]));await assert.rejects(()=>stat(join(dir,'new-leaf')),{code:'ENOENT'});
  await chmod(dir,0o755);await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await chmod(dir,0o700);
  const retained=join(dir,'old');await rename(path,retained);await symlink(retained,path);await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await rm(path);await link(retained,path);await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await rm(path);await rename(retained,path);await chmod(path,0o644);await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await chmod(path,0o600);
 }
 await rm(path);await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,a.revision,[observation()]));await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,'EMPTY',[observation()]));await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));
}));
test('initialization intent is durable and either missing member or orphan intent holds even with EMPTY expectation',()=>fixture(async(dir,key)=>{
 const missing=join(dir,'missing-leaf');await assert.rejects(()=>enqueueCRMDeliveryObservations(missing,key,hex('a'),[observation()]));await assert.rejects(()=>stat(missing),{code:'ENOENT'});
 await writeFile(join(dir,marker),markerBytes,{mode:0o600});await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,'EMPTY',[observation()]));assert.deepEqual(await readFile(join(dir,marker)),markerBytes);await rm(join(dir,marker));
 const a=await enqueued(dir,key);assert.deepEqual(await readFile(join(dir,marker)),markerBytes);await rm(join(dir,marker));await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,'EMPTY',[observation()]));await assert.rejects(()=>enqueueCRMDeliveryObservations(dir,key,a.revision,[observation()]));
}));
test('initialization marker rejects altered bytes, symlinks, hardlinks and unsafe access',()=>fixture(async(dir,key)=>{
 await enqueued(dir,key);const path=join(dir,marker);
 await writeFile(path,'wrong',{mode:0o600});await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await writeFile(path,markerBytes);
 if(process.platform!=='win32'){
  await chmod(path,0o644);await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await chmod(path,0o600);
  const original=join(dir,'marker-original');await rename(path,original);await symlink(original,path);await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));await rm(path);await link(original,path);await assert.rejects(()=>readCRMDeliveryOutbox(dir,key));
 }
}));
