import { storedEnterpriseRevenueBrief, type EnterpriseRevenueStoreReaders, type StoredEnterpriseRevenueBrief } from "./storedEnterpriseRevenueBrief.ts";

export interface FounderRevenueReadModel {
  generatedAt:string;
  totalRecords:number;
  unknownRecords:number;
  verifiedEstimatedRevenue:number;
  verifiedExpectedRevenue:number;
  queue:readonly {division:string;recordId:string;status:string;reason:string}[];
  founderActions:readonly {division:string;recordId:string;action:string;expectedRevenue:number|null;revenueScore:number|null}[];
  intakeReliability:StoredEnterpriseRevenueBrief["intakeReliability"];
  intakeReconciliation:StoredEnterpriseRevenueBrief["intakeReconciliation"]["divisions"];
  sourceRead:StoredEnterpriseRevenueBrief["sourceRead"];
}

export async function founderRevenueReadModel(now=new Date(),readers?:EnterpriseRevenueStoreReaders):Promise<FounderRevenueReadModel>{
  const brief=await storedEnterpriseRevenueBrief(now,readers);
  return Object.freeze({
    generatedAt:now.toISOString(),
    intakeReliability:brief.intakeReliability,
    // Authenticated read model exposes aggregate status only; no customer
    // identity, message content or receipt lookup keys leave this boundary.
    intakeReconciliation:brief.intakeReconciliation.divisions,
    sourceRead:brief.sourceRead,
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
      expectedRevenue:item.expectedRevenue,
      revenueScore:item.revenueScore,
    }))),
  });
}
