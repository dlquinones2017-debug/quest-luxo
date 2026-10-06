import { enterpriseRevenueFounderQueue, type EnterpriseRevenueQueueInput } from "./enterpriseRevenueQueue.ts";
import { enterpriseRevenueSnapshot, type EnterpriseRevenueSnapshot } from "./enterpriseRevenueSnapshot.ts";
import { founderRevenueActions, type FounderRevenueAction } from "./founderRevenueActions.ts";
import type { RevenueAction } from "./revenueActivation.ts";

export interface EnterpriseRevenueBrief {
  generatedAt:string;
  queue:readonly RevenueAction[];
  snapshot:EnterpriseRevenueSnapshot;
  founderActions:readonly FounderRevenueAction[];
}

export function enterpriseRevenueBrief(input:EnterpriseRevenueQueueInput,now=new Date()):EnterpriseRevenueBrief{
  const queue=enterpriseRevenueFounderQueue(input,now);
  return Object.freeze({
    generatedAt:now.toISOString(),
    queue,
    snapshot:enterpriseRevenueSnapshot(queue),
    founderActions:founderRevenueActions(queue),
  });
}
