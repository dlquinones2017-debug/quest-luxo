import type { LeadStorageAdapter } from "../leads/leadStorageTypes.ts";
import { brokerageLeadsToRevenueRecords } from "./brokerageRevenueAdapter.ts";
import { revenueFounderQueue, type RevenueAction } from "./revenueActivation.ts";

export async function buildBrokerageFounderRevenueQueue(
  storage:LeadStorageAdapter,
  now=new Date()
):Promise<readonly RevenueAction[]>{
 const leads=await storage.readLeadSubmissions();
 return revenueFounderQueue(brokerageLeadsToRevenueRecords(leads),now);
}
