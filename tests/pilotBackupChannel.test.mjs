import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable} from 'node:stream';
import {mkdtemp,rm,readFile,writeFile,chmod,symlink,link,stat} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {createPilotBackupChannel,readRecurringCheckpoint} from '../scripts/pilot-backup-channel.mjs';
import {signRequest,verifyPayload} from '../scripts/pilot-backup-protocol.mjs';

const hash=s=>createHash('sha256').update(s).digest('hex'),file='recurring-backup-checkpoint.json';
const clientId='windows-recovery-primary';
const bundle=()=>['pipeline','intake','preparation'].map(kind=>{const archive=JSON.stringify({kind,synthetic:true});return {kind,revision:hash(kind),sha256:hash(archive),archive};});
async function fixture(run){const root=await mkdtemp(join(tmpdir(),'pilot-backup-channel-')),key=randomBytes(32);let clock=Date.parse('2026-10-24T10:00:00.000Z'),counter=0;const contents=bundle();const handler=createPilotBackupChannel({key,root,clientId,readBundle:async()=>contents,now:()=>clock});
 const request=async(method,path,body='',patch={})=>{
  const fields={method,path,body,clientId,timestamp:new Date(clock).toISOString(),nonce:(++counter).toString(16).padStart(32,'0'),...patch};
  let signature;try{signature=signRequest(key,fields);}catch{signature='0'.repeat(64);}
  const req=Readable.from([Buffer.from(body)]);req.method=method;req.url=path;req.headers={'x-quest-client':fields.clientId,'x-quest-timestamp':fields.timestamp,'x-quest-nonce':fields.nonce,'x-quest-signature':signature};
  const res={headersSent:false,status:null,text:'',writeHead(status){this.status=status;this.headersSent=true;},end(text){this.text=text;},destroy(){this.destroyed=true;}};
  const handled=await handler(req,res);return {handled,status:res.status,data:res.text?JSON.parse(res.text):null,fields};
 };
 const get=()=>request('GET','/pilot-backup/v1');
 const ack=(g,patch={})=>request('POST','/pilot-backup/v1/ack',JSON.stringify({version:1,nonce:g.data.payload.nonce,verifiedAt:new Date(clock).toISOString(),archives:g.data.payload.archives.map(({kind,revision,sha256})=>({kind,revision,sha256})),aclVerified:true,recoveryVerified:true,deviceId:clientId,...patch}));
 try{await run({root,key,contents,request,get,ack,now:()=>clock,advance:n=>clock+=n});}finally{key.fill(0);await rm(root,{recursive:true,force:true});}
}
test('signed three-profile delivery and two separated authenticated recoveries create a private fresh proof',()=>fixture(async({root,key,get,ack,advance,now})=>{
 const first=await get();assert.equal(first.status,200);assert.equal(verifyPayload(key,first.data.payload,first.data.signature),true);assert.equal(first.data.payload.archives.length,3);
 assert.equal((await ack(first)).data.payload.successfulCycles,1);assert.equal(await readRecurringCheckpoint(root,key,now()),null);
 advance(60_000);const second=await ack(await get());assert.equal(second.status,200);assert.equal(second.data.payload.recurringIndependentRetentionVerified,true);assert(verifyPayload(key,second.data.payload,second.data.signature));
 const proof=await readRecurringCheckpoint(root,key,now());assert.equal(proof.successfulCycles,2);assert.equal(proof.businessDataExecutionAllowed,false);assert.equal(proof.checkpointAuthenticated,true);assert.equal((await stat(join(root,file))).mode&0o777,0o600);
 advance(43_200_001);assert.equal(await readRecurringCheckpoint(root,key,now()),null);
}));
test('request replay, future/stale signatures, wrong client and unrequested acknowledgements are held',()=>fixture(async({request,get,ack,now})=>{
 const g=await get();assert.equal((await request('GET','/pilot-backup/v1','',g.fields)).status,403);
 for(const patch of [{timestamp:new Date(now()-120_001).toISOString()},{timestamp:new Date(now()+15_001).toISOString()},{clientId:'other-device'}])assert.equal((await request('GET','/pilot-backup/v1','',patch)).status,403);
 assert.equal((await ack(g,{nonce:'f'.repeat(32)})).status,403);
 const accepted=await ack(g);assert.equal(accepted.status,200);assert.equal((await ack(g)).status,403);
 assert.equal((await request('GET','/another-path')).handled,false);
 assert.equal((await request('POST','/pilot-backup/v1')).status,403);
}));
test('freshness, exact matching archives, ACL attestation and bounded bodies fail closed',()=>fixture(async({get,ack,request,advance,now})=>{
 const g=await get();
 for(const patch of [{aclVerified:false},{recoveryVerified:false},{deviceId:'unapproved'},{verifiedAt:new Date(now()+1).toISOString()},{verifiedAt:new Date(now()-1).toISOString()},{archives:[]}])assert.equal((await ack(g,patch)).status,403);
 assert.equal((await request('POST','/pilot-backup/v1/ack','x'.repeat(16_385))).status,403);
 advance(120_001);assert.equal((await ack(g)).status,403);
}));
test('rapid cycles do not increase evidence, changed revisions and gaps reset the sequence',()=>fixture(async({root,key,get,ack,contents,advance,now})=>{
 assert.equal((await ack(await get())).data.payload.successfulCycles,1);advance(1_000);assert.equal((await ack(await get())).data.payload.successfulCycles,1);
 advance(60_000);assert.equal((await ack(await get())).data.payload.successfulCycles,2);
 contents[0].revision=hash('updated pipeline');advance(60_000);assert.equal((await ack(await get())).data.payload.successfulCycles,1);assert.equal(await readRecurringCheckpoint(root,key,now()),null);
 advance(43_200_001);assert.equal((await ack(await get())).data.payload.successfulCycles,1);
}));
test('tampered or unsafe checkpoints cannot be overwritten or accepted as evidence',()=>fixture(async({root,key,get,ack,advance,now})=>{
 await ack(await get());const path=join(root,file),original=await readFile(path);const wrapper=JSON.parse(original);wrapper.payload.successfulCycles=200;
 await writeFile(path,JSON.stringify(wrapper));const damaged=await readFile(path);advance(60_000);assert.equal(await readRecurringCheckpoint(root,key,now()),null);assert.equal((await ack(await get())).status,403);assert.deepEqual(await readFile(path),damaged);
 await writeFile(path,original);await chmod(path,0o644);assert.equal(await readRecurringCheckpoint(root,key,now()),null);assert.equal((await ack(await get())).status,403);await chmod(path,0o600);
 await link(path,join(root,'hardlink'));assert.equal(await readRecurringCheckpoint(root,key,now()),null);assert.equal((await ack(await get())).status,403);await rm(join(root,'hardlink'));
 await rm(path);await writeFile(join(root,'target'),original,{mode:0o600});await symlink(join(root,'target'),path);assert.equal((await ack(await get())).status,403);assert.deepEqual(await readFile(join(root,'target')),original);
}));
test('unsafe directories and malformed source bundles fail without proof',()=>fixture(async({root,key,get,ack,contents,now})=>{
 await chmod(root,0o755);assert.equal((await ack(await get())).status,403);assert.equal(await readRecurringCheckpoint(root,key,now()),null);await chmod(root,0o700);
 contents[0].sha256=hash('wrong');assert.equal((await get()).status,403);
}));
test('changed primary revisions between delivery and ACK cannot establish retention',()=>fixture(async({root,key,get,ack,contents,now})=>{
 const delivery=await get();contents[0].revision=hash('changed-since-delivery');assert.equal((await ack(delivery)).status,403);assert.equal(await readRecurringCheckpoint(root,key,now()),null);
}));
test('fixed synthetic archive size bounds are enforced before delivery',()=>fixture(async({get,contents})=>{
 contents[0].archive='x'.repeat(20_001);contents[0].sha256=hash(contents[0].archive);assert.equal((await get()).status,403);
}));
test('future-skew request nonces remain replay-protected for their entire signature window',()=>fixture(async({request,advance,now})=>{
 const future={timestamp:new Date(now()+15_000).toISOString()},g=await request('GET','/pilot-backup/v1','',future);assert.equal(g.status,200);
 advance(120_001);assert.equal((await request('GET','/pilot-backup/v1','',g.fields)).status,403);
}));
test('parallel ACKs consume a delivery only once and pending deliveries remain bounded',()=>fixture(async({get,ack})=>{
 const g=await get(),results=await Promise.all([ack(g),ack(g)]);assert.deepEqual(results.map(x=>x.status).sort(),[200,403]);
 for(let i=0;i<32;i++)assert.equal((await get()).status,200);assert.equal((await get()).status,403);
}));
