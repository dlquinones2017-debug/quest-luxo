import type { RevenueAction } from "./revenueActivation.ts";

export interface EnterpriseRevenueSnapshot {
  totalRecords:number;
  actionableRecords:number;
  founderRequiredRecords:number;
  unknownRecords:number;
  verifiedEstimatedRevenue:number;
  verifiedExpectedRevenue:number;
}

export function enterpriseRevenueSnapshot(queue:readonly RevenueAction[]):EnterpriseRevenueSnapshot {
  let actionableRecords=0, founderRequiredRecords=0, unknownRecords=0;
  let verifiedEstimatedRevenue=0, verifiedExpectedRevenue=0;
  for(const item of queue){
    if(item.status==="READY"||item.status==="REQUIRES_FOUNDER") actionableRecords++;
    if(item.status==="REQUIRES_FOUNDER") founderRequiredRecords++;
    if(item.status==="UNKNOWN") unknownRecords++;
    if(item.evidenceState==="VERIFIED"&&item.estimatedRevenue!==null) verifiedEstimatedRevenue+=item.estimatedRevenue;
    if(item.evidenceState==="VERIFIED"&&item.expectedRevenue!==null) verifiedExpectedRevenue+=item.expectedRevenue;
  }
  return Object.freeze({totalRecords:queue.length,actionableRecords,founderRequiredRecords,unknownRecords,verifiedEstimatedRevenue,verifiedExpectedRevenue});
}
