import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {createLuxuryCRMObservation} from '../src/lib/command/luxuryCRMSourceBinding.ts';
const at='2026-10-24T01:00:00.000Z';
const row=()=>({id:'lead_12345678-1234-4123-8123-123456789abc',status:'new',notes:'',notesUpdatedAt:null,tags:[],tagsUpdatedAt:null,economicsSnapshots:[],savedAt:at,
 payload:{name:'Synthetic Example',email:'synthetic@example.test',phone:null,intent:'request-this-watch',brand:null,collection:null,reference:null,desiredWatch:'Synthetic watch',budget:null,timeline:null,message:null,source:'begin-your-quest',createdAt:at}});
test('keyed identities stay stable while content changes; no PII, inferred consent or transport escapes',()=>{
 const key=randomBytes(32),source=row(),before=JSON.stringify(source);const first=createLuxuryCRMObservation(source,key,at);
 const changed=createLuxuryCRMObservation({...source,status:'closed',emailDelivery:{delivered:true}},key,at);
 assert.equal(first.observation.sourceRecordId,changed.observation.sourceRecordId);assert.equal(first.observation.canonicalRecordId,changed.observation.canonicalRecordId);
 assert.notEqual(first.observation.sourceRecordId,first.observation.canonicalRecordId);assert.notEqual(first.observation.payloadFingerprint,changed.observation.payloadFingerprint);
 assert.notEqual(first.observation.sourceRecordId,createLuxuryCRMObservation(source,randomBytes(32),at).observation.sourceRecordId);
 assert.equal(JSON.stringify(first).includes('synthetic@example.test'),false);assert.equal(JSON.stringify(first).includes(source.id),false);
 assert.equal(changed.processingConsent,'UNKNOWN');assert.equal(changed.qualificationState,'UNKNOWN');assert.equal(changed.providerSharingConsent,'UNKNOWN');assert.equal(changed.businessDataExecutionAllowed,false);
 assert.equal(JSON.stringify(source),before);assert(Object.isFrozen(first.observation));key.fill(0);
});
test('notification-only changes and object-key order do not alter source content fingerprints',()=>{
 const key=randomBytes(32),source=row(),a=createLuxuryCRMObservation(source,key,at),b=createLuxuryCRMObservation({...source,emailDelivery:{provider:'unverified',delivered:true}},key,'2026-10-24T01:01:00.000Z');
 assert.equal(a.observation.payloadFingerprint,b.observation.payloadFingerprint);
 const reordered=Object.fromEntries(Object.entries(source).reverse());assert.equal(a.observation.payloadFingerprint,createLuxuryCRMObservation(reordered,key,at).observation.payloadFingerprint);key.fill(0);
});
test('legacy/fallback identifiers, extra fields, noncanonical dates, future evidence and oversized inputs hold generically',()=>{
 const key=randomBytes(32),source=row();
 for(const patch of [{id:'lead_abcdef123456abcdef123456'},{id:'person@example.test'},{revision:1},{savedAt:'2026-10-24T02:00:00.000Z'},{notes:'x'.repeat(20001)},{payload:{...source.payload,token:'secret'}},{payload:{...source.payload,intent:'unreviewed'}}])
  assert.throws(()=>createLuxuryCRMObservation({...source,...patch},key,at),e=>e.message==='Luxury source binding held; verify canonical format, opaque identity and observation time.');
 assert.throws(()=>createLuxuryCRMObservation(source,key,'2026-10-24'));assert.throws(()=>createLuxuryCRMObservation(source,randomBytes(31),at));key.fill(0);
});
