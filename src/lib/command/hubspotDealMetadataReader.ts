import {createHmac} from 'node:crypto';

const ORIGIN='https://api.hubapi.com',DEADLINE_MS=15_000,MAX_BYTES=262_144;
const fields=['ql_division','ql_originating_website','ql_inquiry_category','ql_provider_sharing_consent','ql_factoring_referral_stage'] as const;
type Field=typeof fields[number];
type Properties=Readonly<Record<Field,string|null>>;
type State='OBSERVED_METADATA'|'NOT_FOUND_NONDEFINITIVE'|'AUTHORIZATION_UNAVAILABLE'|'RATE_LIMITED'|'PROVIDER_UNAVAILABLE'|'INVALID_METADATA';
interface Result {schemaVersion:1;provider:'HUBSPOT';state:State;capturedAt:string;crmCaseId:string|null;providerRevision:string|null;responseFingerprint:string|null;createdAt:string|null;updatedAt:string|null;archived:boolean|null;properties:Properties|null;retryAfterSeconds:number|null;businessDataExecutionAllowed:false;writesCRM:false;deliveryOutcomeVerified:false}
interface Options {key:Buffer;portalId:string;token:()=>Promise<string>;request?:typeof fetch;clock?:()=>Date}
const fail=():never=>{throw Error('HubSpot metadata reader held; verify bounded identity, managed credentials and reader configuration.');};
const plain=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
const nativeID=(v:unknown):v is string=>typeof v==='string'&&/^[1-9][0-9]{0,29}$/.test(v);
function keyCheck(key:Buffer){if(!Buffer.isBuffer(key)||key.length!==32)return fail();}
function keyed(key:Buffer,purpose:string,value:unknown){
 const derived=createHmac('sha256',key).update('QUEST_HUBSPOT_DEAL_METADATA_V1:'+purpose).digest();
 try{return createHmac('sha256',derived).update(JSON.stringify(value)).digest('hex');}finally{derived.fill(0);}
}
/** Portal-scoped opaque DEAL identity only, never a source/canonical association. */
export function deriveHubSpotCRMCaseId(key:Buffer,id:string,portalId:string){keyCheck(key);if(!nativeID(id)||!nativeID(portalId))return fail();return keyed(key,'case-identity',[portalId,id]);}
function result(state:State,capturedAt:string,extra:Partial<Result>={}):Readonly<Result>{return Object.freeze({schemaVersion:1,provider:'HUBSPOT',state,capturedAt,crmCaseId:null,providerRevision:null,responseFingerprint:null,createdAt:null,updatedAt:null,archived:null,properties:null,retryAfterSeconds:null,...extra,businessDataExecutionAllowed:false,writesCRM:false,deliveryOutcomeVerified:false});}
function normalizedTime(v:unknown):string|null{
 if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(v)||!Number.isFinite(Date.parse(v)))return null;
 const expected=v.replace(/(?:\.(\d{1,3}))?Z$/,(_match,milliseconds:string|undefined)=>'.'+(milliseconds??'').padEnd(3,'0')+'Z'),normalized=new Date(v).toISOString();return normalized===expected?normalized:null;
}
function retryAfter(v:string|null){if(v===null||!/^\d{1,16}$/.test(v))return null;const n=Number(v);return Number.isSafeInteger(n)?Math.min(n,3600):null;}
async function boundedBody(response:Response):Promise<unknown>{
 const declared=response.headers.get('content-length');if(declared!==null&&(!/^\d{1,16}$/.test(declared)||Number(declared)>MAX_BYTES))throw Error();
 if(!response.body)return Promise.reject(Error());const reader=response.body.getReader(),chunks:Uint8Array[]=[];let total=0;
 try{while(true){const next=await reader.read();if(next.done)break;if(!(next.value instanceof Uint8Array))throw Error();total+=next.value.byteLength;if(total>MAX_BYTES)throw Error();chunks.push(next.value);}const bytes=Buffer.concat(chunks,total);try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}finally{bytes.fill(0);}}
 finally{void reader.cancel().catch(()=>{});reader.releaseLock();}
}
// Reviewed shared schema values; no dynamic schema discovery, field creation or fallback.
const enums:Readonly<Record<Field,readonly string[]>>={
 ql_division:['luxury_advisory','capital_advisory','property_acquisitions'],
 ql_originating_website:['questluxo_com','capital_questluxo_com','realty_questluxo_com'],
 ql_inquiry_category:['watch_sourcing','watch_selling_brokerage','business_financing','invoice_factoring','property_sale_acquisition','other_needs_review'],
 ql_provider_sharing_consent:['not_requested','pending','granted_evidence_verified','declined','withdrawn'],
 ql_factoring_referral_stage:['inquiry','initial_qualification','receivables_assessment','provider_matching','consent','provider_submission','underwriting_follow_up','funding_confirmation','referral_compensation_tracking'],
};
function observed(body:unknown,id:string,archived:boolean,capturedAt:string,key:Buffer,portalId:string):Readonly<Result>{
 if(!plain(body)||body.id!==id||body.archived!==archived||!plain(body.properties))return result('INVALID_METADATA',capturedAt);
 const createdAt=normalizedTime(body.createdAt),updatedAt=normalizedTime(body.updatedAt);
 if(!createdAt||!updatedAt||Date.parse(createdAt)>Date.parse(updatedAt)||Date.parse(updatedAt)>Date.parse(capturedAt))return result('INVALID_METADATA',capturedAt);
 if(Object.hasOwn(body.properties,'hs_object_id')&&body.properties.hs_object_id!==null&&body.properties.hs_object_id!==''&&body.properties.hs_object_id!==id)return result('INVALID_METADATA',capturedAt);
 const properties={} as Record<Field,string|null>;
 for(const field of fields){const v=Object.hasOwn(body.properties,field)?body.properties[field]:null;if(v===undefined||v===null||v==='')properties[field]=null;else if(typeof v==='string'&&enums[field].includes(v))properties[field]=v;else return result('INVALID_METADATA',capturedAt);}
 const safe=Object.freeze(properties),crmCaseId=deriveHubSpotCRMCaseId(key,id,portalId);
 return result('OBSERVED_METADATA',capturedAt,{crmCaseId,createdAt,updatedAt,archived,properties:safe,
  providerRevision:keyed(key,'provider-revision',{crmCaseId,updatedAt,archived,properties:safe}),responseFingerprint:keyed(key,'response-fingerprint',{crmCaseId,createdAt,updatedAt,archived,properties:safe})});
}
/**
 * Read-only known-ID V3 request. Five ql properties cannot establish delivery or source binding.
 * The caller must bind the configured portal to the approved token provider; this reader does
 * not verify token account ownership. Portal scoping prevents cross-portal opaque-ID collisions.
 */
export function createHubSpotDealMetadataReader({key,portalId,token,request=fetch,clock=()=>new Date()}:Options){
 keyCheck(key);if(!nativeID(portalId)||typeof token!=='function'||typeof request!=='function'||typeof clock!=='function')return fail();const protectedKey=Buffer.from(key);
 return Object.freeze({async read(id:string,options:{archived?:boolean}={}){
  if(!nativeID(id)||!plain(options)||Object.keys(options).some(k=>k!=='archived')||options.archived!==undefined&&typeof options.archived!=='boolean')return fail();
  const archived=options.archived??false;const getTime=()=>{const n=clock();if(!(n instanceof Date)||!Number.isFinite(n.getTime()))return fail();return n.toISOString();};
  const capturedAt=getTime(),controller=new AbortController();let phase:'TOKEN'|'PROVIDER'='TOKEN';
  const unavailable=()=>result(phase==='TOKEN'?'AUTHORIZATION_UNAVAILABLE':'PROVIDER_UNAVAILABLE',capturedAt);
  let timer:ReturnType<typeof setTimeout>|undefined;
  const deadline=new Promise<Readonly<Result>>(resolveDeadline=>{timer=setTimeout(()=>{controller.abort();resolveDeadline(unavailable());},DEADLINE_MS);});
  const work=(async()=>{
   let credential:string;try{credential=await token();}catch{return result('AUTHORIZATION_UNAVAILABLE',capturedAt);}
   if(controller.signal.aborted)return unavailable();
   if(typeof credential!=='string'||credential.length>8192||!/^[A-Za-z0-9._~+/-]+=*$/.test(credential))return result('AUTHORIZATION_UNAVAILABLE',capturedAt);
   phase='PROVIDER';const url=new URL(ORIGIN+'/crm/v3/objects/0-3/'+id);url.searchParams.set('properties',[...fields,'hs_object_id'].join(','));url.searchParams.set('archived',String(archived));
   let response:Response;try{response=await request(url.href,{method:'GET',headers:{Authorization:'Bearer '+credential,Accept:'application/json'},redirect:'error',signal:controller.signal});}catch{return result('PROVIDER_UNAVAILABLE',capturedAt);}
   credential='';if(controller.signal.aborted){void response.body?.cancel().catch(()=>{});return unavailable();}
   if(response.status!==200){void response.body?.cancel().catch(()=>{});const status=response.status;return result(status===404?'NOT_FOUND_NONDEFINITIVE':status===401||status===403?'AUTHORIZATION_UNAVAILABLE':status===429?'RATE_LIMITED':'PROVIDER_UNAVAILABLE',capturedAt,status===429?{retryAfterSeconds:retryAfter(response.headers.get('retry-after'))}:{});}
   try{const body=await boundedBody(response);if(controller.signal.aborted)return unavailable();return observed(body,id,archived,getTime(),protectedKey,portalId);}catch{return result('INVALID_METADATA',capturedAt);}
  })().catch(()=>unavailable());
  try{return await Promise.race([work,deadline]);}finally{if(timer!==undefined)clearTimeout(timer);controller.abort();}
 }});
}
