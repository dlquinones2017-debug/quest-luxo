import { normalizeEvent, type CommandEnvelope, type Division, type EnterpriseStatus } from "./enterpriseCommand.ts";

export type EvidenceState = "VERIFIED" | "UNKNOWN" | "REQUIRES_VERIFICATION";
export interface RevenueRecord {
  division: Exclude<Division,"GROWTH_ENGINE">;
  recordId:string; stage:string; status:EnterpriseStatus; reason:string;
  sourceSystem:string; updatedAt:string; evidenceIds:readonly string[];
  evidenceState:EvidenceState; estimatedRevenue?:number; probability?:number;
  urgency?:number; requiredHumanAction?:string;
}
export interface RevenueAction extends CommandEnvelope {
  estimatedRevenue:number|null; probability:number|null; urgency:number;
  evidenceState:EvidenceState; expectedRevenue:number|null; revenueScore:number|null;
}
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function ingestRevenueRecord(r:RevenueRecord,now=new Date()):RevenueAction{
  if(!r.recordId||!r.sourceSystem||!r.updatedAt)throw new Error("Revenue record identity, source, and timestamp are required.");
  const parsed=Date.parse(r.updatedAt); if(!Number.isFinite(parsed))throw new Error("Revenue record timestamp must be valid.");
  const stale=now.getTime()-parsed>1000*60*60*24*30;
  const evidenceOk=r.evidenceState==="VERIFIED"&&r.evidenceIds.length>0&&!stale;
  const status:EnterpriseStatus=evidenceOk?r.status:"UNKNOWN";
  const envelope=normalizeEvent({...r,status,reason:evidenceOk?r.reason:stale?"Revenue evidence is stale and requires verification.":"Revenue evidence requires verification."});
  const amount=evidenceOk&&typeof r.estimatedRevenue==="number"&&r.estimatedRevenue>=0?r.estimatedRevenue:null;
  const probability=evidenceOk&&typeof r.probability==="number"?clamp(r.probability,0,1):null;
  const urgency=clamp(r.urgency??0,0,100);
  const expectedRevenue=amount!==null&&probability!==null?Math.round(amount*probability):null;
  const revenueScore=expectedRevenue===null?null:Math.round(expectedRevenue*(1+urgency/100));
  return Object.freeze({...envelope,estimatedRevenue:amount,probability,urgency,evidenceState:r.evidenceState,expectedRevenue,revenueScore});
}
export function revenueFounderQueue(records:readonly RevenueRecord[],now=new Date()):readonly RevenueAction[]{
  const latest=new Map<string,RevenueAction>();
  for(const raw of records){const a=ingestRevenueRecord(raw,now);const old=latest.get(a.key);if(!old||Date.parse(a.updatedAt)>=Date.parse(old.updatedAt))latest.set(a.key,a);}
  return Object.freeze([...latest.values()].sort((a,b)=>{
    const actionable=(s: EnterpriseStatus):number=>s==="REQUIRES_FOUNDER"||s==="READY"?0:s==="BLOCKED"?1:2;
    return actionable(a.status)-actionable(b.status)||(b.revenueScore??-1)-(a.revenueScore??-1)||b.urgency-a.urgency||Date.parse(b.updatedAt)-Date.parse(a.updatedAt);
  }));
}
