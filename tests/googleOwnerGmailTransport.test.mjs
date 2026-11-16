import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { createGoogleOwnerGmailTransport, createGoogleOwnerGmailReceiptReader, GoogleOwnerGmailReadUnavailable } from '../src/lib/command/googleOwnerGmailTransport.ts';
import { isBoundWorkforceOwnerInboxReceipt } from '../src/lib/command/workforceOwnerInboxReceipt.ts';
import { createLuxuryWorkforceEvent } from '../src/lib/command/luxuryWorkforceEvent.ts';
import { createLeadCapturePayload } from '../src/lib/leads/leadCapture.ts';
import { workforceOwnerNotification } from '../src/lib/command/workforceOwnerNotification.ts';

// Synthetic HTTP responses only. No OAuth grant, token, mailbox, saved inquiry or provider access.
const now = Date.parse('2026-11-16T02:00:00Z'), id = 'abcdef1234567890';
const DISCOVERY = 'https://accounts.google.com/.well-known/openid-configuration';
const USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';
const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me/';
const auth = () => ({accessToken:'synthetic-test-token-never-real',expiresAt:now+3600000,
  grantedScopes:['openid','email','https://www.googleapis.com/auth/gmail.readonly'],
  binding:{accountId:'111111111111111111111',mailbox:'denzel@questluxo.com'}});
const discovery = () => ({issuer:'https://accounts.google.com',userinfo_endpoint:USERINFO});
const identity = () => ({sub:auth().binding.accountId,email:auth().binding.mailbox,email_verified:true});
const profile = () => ({emailAddress:auth().binding.mailbox,historyId:'123',messagesTotal:42,threadsTotal:30});
const leaf = (mimeType,content) => ({mimeType,filename:'',body:{size:Buffer.byteLength(content),data:Buffer.from(content).toString('base64url')}});
function message(text='Unicode résumé 🎯\r\nbody',html='<p>Unicode résumé 🎯</p>') {
  return {id,labelIds:['INBOX'],internalDate:String(now-30000),payload:{mimeType:'multipart/alternative',filename:'',headers:[],body:{size:0},parts:[leaf('text/plain',text),leaf('text/html',html)]}};
}
function mock(change = () => {}) {
  const calls = [], responses = {discovery:discovery(),identity:identity(),profile:profile(),message:message()};
  change(responses);
  const fetcher = async (url, options) => {
    calls.push({url,options}); assert.equal(options.method,'GET'); assert.equal(options.redirect,'error');
    assert.equal(options.cache,'no-store'); assert.equal(options.credentials,'omit'); assert.ok(options.signal instanceof AbortSignal);
    assert.ok(!url.includes(auth().accessToken)); assert.ok(!options.body);
    if(url===DISCOVERY){assert.equal(options.headers.Authorization,undefined);return Response.json(responses.discovery);}
    assert.equal(options.headers.Authorization,`Bearer ${auth().accessToken}`);
    if(url===USERINFO)return Response.json(responses.identity);
    if(url===GMAIL+'profile')return Response.json(responses.profile);
    assert.equal(url,GMAIL+`messages/${id}?format=full`);return Response.json(responses.message);
  };
  return {calls,responses,fetcher};
}
const unavailable = e => e instanceof GoogleOwnerGmailReadUnavailable && e.code==='GOOGLE_OWNER_GMAIL_READ_UNAVAILABLE' && !JSON.stringify(e).includes('synthetic-test-token');

test('missing authorization remains unbound without HTTP or credential discovery',async()=>{
  let calls=0;const reader=createGoogleOwnerGmailReceiptReader(undefined,async()=>{calls++;throw Error()});
  assert.deepEqual(await reader.read({}),{status:'UNAVAILABLE',reason:'AUTHENTICATED_OWNER_GMAIL_TRANSPORT_NOT_BOUND'});assert.equal(calls,0);
});
test('invalid token, binding, expiry and broad or incomplete declared scopes fail before HTTP',()=>{
  const changes=[a=>a.accessToken='',a=>a.accessToken='x'.repeat(4097),a=>a.accessToken='private\r\nAuthorization: injected',a=>a.expiresAt=now,
    a=>a.expiresAt=NaN,a=>a.binding.accountId='',a=>a.binding.mailbox='personal@example.com',
    a=>a.grantedScopes.push('https://mail.google.com/'),a=>a.grantedScopes[2]='https://www.googleapis.com/auth/gmail.modify',
    a=>a.grantedScopes=['openid','email'],a=>a.grantedScopes=['openid','openid','https://www.googleapis.com/auth/gmail.readonly']];
  for(const change of changes){const a=auth();change(a);assert.throws(()=>createGoogleOwnerGmailTransport(a,()=>{throw Error('network must not run')},()=>now),unavailable);}
});
test('trusted credential and binding are snapshotted; identity and Gmail mailbox must independently match',async()=>{
  const m=mock(),a=auth(),transport=createGoogleOwnerGmailTransport(a,m.fetcher,()=>now);
  a.accessToken='changed';a.binding.accountId='222222222222222222222';a.grantedScopes.length=0;a.expiresAt=0;
  assert.deepEqual(await transport.getProfile(),{id:identity().sub,email:identity().email});
  assert.equal(m.calls.length,3);assert.ok(Object.isFrozen(transport));
});
test('discovery cannot redirect credentials or redefine the trusted UserInfo endpoint',async()=>{
  for(const change of [r=>r.discovery.userinfo_endpoint='https://attacker.example/collect',r=>r.discovery.issuer='https://attacker.example']){
    const m=mock(change),t=createGoogleOwnerGmailTransport(auth(),m.fetcher,()=>now);
    await assert.rejects(t.getProfile(),unavailable);assert.equal(m.calls.length,1);assert.equal(m.calls[0].options.headers.Authorization,undefined);
  }
});
test('wrong account, unverified identity and Gmail mailbox drift stop before any message body read',async()=>{
  const changes=[r=>r.identity.sub='222222222222222222222',r=>r.identity.email='other@example.com',
    r=>r.identity.email_verified=false,r=>r.identity.email_verified='true',r=>r.profile.emailAddress='other@example.com'];
  for(const change of changes){const m=mock(change),t=createGoogleOwnerGmailTransport(auth(),m.fetcher,()=>now);
    await assert.rejects(t.readFullMessage(id),unavailable);assert.equal(m.calls.filter(c=>c.url.includes('/messages/')).length,0);}
});
test('fixed full-message GET maps camelCase REST and strict base64url to the existing reader contract',async()=>{
  const m=mock(),t=createGoogleOwnerGmailTransport(auth(),m.fetcher,()=>now),result=await t.readFullMessage(id);
  assert.equal(result.id,id);assert.deepEqual(result.label_ids,['INBOX']);assert.equal(result.internal_date,m.responses.message.internalDate);
  assert.equal(result.payload.parts[0].body.content,'Unicode résumé 🎯\r\nbody');
  assert.equal(result.payload.parts[1].body.content,'<p>Unicode résumé 🎯</p>');assert.equal(result.payload.parts[0].mime_type,'text/plain');
  assert.equal(m.calls.length,4);assert.equal(m.calls.filter(c=>c.url.includes('/messages/')).length,1);
  assert.ok(!JSON.stringify(result).includes(auth().accessToken));
});
test('invalid and path-injection message identifiers cause zero HTTP calls',async()=>{
  for(const bad of ['',id+'/../profile','../profile',id+'?format=raw','https://attacker.example',id+'%2f']){
    const m=mock(),t=createGoogleOwnerGmailTransport(auth(),m.fetcher,()=>now);await assert.rejects(t.readFullMessage(bad),unavailable);assert.equal(m.calls.length,0);
  }
});
test('malformed, oversized, unread, attached and ambiguous MIME data are rejected',async()=>{
  const changes=[r=>r.message.id='different',r=>r.message.labelIds='INBOX',r=>r.message.internalDate='invalid',
    r=>r.message.payload.parts[0].body.data='not+url/base64',r=>r.message.payload.parts[0].body.data='AB',
    r=>r.message.payload.parts[0].body={size:1,data:'YQ='},
    r=>r.message.payload.parts[0].body.data=Buffer.from([0xff]).toString('base64url'),r=>r.message.payload.parts[0].body.size++,
    r=>r.message.payload.parts[0].body.attachmentId='external-unread',r=>r.message.payload.parts[0].filename='attached.eml',
    r=>r.message.payload.parts[0].parts=[leaf('text/plain','extra')],r=>r.message.payload.parts[0].mimeType='message/rfc822',
    r=>r.message.payload.parts[0]=leaf('text/plain','x'.repeat(100001)),r=>r.message.payload.body.data='hidden-container-data',
    r=>r.message.payload.parts=Array.from({length:9},()=>leaf('text/plain','x')),
    r=>r.message.payload.headers=[{name:'x',value:'x'.repeat(16385)}]];
  for(const change of changes){const m=mock(change),t=createGoogleOwnerGmailTransport(auth(),m.fetcher,()=>now);await assert.rejects(t.readFullMessage(id),unavailable);}
});
test('HTTP denial, redirect, non-JSON, invalid UTF-8 and oversized streaming response leak no token or private error',async()=>{
  const bodies=[()=>new Response('private response contains synthetic-test-token-never-real',{status:401}),
    ()=>new Response(null,{status:302,headers:{location:'https://attacker.example'}}),
    ()=>new Response('not json',{headers:{'content-type':'text/plain'}}),
    ()=>new Response('{broken',{headers:{'content-type':'application/json'}}),
    ()=>new Response(new Uint8Array([0xff]),{headers:{'content-type':'application/json'}}),
    ()=>new Response('x',{headers:{'content-type':'application/json','content-length':'32769'}}),
    ()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(32769));c.close()}}),{headers:{'content-type':'application/json'}}),
    ()=>{throw Error('private provider failure synthetic-test-token-never-real')}];
  for(const body of bodies){const t=createGoogleOwnerGmailTransport(auth(),async()=>body(),()=>now);await assert.rejects(t.getProfile(),unavailable);}
});
test('expiration before a later request fails closed without refresh or another HTTP call',async()=>{
  const m=mock();let time=now;const t=createGoogleOwnerGmailTransport(auth(),m.fetcher,()=>time);
  await t.getProfile();const before=m.calls.length;time=now+3600000;await assert.rejects(t.getProfile(),unavailable);assert.equal(m.calls.length,before);
});
test('composed REST transport passes exact existing reader proof and rejects copied proof or altered content',async()=>{
  const event=createLuxuryWorkforceEvent({id:'lead_google-unit',savedAt:new Date(now-60000).toISOString(),payload:createLeadCapturePayload({name:'UNIT TEST',email:'unit@example.com',source:'/begin-your-quest',message:'synthetic only'})},randomBytes(32));
  const req={messageId:id,event,contactId:'5001',taskId:'9001',mode:'INTERNAL_VALIDATION'};
  const expected=workforceOwnerNotification(event,req.contactId,req.taskId,req.mode);
  const m=mock(r=>{r.message=message(expected.text,expected.html);r.message.payload.headers=[
    {name:'From',value:'info@questluxo.com'},{name:'To',value:expected.to},{name:'Delivered-To',value:expected.to},
    {name:'Subject',value:expected.subject},{name:'Message-ID',value:'<unit-google-message@email.amazonses.com>'},
    {name:'Date',value:new Date(now-30000).toUTCString()},
    {name:'Authentication-Results',value:'mx.google.com; dkim=pass header.i=@questluxo.com; spf=pass smtp.mailfrom=unit@send.questluxo.com; dmarc=pass header.from=questluxo.com'},
    {name:'Received',value:'from unit.example by mx.google.com with ESMTPS for <denzel@questluxo.com>'}];});
  const reader=createGoogleOwnerGmailReceiptReader(auth(),m.fetcher,()=>now),proof=await reader.read(req);
  assert.equal(proof.status,'VERIFIED');assert.equal(proof.providerId,null);assert.equal(proof.humanAction,'UNKNOWN');
  assert.ok(isBoundWorkforceOwnerInboxReceipt(proof,req,now));assert.equal(isBoundWorkforceOwnerInboxReceipt(JSON.parse(JSON.stringify(proof)),req,now),false);
  assert.equal(m.calls.filter(c=>c.url===DISCOVERY).length,1);assert.equal(m.calls.filter(c=>c.url.includes('/messages/')).length,1);assert.equal(m.calls.length,8);
  m.responses.message.payload.parts[1]=leaf('text/html',expected.html+' altered');assert.equal((await reader.read(req)).status,'UNVERIFIED');
});
