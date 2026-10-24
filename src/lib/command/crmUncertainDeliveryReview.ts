import {crmHandoffIdempotencyKey} from './crmReconciliationPlan.ts';

const hash=(v:unknown):v is string=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
const iso=(v:unknown):v is string=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const exact=(v:unknown,fields:string[]):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===[...fields].sort().join();
const fail=():never=>{throw Error('Uncertain delivery review held; verify bounded current metadata and explicit case binding.');};
const divisionValues={LUXURY_ADVISORY:'luxury_advisory',CAPITAL_ADVISORY:'capital_advisory',REALTY:'property_acquisitions'} as const;
const providerStates=['OBSERVED_METADATA','NOT_FOUND_NONDEFINITIVE','AUTHORIZATION_UNAVAILABLE','RATE_LIMITED','PROVIDER_UNAVAILABLE','INVALID_METADATA'];
const propertyNames=['ql_division','ql_originating_website','ql_inquiry_category','ql_provider_sharing_consent','ql_factoring_referral_stage'];
/** Read-only review. Current provider fields cannot establish whether a specific uncertain event was applied. */
export function reviewUncertainCRMDelivery(input:unknown,now:string){
 if(!iso(now)||!exact(input,['schemaVersion','mode','outboxRevision','observation','delivery','binding','provider','maxAgeSeconds'])||input.schemaVersion!==1||input.mode!=='UNCERTAIN_REVIEW_ONLY'||!hash(input.outboxRevision)||!Number.isSafeInteger(input.maxAgeSeconds)||(input.maxAgeSeconds as number)<1||(input.maxAgeSeconds as number)>3600)return fail();
 const o=input.observation,d=input.delivery,b=input.binding,p=input.provider,current=Date.parse(now);
 if(!exact(o,['division','sourceId','sourceRecordId','canonicalRecordId','payloadFingerprint','observedAt','sourceRevision','idempotencyKey'])||!hash(o.canonicalRecordId)||!hash(o.payloadFingerprint)||!iso(o.observedAt)||Date.parse(o.observedAt)>current||!hash(o.idempotencyKey))return fail();
 // Reuse the stable event identity validator, including division/source/revision bounds.
 try{if(crmHandoffIdempotencyKey(o as never)!==o.idempotencyKey)return fail();}catch{return fail();}
 if(!exact(d,['idempotencyKey','state','attempt','receipt'])||d.idempotencyKey!==o.idempotencyKey||d.state!=='UNCERTAIN'||d.receipt!==null||!exact(d.attempt,['tokenHash','claimedAt','expiresAt'])||!hash(d.attempt.tokenHash)||!iso(d.attempt.claimedAt)||!iso(d.attempt.expiresAt)||Date.parse(d.attempt.claimedAt)<Date.parse(o.observedAt)||Date.parse(d.attempt.expiresAt)-Date.parse(d.attempt.claimedAt)!==120000||Date.parse(d.attempt.expiresAt)>current)return fail();
 if(!exact(b,['state','crmCaseId','evidenceRef','reviewedAt','expiresAt'])||!['REVIEWED','UNREVIEWED'].includes(b.state as string))return fail();
 if(b.state==='UNREVIEWED'){if([b.crmCaseId,b.evidenceRef,b.reviewedAt,b.expiresAt].some(v=>v!==null))return fail();}
 else if(!hash(b.crmCaseId)||!hash(b.evidenceRef)||!iso(b.reviewedAt)||!iso(b.expiresAt)||Date.parse(b.reviewedAt)>current||Date.parse(b.expiresAt)<=Date.parse(b.reviewedAt))return fail();
 if(!exact(p,['schemaVersion','provider','state','capturedAt','crmCaseId','providerRevision','responseFingerprint','createdAt','updatedAt','archived','properties','retryAfterSeconds','businessDataExecutionAllowed','writesCRM','deliveryOutcomeVerified'])||p.schemaVersion!==1||p.provider!=='HUBSPOT'||!providerStates.includes(p.state as string)||!iso(p.capturedAt)||[p.businessDataExecutionAllowed,p.writesCRM,p.deliveryOutcomeVerified].some(v=>v!==false)||!(p.retryAfterSeconds===null||Number.isSafeInteger(p.retryAfterSeconds)&&(p.retryAfterSeconds as number)>=0&&(p.retryAfterSeconds as number)<=86400))return fail();
 if(p.state==='OBSERVED_METADATA'){
  if(!hash(p.crmCaseId)||!hash(p.providerRevision)||!hash(p.responseFingerprint)||!iso(p.createdAt)||!iso(p.updatedAt)||Date.parse(p.createdAt)>Date.parse(p.updatedAt)||Date.parse(p.updatedAt)>Date.parse(p.capturedAt)+15000||typeof p.archived!=='boolean'||!exact(p.properties,propertyNames)||Object.values(p.properties).some(v=>v!==null&&(typeof v!=='string'||v.length>80))||p.retryAfterSeconds!==null)return fail();
 }else if([p.crmCaseId,p.providerRevision,p.responseFingerprint,p.createdAt,p.updatedAt,p.archived,p.properties].some(v=>v!==null)||p.state!=='RATE_LIMITED'&&p.retryAfterSeconds!==null)return fail();
 const age=current-Date.parse(p.capturedAt),ttl=(input.maxAgeSeconds as number)*1000;
 let state:string;
 if(age<0||age>ttl)state='HOLD_STALE_PROVIDER_EVIDENCE';
 else if(p.state==='NOT_FOUND_NONDEFINITIVE')state='HOLD_ABSENCE_NONDEFINITIVE';
 else if(p.state==='AUTHORIZATION_UNAVAILABLE')state='HOLD_PROVIDER_AUTHORIZATION';
 else if(p.state==='RATE_LIMITED')state='HOLD_PROVIDER_RATE_LIMIT';
 else if(p.state!=='OBSERVED_METADATA')state='HOLD_PROVIDER_UNAVAILABLE';
 else if(b.state!=='REVIEWED'||Date.parse(b.expiresAt as string)<=current||current-Date.parse(b.reviewedAt as string)>ttl)state='HOLD_CASE_BINDING_REVIEW';
 else if(p.archived===true)state='HOLD_ARCHIVED_CASE';
 else if(p.crmCaseId!==b.crmCaseId)state='HOLD_CASE_BINDING_CONFLICT';
 else if((p.properties as Record<string,unknown>).ql_division===null)state='HOLD_PROVIDER_DIVISION_UNKNOWN';
 else if((p.properties as Record<string,unknown>).ql_division!==divisionValues[o.division as keyof typeof divisionValues])state='HOLD_DIVISION_CONFLICT';
 else state='HOLD_OPERATION_EVIDENCE_REQUIRED';
 return Object.freeze({schemaVersion:1,mode:'UNCERTAIN_REVIEW_ONLY',assessedAt:now,state,ownerTeamId:'enterprise-operations',outboxRevision:input.outboxRevision,idempotencyKey:o.idempotencyKey,
  receiptAttestation:'CALLER_SUPPLIED_UNVERIFIED',requiredEvidence:Object.freeze(['REVIEWED_NATIVE_CASE_BINDING','SOURCE_EVENT_AND_REVISION_BINDING','OPERATION_SPECIFIC_PROVIDER_EVIDENCE']),
  preservesUncertainState:true,providerReadOutcome:p.state,retryAfterSeconds:p.retryAfterSeconds,
  deliveryOutcomeVerified:false,acknowledgementAllowed:false,retryAllowed:false,checkpointAdvancementAllowed:false,businessDataExecutionAllowed:false,writesCRM:false,sendsMessages:false,modelApiRequestsAllowed:false});
}
