import type { RevenueAction } from "./revenueActivation.ts";
import type { RecoveryRecommendation } from "./revenueRecoveryAgent.ts";

export type NextBestActionType="FOUNDER_DECISION"|"RECOVER_OPPORTUNITY"|"ADVANCE_REVENUE"|"COLLECT_EVIDENCE";
export interface NextBestActionRecommendation{
  key:string;division:RevenueAction["division"];recordId:string;actionType:NextBestActionType;
  recommendedAction:string;founderActionRequired:boolean;requiredHumanAction:string|null;
  expectedRevenue:number|null;revenueScore:number|null;urgency:number;
  evidenceIds:readonly string[];source:"REVENUE_QUEUE"|"RECOVERY_AGENT";rationale:string;
}
const verified=(a:RevenueAction)=>a.evidenceState==="VERIFIED"&&a.evidenceIds.length>0&&a.status!=="UNKNOWN";
const score=(x:NextBestActionRecommendation)=>Number(x.founderActionRequired)*1e12+(x.expectedRevenue??-1)*1e6+(x.revenueScore??-1)*1e3+x.urgency;
export function nextBestActionAgent(actions:readonly RevenueAction[],recovery:readonly RecoveryRecommendation[]):readonly NextBestActionRecommendation[]{
 const out=new Map<string,NextBestActionRecommendation>();
 for(const a of actions){
  const isVerified=verified(a);
  const founder=a.status==="REQUIRES_FOUNDER";
  const item:NextBestActionRecommendation=Object.freeze({
   key:a.key,division:a.division,recordId:a.recordId,
   actionType:founder?"FOUNDER_DECISION":isVerified?"ADVANCE_REVENUE":"COLLECT_EVIDENCE",
   recommendedAction:founder?(a.requiredHumanAction??"Founder decision required."):isVerified?"Advance the verified revenue opportunity.":"Collect or refresh evidence before recommending execution.",
   founderActionRequired:founder,requiredHumanAction:founder?a.requiredHumanAction??null:null,
   expectedRevenue:isVerified?a.expectedRevenue:null,revenueScore:isVerified?a.revenueScore:null,urgency:a.urgency,
   evidenceIds:Object.freeze([...a.evidenceIds]),source:"REVENUE_QUEUE",rationale:a.reason
  }); out.set(a.key,item);
 }
 for(const r of recovery){
  const existing=out.get(r.opportunityKey);
  const item:NextBestActionRecommendation=Object.freeze({
   key:r.opportunityKey,division:r.division,recordId:r.recordId,
   actionType:r.founderActionRequired?"FOUNDER_DECISION":r.recommendedAction==="COLLECT_EVIDENCE"?"COLLECT_EVIDENCE":"RECOVER_OPPORTUNITY",
   recommendedAction:r.requiredHumanAction??r.recommendedAction,founderActionRequired:r.founderActionRequired,
   requiredHumanAction:r.requiredHumanAction,expectedRevenue:r.expectedRevenueAtRisk,revenueScore:existing?.revenueScore??null,
   urgency:r.urgency,evidenceIds:Object.freeze([...r.evidenceIds]),source:"RECOVERY_AGENT",rationale:r.rationale
  });
  if(!existing||r.founderActionRequired||r.recommendedAction==="COLLECT_EVIDENCE"||score(item)>score(existing))out.set(r.opportunityKey,item);
 }
 return Object.freeze([...out.values()].sort((a,b)=>score(b)-score(a)||a.key.localeCompare(b.key)));
}
