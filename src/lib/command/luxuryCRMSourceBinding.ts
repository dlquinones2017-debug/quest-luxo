import { createHmac } from 'node:crypto';
import { leadIntentValues } from '../leads/leadIntakeContext.ts';

const SOURCE='luxury-canonical-jsonl';
const payloadFields=['name','email','phone','intent','brand','collection','reference','desiredWatch','budget','timeline','message','source','createdAt'];
const required=['id','status','notes','notesUpdatedAt','tags','tagsUpdatedAt','economicsSnapshots','payload','savedAt'];
const fail=():never=>{throw Error('Luxury source binding held; verify canonical format, opaque identity and observation time.');};
const plain=(v:unknown):v is Record<string,unknown>=>!!v && typeof v==='object' && Object.getPrototypeOf(v)===Object.prototype;
const iso=(v:unknown):v is string=>typeof v==='string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString()===v;
function canonical(value:unknown):string {
  let budget=262144,nodes=0;
  const reserve=(s:string)=>{budget-=Buffer.byteLength(s);if(budget<0)return fail();return s;};
  const visit=(v:unknown,depth:number):string=>{
    if(depth>12 || ++nodes>10000)return fail();
    if(v===null || typeof v==='boolean')return reserve(JSON.stringify(v));
    if(typeof v==='string' && v.length<=20000)return reserve(JSON.stringify(v));
    if(typeof v==='number' && Number.isFinite(v))return reserve(JSON.stringify(v));
    if(Array.isArray(v) && v.length<=1000){reserve('['+','.repeat(v.length)+']');return '['+v.map(x=>visit(x,depth+1)).join(',')+']';}
    if(plain(v) && Object.keys(v).length<=100){reserve('{'+','.repeat(Object.keys(v).length)+'}');return '{'+Object.keys(v).sort().map(k=>reserve(JSON.stringify(k)+':')+visit(v[k],depth+1)).join(',')+'}';}
    return fail();
  };
  return visit(value,0);
}
function keyed(key:Buffer,purpose:string,value:unknown) {
  let derived:Buffer|undefined,bytes:Buffer|undefined;
  try { bytes=Buffer.from(canonical(value));derived=createHmac('sha256',key).update('QUEST_LUXURY_CRM_SOURCE_V1:'+purpose).digest();
    if(bytes.length>262144)return fail();return createHmac('sha256',derived).update(bytes).digest('hex'); }
  finally { derived?.fill(0);bytes?.fill(0); }
}
/** Pure projection of the current normalized TS canonical format. No reader, source attestation or CRM client. */
export function createLuxuryCRMObservation(record:unknown,key:Buffer,observedAt:string) {
  if(!Buffer.isBuffer(key) || key.length!==32 || !iso(observedAt) || !plain(record) ||
    required.some(k=>!Object.hasOwn(record,k)) || Object.keys(record).some(k=>![...required,'emailDelivery'].includes(k)) ||
    typeof record.id!=='string' || !/^lead_[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(record.id) ||
    !['new','contacted','sourcing','offer-sent','closed','lost'].includes(record.status as string) ||
    typeof record.notes!=='string' || record.notes.length>20000 || !Array.isArray(record.tags) || record.tags.length>100 ||
    record.tags.some(t=>typeof t!=='string' || t.length>160) || !Array.isArray(record.economicsSnapshots) || record.economicsSnapshots.length>100 ||
    !iso(record.savedAt) || Date.parse(record.savedAt)>Date.parse(observedAt) ||
    !plain(record.payload) || Object.keys(record.payload).sort().join()!==[...payloadFields].sort().join())return fail();
  const payload=record.payload;
  if(payload.intent!==null && !leadIntentValues.includes(payload.intent as typeof leadIntentValues[number]))return fail();
  for(const field of payloadFields){
    const v=payload[field];
    if(field==='createdAt'){if(!iso(v) || Date.parse(v)>Date.parse(observedAt))return fail();}
    else if(field==='source'){if(typeof v!=='string' || v.length>160)return fail();}
    else if(v!==null && (typeof v!=='string' || v.length>4000))return fail();
  }
  for(const field of ['notesUpdatedAt','tagsUpdatedAt'])if(record[field]!==null && (!iso(record[field]) || Date.parse(record[field])>Date.parse(observedAt)))return fail();
  // Operational delivery notifications are excluded: SMTP changes do not create new business revisions.
  const content={payload,status:record.status,notes:record.notes,notesUpdatedAt:record.notesUpdatedAt,tags:record.tags,tagsUpdatedAt:record.tagsUpdatedAt,economicsSnapshots:record.economicsSnapshots,savedAt:record.savedAt};
  const observation=Object.freeze({division:'LUXURY_ADVISORY' as const,sourceId:SOURCE,
    sourceRecordId:keyed(key,'source-identity',[SOURCE,record.id]),canonicalRecordId:keyed(key,'canonical-identity',[SOURCE,record.id]),
    payloadFingerprint:keyed(key,'content-fingerprint',content),observedAt});
  return Object.freeze({schemaVersion:1,mode:'INTERNAL_SOURCE_PROJECTION_ONLY',observation,
    sourceAuthority:'CALLER_SUPPLIED_UNVERIFIED',sourceCompletenessVerified:false,qualificationState:'UNKNOWN',processingConsent:'UNKNOWN',
    providerSharingConsent:'UNKNOWN',sourceWebsiteVerified:false,businessDataExecutionAllowed:false,writesCRM:false,sendsMessages:false,modelApiRequestsAllowed:false});
}
