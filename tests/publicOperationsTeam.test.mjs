import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { checkPublicWebsites } from "../src/lib/agents/publicWebsiteHealth.ts";
import { triagePublicWebsiteReport, buildPublicOperationsBrief } from "../src/lib/agents/publicOperationsTeam.ts";
import { runApprovedPublicIncidentAgent, runApprovedPublicOperationsAgent, runFactoryAgent } from "../scripts/factory-agent-runtime.mjs";
import { validateFactorySpec } from "../src/lib/agents/agentFactory.ts";
import { createPilotHealthServer } from "../scripts/start-agent-pilot.mjs";
const now="2026-10-21T21:00:00.000Z";
const spec=async name=>JSON.parse(await readFile(new URL(`../config/agents/${name}.spec.json`,import.meta.url),"utf8"));
async function health(statuses=[200,403,503]) {let i=0;return checkPublicWebsites({now:()=>new Date(now),reader:async()=>new Response(null,{status:statuses[i++]})});}
test("incident triage distinguishes access review from server response investigation, with no remediation or dispatch",async()=>{
  const report=triagePublicWebsiteReport(await health(),now);
  assert.equal(report.status,"ATTENTION");assert.equal(report.incidentCount,2);
  assert.deepEqual(report.incidents.map(i=>[i.division,i.action,i.severity]),[["REALTY","VERIFY_ACCESS","REVIEW"],["CAPITAL_ADVISORY","INVESTIGATE_SERVER_RESPONSE","ERROR"]]);
  for(const k of ["businessDataExecutionAllowed","changesProduction","dispatchesWork","sendsMessages","writesCRM","activatesGmail"]) assert.equal(report[k],false);
});
test("clear public observations remain clear while stale and future observations cannot masquerade as current",async()=>{
  const source=await health([200,200,200]);assert.equal(triagePublicWebsiteReport(source,now).status,"CLEAR");
  const stale=triagePublicWebsiteReport(source,"2026-10-21T21:06:00.000Z");assert.equal(stale.status,"HOLD");assert.equal(stale.sourceFresh,false);
  assert.deepEqual(stale.incidents.map(i=>i.action),["VERIFY_FRESH_CHECK"]);
  assert.throws(()=>triagePublicWebsiteReport(source,"2026-10-21T20:59:59.000Z"));
});
test("consumer rejects raw extra fields, redirected targets, false counts and inconsistent HTTP classifications",async()=>{
  const source=await health();
  for(const change of [s=>s.email="private@example.test",s=>s.responding=3,s=>s.observations[0].url="https://example.test/private",
    s=>s.observations[1].state="RESPONDING",s=>s.observations[0].rawBody="secret-marker",s=>s.writesCRM=true,s=>s.observations[0].durationMs=-1]){
    const bad=structuredClone(source);change(bad);assert.throws(()=>triagePublicWebsiteReport(bad,now));
  }
});
test("founder brief consumes matching triage and preserves unknown business pipeline rather than inventing revenue or case counts",async()=>{
  const source=await health(),incident=triagePublicWebsiteReport(source,now),brief=buildPublicOperationsBrief(source,incident,now);
  assert.equal(brief.sitesChecked,3);assert.equal(brief.sitesResponding,1);assert.equal(brief.incidentCount,2);
  assert.equal(brief.status,"READY_FOR_REVIEW");assert.equal(brief.sourceCoverage,"PUBLIC_WEBSITES_ONLY");assert.equal(brief.businessPipeline,"NOT_CONNECTED");
  assert.equal(brief.businessDataExecutionAllowed,false);assert.equal(brief.dispatchesWork,false);
  assert.throws(()=>buildPublicOperationsBrief(source,{...incident,incidentCount:0},now));
  assert.throws(()=>buildPublicOperationsBrief(source,{...incident,customer:"secret-marker"},now));
  const staleNow="2026-10-21T21:06:00.000Z";assert.equal(buildPublicOperationsBrief(source,triagePublicWebsiteReport(source,staleNow),staleNow).status,"HOLD");
});
test("three public roles coordinate through one observation with exactly three network calls",async()=>{
  let calls=0;const source=await checkPublicWebsites({now:()=>new Date(now),reader:async()=>{calls++;return new Response(null,{status:200})}});
  const incidentSpec=await spec("public-incident-triage"),briefSpec=await spec("public-operations-brief");
  const incidents=await runApprovedPublicIncidentAgent(incidentSpec,source,now);
  const brief=await runApprovedPublicOperationsAgent(briefSpec,source,incidents.report,now);
  assert.equal(calls,3);assert.equal(incidents.report.status,"CLEAR");assert.equal(brief.report.sitesResponding,3);
  assert.equal(brief.report.incidentCount,0);assert.equal(brief.report.businessDataExecutionAllowed,false);
});
test("derived roles cannot swap tools, permissions, roles or evaluation outcomes; wrong entry points reject before network calls",async()=>{
  const incident=await spec("public-incident-triage"),brief=await spec("public-operations-brief");
  for(const template of [incident,brief]){
    for(const patch of [{roleId:"website-product"},{authorizedTools:["public-http.head"]},{permissions:{...template.permissions,production:true}},
      {evaluation:{expectedStatus:"CLEAR",expectedIncidents:0}}])await assert.rejects(()=>validateFactorySpec({...template,...patch}));
    const fixture=await runFactoryAgent(template);assert.equal(fixture.source,"SYNTHETIC_FIXTURE_ONLY");assert.equal(fixture.report.incidentCount,2);
  }
  await assert.rejects(()=>runApprovedPublicIncidentAgent(brief));await assert.rejects(()=>runApprovedPublicOperationsAgent(incident));
});
test("health counts live public agents only after the complete team succeeds, and reflects staleness",async()=>{
  let freshness="CURRENT",team="CURRENT";
  const server=createPilotHealthServer({healthy:()=>true},{snapshot:()=>({state:freshness})},()=>team);
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  try{
    const url=`http://127.0.0.1:${server.address().port}/healthz`;
    assert.equal((await(await fetch(url)).json()).livePublicAgents,3);
    team="CHECK_FAILED";assert.equal((await(await fetch(url)).json()).livePublicAgents,0);
    team="CURRENT";freshness="STALE";const result=await(await fetch(url)).json();assert.equal(result.publicOperationsTeam,"STALE");assert.equal(result.livePublicAgents,0);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
