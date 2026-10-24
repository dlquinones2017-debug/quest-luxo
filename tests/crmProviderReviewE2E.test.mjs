import test from 'node:test';
import assert from 'node:assert/strict';
import {demonstrateCRMProviderReview} from '../scripts/demo-crm-provider-review.mjs';
test('expired durable attempt remains uncertain after matching metadata and nondefinitive 404 lookups',async()=>{
 const r=await demonstrateCRMProviderReview();assert.equal(r.status,'SYNTHETIC_PROVIDER_REVIEW_PASSED');assert.equal(r.mockRequests,2);assert.equal(r.realProviderRequests,0);assert.equal(r.uncertainStatePreserved,true);assert.equal(r.outboxRevisionUnchanged,true);
 for(const k of ['successfulReadPermitsAcknowledgement','notFoundPermitsRetry','businessDataExecutionAllowed','writesCRM','modelApiRequestsAllowed'])assert.equal(r[k],false);
});
