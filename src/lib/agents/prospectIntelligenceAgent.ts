export type ProspectClass = "DIRECT_BUYER" | "REFERRAL_NODE" | "STRATEGIC" | "LOW_PRIORITY";
export type ProspectEvidenceState = "VERIFIED" | "UNKNOWN" | "REQUIRES_VERIFICATION";
export interface ProspectRecord { id:string; name:string; title?:string; organization?:string; location?:string; linkedinUrl?:string; source:string; evidenceState:ProspectEvidenceState; commercialFit:number; referralLeverage:number; accessibility:number; conversationRelevance:number; classification?:ProspectClass; reason:string; }
export interface ProspectRecommendation { prospectId:string; classification:ProspectClass; score:number|null; priority:"HIGH"|"MEDIUM"|"LOW"|"VERIFY"; reason:string; founderAction:string; }
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
export function classifyProspect(p:ProspectRecord):ProspectRecommendation{
 if(p.evidenceState!=="VERIFIED")return{prospectId:p.id,classification:"LOW_PRIORITY",score:null,priority:"VERIFY",reason:"Prospect evidence is not verified.",founderAction:"Verify identity, role, source, and LinkedIn profile before outreach."};
 const score=Math.round(clamp(p.commercialFit)*.35+clamp(p.referralLeverage)*.25+clamp(p.accessibility)*.15+clamp(p.conversationRelevance)*.25);
 const classification=p.classification??(p.commercialFit>=80?"DIRECT_BUYER":p.referralLeverage>=80?"REFERRAL_NODE":p.conversationRelevance>=80?"STRATEGIC":"LOW_PRIORITY");
 const priority=score>=75?"HIGH":score>=60?"MEDIUM":"LOW";
 return Object.freeze({prospectId:p.id,classification,score,priority,reason:p.reason,founderAction:"Founder reviews the profile and approves any external connection or outreach."});
}
export function rankProspects(records:readonly ProspectRecord[]):readonly ProspectRecommendation[]{return Object.freeze(records.map(classifyProspect).sort((a,b)=>(b.score??-1)-(a.score??-1)));}
