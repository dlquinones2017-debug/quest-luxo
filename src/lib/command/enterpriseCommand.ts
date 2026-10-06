export type Division="WATCH_BROKERAGE"|"CAPITAL_ADVISORY"|"REALTY"|"GROWTH_ENGINE";
export type EnterpriseStatus="BLOCKED"|"REQUIRES_FOUNDER"|"UNKNOWN"|"READY";
export interface DivisionEvent{division:Division;recordId:string;stage:string;status:EnterpriseStatus;reason:string;evidenceIds:readonly string[];sourceSystem:string;updatedAt:string;requiredHumanAction?:string}
export interface CommandEnvelope extends DivisionEvent{key:string;priority:number}
const priority:Record<EnterpriseStatus,number>={BLOCKED:0,REQUIRES_FOUNDER:1,UNKNOWN:2,READY:3};

export function normalizeEvent(e:DivisionEvent):CommandEnvelope{
 if(!e.division||!e.recordId||!e.stage||!e.sourceSystem||!e.updatedAt)throw new Error("Incomplete command event.");
 if(!["BLOCKED","REQUIRES_FOUNDER","UNKNOWN","READY"].includes(e.status))throw new Error("Unsupported enterprise status.");
 return Object.freeze({...e,evidenceIds:Object.freeze([...e.evidenceIds]),key:`${e.division}:${e.recordId}:${e.stage}`,priority:priority[e.status]});
}
export function founderQueue(events:readonly DivisionEvent[]):readonly CommandEnvelope[]{
 const latest=new Map<string,CommandEnvelope>();
 for(const raw of events){const e=normalizeEvent(raw);const old=latest.get(e.key);if(!old||Date.parse(e.updatedAt)>=Date.parse(old.updatedAt))latest.set(e.key,e);}
 return Object.freeze([...latest.values()].sort((a,b)=>a.priority-b.priority||Date.parse(a.updatedAt)-Date.parse(b.updatedAt)));
}
export function preserveVerification(status:string):EnterpriseStatus{
 if(status==="BLOCKED")return "BLOCKED"; if(status==="REQUIRES_FOUNDER")return "REQUIRES_FOUNDER";
 if(status==="UNKNOWN"||status==="REQUIRES_VERIFICATION")return "UNKNOWN"; if(status==="READY")return "READY";
 return "UNKNOWN";
}
export function prohibitEnterpriseAction(division:Division,recordId:string,action:string):CommandEnvelope{
 return normalizeEvent({division,recordId,stage:"FOUNDER_APPROVAL",status:"REQUIRES_FOUNDER",reason:`${action} cannot be executed autonomously by Enterprise Command.`,evidenceIds:[],sourceSystem:"enterprise-command",updatedAt:new Date(0).toISOString(),requiredHumanAction:"Founder/human execution required"});
}
