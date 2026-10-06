import { readLeadSubmissions } from "../leads/leadStorage.ts";
import { capitalSnapshot } from "../capital/capitalPipelineStore.ts";
import { realtySnapshot } from "../realty/realtyPipelineStore.ts";
import { enterpriseLiveRevenueBrief } from "./enterpriseLiveRevenueBrief.ts";
import type { EnterpriseRevenueBrief } from "./enterpriseRevenueBrief.ts";

export async function storedEnterpriseRevenueBrief(now=new Date()):Promise<EnterpriseRevenueBrief>{
  const brokerage=await readLeadSubmissions();
  return enterpriseLiveRevenueBrief({
    brokerage,
    capital:capitalSnapshot(),
    realty:realtySnapshot(),
  },now);
}
