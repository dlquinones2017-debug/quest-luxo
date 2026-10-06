export type PersistenceEvidenceState="VERIFIED"|"UNKNOWN"|"REQUIRES_VERIFICATION";
export interface CapitalPipelineRecord{borrowerId:string;stage:string;status:"READY"|"BLOCKED"|"REQUIRES_FOUNDER";reason:string;updatedAt:string;evidenceIds:readonly string[];evidenceState:PersistenceEvidenceState;estimatedRevenue?:number;probability?:number;urgency?:number;requiredHumanAction?:string}
const records:CapitalPipelineRecord[]=[];
export function appendCapitalRecord(r:CapitalPipelineRecord):CapitalPipelineRecord{if(!r.borrowerId||!r.updatedAt)throw new Error("Capital record identity and timestamp are required.");const copy=Object.freeze({...r,evidenceIds:Object.freeze([...r.evidenceIds])});records.push(copy);return copy}
export function capitalSnapshot():readonly CapitalPipelineRecord[]{return Object.freeze(records.map(r=>Object.freeze({...r,evidenceIds:Object.freeze([...r.evidenceIds])})))}
export function clearCapitalStoreForTests(){records.length=0}
