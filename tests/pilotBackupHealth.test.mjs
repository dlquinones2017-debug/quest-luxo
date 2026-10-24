import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createPilotHealthServer} from '../scripts/start-agent-pilot.mjs';
test('health reports only current recurring proof and optional backup handler stays opt-in',async()=>{
 const report={independentBackupVerified:true,recurringOffsiteRetentionVerified:true,recoveryValidUntil:new Date(Date.now()+60000).toISOString()};
 let called=0;
 const server=createPilotHealthServer({healthy:()=>true},null,null,()=>({state:'CURRENT',report}),null,async(req,res)=>{if(req.url!=='/pilot-backup/v1')return false;called++;res.writeHead(403);res.end('{}');return true;});
 server.listen(0,'127.0.0.1');await once(server,'listening');const base='http://127.0.0.1:'+server.address().port;
 try{
  let body=await (await fetch(base+'/healthz')).json();assert.equal(body.recurringOffsiteRetentionVerified,true);assert.equal(body.businessDataReady,false);assert.equal(body.gmail,false);assert.equal(body.crm,false);
  report.recoveryValidUntil=new Date(Date.now()-1).toISOString();body=await(await fetch(base+'/healthz')).json();assert.equal(body.recurringOffsiteRetentionVerified,false);
  assert.equal((await fetch(base+'/pilot-backup/v1')).status,403);assert.equal(called,1);assert.equal((await fetch(base+'/backup')).status,404);
 }finally{server.close();await once(server,'close');}
 const disabled=createPilotHealthServer({healthy:()=>true});disabled.listen(0,'127.0.0.1');await once(disabled,'listening');
 try{assert.equal((await fetch('http://127.0.0.1:'+disabled.address().port+'/pilot-backup/v1')).status,404);}finally{disabled.close();await once(disabled,'close');}
});
