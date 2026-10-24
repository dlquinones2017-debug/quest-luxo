import {createHash} from "node:crypto";
import {constants} from "node:fs";
import {lstat,open,realpath,mkdtemp,rename,rm,unlink} from "node:fs/promises";
import {dirname,join,resolve,sep} from "node:path";
import {withLeadStorageLock} from "../leads/leadStorageLock.ts";
import {readCRMDeliveryOutbox} from "./crmDeliveryOutbox.ts";

const FILE="crm-delivery-outbox-v1.enc.json",MARKER="crm-delivery-outbox-v1.initialized";
const MARKER_BYTES=Buffer.from("QUEST_LUXO_CRM_DELIVERY_OUTBOX_V1_INITIALIZED\n");
const KIND="QUEST_CRM_DELIVERY_OUTBOX_ENCRYPTED_BACKUP",MAX_ENCRYPTED=3_000_000,MAX_ARCHIVE=4_100_000;
const metadataFields=["sequence","observationCount","pendingCount","activeCount","uncertainCount","acknowledgedCount"] as const;
interface Metadata {sequence:number;observationCount:number;pendingCount:number;activeCount:number;uncertainCount:number;acknowledgedCount:number}
interface Bundle extends Metadata {version:1;kind:typeof KIND;revision:string;createdAt:string;encrypted:string;marker:string}
const failure=():never=>{throw Error("CRM delivery outbox backup held; verify private paths, complete pair, managed key, revision and recovery target.");};
const hash=(bytes:Buffer)=>createHash("sha256").update(bytes).digest("hex");
const code=(e:unknown,c:string)=>e instanceof Error&&"code" in e&&e.code===c;
function keyCheck(key:Buffer){if(!Buffer.isBuffer(key)||key.length!==32)return failure();}
async function privateDirectory(path:string){const s=await lstat(path);if(!s.isDirectory()||s.isSymbolicLink()||await realpath(path)!==path||process.platform!=="win32"&&(s.mode&0o077)!==0)return failure();}
async function absent(path:string){try{await lstat(path);return failure();}catch(e){if(!code(e,"ENOENT"))throw e;}}
async function privateRead(path:string,maximum:number){
 if(await realpath(path)!==path)return failure();const fd=await open(path,constants.O_RDONLY|(constants.O_NOFOLLOW??0));
 try{const stat=await fd.stat();if(!stat.isFile()||stat.nlink!==1||stat.size<1||stat.size>maximum||process.platform!=="win32"&&(stat.mode&0o077)!==0)return failure();const bytes=Buffer.alloc(stat.size+1);let count=0;while(count<bytes.length){const r=await fd.read(bytes,count,bytes.length-count,null);if(!r.bytesRead)break;count+=r.bytesRead;}if(count!==stat.size)return failure();return bytes.subarray(0,count);}finally{await fd.close();}
}
async function syncDirectory(dir:string){if(process.platform!=="win32"){const fd=await open(dir,"r");try{await fd.sync();}finally{await fd.close();}}}
async function exclusiveWrite(path:string,bytes:Buffer){
 const fd=await open(path,"wx",0o600);let complete=false;
 try{try{await fd.writeFile(bytes);await fd.sync();complete=true;}finally{await fd.close();}await syncDirectory(dirname(path));}
 finally{if(!complete)await unlink(path).catch(e=>{if(!code(e,"ENOENT"))throw e;});}
}
function metadata(snapshot:Awaited<ReturnType<typeof readCRMDeliveryOutbox>>):Metadata{
 return {sequence:snapshot.sequence,observationCount:snapshot.observations.length,pendingCount:snapshot.deliveries.filter(d=>d.state==="PENDING").length,
  activeCount:snapshot.deliveries.filter(d=>d.state==="ACTIVE").length,uncertainCount:snapshot.deliveries.filter(d=>d.state==="UNCERTAIN").length,acknowledgedCount:snapshot.deliveries.filter(d=>d.state==="ACKNOWLEDGED").length};
}
function report(revision:string,m:Metadata,authenticated:boolean){return Object.freeze({version:1,revision,...m,authenticated,scope:"INTERNAL_DELIVERY_METADATA_ONLY",independentRetentionVerified:false,
 businessDataExecutionAllowed:false,writesCRM:false,providerAcknowledgementIndependentlyVerified:false,receiptAttestation:"CALLER_SUPPLIED_UNVERIFIED"});}
function decodeBundle(bytes:Buffer):{bundle:Bundle;encrypted:Buffer;marker:Buffer}{
 const v:unknown=JSON.parse(bytes.toString());const keys=["version","kind","revision","createdAt","encrypted","marker",...metadataFields];
 if(!v||typeof v!=="object"||Array.isArray(v)||Object.keys(v).sort().join()!==keys.sort().join())return failure();const b=v as Bundle;
 if(b.version!==1||b.kind!==KIND||typeof b.revision!=="string"||!/^[a-f0-9]{64}$/.test(b.revision)||typeof b.createdAt!=="string"||!Number.isFinite(Date.parse(b.createdAt))||new Date(b.createdAt).toISOString()!==b.createdAt||Date.parse(b.createdAt)>Date.now()||
  typeof b.encrypted!=="string"||b.encrypted.length<1||b.encrypted.length>4_000_000||typeof b.marker!=="string"||b.marker.length!==MARKER_BYTES.toString("base64").length||
  !Number.isSafeInteger(b.sequence)||b.sequence<1||metadataFields.slice(1).some(f=>!Number.isSafeInteger(b[f])||b[f]<0||b[f]>1000)||b.pendingCount+b.activeCount+b.uncertainCount+b.acknowledgedCount!==b.observationCount)return failure();
 const encrypted=Buffer.from(b.encrypted,"base64"),marker=Buffer.from(b.marker,"base64");
 if(encrypted.length<1||encrypted.length>MAX_ENCRYPTED||encrypted.toString("base64")!==b.encrypted||hash(encrypted)!==b.revision||marker.toString("base64")!==b.marker||!marker.equals(MARKER_BYTES))return failure();
 return {bundle:b,encrypted,marker};
}
/** Consistent ciphertext+initialization intent pair; does not certify offsite retention or independent key custody. */
export async function exportCRMDeliveryOutboxBackup(directory:string,archive:string,key:Buffer){
 try{keyCheck(key);const source=resolve(directory),destination=resolve(archive),parent=dirname(destination);await privateDirectory(source);await privateDirectory(parent);
  if(destination===source||destination.startsWith(source+sep))return failure();await absent(destination);
  return await withLeadStorageLock(join(source,FILE),async()=>{
   await privateDirectory(source);await privateDirectory(parent);await absent(destination);
   const snapshot=await readCRMDeliveryOutbox(source,key);if(snapshot.revision==="EMPTY")return failure();
   const encrypted=await privateRead(join(source,FILE),MAX_ENCRYPTED),marker=await privateRead(join(source,MARKER),MARKER_BYTES.length);
   if(hash(encrypted)!==snapshot.revision||!marker.equals(MARKER_BYTES))return failure();
   const after=await readCRMDeliveryOutbox(source,key);if(after.revision!==snapshot.revision)return failure();
   const m=metadata(snapshot),bundle:Bundle={version:1,kind:KIND,revision:snapshot.revision,createdAt:new Date().toISOString(),encrypted:encrypted.toString("base64"),marker:marker.toString("base64"),...m};
   const bytes=Buffer.from(JSON.stringify(bundle));if(bytes.length>MAX_ARCHIVE)return failure();await exclusiveWrite(destination,bytes);return report(snapshot.revision,m,true);
  });
 }catch{return failure();}
}
/**
 * Publish a complete NEW directory under an existing private canonical parent.
 * A fixed target-level lock serializes cooperating restores. The final absence check
 * and rename require that no noncooperating writer modifies this trusted private
 * parent: portable Node rename cannot express Linux RENAME_NOREPLACE for directories.
 * Existing targets are never intentionally replaced, including empty directories.
 */
export async function restoreCRMDeliveryOutboxBackup(archive:string,target:string,key:Buffer){
 try{keyCheck(key);const source=resolve(archive),destination=resolve(target),parent=dirname(destination);await privateDirectory(dirname(source));await privateDirectory(parent);await absent(destination);
  const {bundle,encrypted,marker}=decodeBundle(await privateRead(source,MAX_ARCHIVE));
  return await withLeadStorageLock(destination,async()=>{
   await privateDirectory(parent);await absent(destination);let staging:string|undefined,published=false;
   try{staging=await mkdtemp(join(parent,".crm-outbox-restore-"));await privateDirectory(staging);await exclusiveWrite(join(staging,MARKER),marker);await exclusiveWrite(join(staging,FILE),encrypted);
    const recovered=await readCRMDeliveryOutbox(staging,key),m=metadata(recovered);
    if(recovered.revision!==bundle.revision||metadataFields.some(f=>m[f]!==bundle[f]))return failure();
    await privateDirectory(parent);await absent(destination);await rename(staging,destination);published=true;await syncDirectory(parent);
    return report(recovered.revision,m,true);
   }finally{if(staging&&!published)await rm(staging,{recursive:true,force:true});}
  });
 }catch{return failure();}
}
