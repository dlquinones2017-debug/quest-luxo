import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import type { CapitalPipelineRecord } from "../capital/capitalPipelineStore.ts";
import type { RealtyPipelineRecord } from "../realty/realtyPipelineStore.ts";
import { brokerageLeadsToRevenueRecords } from "./brokerageRevenueAdapter.ts";
import { capitalRevenueRecord } from "./capitalRevenueAdapter.ts";
import { realtyRevenueRecord } from "./realtyRevenueAdapter.ts";
import { enterpriseRevenueBrief, type EnterpriseRevenueBrief } from "./enterpriseRevenueBrief.ts";
import { enterpriseLeadIntelligence, enterpriseLeadRevenueRecords, type EnterpriseLeadReceipt } from "./enterpriseLeadIntelligence.ts";

export interface EnterpriseLiveRevenueInput {
  brokerage?:readonly LeadSubmissionRecord[];
  capital?:readonly CapitalPipelineRecord[];
  realty?:readonly RealtyPipelineRecord[];
  intake?:readonly EnterpriseLeadReceipt[];
}
export function enterpriseLiveRevenueBrief(input:EnterpriseLiveRevenueInput,now=new Date()):EnterpriseRevenueBrief{
  const brokerage = brokerageLeadsToRevenueRecords(input.brokerage??[]);
  const capital = (input.capital??[]).map(capitalRevenueRecord);
  const realty = (input.realty??[]).map(realtyRevenueRecord);
  const existing = new Set([...brokerage,...capital,...realty].map(r => `${r.division}:${r.recordId}`));
  const intake = enterpriseLeadRevenueRecords(enterpriseLeadIntelligence(input.intake??[],now))
    .filter(r => !existing.has(`${r.division}:${r.recordId}`));
  return enterpriseRevenueBrief({
    brokerage:[...brokerage,...intake.filter(r=>r.division==="WATCH_BROKERAGE")],
    capital:[...capital,...intake.filter(r=>r.division==="CAPITAL_ADVISORY")],
    realty:[...realty,...intake.filter(r=>r.division==="REALTY")],
  },now);
}
