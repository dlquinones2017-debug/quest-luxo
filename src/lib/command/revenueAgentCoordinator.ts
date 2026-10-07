import { watchBrokerageRevenueAgent, type BrokerageRevenueRecommendation } from "../agents/watchBrokerageRevenueAgent.ts";
import { capitalAdvisoryRevenueAgent, type CapitalRevenueRecommendation } from "../agents/capitalAdvisoryRevenueAgent.ts";
import { realtyRevenueAgent, type RealtyRevenueRecommendation } from "../agents/realtyRevenueAgent.ts";
import type { RevenueAction } from "./revenueActivation.ts";

export interface RevenueAgentCoordination {
  brokerage: readonly BrokerageRevenueRecommendation[];
  capital: readonly CapitalRevenueRecommendation[];
  realty: readonly RealtyRevenueRecommendation[];
  totalRecommendations: number;
}

export function coordinateRevenueAgents(
  queue: readonly RevenueAction[],
): RevenueAgentCoordination {
  const brokerage = watchBrokerageRevenueAgent(queue);
  const capital = capitalAdvisoryRevenueAgent(queue);
  const realty = realtyRevenueAgent(queue);

  return Object.freeze({
    brokerage,
    capital,
    realty,
    totalRecommendations: brokerage.length + capital.length + realty.length,
  });
}
