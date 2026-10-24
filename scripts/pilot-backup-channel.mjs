import {createHash,randomUUID} from 'node:crypto';
import {constants} from 'node:fs';
import {lstat,realpath,open,rename,unlink} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {withLeadStorageLock} from '../src/lib/leads/leadStorageLock.ts';
import {verifyRequest,signPayload,verifyPayload} from './pilot-backup-protocol.mjs';

const FILE='recurring-backup-checkpoint.json', TTL=120_000, GAP=43_200_000, MIN_INTERVAL=60_000;
const KINDS=['intake','pipeline','preparation'], SHA=/^[a-f0-9]{64}$/, NONCE=/^[a-f0-9]{32}$/;
const exact=(v,keys)=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join() === [...keys].sort().join();
const canonicalTime=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const fail=()=>{throw Error('Authenticated private backup verification required.');};
const missing=e=>e?.code==='ENOENT';
const digest=s=>createHash('sha256').update(s,'utf8').digest('hex');
function archives(value,withContents=false){
 if(!Array.isArray(value)||value.length!==3)return fail();
 const result=value.map(a=>{
  if(!exact(a,withContents?['kind','revision','sha256','archive']:['kind','revision','sha256'])||!KINDS.includes(a.kind)||typeof a.revision!=='string'||!SHA.test(a.revision)||typeof a.sha256!=='string'||!SHA.test(a.sha256))return fail();
  if(withContents&&(typeof a.archive!=='string'||Buffer.byteLength(a.archive)>20_000||digest(a.archive)!==a.sha256))return fail();
  return withContents?{kind:a.kind,revision:a.revision,sha256:a.sha256,archive:a.archive}:{kind:a.kind,revision:a.revision,sha256:a.sha256};
 }).sort((a,b)=>a.kind.localeCompare(b.kind));
 if(!same(result.map(a=>a.kind),KINDS)||withContents&&Buffer.byteLength(JSON.stringify(result))>64_000)return fail();
 return result;
}
async function privateRoot(root){
 const dir=resolve(root),s=await lstat(dir);
 if(!s.isDirectory()||s.isSymbolicLink()||(s.mode&0o077)||await realpath(dir)!==dir)return fail();
 return dir;
}
function checkpointPayload(p){
 if(!exact(p,['version','clientId','firstSuccessAt','lastSuccessAt','successfulCycles','archives'])||p.version!==1||typeof p.clientId!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(p.clientId)||!canonicalTime(p.firstSuccessAt)||!canonicalTime(p.lastSuccessAt)||Date.parse(p.firstSuccessAt)>Date.parse(p.lastSuccessAt)||!Number.isSafeInteger(p.successfulCycles)||p.successfulCycles<1||p.successfulCycles>1_000_000_000)return fail();
 const normalized=archives(p.archives);
 if(!same(normalized,p.archives)||p.successfulCycles===1&&p.firstSuccessAt!==p.lastSuccessAt||p.successfulCycles>1&&Date.parse(p.lastSuccessAt)-Date.parse(p.firstSuccessAt)<MIN_INTERVAL)return fail();
 return p;
}
async function loadCheckpoint(root,key){
 const dir=await privateRoot(root);let fd;
 try{fd=await open(join(dir,FILE),constants.O_RDONLY|(constants.O_NOFOLLOW??0));}catch(e){if(missing(e))return null;throw e;}
 try{
  const s=await fd.stat();if(!s.isFile()||s.nlink!==1||(s.mode&0o077)||s.size<1||s.size>16_384)return fail();
  const bytes=await fd.readFile();if(bytes.length!==s.size)return fail();
  const wrapped=JSON.parse(bytes.toString('utf8'));
  if(!exact(wrapped,['payload','signature'])||!verifyPayload(key,wrapped.payload,wrapped.signature))return fail();
  return checkpointPayload(wrapped.payload);
 }finally{await fd.close();}
}
function recurring(p,now){return !!p&&p.successfulCycles>=2&&now>=Date.parse(p.lastSuccessAt)&&now-Date.parse(p.lastSuccessAt)<=GAP;}
/** Authenticated evidence only; never activates business processing or verifies caller/device ACLs itself. */
export async function readRecurringCheckpoint(root,key,now=Date.now()){
 try{const p=await loadCheckpoint(root,key);if(!Number.isFinite(now)||!recurring(p,now))return null;return Object.freeze({...p,archives:Object.freeze(p.archives.map(a=>Object.freeze({...a}))),checkpointAuthenticated:true,recurringIndependentRetentionVerified:true,businessDataExecutionAllowed:false});}catch{return null;}
}
async function recordSuccess(root,key,clientId,acceptedArchives,now){
 const dir=await privateRoot(root),file=join(dir,FILE);
 return withLeadStorageLock(file,async()=>{
  await privateRoot(dir);const prior=await loadCheckpoint(dir,key);
  if(prior&&(prior.clientId!==clientId||Date.parse(prior.lastSuccessAt)>now))return fail();
  const continuation=prior&&same(prior.archives,acceptedArchives)&&now-Date.parse(prior.lastSuccessAt)<=GAP;
  let payload;
  if(continuation&&now-Date.parse(prior.lastSuccessAt)<MIN_INTERVAL)payload=prior;
  else payload={version:1,clientId,firstSuccessAt:continuation?prior.firstSuccessAt:new Date(now).toISOString(),lastSuccessAt:new Date(now).toISOString(),successfulCycles:continuation?prior.successfulCycles+1:1,archives:acceptedArchives};
  checkpointPayload(payload);
  if(payload===prior)return payload;
  const tmp=join(dir,'.recurring-backup-'+randomUUID()+'.tmp'),fd=await open(tmp,'wx',0o600);
  try{
   try{await fd.writeFile(JSON.stringify({payload,signature:signPayload(key,payload)}));await fd.sync();}finally{await fd.close();}
   await rename(tmp,file);const folder=await open(dir,'r');try{await folder.sync();}finally{await folder.close();}
  }finally{await unlink(tmp).catch(e=>{if(!missing(e))throw e;});}
  return payload;
 });
}
async function readBody(req){
 const timeout=()=>req.destroy(Error('Bounded backup request timed out.'));
 req.setTimeout?.(15_000,timeout);const timer=setTimeout(timeout,15_000);timer.unref?.();
 try{let size=0;const chunks=[];for await(const chunk of req){const b=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=b.length;if(size>16_384)return fail();chunks.push(b);}const b=Buffer.concat(chunks);const text=b.toString('utf8');if(!b.equals(Buffer.from(text,'utf8')))return fail();return text;}
 finally{clearTimeout(timer);req.setTimeout?.(0);req.removeListener?.('timeout',timeout);}
}
function header(req,name){const v=req.headers[name];if(typeof v!=='string'||v.length>256)return fail();return v;}
function send(res,status,body){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(body));}
/** Mount only after isolated synthetic pilot identity checks and explicit operator opt-in. */
export function createPilotBackupChannel({key,root,clientId,readBundle,now=()=>Date.now()}){
 if(!Buffer.isBuffer(key)||key.length!==32||typeof clientId!=='string'||!/^[a-z][a-z0-9-]{0,63}$/.test(clientId)||typeof readBundle!=='function'||typeof now!=='function')return fail();
 const seen=new Map(),pending=new Map();
 return async function handle(req,res){
  if(req.url!=='/pilot-backup/v1'&&req.url!=='/pilot-backup/v1/ack')return false;
  try{
   if(req.url==='/pilot-backup/v1'&&req.method!=='GET'||req.url==='/pilot-backup/v1/ack'&&req.method!=='POST')return fail();
   const body=await readBody(req),clock=now();if(!Number.isFinite(clock))return fail();
   for(const [n,t]of seen)if(clock-t>TTL+15_000)seen.delete(n);for(const[n,p]of pending)if(clock-p.at>TTL)pending.delete(n);
   const fields={method:req.method,path:req.url,clientId:header(req,'x-quest-client'),timestamp:header(req,'x-quest-timestamp'),nonce:header(req,'x-quest-nonce'),body};
   if(fields.clientId!==clientId||!NONCE.test(fields.nonce)||!verifyRequest(key,fields,header(req,'x-quest-signature'),clock)||seen.has(fields.nonce)||seen.size>=256)return fail();
   seen.set(fields.nonce,clock);
   if(req.method==='GET'){
    if(body!==''||pending.size>=32)return fail();
    const contents=archives(await readBundle(),true),descriptors=contents.map(({kind,revision,sha256})=>({kind,revision,sha256}));
    pending.set(fields.nonce,{at:clock,archives:descriptors});
    const payload={version:1,nonce:fields.nonce,generatedAt:new Date(clock).toISOString(),archives:contents};
    send(res,200,{payload,signature:signPayload(key,payload)});
   }else{
    const ack=JSON.parse(body);
    if(!exact(ack,['version','nonce','verifiedAt','archives','aclVerified','recoveryVerified','deviceId'])||ack.version!==1||typeof ack.nonce!=='string'||!NONCE.test(ack.nonce)||!canonicalTime(ack.verifiedAt)||Date.parse(ack.verifiedAt)>clock||clock-Date.parse(ack.verifiedAt)>TTL||ack.aclVerified!==true||ack.recoveryVerified!==true||ack.deviceId!=='windows-recovery-primary')return fail();
    const proposal=pending.get(ack.nonce),accepted=archives(ack.archives);
    if(!proposal||clock<proposal.at||clock-proposal.at>TTL||Date.parse(ack.verifiedAt)<proposal.at||!same(accepted,proposal.archives))return fail();
    pending.delete(ack.nonce); // Consume before any await: parallel ACKs cannot reuse a delivery.
    const current=archives(await readBundle(),true).map(({kind,revision,sha256})=>({kind,revision,sha256}));
    if(!same(current,proposal.archives))return fail();
    const saved=await recordSuccess(root,key,clientId,accepted,clock);
    const payload={version:1,nonce:ack.nonce,acknowledgedAt:new Date(clock).toISOString(),successfulCycles:saved.successfulCycles,recurringIndependentRetentionVerified:recurring(saved,clock)};
    send(res,200,{payload,signature:signPayload(key,payload)});
   }
  }catch{if(!res.headersSent)send(res,403,{error:'Authenticated backup request held.'});else res.destroy();}
  return true;
 };
}
