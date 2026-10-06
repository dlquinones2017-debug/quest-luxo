import { readLeadSubmissions } from "../leads/leadStorage.ts";
import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";
import { capitalSnapshot, type CapitalPipelineRecord } from "../capital/capitalPipelineStore.ts";
import { realtySnapshot, type RealtyPipelineRecord } from "../realty/realtyPipelineStore.ts";
import { enterpriseLiveRevenueBrief } from "./enterpriseLiveRevenueBrief.ts";
import type { EnterpriseRevenueBrief } from "./enterpriseRevenueBrief.ts";

export interface EnterpriseRevenueStoreReaders {
  readBrokerage():Promise<readonly LeadSubmissionRecord[]>;
  readCapital():readonly CapitalPipelineRecord[];
  readRealty():readonly RealtyPipelineRecord[];
}
const defaultReaders:EnterpriseRevenueStoreReaders=Object.freeze({
  readBrokerage:readLeadSubmissions,
  readCapital:capitalSnapshot,
  readRealty:realtySnapshot,
});
export async function storedEnterpriseRevenueBrief(now=new Date(),readers:EnterpriseRevenueStoreReaders=defaultReaders):Promise<EnterpriseRevenueBrief>{
  const brokerage=await readers.readBrokerage();
  return enterpriseLiveRevenueBrief({
    brokerage,
    capital:readers.readCapital(),
    realty:readers.readRealty(),
  },now);
}
