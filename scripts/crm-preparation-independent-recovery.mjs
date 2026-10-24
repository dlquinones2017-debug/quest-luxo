import assert from 'node:assert/strict';
import { createHash,createDecipheriv } from 'node:crypto';
import { constants,readSync,openSync,readFileSync,fstatSync,lstatSync,realpathSync,closeSync,mkdirSync,writeFileSync,fsyncSync } from 'node:fs';
import { resolve,join,dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
const hash=b=>createHash('sha256').update(b).digest('hex');
const sha=v=>hash(JSON.stringify(v));
const filename='crm-preparation-v1.enc.json';
const exact=(v,fields)=>assert.deepEqual(Object.keys(v).sort(),fields.sort());
/** Independently checks only the fixed pilot fixture, not arbitrary customer records or source scope. */
export function authenticatePreparationArchive(bytes,key){
 assert(Buffer.isBuffer(key)&&key.length===32&&bytes.length>0&&bytes.length<=2_800_000);
 const b=JSON.parse(bytes);exact(b,['version','kind','revision','sequence','retainedPreparationCount','createdAt','encrypted']);
 assert.equal(b.version,1);assert.equal(b.kind,'QUEST_CRM_PREPARATION_ENCRYPTED_BACKUP');assert.match(b.revision,/^[a-f0-9]{64}$/);assert.equal(b.sequence,1);assert.equal(b.retainedPreparationCount,1);
 assert(typeof b.createdAt==='string'&&Number.isFinite(Date.parse(b.createdAt)));assert.equal(typeof b.encrypted,'string');
 const encrypted=Buffer.from(b.encrypted,'base64');assert.equal(encrypted.toString('base64'),b.encrypted);assert.equal(hash(encrypted),b.revision);
 const w=JSON.parse(encrypted);exact(w,['version','iv','tag','ciphertext']);assert.equal(w.version,1);assert.match(w.iv,/^[a-f0-9]{24}$/);assert.match(w.tag,/^[a-f0-9]{32}$/);assert.equal(typeof w.ciphertext,'string');
 const cipher=Buffer.from(w.ciphertext,'base64');assert.equal(cipher.toString('base64'),w.ciphertext);
 function decode(k,c=cipher){const d=createDecipheriv('aes-256-gcm',k,Buffer.from(w.iv,'hex'));d.setAAD(Buffer.from('QUEST_LUXO_CRM_INTERNAL_PREPARATION_V1'));d.setAuthTag(Buffer.from(w.tag,'hex'));let p;try{p=Buffer.concat([d.update(c),d.final()]);return JSON.parse(p);}finally{p?.fill(0);}}
 const expected={version:1,scope:'INTERNAL_PREPARATION_ONLY',sequence:1,entries:[{division:'LUXURY_ADVISORY',sourceId:'synthetic-luxury',sourceRecordId:'a'.repeat(64),sourceRevision:1,
  idempotencyKey:sha(['quest-luxo-crm-handoff-v1','LUXURY_ADVISORY','synthetic-luxury','a'.repeat(64),1]),
  metadataFingerprint:sha(['b'.repeat(64),'c'.repeat(64),'2026-10-23T23:00:00.000Z','UNKNOWN',null,'UNKNOWN','UNKNOWN'])}]};
 assert.deepEqual(decode(key),expected);
 const wrong=Buffer.from(key);wrong[0]^=1;try{assert.throws(()=>decode(wrong));}finally{wrong.fill(0);}
 const damaged=Buffer.from(cipher);assert(damaged.length);damaged[0]^=1;assert.throws(()=>decode(key,damaged));
 return {revision:b.revision,archiveSha256:hash(bytes),encrypted};
}
function privateRead(path){assert.equal(realpathSync(path),resolve(path));const fd=openSync(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));try{const s=fstatSync(fd);assert(s.isFile()&&s.nlink===1&&s.size>0&&s.size<=2_800_000);if(process.platform!=='win32')assert.equal(s.mode&0o077,0);const b=readFileSync(fd);assert.equal(b.length,s.size);return b;}finally{closeSync(fd);}}
export function recoverSyntheticPreparation(archive,target,key,mode){
 assert(['restore','verify'].includes(mode));const b=privateRead(archive),r=authenticatePreparationArchive(b,key);
 target=resolve(target);
 if(mode==='restore'){const parent=dirname(target),s=lstatSync(parent);assert(s.isDirectory()&&!s.isSymbolicLink());assert.equal(realpathSync(parent),parent);if(process.platform!=='win32')assert.equal(s.mode&0o077,0);mkdirSync(target,{mode:0o700});} // Explicit new target only, never replace existing recovery state.
 assert.equal(realpathSync(target),target);const folder=lstatSync(target);assert(folder.isDirectory()&&!folder.isSymbolicLink());if(process.platform!=='win32')assert.equal(folder.mode&0o077,0);
 const file=join(target,filename);
 if(mode==='restore'){const fd=openSync(file,'wx',0o600);try{writeFileSync(fd,r.encrypted);fsyncSync(fd);}finally{closeSync(fd);}}
 const stored=privateRead(file);assert.equal(hash(stored),r.revision);const bundle=JSON.parse(b);bundle.encrypted=stored.toString('base64');authenticatePreparationArchive(Buffer.from(JSON.stringify(bundle)),key);
 return {status:'VERIFIED',mode,checkedAt:new Date().toISOString(),scope:'SYNTHETIC_PREPARATION_ONLY',revision:r.revision,archiveSha256:r.archiveSha256,exactFixtureVerified:true,wrongKeyRejected:true,tamperRejected:true,businessDataExecutionAllowed:false,writesCRM:false,recurringIndependentRetentionVerified:false};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let key;const input=Buffer.alloc(66);
 try{assert.equal(process.argv.length,5);let n=0;while(n<input.length){const c=readSync(0,input,n,input.length-n,null);if(!c)break;n+=c;}assert(n===64||n===65&&input[64]===10);const hex=input.subarray(0,64).toString('ascii');assert.match(hex,/^[a-f0-9]{64}$/);key=Buffer.from(hex,'hex');input.fill(0);console.log(JSON.stringify(recoverSyntheticPreparation(process.argv[3],process.argv[4],key,process.argv[2])));}
 catch{console.error('Independent synthetic preparation recovery held; existing files preserved.');process.exitCode=1;}
 finally{input.fill(0);key?.fill(0);}
}
