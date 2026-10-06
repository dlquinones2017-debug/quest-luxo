export type PersistenceEvidenceState="VERIFIED"|"UNKNOWN"|"REQUIRES_VERIFICATION";
export interface RealtyPipelineRecord{leadId:string;stage:string;status:"READY"|"BLOCKED"|"REQUIRES_FOUNDER";reason:string;updatedAt:string;evidenceIds:readonly string[];evidenceState:PersistenceEvidenceState;estimatedRevenue?:number;probability?:number;urgency?:number;requiredHumanAction?:string}
const records:RealtyPipelineRecord[]=[];
export function appendRealtyRecord(r:RealtyPipelineRecord):RealtyPipelineRecord{if(!r.leadId||!r.updatedAt)throw new Error("Realty record identity and timestamp are required.");const copy=Object.freeze({...r,evidenceIds:Object.freeze([...r.evidenceIds])});records.push(copy);return copy}
export function realtySnapshot():readonly RealtyPipelineRecord[]{return Object.freeze(records.map(r=>Object.freeze({...r,evidenceIds:Object.freeze([...r.evidenceIds])})))}
export function clearRealtyStoreForTests(){records.length=0}
