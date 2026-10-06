import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import type { CapitalPipelineRecord } from "../capital/capitalPipelineStore.ts";
import type { RealtyPipelineRecord } from "../realty/realtyPipelineStore.ts";
import { brokerageLeadsToRevenueRecords } from "./brokerageRevenueAdapter.ts";
import { capitalRevenueRecord } from "./capitalRevenueAdapter.ts";
import { realtyRevenueRecord } from "./realtyRevenueAdapter.ts";
import { enterpriseRevenueBrief, type EnterpriseRevenueBrief } from "./enterpriseRevenueBrief.ts";

export interface EnterpriseLiveRevenueInput {
  brokerage?:readonly LeadSubmissionRecord[];
  capital?:readonly CapitalPipelineRecord[];
  realty?:readonly RealtyPipelineRecord[];
}
export function enterpriseLiveRevenueBrief(input:EnterpriseLiveRevenueInput,now=new Date()):EnterpriseRevenueBrief{
  return enterpriseRevenueBrief({
    brokerage:brokerageLeadsToRevenueRecords(input.brokerage??[]),
    capital:(input.capital??[]).map(capitalRevenueRecord),
    realty:(input.realty??[]).map(realtyRevenueRecord),
  },now);
}
