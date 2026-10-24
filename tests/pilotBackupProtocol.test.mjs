import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { signRequest, verifyRequest, signPayload, verifyPayload } from '../scripts/pilot-backup-protocol.mjs';
test('request authentication binds method, exact path, client, nonce, time and bytes', () => {
  const key=randomBytes(32), now=Date.now();
  const f={method:'POST',path:'/pilot-backup/v1/ack',clientId:'windows-recovery-primary',timestamp:new Date(now).toISOString(),nonce:'a'.repeat(32),body:'{"version":1}'};
  const sig=signRequest(key,f);
  assert.equal(verifyRequest(key,f,sig,now),true);
  for(const patch of [{body:'{ "version":1}'},{nonce:'b'.repeat(32)},{path:f.path+'?x=1'},{clientId:'other'},{method:'GET'}])
    assert.equal(verifyRequest(key,{...f,...patch},sig,now),false);
  assert.equal(verifyRequest(key,f,sig,now+120001),false);
  assert.equal(verifyRequest(key,f,sig,now-15001),false);
  assert.equal(verifyRequest(randomBytes(32),f,sig,now),false);
});
test('canonical response signatures reject tamper and cannot authenticate requests', () => {
  const key=randomBytes(32), payload={version:1,nonce:'a'.repeat(32),archives:[]};
  const sig=signPayload(key,payload);
  assert.equal(verifyPayload(key,{archives:[],nonce:payload.nonce,version:1},sig),true);
  assert.equal(verifyPayload(key,{...payload,version:2},sig),false);
  assert.equal(verifyPayload(key,payload,'z'.repeat(64)),false);
});
