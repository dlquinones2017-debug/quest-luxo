import type { RevenueAction, EvidenceState } from "./revenueActivation.ts";

export type RevenueOutcomeType = "WON" | "LOST" | "REVENUE_REALIZED" | "ENGAGEMENT_ONLY";

export interface RevenueOutcome {
  outcomeId:string;
  opportunityKey:string;
  division:RevenueAction["division"];
  recordId:string;
  outcomeType:RevenueOutcomeType;
  evidenceState:EvidenceState;
  evidenceIds:readonly string[];
  sourceSystem:string;
  observedAt:string;
  realizedRevenue?:number;
  relatedActionKey?:string;
}

export interface RevenueLearningObservation {
  outcomeId:string;
  opportunityKey:string;
  division:RevenueAction["division"];
  recordId:string;
  learningState:"VERIFIED" | "UNKNOWN";
  outcomeType:RevenueOutcomeType;
  realizedRevenue:number|null;
  evidenceIds:readonly string[];
  observedAt:string;
  correlatedActionKey:string|null;
  attribution:"CORRELATION_ONLY" | "NOT_ATTRIBUTED";
  causalClaim:false;
  reason:string;
}

const validDate=(value:string)=>Number.isFinite(Date.parse(value));
const stableOutcome=(outcome:RevenueOutcome)=>JSON.stringify({
  opportunityKey:outcome.opportunityKey,
  division:outcome.division,
  recordId:outcome.recordId,
  outcomeType:outcome.outcomeType,
  evidenceState:outcome.evidenceState,
  evidenceIds:[...outcome.evidenceIds].sort(),
  sourceSystem:outcome.sourceSystem,
  observedAt:outcome.observedAt,
  realizedRevenue:outcome.realizedRevenue??null,
  relatedActionKey:outcome.relatedActionKey??null,
});

function toLearning(outcome:RevenueOutcome,actions:readonly RevenueAction[]):RevenueLearningObservation {
  if(!outcome.outcomeId||!outcome.opportunityKey||!outcome.recordId||!outcome.sourceSystem||!validDate(outcome.observedAt)){
    throw new Error("Revenue outcome identity, source, opportunity, record, and valid timestamp are required.");
  }
  const evidenceIds=Object.freeze([...new Set(outcome.evidenceIds)].sort());
  const verified=outcome.evidenceState==="VERIFIED"&&evidenceIds.length>0;
  const commercial=outcome.outcomeType!=="ENGAGEMENT_ONLY";
  const learningState=verified&&commercial?"VERIFIED" as const:"UNKNOWN" as const;
  const amount=learningState==="VERIFIED"&&outcome.outcomeType==="REVENUE_REALIZED"&&
    typeof outcome.realizedRevenue==="number"&&Number.isFinite(outcome.realizedRevenue)&&outcome.realizedRevenue>=0
      ?outcome.realizedRevenue:null;
  const matchingAction=outcome.relatedActionKey
    ?actions.find(action=>action.key===outcome.relatedActionKey&&action.division===outcome.division&&action.recordId===outcome.recordId)
    :undefined;
  const sharedEvidence=matchingAction?.evidenceIds.some(id=>evidenceIds.includes(id))??false;
  const correlatedActionKey=learningState==="VERIFIED"&&matchingAction&&sharedEvidence?matchingAction.key:null;
  const reason=!commercial
    ?"Engagement is not a verified commercial outcome and cannot be attributed as revenue."
    :!verified
      ?"Outcome remains UNKNOWN until supported by verified evidence."
      :outcome.outcomeType==="REVENUE_REALIZED"&&amount===null
        ?"Commercial outcome is verified, but realized revenue remains UNKNOWN without a valid non-negative amount."
        :correlatedActionKey
          ?"Verified commercial outcome shares evidence with an action; the association is correlation only, not causation."
          :"Verified commercial outcome recorded without causal attribution.";
  return Object.freeze({
    outcomeId:outcome.outcomeId,opportunityKey:outcome.opportunityKey,division:outcome.division,
    recordId:outcome.recordId,learningState,outcomeType:outcome.outcomeType,realizedRevenue:amount,
    evidenceIds,observedAt:outcome.observedAt,correlatedActionKey,
    attribution:correlatedActionKey?"CORRELATION_ONLY":"NOT_ATTRIBUTED",causalClaim:false,reason,
  });
}

export function revenueLearningAgent(
  outcomes:readonly RevenueOutcome[],
  actions:readonly RevenueAction[]=[],
):readonly RevenueLearningObservation[] {
  const latest=new Map<string,RevenueOutcome>();
  const ordered=[...outcomes].sort((a,b)=>a.outcomeId.localeCompare(b.outcomeId)||
    Date.parse(a.observedAt)-Date.parse(b.observedAt)||stableOutcome(a).localeCompare(stableOutcome(b)));
  for(const outcome of ordered){
    const old=latest.get(outcome.outcomeId);
    if(!old||Date.parse(outcome.observedAt)>=Date.parse(old.observedAt))latest.set(outcome.outcomeId,outcome);
  }
  return Object.freeze([...latest.values()].map(outcome=>toLearning(outcome,actions)).sort((a,b)=>
    a.opportunityKey.localeCompare(b.opportunityKey)||a.outcomeId.localeCompare(b.outcomeId)));
}
