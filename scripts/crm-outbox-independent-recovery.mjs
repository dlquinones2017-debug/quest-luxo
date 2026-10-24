import assert from 'node:assert/strict';
import {createHash,createDecipheriv} from 'node:crypto';
import {constants,readSync,openSync,readSync as fileReadSync,fstatSync,lstatSync,realpathSync,closeSync,mkdirSync,writeFileSync,fsyncSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';

const FILE='crm-delivery-outbox-v1.enc.json',MARKER='crm-delivery-outbox-v1.initialized',MAX=20_000;
const MARKER_BYTES=Buffer.from('QUEST_LUXO_CRM_DELIVERY_OUTBOX_V1_INITIALIZED\n');
const SHA=/^[a-f0-9]{64}$/;
const hash=b=>createHash('sha256').update(b).digest('hex');
const sha=v=>hash(JSON.stringify(v));
const held=()=>Error('Independent synthetic outbox recovery held.');
const exact=(v,fields)=>{assert(v&&typeof v==='object'&&!Array.isArray(v));assert.deepEqual(Object.keys(v).sort(),[...fields].sort());};
const canonicalTime=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
function base64(value){assert.equal(typeof value,'string');assert(value.length&&value.length<=MAX);const decoded=Buffer.from(value,'base64');assert.equal(decoded.toString('base64'),value);return decoded;}
function expectedFixture(tokenHash){
 assert.equal(typeof tokenHash,'string');assert.match(tokenHash,SHA);
 const observations=[1,2].map(sourceRevision=>({division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),canonicalRecordId:'b'.repeat(64),payloadFingerprint:(sourceRevision===1?'c':'d').repeat(64),observedAt:sourceRevision===1?'2026-10-23T23:00:00.000Z':'2026-10-23T23:01:00.000Z',sourceRevision,idempotencyKey:sha(['quest-luxo-crm-handoff-v1','LUXURY_ADVISORY','synthetic-luxury','a'.repeat(64),sourceRevision])}));
 return {version:1,scope:'INTERNAL_DELIVERY_METADATA_ONLY',sequence:4,observations,deliveries:[
  {idempotencyKey:observations[0].idempotencyKey,state:'ACKNOWLEDGED',attempt:{tokenHash,claimedAt:'2026-10-23T23:00:10.000Z',expiresAt:'2026-10-23T23:02:10.000Z'},receipt:{crmCaseId:'e'.repeat(64),providerRevision:'f'.repeat(64),responseFingerprint:'1'.repeat(64),acknowledgedAt:'2026-10-23T23:00:11.000Z'}},
  {idempotencyKey:observations[1].idempotencyKey,state:'PENDING',attempt:null,receipt:null}
 ]};
}
/** Standalone authentication of one exact synthetic fixture; retained receipts remain caller supplied. */
export function authenticateOutboxArchive(bytes,key){
 try{
  assert(Buffer.isBuffer(bytes)&&bytes.length>0&&bytes.length<=MAX&&Buffer.isBuffer(key)&&key.length===32);
  const b=JSON.parse(bytes.toString('utf8'));
  exact(b,['version','kind','revision','createdAt','encrypted','marker','sequence','observationCount','pendingCount','activeCount','uncertainCount','acknowledgedCount']);
  assert.equal(b.version,1);assert.equal(b.kind,'QUEST_CRM_DELIVERY_OUTBOX_ENCRYPTED_BACKUP');assert.equal(typeof b.revision,'string');assert.match(b.revision,SHA);assert(canonicalTime(b.createdAt));
  assert.equal(b.sequence,4);assert.equal(b.observationCount,2);assert.equal(b.pendingCount,1);assert.equal(b.activeCount,0);assert.equal(b.uncertainCount,0);assert.equal(b.acknowledgedCount,1);
  const encrypted=base64(b.encrypted),marker=base64(b.marker);assert(marker.equals(MARKER_BYTES));assert.equal(hash(encrypted),b.revision);
  const w=JSON.parse(encrypted.toString('utf8'));exact(w,['version','iv','tag','ciphertext']);assert.equal(w.version,1);assert.equal(typeof w.iv,'string');assert.match(w.iv,/^[a-f0-9]{24}$/);assert.equal(typeof w.tag,'string');assert.match(w.tag,/^[a-f0-9]{32}$/);
  const cipher=base64(w.ciphertext);
  function decode(k,c=cipher){
   const d=createDecipheriv('aes-256-gcm',k,Buffer.from(w.iv,'hex'));d.setAAD(Buffer.from('QUEST_LUXO_CRM_INTERNAL_DELIVERY_OUTBOX_V1'));d.setAuthTag(Buffer.from(w.tag,'hex'));
   let first,last,plain;
   try{first=d.update(c);last=d.final();plain=Buffer.concat([first,last]);return JSON.parse(plain.toString('utf8'));}
   finally{first?.fill(0);last?.fill(0);plain?.fill(0);}
  }
  const decoded=decode(key);assert.deepEqual(decoded,expectedFixture(decoded?.deliveries?.[0]?.attempt?.tokenHash));
  const wrong=Buffer.from(key);wrong[0]^=1;try{assert.throws(()=>decode(wrong));}finally{wrong.fill(0);}
  const damaged=Buffer.from(cipher);assert(damaged.length);damaged[0]^=1;assert.throws(()=>decode(key,damaged));
  return {revision:b.revision,archiveSha256:hash(bytes),encrypted,marker};
 }catch{throw held();}
}
function privateDirectory(path){
 const p=resolve(path),s=lstatSync(p);assert(s.isDirectory()&&!s.isSymbolicLink());assert.equal(realpathSync(p),p);if(process.platform!=='win32')assert.equal(s.mode&0o077,0);return p;
}
function privateRead(path,limit=MAX){
 assert.equal(realpathSync(path),resolve(path));const fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 try{
  const s=fstatSync(fd);assert(s.isFile()&&s.nlink===1&&s.size>0&&s.size<=limit);if(process.platform!=='win32')assert.equal(s.mode&0o077,0);
  const bytes=Buffer.alloc(s.size+1);let count=0;while(count<bytes.length){const n=fileReadSync(fd,bytes,count,bytes.length-count,null);if(!n)break;count+=n;}assert.equal(count,s.size);return bytes.subarray(0,count);
 }finally{closeSync(fd);}
}
function writeExclusive(path,bytes){const fd=openSync(path,'wx',0o600);try{writeFileSync(fd,bytes);fsyncSync(fd);}finally{closeSync(fd);}}
/** New restore directories only. Interrupted restores remain held for explicit review, never reseeded. */
export function recoverSyntheticOutbox(archive,target,key,mode){
 try{
  assert(['restore','verify'].includes(mode));const bytes=privateRead(archive),r=authenticateOutboxArchive(bytes,key);target=resolve(target);
  if(mode==='restore'){privateDirectory(dirname(target));mkdirSync(target,{mode:0o700});}
  privateDirectory(target);
  if(mode==='restore'){
   writeExclusive(join(target,MARKER),r.marker);writeExclusive(join(target,FILE),r.encrypted);
   if(process.platform!=='win32'){const fd=openSync(target,'r');try{fsyncSync(fd);}finally{closeSync(fd);}}
  }
  const stored=privateRead(join(target,FILE)),marker=privateRead(join(target,MARKER),MARKER_BYTES.length);assert(marker.equals(MARKER_BYTES));assert.equal(hash(stored),r.revision);
  const recheck=JSON.parse(bytes.toString('utf8'));recheck.encrypted=stored.toString('base64');recheck.marker=marker.toString('base64');authenticateOutboxArchive(Buffer.from(JSON.stringify(recheck)),key);
  return {status:'VERIFIED',mode,checkedAt:new Date().toISOString(),scope:'SYNTHETIC_OUTBOX_ONLY',revision:r.revision,archiveSha256:r.archiveSha256,exactFixtureVerified:true,wrongKeyRejected:true,tamperRejected:true,markerVerified:true,businessDataExecutionAllowed:false,writesCRM:false,providerAcknowledgementIndependentlyVerified:false,recurringIndependentRetentionVerified:false};
 }catch{throw held();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let key;const input=Buffer.alloc(66);
 try{
  assert.equal(process.argv.length,5);let n=0;while(n<input.length){const c=readSync(0,input,n,input.length-n,null);if(!c)break;n+=c;}
  assert(n===64||n===65&&input[64]===10);for(const byte of input.subarray(0,64))assert(byte>=48&&byte<=57||byte>=97&&byte<=102);
  key=Buffer.from(input.subarray(0,64).toString('utf8'),'hex');input.fill(0);console.log(JSON.stringify(recoverSyntheticOutbox(process.argv[3],process.argv[4],key,process.argv[2])));
 }catch{console.error('Independent synthetic outbox recovery held.');process.exitCode=1;}
 finally{input.fill(0);key?.fill(0);}
}
