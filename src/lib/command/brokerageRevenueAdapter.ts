import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import type { RevenueRecord } from "./revenueActivation.ts";

const stageByStatus:Record<LeadSubmissionRecord["status"],string>={
  new:"QUALIFICATION",contacted:"QUALIFICATION",sourcing:"SOURCING","offer-sent":"FOUNDER_APPROVAL",closed:"AFTERCARE",lost:"FOLLOW_UP"
};
const urgency=(r:LeadSubmissionRecord):number=>{
 const t=(r.payload.timeline??"").toLowerCase();
 if(t.includes("immediately"))return 100;if(t.includes("30"))return 80;if(t.includes("research"))return 20;return 50;
};
export function brokerageLeadToRevenueRecord(r:LeadSubmissionRecord):RevenueRecord{
 const latest=[...r.economicsSnapshots].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))[0];
 const economicsEvidence=latest&&latest.riskAdjustedProfit>0?latest:undefined;
 const evidenceIds:string[]=[];
 if(economicsEvidence)evidenceIds.push(economicsEvidence.id);
 const evidenceState=evidenceIds.length?"VERIFIED":"REQUIRES_VERIFICATION";
 const status=r.status==="offer-sent"?"REQUIRES_FOUNDER":r.status==="lost"?"BLOCKED":evidenceIds.length?"READY":"UNKNOWN";
 return Object.freeze({
  division:"WATCH_BROKERAGE",recordId:r.id,stage:stageByStatus[r.status],status,
  reason:evidenceIds.length?"Stored brokerage economics support commercial prioritization.":"Lead exists, but verified economics are not stored; revenue remains unknown.",
  sourceSystem:"quest-luxo-lead-storage",updatedAt:r.notesUpdatedAt??r.tagsUpdatedAt??r.savedAt,
  evidenceIds:Object.freeze(evidenceIds),evidenceState,
  ...(economicsEvidence?{estimatedRevenue:economicsEvidence.riskAdjustedProfit}:{}),
  urgency:urgency(r),
  requiredHumanAction:r.status==="offer-sent"?"Founder review/communication required before external commitment.":undefined
 });
}
export function brokerageLeadsToRevenueRecords(records:readonly LeadSubmissionRecord[]):readonly RevenueRecord[]{
 return Object.freeze(records.map(brokerageLeadToRevenueRecord));
}
