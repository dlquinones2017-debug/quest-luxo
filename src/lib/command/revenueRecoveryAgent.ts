import type { RevenueAction } from "./revenueActivation.ts";

export type RecoveryStallReason =
  | "FOLLOW_UP_OVERDUE" | "QUALIFICATION_INCOMPLETE" | "EVIDENCE_MISSING"
  | "ECONOMICS_MISSING" | "SOURCING_STALLED" | "MATCHING_STALLED"
  | "DUE_DILIGENCE_STALLED" | "FOUNDER_ACTION_PENDING" | "EVIDENCE_STALE";

export type RecoveryAction =
  | "COLLECT_EVIDENCE" | "FOLLOW_UP" | "QUALIFY" | "SOURCE"
  | "PREPARE_MATCH" | "UNDERWRITE" | "ESCALATE_TO_FOUNDER";

export interface RecoveryRecommendation {
  opportunityKey:string; division:RevenueAction["division"]; recordId:string;
  stallReason:RecoveryStallReason; recommendedAction:RecoveryAction;
  evidenceIds:readonly string[]; lastVerifiedActivity:string|null;
  estimatedRevenueAtRisk:number|null; expectedRevenueAtRisk:number|null;
  urgency:number; founderActionRequired:boolean; requiredHumanAction:string|null;
  rationale:string;
}

const DAY=86400000;
const FOLLOW_UP_DAYS=7;
const ageDays=(updatedAt:string,now:Date)=>{
  const parsed=Date.parse(updatedAt);
  return Number.isFinite(parsed)?Math.max(0,Math.floor((now.getTime()-parsed)/DAY)):null;
};

function inferVerifiedStall(action:RevenueAction,age:number){
  if(action.status==="REQUIRES_FOUNDER") return {reason:"FOUNDER_ACTION_PENDING" as const,next:"ESCALATE_TO_FOUNDER" as const,rationale:"Verified opportunity is waiting on an explicit founder decision."};
  const text=`${action.stage} ${action.reason}`.toLowerCase();
  if(/qualif/.test(text)) return {reason:"QUALIFICATION_INCOMPLETE" as const,next:"QUALIFY" as const,rationale:"Verified opportunity indicates incomplete qualification."};
  if(/sourc/.test(text)) return {reason:"SOURCING_STALLED" as const,next:"SOURCE" as const,rationale:"Verified opportunity indicates stalled sourcing."};
  if(/match|lender/.test(text)) return {reason:"MATCHING_STALLED" as const,next:"PREPARE_MATCH" as const,rationale:"Verified opportunity indicates stalled matching."};
  if(/due diligence|underwrit/.test(text)) return {reason:"DUE_DILIGENCE_STALLED" as const,next:"UNDERWRITE" as const,rationale:"Verified opportunity indicates stalled diligence or underwriting."};
  if(action.estimatedRevenue===null||action.probability===null) return {reason:"ECONOMICS_MISSING" as const,next:"COLLECT_EVIDENCE" as const,rationale:"Verified opportunity lacks decision-grade revenue economics."};
  if(age>=FOLLOW_UP_DAYS&&(action.status==="READY"||action.status==="BLOCKED")) return {reason:"FOLLOW_UP_OVERDUE" as const,next:"FOLLOW_UP" as const,rationale:`Verified opportunity has had no newer recorded activity for ${age} days.`};
  return null;
}

export function revenueRecoveryAgent(actions:readonly RevenueAction[],now=new Date()):readonly RecoveryRecommendation[]{
  const latest=new Map<string,RevenueAction>();
  for(const action of actions){const old=latest.get(action.key);if(!old||Date.parse(action.updatedAt)>=Date.parse(old.updatedAt))latest.set(action.key,action);}
  const recommendations:RecoveryRecommendation[]=[];
  for(const action of latest.values()){
    const age=ageDays(action.updatedAt,now); if(age===null)continue;
    let detected:ReturnType<typeof inferVerifiedStall>;
    let lastVerifiedActivity:string|null=action.updatedAt;
    if(action.evidenceState!=="VERIFIED"||action.evidenceIds.length===0||action.status==="UNKNOWN"){
      const stale=/stale/i.test(action.reason);
      detected={reason:stale?"EVIDENCE_STALE":"EVIDENCE_MISSING",next:"COLLECT_EVIDENCE",rationale:stale?"Opportunity evidence is stale; refresh evidence before recovery action.":"Opportunity is not sufficiently verified; collect evidence rather than inferring a stall."};
      lastVerifiedActivity=null;
    }else detected=inferVerifiedStall(action,age);
    if(!detected)continue;
    recommendations.push(Object.freeze({
      opportunityKey:action.key,division:action.division,recordId:action.recordId,
      stallReason:detected.reason,recommendedAction:detected.next,
      evidenceIds:Object.freeze([...action.evidenceIds]),lastVerifiedActivity,
      estimatedRevenueAtRisk:action.evidenceState==="VERIFIED"?action.estimatedRevenue:null,
      expectedRevenueAtRisk:action.evidenceState==="VERIFIED"?action.expectedRevenue:null,
      urgency:action.urgency,founderActionRequired:action.status==="REQUIRES_FOUNDER",
      requiredHumanAction:action.status==="REQUIRES_FOUNDER"?action.requiredHumanAction??null:null,
      rationale:detected.rationale,
    }));
  }
  return Object.freeze(recommendations.sort((a,b)=>Number(b.founderActionRequired)-Number(a.founderActionRequired)||(b.expectedRevenueAtRisk??-1)-(a.expectedRevenueAtRisk??-1)||b.urgency-a.urgency||a.opportunityKey.localeCompare(b.opportunityKey)));
}
