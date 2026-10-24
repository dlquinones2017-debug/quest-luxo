import {createCipheriv,createDecipheriv,createHash,randomBytes,randomUUID} from "node:crypto";
import {constants} from "node:fs";
import {lstat,mkdir,open,realpath,rename,unlink} from "node:fs/promises";
import {dirname,join,resolve} from "node:path";
import {withLeadStorageLock} from "../leads/leadStorageLock.ts";
import {crmHandoffIdempotencyKey,type CRMDivision} from "./crmReconciliationPlan.ts";

const FILE="crm-delivery-outbox-v1.enc.json",AAD=Buffer.from("QUEST_LUXO_CRM_INTERNAL_DELIVERY_OUTBOX_V1");
const MARKER="crm-delivery-outbox-v1.initialized",MARKER_BYTES=Buffer.from("QUEST_LUXO_CRM_DELIVERY_OUTBOX_V1_INITIALIZED\n");
const SHA=/^[a-f0-9]{64}$/,MAX_BYTES=3_000_000,MAX_HISTORY=1000;
export interface CRMDeliveryObservation {division:CRMDivision;sourceId:string;sourceRecordId:string;canonicalRecordId:string;payloadFingerprint:string;observedAt:string}
interface Observation extends CRMDeliveryObservation {sourceRevision:number;idempotencyKey:string}
interface Attempt {tokenHash:string;claimedAt:string;expiresAt:string}
interface Receipt {crmCaseId:string;providerRevision:string;responseFingerprint:string;acknowledgedAt:string}
interface Delivery {idempotencyKey:string;state:"PENDING"|"ACTIVE"|"UNCERTAIN"|"ACKNOWLEDGED";attempt:Attempt|null;receipt:Receipt|null}
interface Stored {version:1;scope:"INTERNAL_DELIVERY_METADATA_ONLY";sequence:number;observations:Observation[];deliveries:Delivery[]}
export interface CRMDeliveryAcknowledgement extends Receipt {idempotencyKey:string;attemptToken:string}
type Outcome="ENQUEUED"|"NOOP"|"CLAIMED"|"ACKNOWLEDGED"|"HELD_UNCERTAIN";
const failure=():never=>{throw Error("CRM delivery outbox held; verify bounded metadata, private storage, key, revision and reconciliation.");};
const digest=(v:Buffer|string)=>createHash("sha256").update(v).digest("hex");
const hash=(v:unknown):v is string=>typeof v==="string"&&SHA.test(v);
const time=(v:unknown)=>typeof v==="string"&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v?Date.parse(v):NaN;
const exact=(v:unknown,keys:readonly string[]):v is Record<string,unknown>=>!!v&&typeof v==="object"&&!Array.isArray(v)&&Object.keys(v).sort().join()===[...keys].sort().join();
const code=(e:unknown,c:string)=>e instanceof Error&&"code" in e&&e.code===c;
const binding=(v:CRMDeliveryObservation)=>JSON.stringify([v.division,v.sourceId,v.sourceRecordId]);
function keyCheck(key:Buffer){if(!Buffer.isBuffer(key)||key.length!==32)return failure();}
function revisionCheck(v:unknown){if(v!=="EMPTY"&&!hash(v))return failure();}
function observationCheck(v:unknown,stored=false):asserts v is Observation {
 const fields=["division","sourceId","sourceRecordId","canonicalRecordId","payloadFingerprint","observedAt",...(stored?["sourceRevision","idempotencyKey"]:[])];
 if(!exact(v,fields)||!["LUXURY_ADVISORY","CAPITAL_ADVISORY","REALTY"].includes(v.division as string)||typeof v.sourceId!=="string"||!/^[a-z][a-z0-9-]{0,79}$/.test(v.sourceId)||
  !hash(v.sourceRecordId)||!hash(v.canonicalRecordId)||!hash(v.payloadFingerprint)||!Number.isFinite(time(v.observedAt)))return failure();
 if(stored&&(!Number.isSafeInteger(v.sourceRevision)||(v.sourceRevision as number)<1||(v.sourceRevision as number)>MAX_HISTORY||!hash(v.idempotencyKey)||
  crmHandoffIdempotencyKey(v as unknown as Observation)!==v.idempotencyKey))return failure();
}
function empty():Stored{return {version:1,scope:"INTERNAL_DELIVERY_METADATA_ONLY",sequence:0,observations:[],deliveries:[]};}
function validate(v:unknown):asserts v is Stored {
 if(!exact(v,["version","scope","sequence","observations","deliveries"])||v.version!==1||v.scope!=="INTERNAL_DELIVERY_METADATA_ONLY"||!Number.isSafeInteger(v.sequence)||(v.sequence as number)<0||
  !Array.isArray(v.observations)||v.observations.length>MAX_HISTORY||!Array.isArray(v.deliveries)||v.deliveries.length!==v.observations.length)return failure();
 const history:Observation[]=[],seen=new Set<string>();
 for(const observation of v.observations){
  observationCheck(observation,true);if(seen.has(observation.idempotencyKey))return failure();
  const prior=history.filter(e=>binding(e)===binding(observation)),latest=prior.at(-1);
  if(observation.sourceRevision!==prior.length+1||latest&&(latest.canonicalRecordId!==observation.canonicalRecordId||latest.payloadFingerprint===observation.payloadFingerprint||time(latest.observedAt)>time(observation.observedAt))||
   history.some(e=>e.sourceId===observation.sourceId&&e.division!==observation.division||e.canonicalRecordId===observation.canonicalRecordId&&binding(e)!==binding(observation)))return failure();
  history.push(observation);seen.add(observation.idempotencyKey);
 }
 const deliveries:Delivery[]=[],byKey=new Map(history.map(o=>[o.idempotencyKey,o]));
 for(const d of v.deliveries){
  if(!exact(d,["idempotencyKey","state","attempt","receipt"])||!hash(d.idempotencyKey)||!seen.has(d.idempotencyKey)||deliveries.some(e=>e.idempotencyKey===d.idempotencyKey)||
   !["PENDING","ACTIVE","UNCERTAIN","ACKNOWLEDGED"].includes(d.state as string))return failure();
  if(d.state==="PENDING"){if(d.attempt!==null||d.receipt!==null)return failure();}
  else {
   if(!exact(d.attempt,["tokenHash","claimedAt","expiresAt"])||!hash(d.attempt.tokenHash)||!Number.isFinite(time(d.attempt.claimedAt))||time(d.attempt.expiresAt)-time(d.attempt.claimedAt)!==120_000)return failure();
   const observation=byKey.get(d.idempotencyKey)!;
   if(time(d.attempt.claimedAt)<time(observation.observedAt))return failure();
   if(d.state==="ACKNOWLEDGED"){
    if(!exact(d.receipt,["crmCaseId","providerRevision","responseFingerprint","acknowledgedAt"])||!hash(d.receipt.crmCaseId)||!hash(d.receipt.providerRevision)||!hash(d.receipt.responseFingerprint)||
     !Number.isFinite(time(d.receipt.acknowledgedAt))||time(d.receipt.acknowledgedAt)<time(d.attempt.claimedAt)||time(d.receipt.acknowledgedAt)>=time(d.attempt.expiresAt))return failure();
   }else if(d.receipt!==null)return failure();
  }
  deliveries.push(d as unknown as Delivery);
 }
 const byBinding=new Map<string,Delivery[]>(),caseBindings=new Map<string,string>(),bindingCases=new Map<string,string>();
 for(const d of deliveries){const scope=binding(byKey.get(d.idempotencyKey)!);const related=byBinding.get(scope)??[];related.push(d);byBinding.set(scope,related);
  if(d.receipt){if(caseBindings.has(d.receipt.crmCaseId)&&caseBindings.get(d.receipt.crmCaseId)!==scope||bindingCases.has(scope)&&bindingCases.get(scope)!==d.receipt.crmCaseId)return failure();caseBindings.set(d.receipt.crmCaseId,scope);bindingCases.set(scope,d.receipt.crmCaseId);}}
 for(const related of byBinding.values()){let unacknowledged=false;related.sort((a,b)=>byKey.get(a.idempotencyKey)!.sourceRevision-byKey.get(b.idempotencyKey)!.sourceRevision);
  for(const d of related){if(unacknowledged&&(d.state==="ACTIVE"||d.state==="ACKNOWLEDGED"))return failure();if(d.state!=="ACKNOWLEDGED")unacknowledged=true;}}
}
function snapshot(s:Stored,revision:string,outcome?:Outcome,attemptToken?:string){
 return Object.freeze({...s,observations:Object.freeze(s.observations.map(e=>Object.freeze({...e}))),deliveries:Object.freeze(s.deliveries.map(d=>Object.freeze({...d,attempt:d.attempt?Object.freeze({...d.attempt}):null,receipt:d.receipt?Object.freeze({...d.receipt}):null}))),revision,
  ...(outcome?{outcome}:{}),...(attemptToken?{attemptToken}:{}),businessDataExecutionAllowed:false,writesCRM:false,providerAcknowledgementIndependentlyVerified:false,receiptAttestation:"CALLER_SUPPLIED_UNVERIFIED" as const});
}
async function directory(path:string,create:boolean){
 if(create){try{await lstat(path);}catch(e){if(!code(e,"ENOENT"))throw e;const parent=dirname(path),s=await lstat(parent);if(!s.isDirectory()||s.isSymbolicLink()||await realpath(parent)!==parent||process.platform!=="win32"&&(s.mode&0o077)!==0)return failure();try{await mkdir(path,{mode:0o700});}catch(e){if(!code(e,"EEXIST"))throw e;}}}
 try{const s=await lstat(path);if(!s.isDirectory()||s.isSymbolicLink()||await realpath(path)!==path||process.platform!=="win32"&&(s.mode&0o077)!==0)return failure();return true;}
 catch(e){if(!create&&code(e,"ENOENT"))return false;throw e;}
}
// Explicit wrapper format and purpose-specific AAD prevent interchange with preparation/source backups.
function encode(s:Stored,key:Buffer){const iv=randomBytes(12),c=createCipheriv("aes-256-gcm",key,iv);c.setAAD(AAD);const plain=Buffer.from(JSON.stringify(s));try{const ciphertext=Buffer.concat([c.update(plain),c.final()]);return Buffer.from(JSON.stringify({version:1,iv:iv.toString("hex"),tag:c.getAuthTag().toString("hex"),ciphertext:ciphertext.toString("base64")}));}finally{plain.fill(0);}}
function decode(bytes:Buffer,key:Buffer):Stored {
 let plain:Buffer|undefined;
 try{const v:unknown=JSON.parse(bytes.toString());if(!exact(v,["version","iv","tag","ciphertext"])||v.version!==1||typeof v.iv!=="string"||!/^[a-f0-9]{24}$/.test(v.iv)||typeof v.tag!=="string"||!/^[a-f0-9]{32}$/.test(v.tag)||typeof v.ciphertext!=="string"||v.ciphertext.length>MAX_BYTES)return failure();const encrypted=Buffer.from(v.ciphertext,"base64");if(encrypted.toString("base64")!==v.ciphertext)return failure();const d=createDecipheriv("aes-256-gcm",key,Buffer.from(v.iv,"hex"));d.setAAD(AAD);d.setAuthTag(Buffer.from(v.tag,"hex"));plain=Buffer.concat([d.update(encrypted),d.final()]);const s:unknown=JSON.parse(plain.toString());validate(s);return s;}catch{return failure();}finally{plain?.fill(0);}
}
async function load(file:string,key:Buffer):Promise<{stored:Stored;revision:string}>{
 const initialized=await markerPresent(dirname(file));
 let fd;try{fd=await open(file,constants.O_RDONLY|(constants.O_NOFOLLOW??0));}catch(e){if(code(e,"ENOENT")&&!initialized)return {stored:empty(),revision:"EMPTY"};throw e;}
 try{if(!initialized)return failure();const stat=await fd.stat();if(!stat.isFile()||stat.nlink!==1||stat.size<1||stat.size>MAX_BYTES||process.platform!=="win32"&&(stat.mode&0o077)!==0)return failure();const bytes=Buffer.alloc(stat.size+1);let count=0;while(count<bytes.length){const r=await fd.read(bytes,count,bytes.length-count,null);if(!r.bytesRead)break;count+=r.bytesRead;}if(count!==stat.size)return failure();const retained=bytes.subarray(0,count);return {stored:decode(retained,key),revision:digest(retained)};}finally{await fd.close();}
}
async function markerPresent(dir:string){
 let fd;try{fd=await open(join(dir,MARKER),constants.O_RDONLY|(constants.O_NOFOLLOW??0));}catch(e){if(code(e,"ENOENT"))return false;throw e;}
 try{const stat=await fd.stat();if(!stat.isFile()||stat.nlink!==1||stat.size!==MARKER_BYTES.length||process.platform!=="win32"&&(stat.mode&0o077)!==0)return failure();const bytes=Buffer.alloc(MARKER_BYTES.length+1);const {bytesRead}=await fd.read(bytes,0,bytes.length,0);if(bytesRead!==MARKER_BYTES.length||!bytes.subarray(0,bytesRead).equals(MARKER_BYTES))return failure();return true;}finally{await fd.close();}
}
async function syncDirectory(dir:string){if(process.platform!=="win32"){const folder=await open(dir,"r");try{await folder.sync();}finally{await folder.close();}}}
async function save(dir:string,file:string,key:Buffer,s:Stored,initialize:boolean){
 validate(s);const bytes=encode(s,key);if(bytes.length>MAX_BYTES)return failure();
 if(initialize){const marker=await open(join(dir,MARKER),"wx",0o600);try{await marker.writeFile(MARKER_BYTES);await marker.sync();}finally{await marker.close();}await syncDirectory(dir);}
 const temporary=join(dir,".crm-delivery-"+randomUUID()+".tmp"),fd=await open(temporary,"wx",0o600);
 try{try{await fd.writeFile(bytes);await fd.sync();}finally{await fd.close();}await rename(temporary,file);await syncDirectory(dir);}finally{await unlink(temporary).catch(e=>{if(!code(e,"ENOENT"))throw e;});}return digest(bytes);
}
async function mutate(path:string,key:Buffer,expectedRevision:string,change:(s:Stored)=>{outcome:Outcome;changed:boolean;attemptToken?:string}){
 keyCheck(key);revisionCheck(expectedRevision);const dir=resolve(path);if(!await directory(dir,false)&&expectedRevision!=="EMPTY")return failure();await directory(dir,true);const file=join(dir,FILE);
 return withLeadStorageLock(file,async()=>{if(!await directory(dir,false))return failure();const prior=await load(file,key);if(prior.revision!==expectedRevision)return failure();const s=structuredClone(prior.stored),result=change(s);let revision=prior.revision;if(result.changed){if(s.sequence>=Number.MAX_SAFE_INTEGER)return failure();s.sequence++;revision=await save(dir,file,key,s,prior.revision==="EMPTY");}return snapshot(s,revision,result.outcome,result.attemptToken);});
}
/** Read-only stored state; expiry is durably assessed under lock by claim/confirm using their explicit clock. */
export async function readCRMDeliveryOutbox(path:string,key:Buffer){try{keyCheck(key);const dir=resolve(path);if(!await directory(dir,false))return snapshot(empty(),"EMPTY");const r=await load(join(dir,FILE),key);return snapshot(r.stored,r.revision);}catch{return failure();}}
/** Allocate source revisions under CAS lock, never infer provider delivery from an observation. */
export async function enqueueCRMDeliveryObservations(path:string,key:Buffer,expectedRevision:string,observations:readonly CRMDeliveryObservation[]){
 try{keyCheck(key);revisionCheck(expectedRevision);if(!Array.isArray(observations)||observations.length>100)return failure();const incoming=new Map<string,CRMDeliveryObservation>();for(const o of observations){observationCheck(o);if(time(o.observedAt)>Date.now())return failure();const old=incoming.get(binding(o));if(old&&(old.payloadFingerprint!==o.payloadFingerprint||old.canonicalRecordId!==o.canonicalRecordId))return failure();if(!old||time(o.observedAt)<time(old.observedAt))incoming.set(binding(o),{...o});}
  return await mutate(path,key,expectedRevision,s=>{let changed=false;for(const o of incoming.values()){
   const same=s.observations.filter(e=>binding(e)===binding(o)),latest=same.at(-1);
   if(s.observations.some(e=>e.sourceId===o.sourceId&&e.division!==o.division||e.canonicalRecordId===o.canonicalRecordId&&binding(e)!==binding(o))||latest&&latest.canonicalRecordId!==o.canonicalRecordId)return failure();
   if(latest?.payloadFingerprint===o.payloadFingerprint)continue;
   if(latest&&time(o.observedAt)<time(latest.observedAt)||s.observations.length>=MAX_HISTORY)return failure();
   const e={...o,sourceRevision:same.length+1};const idempotencyKey=crmHandoffIdempotencyKey(e);s.observations.push({...e,idempotencyKey});s.deliveries.push({idempotencyKey,state:"PENDING",attempt:null,receipt:null});changed=true;
  }return {outcome:changed?"ENQUEUED":"NOOP",changed};});
 }catch{return failure();}
}
function expire(s:Stored,now:number){let changed=false;for(const d of s.deliveries){if(d.state==="ACTIVE"&&d.attempt&&time(d.attempt.expiresAt)<=now){d.state="UNCERTAIN";changed=true;}}return changed;}
/** Claim only the oldest unacknowledged revision of a binding; expired attempts are never automatically retried. */
export async function claimCRMDeliveryAttempt(path:string,key:Buffer,expectedRevision:string,idempotencyKey:string,now:string){
 try{keyCheck(key);revisionCheck(expectedRevision);if(!hash(idempotencyKey)||!Number.isFinite(time(now))||!Number.isFinite(time(new Date(time(now)+120_000).toISOString())))return failure();
  return await mutate(path,key,expectedRevision,s=>{
   if(expire(s,time(now)))return {outcome:"HELD_UNCERTAIN",changed:true};
   const e=s.observations.find(o=>o.idempotencyKey===idempotencyKey),d=s.deliveries.find(x=>x.idempotencyKey===idempotencyKey);if(!e||!d||d.state!=="PENDING"||time(now)<time(e.observedAt))return failure();
   const related=s.observations.filter(o=>binding(o)===binding(e));
   if(related.some(o=>{const other=s.deliveries.find(x=>x.idempotencyKey===o.idempotencyKey)!;return o.sourceRevision<e.sourceRevision&&other.state!=="ACKNOWLEDGED"||other.state==="ACTIVE"||other.state==="UNCERTAIN"||other.receipt&&time(other.receipt.acknowledgedAt)>time(now);}))return failure();
   const attemptToken=randomBytes(32).toString("hex");d.state="ACTIVE";d.attempt={tokenHash:digest(attemptToken),claimedAt:now,expiresAt:new Date(time(now)+120_000).toISOString()};return {outcome:"CLAIMED",changed:true,attemptToken};
  });
 }catch{return failure();}
}
/** Retain a caller-supplied receipt only. This API performs no provider call or independent acknowledgement verification. */
export async function confirmCRMDelivery(path:string,key:Buffer,expectedRevision:string,ack:CRMDeliveryAcknowledgement,now:string){
 try{keyCheck(key);revisionCheck(expectedRevision);if(!exact(ack,["idempotencyKey","attemptToken","crmCaseId","providerRevision","responseFingerprint","acknowledgedAt"])||![ack.idempotencyKey,ack.attemptToken,ack.crmCaseId,ack.providerRevision,ack.responseFingerprint].every(hash)||!Number.isFinite(time(now))||!Number.isFinite(time(ack.acknowledgedAt))||time(ack.acknowledgedAt)>time(now))return failure();
  return await mutate(path,key,expectedRevision,s=>{
   if(expire(s,time(now)))return {outcome:"HELD_UNCERTAIN",changed:true};
   const e=s.observations.find(o=>o.idempotencyKey===ack.idempotencyKey),d=s.deliveries.find(x=>x.idempotencyKey===ack.idempotencyKey);if(!e||!d||!d.attempt||d.attempt.tokenHash!==digest(ack.attemptToken))return failure();
   const receipt:Receipt={crmCaseId:ack.crmCaseId,providerRevision:ack.providerRevision,responseFingerprint:ack.responseFingerprint,acknowledgedAt:ack.acknowledgedAt};
   if(d.state==="ACKNOWLEDGED"){if(JSON.stringify(d.receipt)!==JSON.stringify(receipt))return failure();return {outcome:"NOOP",changed:false};}
   if(d.state!=="ACTIVE"||time(now)<time(d.attempt.claimedAt)||time(ack.acknowledgedAt)<time(d.attempt.claimedAt))return failure();
   if(s.deliveries.some(other=>other.receipt&&(binding(s.observations.find(o=>o.idempotencyKey===other.idempotencyKey)!)===binding(e)?other.receipt.crmCaseId!==receipt.crmCaseId:other.receipt.crmCaseId===receipt.crmCaseId)))return failure();
   d.state="ACKNOWLEDGED";d.receipt=receipt;return {outcome:"ACKNOWLEDGED",changed:true};
  });
 }catch{return failure();}
}
