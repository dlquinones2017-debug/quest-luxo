export type RelationshipDivision="WATCH_BROKERAGE"|"CAPITAL_ADVISORY"|"REALTY"|"GROWTH";
export type IdentityEvidenceKind="SOURCE_ID"|"EMAIL"|"PHONE"|"NAME";
export type ResolutionState="VERIFIED"|"HIGH_CONFIDENCE"|"POSSIBLE"|"UNKNOWN"|"CONFLICT";
export interface IdentityEvidence{kind:IdentityEvidenceKind;value:string;verified:boolean;evidenceId:string}
export interface RelationshipObservation{observationId:string;division:RelationshipDivision;role:string;evidence:readonly IdentityEvidence[]}
export interface RelationshipResolution{leftObservationId:string;rightObservationId:string;state:ResolutionState;canonicalRelationshipKey:string|null;evidenceIds:readonly string[];reason:string;requiresHumanReview:boolean}
const norm=(kind:IdentityEvidenceKind,value:string)=>{const v=value.trim().toLowerCase();if(kind==="PHONE")return v.replace(/\D/g,"");if(kind==="NAME")return v.replace(/\s+/g," ");return v};
const strong=(e:IdentityEvidence)=>e.verified&&e.kind!=="NAME"&&norm(e.kind,e.value).length>0;
export function resolveRelationshipPair(a:RelationshipObservation,b:RelationshipObservation):RelationshipResolution{
 const evidenceIds=new Set<string>(),matches:{kind:IdentityEvidenceKind;value:string}[]=[];const conflicts:IdentityEvidenceKind[]=[];
 const as=a.evidence.filter(strong),bs=b.evidence.filter(strong);
 for(const kind of ["SOURCE_ID","EMAIL","PHONE"] as const){const av=as.filter(e=>e.kind===kind).map(e=>norm(kind,e.value)),bv=bs.filter(e=>e.kind===kind).map(e=>norm(kind,e.value));const match=av.find(x=>bv.includes(x));if(match){matches.push({kind,value:match});[...as,...bs].filter(e=>e.kind===kind&&norm(kind,e.value)===match).forEach(e=>evidenceIds.add(e.evidenceId))}else if(av.length&&bv.length)conflicts.push(kind)}
 if(conflicts.length&&matches.length)return Object.freeze({leftObservationId:a.observationId,rightObservationId:b.observationId,state:"CONFLICT",canonicalRelationshipKey:null,evidenceIds:Object.freeze([...evidenceIds].sort()),reason:`Verified identity evidence conflicts on ${conflicts.join(", ")}.`,requiresHumanReview:true});
 if(matches.length){const p=matches.find(m=>m.kind==="SOURCE_ID")??matches.find(m=>m.kind==="EMAIL")??matches[0];return Object.freeze({leftObservationId:a.observationId,rightObservationId:b.observationId,state:"VERIFIED",canonicalRelationshipKey:`${p.kind}:${p.value}`,evidenceIds:Object.freeze([...evidenceIds].sort()),reason:`Verified ${p.kind.toLowerCase()} evidence links the observations.`,requiresHumanReview:false})}
 const an=a.evidence.filter(e=>e.kind==="NAME").map(e=>norm("NAME",e.value)),bn=b.evidence.filter(e=>e.kind==="NAME").map(e=>norm("NAME",e.value));const same=an.some(x=>x&&bn.includes(x));
 return Object.freeze({leftObservationId:a.observationId,rightObservationId:b.observationId,state:same?"POSSIBLE":"UNKNOWN",canonicalRelationshipKey:null,evidenceIds:Object.freeze([]),reason:same?"Name similarity alone cannot establish identity.":"No verified shared identity evidence is available.",requiresHumanReview:same});
}
export function enterpriseRelationshipIntelligence(observations:readonly RelationshipObservation[]):readonly RelationshipResolution[]{const s=[...observations].sort((a,b)=>a.observationId.localeCompare(b.observationId)),out:RelationshipResolution[]=[];for(let i=0;i<s.length;i++)for(let j=i+1;j<s.length;j++)out.push(resolveRelationshipPair(s[i],s[j]));return Object.freeze(out)}
