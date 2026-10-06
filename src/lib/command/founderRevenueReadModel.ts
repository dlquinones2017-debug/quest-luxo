import { storedEnterpriseRevenueBrief, type EnterpriseRevenueStoreReaders } from "./storedEnterpriseRevenueBrief.ts";

export interface FounderRevenueReadModel {
  generatedAt:string;
  totalRecords:number;
  unknownRecords:number;
  verifiedEstimatedRevenue:number;
  verifiedExpectedRevenue:number;
  queue:readonly {division:string;recordId:string;status:string;reason:string}[];
  founderActions:readonly {division:string;recordId:string;action:string;reason:string}[];
}

export async function founderRevenueReadModel(now=new Date(),readers?:EnterpriseRevenueStoreReaders):Promise<FounderRevenueReadModel>{
  const brief=await storedEnterpriseRevenueBrief(now,readers);
  return Object.freeze({
    generatedAt:now.toISOString(),
    totalRecords:brief.snapshot.totalRecords,
    unknownRecords:brief.snapshot.unknownRecords,
    verifiedEstimatedRevenue:brief.snapshot.verifiedEstimatedRevenue,
    verifiedExpectedRevenue:brief.snapshot.verifiedExpectedRevenue,
    queue:Object.freeze(brief.queue.map(item=>Object.freeze({
      division:item.division,
      recordId:item.recordId,
      status:item.status,
      reason:item.reason,
    }))),
    founderActions:Object.freeze(brief.founderActions.map(item=>Object.freeze({
      division:item.division,
      recordId:item.recordId,
      action:item.requiredHumanAction,
      reason:item.reason,
    }))),
  });
}
