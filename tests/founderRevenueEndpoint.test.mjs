import test from "node:test";
import assert from "node:assert/strict";
import { founderRevenueResponse } from "../src/lib/broker/founderRevenueEndpoint.ts";
import { validateBrokerConsoleAccess } from "../src/lib/broker/brokerAuth.ts";

const config={isProduction:true,brokerConsole:{accessKey:"fixture-console-key"}};
const authorize=request=>validateBrokerConsoleAccess(request,config);
test("anonymous and invalid keys cannot read the Founder model",async()=>{
  let reads=0;
  for(const headers of [{},{"x-broker-console-key":"wrong"}]){
    const response=await founderRevenueResponse(new Request("https://console.example.test/api/broker/revenue",{headers}),{authorize,read:async()=>{reads++;return {};}});
    assert.equal(response.status,401);assert.match(response.headers.get("Cache-Control"),/no-store/);
    assert.equal(response.headers.get("Referrer-Policy"),"no-referrer");
  }
  assert.equal(reads,0);
});
test("authorized header and existing query-key clients can read without caches",async()=>{
  for(const request of [new Request("https://console.example.test/api/broker/revenue",{headers:{"x-broker-console-key":"fixture-console-key"}}),new Request("https://console.example.test/api/broker/revenue?key=fixture-console-key")]){
    const response=await founderRevenueResponse(request,{authorize,read:async()=>({fixture:true})});
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{fixture:true});
    assert.equal(response.headers.get("Vary"),"x-broker-console-key");assert.match(response.headers.get("Cache-Control"),/private, no-store/);
    assert.equal(response.headers.get("X-Content-Type-Options"),"nosniff");
  }
});
test("write methods cannot invoke the reader or authorize a mutation",async()=>{
  for(const method of ["POST","PUT","PATCH","DELETE"]){
    const response=await founderRevenueResponse(new Request("https://console.example.test/api/broker/revenue",{method}),{authorize:()=>{throw Error("never authorize");},read:()=>{throw Error("never read");}});
    assert.equal(response.status,405);assert.equal(response.headers.get("Allow"),"GET, HEAD");
  }
});
test("source read errors expose no private exception text and no invented zero state",async()=>{
  const original=console.error;const logs=[];
  try {
    console.error=(...args)=>logs.push(args);
    const response=await founderRevenueResponse(new Request("https://console.example.test/api/broker/revenue?key=fixture-console-key"),{authorize,read:async()=>{throw Error("SENSITIVE_FIXTURE path/contact/token");}});
    assert.equal(response.status,500);const body=await response.text();
    assert.doesNotMatch(body,/SENSITIVE_FIXTURE|totalRecords|verifiedExpectedRevenue/);assert.doesNotMatch(JSON.stringify(logs),/SENSITIVE_FIXTURE|path\/contact|fixture-console-key/);
  }finally{console.error=original;}
});
test("HEAD keeps authorization and returns no body",async()=>{
  const response=await founderRevenueResponse(new Request("https://console.example.test/api/broker/revenue",{method:"HEAD",headers:{"x-broker-console-key":"fixture-console-key"}}),{authorize,read:async()=>({fixture:true})});
  assert.equal(response.status,200);assert.equal(await response.text(),"");
});
