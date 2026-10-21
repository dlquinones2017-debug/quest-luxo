import test from "node:test";
import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { PUBLIC_WEBSITE_TARGETS, checkPublicWebsites, createPublicWebsiteMonitor, PUBLIC_WEBSITE_INTERVAL_MS } from "../src/lib/agents/publicWebsiteHealth.ts";
import { validateFactorySpec, generateAgentPackage } from "../src/lib/agents/agentFactory.ts";
import { runFactoryAgent, runApprovedPublicWebsiteAgent } from "../scripts/factory-agent-runtime.mjs";
import { createPilotHealthServer } from "../scripts/start-agent-pilot.mjs";
const spec = JSON.parse(await readFile(new URL("../config/agents/website-health.spec.json",import.meta.url),"utf8"));
test("fixed public HTTP checks use HEAD, omit credentials, forbid redirects and avoid reading response bodies", async () => {
  const calls=[];
  const report=await checkPublicWebsites({reader:async(url,init)=>{
    calls.push({url,init}); assert.equal(init.method,"HEAD");assert.equal(init.redirect,"manual");assert.equal(init.credentials,"omit");assert.equal(init.cache,"no-store");
    assert.ok(init.signal instanceof AbortSignal);assert.deepEqual(Object.keys(init.headers),["User-Agent"]);
    return new Response(null,{status:200});
  }});
  assert.deepEqual(calls.map(c=>c.url),PUBLIC_WEBSITE_TARGETS.map(t=>t.url));assert.equal(calls.length,3);
  assert.equal(report.status,"RESPONDING");assert.equal(report.responding,3);assert.equal(report.evidenceClass,"HTTP_HEADERS_ONLY");
  for(const k of ["assessesContentOrForms","businessDataExecutionAllowed","changesProduction","persistsCustomerData","sendsMessages","writesCRM","activatesGmail"])
    assert.equal(report[k],false);
  assert.ok(Object.isFrozen(report.observations[0]));
});
test("HTTP restrictions, redirects, unsupported HEAD and server errors are distinct observations",async()=>{
  for(const [code,state] of [[301,"REDIRECT_REVIEW"],[403,"ACCESS_RESTRICTED"],[401,"ACCESS_RESTRICTED"],[405,"HEAD_UNSUPPORTED"],[429,"RATE_LIMITED"],[404,"NOT_FOUND"],[503,"SERVER_ERROR"]]){
    const report=await checkPublicWebsites({reader:async()=>new Response(null,{status:code})});
    assert.equal(report.status,"ATTENTION");assert.equal(report.observations[0].state,state);assert.equal(report.responding,0);
  }
});
test("network and timeout failures do not leak provider exception details or pretend to be outage proof",async()=>{
  for(const [name,state] of [["Error","NETWORK_ERROR"],["TimeoutError","TIMEOUT"],["AbortError","TIMEOUT"]]){
    const report=await checkPublicWebsites({reader:async()=>{const error=new Error("secret-marker");error.name=name;throw error;}});
    assert.equal(report.observations[0].state,state);assert.equal(report.observations[0].status,null);
    assert.ok(!JSON.stringify(report).includes("secret-marker"));
  }
});
test("public monitor coalesces work, marks stale results and distinguishes a failed assessment",async()=>{
  let count=0,time=0,release;
  const report=await checkPublicWebsites({reader:async()=>new Response(null,{status:200})});
  const monitor=createPublicWebsiteMonitor(async()=>{count++;await new Promise(resolve=>{release=resolve});return report;},()=>time);
  assert.equal(monitor.snapshot().state,"NOT_CHECKED");const a=monitor.run(),b=monitor.run();assert.equal(count,1);release();await Promise.all([a,b]);
  assert.equal(monitor.snapshot().state,"CURRENT");time=PUBLIC_WEBSITE_INTERVAL_MS+30_001;assert.equal(monitor.snapshot().state,"STALE");
  const failed=createPublicWebsiteMonitor(async()=>{throw Error("private-marker");});
  await assert.rejects(()=>failed.run(),/assessment unavailable/);assert.equal(failed.snapshot().state,"CHECK_FAILED");
});
test("public package binds its exact role, tools, permissions, fixtures and output without granting general network access",async()=>{
  assert.equal((await validateFactorySpec(spec)).version,3);
  for(const patch of [{roleId:"lead-operations"},{authorizedTools:["http.fetch"]},{inputs:["arbitrary-url"]},{target:"https://example.test"},
    {permissions:{...spec.permissions,externalWrites:true}},{permissions:{...spec.permissions,mode:"SYNTHETIC_READ_ONLY"}},
    {template:"founder-brief"},{evaluation:{expectedTargets:57,expectedStatus:"RESPONDING"}}])
    await assert.rejects(()=>validateFactorySpec({...spec,...patch}));
  const fixture=await runFactoryAgent(spec);assert.equal(fixture.source,"SYNTHETIC_FIXTURE_ONLY");assert.equal(fixture.report.checked,3);
  const operations=JSON.parse(await readFile(new URL("../config/agents/operations-pilot.spec.json",import.meta.url),"utf8"));
  await assert.rejects(()=>runApprovedPublicWebsiteAgent(operations));
});
test("newly generated public package has a live runner and an independent offline evaluation",async()=>{
  const id="public-eval-"+process.pid;
  try{
    const generated=await generateAgentPackage({...spec,id});assert.equal(generated.status,"PUBLIC_READ_ONLY_PACKAGE");
    const runner=await readFile(generated.packagePath+"/run.mjs","utf8");assert.ok(runner.includes("runApprovedPublicWebsiteAgent"));
    const child=spawnSync(process.execPath,["--test",generated.packagePath+"/agent.test.mjs"],{encoding:"utf8"});assert.equal(child.status,0,child.stdout+child.stderr);
  }finally{await rm(new URL("../agent-packages/"+id,import.meta.url),{recursive:true,force:true});}
});
test("remote website access failure cannot restart a healthy storage pilot or expose a new mutation endpoint",async()=>{
  const publicMonitor=createPublicWebsiteMonitor(async()=>{throw Error("unavailable")});await assert.rejects(()=>publicMonitor.run());
  const server=createPilotHealthServer({healthy:()=>true},publicMonitor);await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  try{
    const base=`http://127.0.0.1:${server.address().port}`;
    const response=await fetch(base+"/healthz");assert.equal(response.status,200);const health=await response.json();
    assert.equal(health.publicWebsiteAgent,"CHECK_FAILED");assert.equal(health.businessDataReady,false);
    assert.equal((await fetch(base+"/website-run",{method:"POST"})).status,404);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
