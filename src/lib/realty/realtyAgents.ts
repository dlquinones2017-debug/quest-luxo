export type Verification="VERIFIED"|"UNKNOWN"|"REQUIRES_VERIFICATION";
export type RealtyStage="INTAKE"|"EVIDENCE"|"UNDERWRITING"|"DILIGENCE"|"FOUNDER_APPROVAL"|"OUTCOME"|"FOLLOW_UP";
export interface PropertyLead{leadId:string;address:string;askingPrice?:number;propertyType:string;identity:Verification}
export interface DealEvidence{leadId:string;compEvidenceIds:readonly string[];arv?:number;rent?:number;rehab?:number;arvState:Verification;rentState:Verification;rehabState:Verification}
export interface Diligence{title:Verification;flood:Verification;zoning:Verification;occupancy:Verification;evidenceIds:readonly string[]}
export interface RealtyEvent{leadId:string;stage:RealtyStage;status:"READY"|"BLOCKED"|"REQUIRES_FOUNDER";reason:string;evidenceIds:readonly string[]}
export interface UnderwriteResult{basis:number;rehab:number;allIn:number;arv:number|null;grossSpread:number|null;assumptions:readonly string[]}

export function intakeLead(p:PropertyLead):RealtyEvent{
 if(!p.leadId||!p.address||!p.propertyType||p.identity!=="VERIFIED")return ev(p.leadId,"INTAKE","BLOCKED","Exact property identity must be verified.");
 return ev(p.leadId,"EVIDENCE","READY","Property identity verified; collect market and diligence evidence.");
}
export function underwrite(p:PropertyLead,e:DealEvidence):UnderwriteResult{
 if(!p.askingPrice||p.askingPrice<=0)throw new Error("Verified positive acquisition basis is required.");
 const rehab=e.rehabState==="VERIFIED"&&typeof e.rehab==="number"?e.rehab:0;
 const assumptions:string[]=[]; if(e.rehabState!=="VERIFIED")assumptions.push("Rehab UNKNOWN; zero is not a validated rehab estimate.");
 const arv=e.arvState==="VERIFIED"&&typeof e.arv==="number"?e.arv:null;
 if(!e.compEvidenceIds.length||arv===null)assumptions.push("ARV/comp evidence REQUIRES_VERIFICATION.");
 return Object.freeze({basis:p.askingPrice,rehab,allIn:p.askingPrice+rehab,arv,grossSpread:arv===null?null:arv-p.askingPrice-rehab,assumptions:Object.freeze(assumptions)});
}
export function strategyFit(e:DealEvidence):readonly string[]{
 const out:string[]=[]; if(e.arvState==="VERIFIED"&&e.rehabState==="VERIFIED")out.push("FIX_FLIP","BRRRR");
 if(e.rentState==="VERIFIED")out.push("BUY_HOLD"); return Object.freeze(out);
}
export function diligenceGate(leadId:string,d:Diligence):RealtyEvent{
 if(d.title!=="VERIFIED"||d.flood!=="VERIFIED"||d.zoning!=="VERIFIED"||d.occupancy!=="VERIFIED"||!d.evidenceIds.length)
  return ev(leadId,"DILIGENCE","BLOCKED","Title, flood, zoning, occupancy, and supporting evidence must be verified before external commitment.",d.evidenceIds);
 return ev(leadId,"FOUNDER_APPROVAL","REQUIRES_FOUNDER","Diligence passed; founder approval required before offer, LOI, contract, financing, or negotiation.",d.evidenceIds);
}
export function prohibitRealtyAction(leadId:string,action:"OFFER"|"LOI"|"CONTRACT"|"EARNEST_MONEY"|"FINANCING_APPLICATION"|"SELLER_REPRESENTATION"|"MONEY_MOVEMENT"):RealtyEvent{
 return ev(leadId,"FOUNDER_APPROVAL","REQUIRES_FOUNDER",`${action} requires explicit human execution/approval; agent autonomy is prohibited.`);
}
export function recordRealtyOutcome(leadId:string,outcome:"ACQUIRED"|"ASSIGNED"|"SOLD"|"LOST"|"WITHDRAWN",evidenceId?:string):RealtyEvent{
 if(!evidenceId)return ev(leadId,"OUTCOME","BLOCKED","Outcome requires evidence.");
 return ev(leadId,"FOLLOW_UP","READY",`Verified realty outcome: ${outcome}.`,[evidenceId]);
}
function ev(leadId:string,stage:RealtyStage,status:RealtyEvent["status"],reason:string,evidenceIds:readonly string[]=[]):RealtyEvent{return Object.freeze({leadId,stage,status,reason,evidenceIds:Object.freeze([...evidenceIds])});}
