import assert from 'node:assert/strict';
import {createHash,randomBytes} from 'node:crypto';
import {request} from 'node:https';
import {spawnSync} from 'node:child_process';
import {constants,readSync,openSync,writeFileSync,fsyncSync,closeSync,lstatSync,realpathSync,mkdirSync,readdirSync,unlinkSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {signRequest,verifyPayload} from './pilot-backup-protocol.mjs';
import {authenticateSyntheticRecovery,recoverSyntheticArchives} from './pilot-independent-recovery.mjs';
import {authenticatePreparationArchive,recoverSyntheticPreparation} from './crm-preparation-independent-recovery.mjs';

const origin='https://quest-luxo-agent-pilot.onrender.com',basePath='/pilot-backup/v1',clientId='windows-recovery-primary';
const limit=4_000_000,sha=b=>createHash('sha256').update(b).digest('hex');
const exact=(v,keys)=>assert(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).sort().join()===keys.sort().join());
const iso=v=>typeof v==='string'&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString()===v;
const fresh=(v,now)=>assert(iso(v)&&Date.parse(v)<=now.getTime()&&now.getTime()-Date.parse(v)<=120_000);
const hash=v=>typeof v==='string'&&/^[a-f0-9]{64}$/.test(v);
export function parseStdinKey(bytes){
 assert(Buffer.isBuffer(bytes)&&(bytes.length===64||bytes.length===65&&bytes[64]===10));
 // Validate raw bytes before ASCII conversion, which otherwise masks high bits.
 assert([...bytes.subarray(0,64)].every(c=>c>=48&&c<=57||c>=97&&c<=102));
 return Buffer.from(bytes.subarray(0,64).toString('ascii'),'hex');
}
function canonicalDirectory(path){
 assert.equal(typeof path,'string');assert.equal(resolve(path),path);assert.equal(realpathSync(path),path);
 const stat=lstatSync(path);assert(stat.isDirectory()&&!stat.isSymbolicLink());
 if(process.platform!=='win32')assert.equal(stat.mode&0o077,0);
 for(let part=path;;part=dirname(part)){assert(!lstatSync(part).isSymbolicLink());if(dirname(part)===part)break;}
}
/** Read-only owner-only Windows ACL/reparse audit. Never changes access controls. */
export function verifyWindowsPrivateTree(root){
 assert.equal(process.platform,'win32');canonicalDirectory(root);
 const encodedRoot=Buffer.from(root,'utf8').toString('base64');
 const script=`$ErrorActionPreference='Stop';$Root=[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${encodedRoot}'));$who=[Security.Principal.WindowsIdentity]::GetCurrent();$sid=$who.User.Value;if(-not (Get-Acl -LiteralPath $Root).AreAccessRulesProtected){throw 'Inherited root'};$items=@(Get-Item -LiteralPath $Root)+@(Get-ChildItem -LiteralPath $Root -Force -Recurse);foreach($item in $items){if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Reparse'};$acl=Get-Acl -LiteralPath $item.FullName;if($acl.Owner -ne $who.Name -or @($acl.Access).Count -eq 0){throw 'Owner'};foreach($rule in $acl.Access){if($rule.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -ne $sid -or $rule.AccessControlType -ne 'Allow'){throw 'Rule'}}};$p=[IO.DirectoryInfo]$Root;while($null -ne $p){if(($p.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0){throw 'Ancestry'};$p=$p.Parent};Write-Output 'PRIVATE_TREE_VERIFIED'`;
 const r=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{encoding:'utf8',timeout:20_000,maxBuffer:4096,windowsHide:true});
 assert(!r.error&&r.status===0&&r.stdout.trim()==='PRIVATE_TREE_VERIFIED');return true;
}
/** Fixed HTTPS peer only; redirects, oversized bodies and non-200 responses reject. */
export function boundedHttpsTransport({method,path,headers,body}){
 assert(['GET','POST'].includes(method)&&[basePath,basePath+'/ack'].includes(path)&&typeof body==='string');
 return new Promise((resolveResult,reject)=>{
  const req=request(origin+path,{method,headers:{...headers,'content-length':Buffer.byteLength(body)},timeout:15_000},res=>{
   if(res.statusCode!==200){res.destroy();reject(Error('Backup peer held.'));return;}
   const chunks=[];let size=0;
   res.on('data',chunk=>{size+=chunk.length;if(size>limit){res.destroy(Error('Response bound exceeded.'));return;}chunks.push(chunk);});
   res.on('error',reject);res.on('end',()=>resolveResult({status:res.statusCode,body:Buffer.concat(chunks)}));
  });
  const timer=setTimeout(()=>req.destroy(Error('Backup deadline exceeded.')),20_000);timer.unref();
  req.on('timeout',()=>req.destroy(Error('Backup timeout.')));req.on('error',reject);req.on('close',()=>clearTimeout(timer));req.end(body);
 });
}
function retain(file,bytes){const fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL,0o600);try{writeFileSync(fd,bytes);fsyncSync(fd);}finally{closeSync(fd);}}
/** Dependency injection is test-only; CLI exposes only the existing private root argument. */
export async function runRecurringBackup({root,key,transport=boundedHttpsTransport,clock=()=>new Date(),aclChecker=verifyWindowsPrivateTree,nonceFactory=()=>randomBytes(16).toString('hex')}){
 assert(Buffer.isBuffer(key)&&key.length===32);canonicalDirectory(root);assert.equal(await aclChecker(root),true);
 const now=()=>{const date=clock();assert(date instanceof Date&&Number.isFinite(date.getTime()));return date;};
 const nonce=()=>{const n=nonceFactory();assert(typeof n==='string'&&/^[a-f0-9]{32}$/.test(n));return n;};
 async function exchange(method,path,body,requestNonce){
  const timestamp=now().toISOString(),signature=signRequest(key,{method,path,clientId,timestamp,nonce:requestNonce,body});
  const response=await transport({method,path,body,headers:{'content-type':'application/json','x-quest-client':clientId,'x-quest-timestamp':timestamp,'x-quest-nonce':requestNonce,'x-quest-signature':signature}});
  assert(response.status===200&&Buffer.isBuffer(response.body)&&response.body.length>0&&response.body.length<=limit);
  const parsed=JSON.parse(response.body);exact(parsed,['payload','signature']);assert(verifyPayload(key,parsed.payload,parsed.signature));return parsed.payload;
 }
 const retained=join(root,'recurring-backups');
 try{mkdirSync(retained,{mode:0o700});}catch(e){if(e.code!=='EEXIST')throw e;}canonicalDirectory(retained);
 const lock=join(retained,'.client.lock'),lockFd=openSync(lock,'wx',0o600);closeSync(lockFd);
 try{
  const entries=readdirSync(retained,{withFileTypes:true}).filter(e=>e.name!=='.client.lock');
  assert(entries.every(e=>e.isDirectory()&&/^run-[a-f0-9]{32}$/.test(e.name))&&entries.length<1000);
  const getNonce=nonce(),payload=await exchange('GET',basePath,'',getNonce);
  exact(payload,['version','nonce','generatedAt','archives']);assert(payload.version===1&&payload.nonce===getNonce);fresh(payload.generatedAt,now());
  assert(Array.isArray(payload.archives)&&payload.archives.length===3);assert.deepEqual(payload.archives.map(a=>a.kind).sort(),['intake','pipeline','preparation']);
  // Authenticate every exact synthetic fixture before retaining any returned archive.
  for(const a of payload.archives){exact(a,['kind','revision','sha256','archive']);assert(hash(a.revision)&&hash(a.sha256)&&typeof a.archive==='string');const bytes=Buffer.from(a.archive,'utf8');assert.equal(sha(bytes),a.sha256);const verified=a.kind==='preparation'?authenticatePreparationArchive(bytes,key):authenticateSyntheticRecovery(bytes,key,a.kind);assert.equal(verified.revision,a.revision);}
  const run=join(retained,'run-'+getNonce);mkdirSync(run,{mode:0o700});canonicalDirectory(run);
  const manifest=[];let preparation;
  for(const a of payload.archives){const filename=(a.kind==='pipeline'?'snapshot':a.kind)+'-'+a.revision+'.backup.json';retain(join(run,filename),Buffer.from(a.archive,'utf8'));if(a.kind==='preparation')preparation=join(run,filename);else manifest.push({kind:a.kind,filename,sha256:a.sha256});}
  retain(join(run,'transfer-manifest.json'),Buffer.from(JSON.stringify(manifest)));
  recoverSyntheticArchives(run,key,'restore');recoverSyntheticArchives(run,key,'verify');
  const preparationTarget=join(run,'restored-preparation');recoverSyntheticPreparation(preparation,preparationTarget,key,'restore');recoverSyntheticPreparation(preparation,preparationTarget,key,'verify');
  canonicalDirectory(root);assert.equal(await aclChecker(root),true);fresh(payload.generatedAt,now());
  const ack={version:1,nonce:getNonce,verifiedAt:now().toISOString(),archives:payload.archives.map(({kind,revision,sha256})=>({kind,revision,sha256})),aclVerified:true,recoveryVerified:true,deviceId:clientId};
  retain(join(run,'local-recovery-receipt.json'),Buffer.from(JSON.stringify(ack)));
  assert.equal(await aclChecker(root),true);const ackNonce=nonce();assert.notEqual(ackNonce,getNonce);
  const accepted=await exchange('POST',basePath+'/ack',JSON.stringify(ack),ackNonce);
  exact(accepted,['version','nonce','acknowledgedAt','successfulCycles','recurringIndependentRetentionVerified']);assert(accepted.version===1&&accepted.nonce===getNonce&&Number.isSafeInteger(accepted.successfulCycles)&&accepted.successfulCycles>=1&&typeof accepted.recurringIndependentRetentionVerified==='boolean');fresh(accepted.acknowledgedAt,now());
  retain(join(run,'server-acknowledgement.json'),Buffer.from(JSON.stringify(accepted)));assert.equal(await aclChecker(root),true);
  return {status:'VERIFIED',deviceId:clientId,syntheticOnly:true,aclVerified:true,recoveryVerified:true,acknowledged:true,successfulCycles:accepted.successfulCycles,recurringIndependentRetentionVerified:accepted.recurringIndependentRetentionVerified,businessDataReady:false,modelApiRequestsAllowed:false};
 }finally{unlinkSync(lock);}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 let key;const input=Buffer.alloc(66);
 try{assert.equal(process.argv.length,3);let count=0;while(count<input.length){const n=readSync(0,input,count,input.length-count,null);if(!n)break;count+=n;}key=parseStdinKey(input.subarray(0,count));input.fill(0);console.log(JSON.stringify(await runRecurringBackup({root:process.argv[2],key})));}
 catch{console.error('Recurring synthetic backup held; no recovery success asserted.');process.exitCode=1;}
 finally{input.fill(0);key?.fill(0);}
}
