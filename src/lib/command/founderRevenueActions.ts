import type { RevenueAction } from "./revenueActivation.ts";

export interface FounderRevenueAction {
  key:string;
  division:RevenueAction["division"];
  recordId:string;
  stage:string;
  status:"REQUIRES_FOUNDER";
  requiredHumanAction:string;
  expectedRevenue:number|null;
  revenueScore:number|null;
  evidenceIds:readonly string[];
}

export function founderRevenueActions(queue:readonly RevenueAction[]):readonly FounderRevenueAction[]{
  return Object.freeze(queue
    .filter((item):item is RevenueAction & {status:"REQUIRES_FOUNDER";requiredHumanAction:string}=>
      item.status==="REQUIRES_FOUNDER"&&typeof item.requiredHumanAction==="string"&&item.requiredHumanAction.trim().length>0)
    .map(item=>Object.freeze({
      key:item.key,division:item.division,recordId:item.recordId,stage:item.stage,status:"REQUIRES_FOUNDER" as const,
      requiredHumanAction:item.requiredHumanAction,expectedRevenue:item.expectedRevenue,revenueScore:item.revenueScore,
      evidenceIds:Object.freeze([...item.evidenceIds]),
    })));
}
