export type MarketOpportunitySignal = "high" | "medium" | "low";
export type MarketOpportunityTier =
  | "urgent"
  | "strong"
  | "emerging"
  | "watchlist";

export interface MarketOpportunity {
  readonly brand: string;
  readonly collection: string;
  readonly priority: MarketOpportunitySignal;
  readonly brokerageMomentum: MarketOpportunitySignal;
  readonly searchDemand: MarketOpportunitySignal;
  readonly averageTicketPotential: MarketOpportunitySignal;
  readonly dealerNetworkSignal: MarketOpportunitySignal;
  readonly rationale: string;
  readonly recommendedNextAction: string;
}

export interface MarketOpportunityScore {
  readonly score: number;
  readonly tier: MarketOpportunityTier;
  readonly reasons: readonly string[];
}

const signalRank: Record<MarketOpportunitySignal, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const signalScoreMultiplier: Record<MarketOpportunitySignal, number> = {
  high: 1,
  medium: 0.5,
  low: 0.15,
};

const marketOpportunityScoreWeights = {
  priority: 25,
  brokerageMomentum: 20,
  searchDemand: 20,
  averageTicketPotential: 15,
  dealerNetworkSignal: 20,
} as const satisfies Record<
  keyof Pick<
    MarketOpportunity,
    | "priority"
    | "brokerageMomentum"
    | "searchDemand"
    | "averageTicketPotential"
    | "dealerNetworkSignal"
  >,
  number
>;

export const marketOpportunityRoadmap = [
  {
    brand: "Cartier",
    collection: "Core Collections",
    priority: "high",
    brokerageMomentum: "high",
    searchDemand: "high",
    averageTicketPotential: "medium",
    dealerNetworkSignal: "high",
    rationale:
      "Cartier has strong discovery demand and broad brokerage appeal across Santos, Tank, Panthere, and classic dress references.",
    recommendedNextAction:
      "Create a dormant Cartier factory foundation, then choose the first launch collection from Santos or Tank.",
  },
  {
    brand: "Tudor",
    collection: "Black Bay",
    priority: "high",
    brokerageMomentum: "high",
    searchDemand: "high",
    averageTicketPotential: "low",
    dealerNetworkSignal: "medium",
    rationale:
      "Tudor adds an accessible luxury entry point with strong Black Bay demand and useful trade-in potential for Rolex-adjacent buyers.",
    recommendedNextAction:
      "Seed Black Bay references and test a value-focused brokerage CTA pattern.",
  },
  {
    brand: "Vacheron Constantin",
    collection: "Overseas",
    priority: "high",
    brokerageMomentum: "high",
    searchDemand: "high",
    averageTicketPotential: "high",
    dealerNetworkSignal: "high",
    rationale:
      "The Overseas line has strong collector demand, high average ticket potential, and dealer-network value for sourcing and consignment conversations.",
    recommendedNextAction:
      "Prioritize a Vacheron Constantin factory foundation with Overseas as the first planned launch collection.",
  },
  {
    brand: "Breitling",
    collection: "Navitimer",
    priority: "medium",
    brokerageMomentum: "medium",
    searchDemand: "high",
    averageTicketPotential: "medium",
    dealerNetworkSignal: "medium",
    rationale:
      "Navitimer is highly recognizable and search-friendly, with enough secondary-market depth for sourcing and valuation content.",
    recommendedNextAction:
      "Create a focused Navitimer seed set before broader Breitling expansion.",
  },
  {
    brand: "Jaeger-LeCoultre",
    collection: "Reverso",
    priority: "medium",
    brokerageMomentum: "medium",
    searchDemand: "medium",
    averageTicketPotential: "medium",
    dealerNetworkSignal: "medium",
    rationale:
      "Reverso provides a distinctive dress-watch lane with educated buyer interest and useful advisory potential.",
    recommendedNextAction:
      "Build a compact Reverso collection model centered on classic, tribute, and precious-metal references.",
  },
  {
    brand: "IWC",
    collection: "Portugieser",
    priority: "medium",
    brokerageMomentum: "medium",
    searchDemand: "medium",
    averageTicketPotential: "medium",
    dealerNetworkSignal: "medium",
    rationale:
      "Portugieser expands the catalog into elegant chronograph and dress-watch demand with steady mid-market brokerage relevance.",
    recommendedNextAction:
      "Draft an IWC factory foundation after the higher-priority dealer-network opportunities are staged.",
  },
  {
    brand: "Panerai",
    collection: "Luminor",
    priority: "medium",
    brokerageMomentum: "medium",
    searchDemand: "medium",
    averageTicketPotential: "medium",
    dealerNetworkSignal: "low",
    rationale:
      "Luminor adds a recognizable enthusiast niche, though sourcing urgency and dealer-network leverage are more selective.",
    recommendedNextAction:
      "Keep as a follow-on opportunity after Cartier, Tudor, and Vacheron Constantin are validated.",
  },
  {
    brand: "Zenith",
    collection: "Chronomaster",
    priority: "low",
    brokerageMomentum: "medium",
    searchDemand: "medium",
    averageTicketPotential: "medium",
    dealerNetworkSignal: "low",
    rationale:
      "Chronomaster has strong watch-enthusiast credibility, but near-term brokerage volume is likely narrower than the top expansion candidates.",
    recommendedNextAction:
      "Track demand and revisit after higher-volume expansion candidates are launched.",
  },
] as const satisfies readonly MarketOpportunity[];

const getWeightedSignalScore = (
  signal: MarketOpportunitySignal,
  weight: number
): number => signalScoreMultiplier[signal] * weight;

const getOpportunityTier = (score: number): MarketOpportunityTier => {
  if (score >= 85) {
    return "urgent";
  }

  if (score >= 70) {
    return "strong";
  }

  if (score >= 50) {
    return "emerging";
  }

  return "watchlist";
};

const getSignalReason = (
  signal: MarketOpportunitySignal,
  highReason: string,
  mediumReason: string,
  lowReason: string
): string => {
  if (signal === "high") {
    return highReason;
  }

  if (signal === "medium") {
    return mediumReason;
  }

  return lowReason;
};

const normalizeLimit = (limit: number): number => {
  if (!Number.isFinite(limit)) {
    return marketOpportunityRoadmap.length;
  }

  return Math.max(0, Math.trunc(limit));
};

export const createMarketOpportunityScore = (
  opportunity: MarketOpportunity
): MarketOpportunityScore => {
  const rawScore =
    getWeightedSignalScore(
      opportunity.priority,
      marketOpportunityScoreWeights.priority
    ) +
    getWeightedSignalScore(
      opportunity.brokerageMomentum,
      marketOpportunityScoreWeights.brokerageMomentum
    ) +
    getWeightedSignalScore(
      opportunity.searchDemand,
      marketOpportunityScoreWeights.searchDemand
    ) +
    getWeightedSignalScore(
      opportunity.averageTicketPotential,
      marketOpportunityScoreWeights.averageTicketPotential
    ) +
    getWeightedSignalScore(
      opportunity.dealerNetworkSignal,
      marketOpportunityScoreWeights.dealerNetworkSignal
    );

  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  return {
    score,
    tier: getOpportunityTier(score),
    reasons: [
      getSignalReason(
        opportunity.priority,
        "High roadmap priority.",
        "Moderate roadmap priority.",
        "Longer-term roadmap priority."
      ),
      getSignalReason(
        opportunity.brokerageMomentum,
        "Strong brokerage momentum.",
        "Steady brokerage momentum.",
        "Limited brokerage momentum."
      ),
      getSignalReason(
        opportunity.searchDemand,
        "Strong search demand.",
        "Steady search demand.",
        "Niche search demand."
      ),
      getSignalReason(
        opportunity.averageTicketPotential,
        "High average ticket potential.",
        "Moderate average ticket potential.",
        "Lower average ticket potential."
      ),
      getSignalReason(
        opportunity.dealerNetworkSignal,
        "Strong dealer-network signal.",
        "Moderate dealer-network signal.",
        "Limited dealer-network signal."
      ),
    ],
  };
};

export const getMarketOpportunityRoadmap = (): readonly MarketOpportunity[] =>
  marketOpportunityRoadmap;

export const getTopMarketOpportunities = (
  limit = 3
): readonly MarketOpportunity[] =>
  [...marketOpportunityRoadmap]
    .sort((firstOpportunity, secondOpportunity) => {
      const scoreDifference =
        createMarketOpportunityScore(secondOpportunity).score -
        createMarketOpportunityScore(firstOpportunity).score;

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const priorityDifference =
        signalRank[secondOpportunity.priority] -
        signalRank[firstOpportunity.priority];

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      return `${firstOpportunity.brand} ${firstOpportunity.collection}`.localeCompare(
        `${secondOpportunity.brand} ${secondOpportunity.collection}`
      );
    })
    .slice(0, normalizeLimit(limit));
