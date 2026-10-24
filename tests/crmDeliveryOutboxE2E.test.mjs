import test from 'node:test';
import assert from 'node:assert/strict';
import {demonstrateCRMOutbox} from '../scripts/demo-crm-outbox.mjs';
test('source projection to revision allocation, simulated delivery and fresh-process recovery preserves outstanding work',async()=>{
 const r=await demonstrateCRMOutbox();assert.equal(r.status,'SYNTHETIC_DEMONSTRATION_PASSED');assert.equal(r.exactReplayNoop,true);
 assert.equal(r.freshProcessCiphertextCopyRecovery,true);assert.equal(r.pendingDeliveriesRecovered,1);assert.equal(r.realCRMDeliveries,0);
 for(const k of ['independentOffsiteOutboxRecoveryVerified','businessDataExecutionAllowed','writesCRM','modelApiRequestsAllowed'])assert.equal(r[k],false);
});
