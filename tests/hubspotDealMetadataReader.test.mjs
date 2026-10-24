import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createHubSpotDealMetadataReader,deriveHubSpotCRMCaseId} from '../src/lib/command/hubspotDealMetadataReader.ts';
const key=randomBytes(32),portalId='12345',id='123456789012345',secret='pat-test-private-credential',now='2026-10-24T02:30:00.000Z';
const fields=['ql_division','ql_originating_website','ql_inquiry_category','ql_provider_sharing_consent','ql_factoring_referral_stage'];
const properties={ql_division:'luxury_advisory',ql_originating_website:'questluxo_com',ql_inquiry_category:'watch_sourcing',ql_provider_sharing_consent:'not_requested',ql_factoring_referral_stage:null};
const body=(patch={})=>({id,createdAt:'2026-10-24T02:00:00Z',updatedAt:'2026-10-24T02:22:00.000Z',archived:false,properties:{...properties,hs_object_id:id},...patch});
const response=(value=body(),status=200,headers={})=>new Response(JSON.stringify(value),{status,headers});
const reader=(request,extra={})=>createHubSpotDealMetadataReader({key,portalId,token:async()=>secret,request,clock:()=>new Date(now),...extra});
const flags=r=>{for(const name of ['businessDataExecutionAllowed','writesCRM','deliveryOutcomeVerified'])assert.equal(r[name],false);};
const noIdentifiers=r=>{const text=JSON.stringify(r);for(const raw of [secret,id,'private@example.test','Sensitive freeform'])assert(!text.includes(raw));};
test('known native ID uses only fixed HTTPS GET path, minimal properties, header credentials and no redirect/retry/body',async()=>{
 let calls=0;const read=reader(async(url,options)=>{calls++;const parsed=new URL(url);assert.equal(parsed.origin,'https://api.hubapi.com');assert.equal(parsed.pathname,'/crm/v3/objects/0-3/'+id);assert.deepEqual([...parsed.searchParams.keys()].sort(),['archived','properties']);assert.equal(parsed.searchParams.get('archived'),'false');assert.deepEqual(parsed.searchParams.get('properties').split(','),[...fields,'hs_object_id']);assert.equal(options.method,'GET');assert.equal(options.redirect,'error');assert.equal(Object.hasOwn(options,'body'),false);assert.equal(options.headers.Authorization,'Bearer '+secret);assert(options.signal instanceof AbortSignal);return response();});
 const r=await read.read(id);assert.equal(calls,1);assert.equal(r.state,'OBSERVED_METADATA');assert.equal(r.createdAt,'2026-10-24T02:00:00.000Z');assert.equal(r.updatedAt,'2026-10-24T02:22:00.000Z');assert.equal(r.capturedAt,now);assert.deepEqual(r.properties,properties);for(const field of ['crmCaseId','providerRevision','responseFingerprint'])assert.match(r[field],/^[a-f0-9]{64}$/);assert.equal(r.crmCaseId,deriveHubSpotCRMCaseId(key,id,portalId));assert.notEqual(r.providerRevision,r.responseFingerprint);flags(r);noIdentifiers(r);
 assert.deepEqual(Object.keys(r).sort(),['schemaVersion','provider','state','capturedAt','crmCaseId','providerRevision','responseFingerprint','createdAt','updatedAt','archived','properties','retryAfterSeconds','businessDataExecutionAllowed','writesCRM','deliveryOutcomeVerified'].sort());assert.throws(()=>r.properties.ql_division='other');assert.throws(()=>r.state='VERIFIED');
});
test('identity is purpose/key separated; normal date variants and ignored freeform metadata do not change revision',async()=>{
 const a=await reader(async()=>response()).read(id),b=await reader(async()=>response(body({updatedAt:'2026-10-24T02:22:00Z',properties:{...properties,hs_object_id:id,email:'private@example.test',message:'Sensitive freeform',source_record_id:'raw'},name:'Sensitive freeform'}))).read(id);assert.equal(a.providerRevision,b.providerRevision);assert.equal(a.responseFingerprint,b.responseFingerprint);noIdentifiers(b);
 const c=await reader(async()=>response(body({properties:{...properties,ql_provider_sharing_consent:'withdrawn'}}))).read(id);assert.notEqual(c.providerRevision,a.providerRevision);
 const newer=await reader(async()=>response(body({updatedAt:'2026-10-24T02:23:00.1Z'}))).read(id);assert.equal(newer.updatedAt,'2026-10-24T02:23:00.100Z');assert.notEqual(newer.providerRevision,a.providerRevision);
 const otherKey=randomBytes(32);try{assert.notEqual(deriveHubSpotCRMCaseId(otherKey,id,portalId),a.crmCaseId);}finally{otherKey.fill(0);}assert.notEqual(deriveHubSpotCRMCaseId(key,'123456789012346',portalId),a.crmCaseId);
 const otherPortal=await reader(async()=>response(),{portalId:'12346'}).read(id);for(const name of ['crmCaseId','providerRevision','responseFingerprint'])assert.notEqual(otherPortal[name],a[name]);
});
test('native IDs, options and key configuration reject before credentials or transport',async()=>{
 let accesses=0;const r=reader(async()=>{accesses++;return response();},{token:async()=>{accesses++;return secret;}});
 for(const value of [0,123,null,'','0','01','-1','1.0','1e3','1/2','https://evil.test','1?properties=email','９','1'.repeat(31)]){await assert.rejects(()=>r.read(value));assert.throws(()=>deriveHubSpotCRMCaseId(key,value,portalId));assert.throws(()=>reader(async()=>{accesses++;return response();},{portalId:value}));assert.throws(()=>deriveHubSpotCRMCaseId(key,id,value));}
 for(const options of [{archived:'false'},{idProperty:'email'},{url:'https://evil.test'},null])await assert.rejects(()=>r.read(id,options));assert.equal(accesses,0);
 assert.throws(()=>createHubSpotDealMetadataReader({key:Buffer.alloc(33),portalId,token:async()=>secret}));assert.throws(()=>deriveHubSpotCRMCaseId(Buffer.alloc(31),id,portalId));assert.throws(()=>createHubSpotDealMetadataReader({key,token:async()=>{accesses++;return secret;}}));assert.throws(()=>deriveHubSpotCRMCaseId(key,id));assert.equal(accesses,0);
});
test('archived option is explicit and never infers an active/archived match from a mismatched response',async()=>{
 for(const archived of [false,true]){const r=await reader(async(url)=>{assert.equal(new URL(url).searchParams.get('archived'),String(archived));return response(body({archived}));}).read(id,{archived});assert.equal(r.state,'OBSERVED_METADATA');assert.equal(r.archived,archived);flags(r);}
 assert.equal((await reader(async()=>response(body({archived:true}))).read(id)).state,'INVALID_METADATA');
});
test('missing/null/empty enum properties remain unknown nulls; native hs_object_id may be absent but cannot disagree',async()=>{
 for(const p of [{},{ql_division:null,ql_originating_website:''},{hs_object_id:null}]){const r=await reader(async()=>response(body({properties:p}))).read(id);assert.equal(r.state,'OBSERVED_METADATA');assert.deepEqual(r.properties,Object.fromEntries(fields.map(f=>[f,null])));flags(r);}
 const valid=await reader(async()=>response(body({properties:{ql_division:'property_acquisitions',ql_originating_website:'realty_questluxo_com',ql_inquiry_category:'property_sale_acquisition'}}))).read(id);assert.equal(valid.properties.ql_division,'property_acquisitions');assert.equal(valid.properties.ql_provider_sharing_consent,null);
 assert.equal((await reader(async()=>response(body({properties:{...properties,hs_object_id:'999'}}))).read(id)).state,'INVALID_METADATA');
});
test('all reviewed enum options are accepted as metadata, never as permission or provider delivery evidence',async()=>{
 const options={ql_division:['luxury_advisory','capital_advisory','property_acquisitions'],ql_originating_website:['questluxo_com','capital_questluxo_com','realty_questluxo_com'],ql_inquiry_category:['watch_sourcing','watch_selling_brokerage','business_financing','invoice_factoring','property_sale_acquisition','other_needs_review'],ql_provider_sharing_consent:['not_requested','pending','granted_evidence_verified','declined','withdrawn'],ql_factoring_referral_stage:['inquiry','initial_qualification','receivables_assessment','provider_matching','consent','provider_submission','underwriting_follow_up','funding_confirmation','referral_compensation_tracking']};
 for(const [field,values]of Object.entries(options))for(const value of values){const r=await reader(async()=>response(body({properties:{...properties,[field]:value}}))).read(id);assert.equal(r.state,'OBSERVED_METADATA');assert.equal(r.properties[field],value);flags(r);}
});
test('invalid enum, dates, native identity or shape yields generic metadata hold without any customer values',async()=>{
 const values=[body({id:'999'}),body({id:123456789012345}),body({properties:null}),body({properties:{...properties,ql_division:'REALTY'}}),body({properties:{...properties,ql_provider_sharing_consent:false}}),body({properties:{...properties,ql_inquiry_category:'private@example.test'}}),body({createdAt:'2026-02-31T00:00:00Z'}),body({updatedAt:'2026-10-24T02:31:00Z'}),body({updatedAt:'2026-10-23T00:00:00Z'}),body({archived:'false'}),{error:'private@example.test'}];
 for(const value of values){const r=await reader(async()=>response(value)).read(id);assert.equal(r.state,'INVALID_METADATA');for(const k of ['crmCaseId','providerRevision','responseFingerprint','properties','createdAt','updatedAt','archived'])assert.equal(r[k],null);flags(r);noIdentifiers(r);}
});
test('HTTP statuses remain nondefinitive and Retry-After is bounded metadata without automatic retries',async()=>{
 for(const [status,state]of [[401,'AUTHORIZATION_UNAVAILABLE'],[403,'AUTHORIZATION_UNAVAILABLE'],[404,'NOT_FOUND_NONDEFINITIVE'],[429,'RATE_LIMITED'],[500,'PROVIDER_UNAVAILABLE'],[503,'PROVIDER_UNAVAILABLE'],[302,'PROVIDER_UNAVAILABLE']]){let calls=0;const r=await reader(async()=>{calls++;return response({error:'private@example.test'},status,{'retry-after':'7200'});}).read(id);assert.equal(calls,1);assert.equal(r.state,state);assert.equal(r.crmCaseId,null);assert.equal(r.properties,null);assert.equal(r.retryAfterSeconds,status===429?3600:null);flags(r);noIdentifiers(r);}
 for(const [header,expected]of [['0',0],['30',30],['-1',null],['soon',null],['9999999999999999',null]])assert.equal((await reader(async()=>response({},429,{'retry-after':header})).read(id)).retryAfterSeconds,expected);
});
test('credential failures are unavailable and never reach transport; network failures disclose no raw errors',async()=>{
 for(const provider of [async()=>{throw Error(secret+' private@example.test');},async()=>'',async()=>secret+'\r\nInjected:yes',async()=>'x'.repeat(8193)]){let calls=0;const r=await reader(async()=>{calls++;return response();},{token:provider}).read(id);assert.equal(calls,0);assert.equal(r.state,'AUTHORIZATION_UNAVAILABLE');noIdentifiers(r);}
 const r=await reader(async()=>{throw Error(secret+' private@example.test');}).read(id);assert.equal(r.state,'PROVIDER_UNAVAILABLE');noIdentifiers(r);
 await assert.rejects(()=>reader(async()=>response(),{clock:()=>new Date(NaN)}).read(id));
});
test('streamed/declared byte bounds, malformed JSON and invalid UTF8 hold without echoing bodies',async()=>{
 const requests=[async()=>new Response('x'.repeat(262145)),async()=>new Response('{}',{headers:{'content-length':'262145'}}),async()=>new Response('{"email":"private@example.test"'),async()=>new Response(new Uint8Array([255,254])),async()=>new Response(null)];
 for(const request of requests){const r=await reader(request).read(id);assert.equal(r.state,'INVALID_METADATA');noIdentifiers(r);}
 const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(' '.repeat(131073)));controller.enqueue(new TextEncoder().encode(' '.repeat(131073)));controller.close();}});assert.equal((await reader(async()=>new Response(stream)).read(id)).state,'INVALID_METADATA');
});
test('full deadline bounds a credential provider that never settles and prevents a late transport request',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let resolveToken,calls=0;const token=new Promise(resolve=>resolveToken=resolve),pending=reader(async()=>{calls++;return response();},{token:()=>token}).read(id);
 t.mock.timers.tick(15000);const r=await pending;assert.equal(r.state,'AUTHORIZATION_UNAVAILABLE');resolveToken(secret);await Promise.resolve();await Promise.resolve();assert.equal(calls,0);
});
test('full deadline bounds both signal-ignoring fetch and a stalled response body',async t=>{
 t.mock.timers.enable({apis:['setTimeout']});let signal,requested;const entered=new Promise(resolve=>requested=resolve),r=reader(async(_url,options)=>{signal=options.signal;requested();return new Promise(()=>{});});const pending=r.read(id);await entered;t.mock.timers.tick(15000);assert.equal((await pending).state,'PROVIDER_UNAVAILABLE');assert.equal(signal.aborted,true);
 let started;const streaming=new Promise(resolve=>started=resolve),stream=new ReadableStream({pull(){started();return new Promise(()=>{});}}),bodyRead=reader(async()=>new Response(stream)).read(id);await streaming;await Promise.resolve();await Promise.resolve();t.mock.timers.tick(15000);assert.equal((await bodyRead).state,'PROVIDER_UNAVAILABLE');
});
