import type { QuestLuxoAsset } from "../../../types/questLuxo";
import {
  createReferenceFactoryInput,
  listReferenceMetadataFromAssets,
} from "../../../lib/factory/referenceGenerator";

export type CartierSantosReferenceFamily =
  | "large"
  | "medium"
  | "dumont"
  | "chronograph"
  | "skeleton"
  | "galbee-vintage-inspired";

export type CartierSantosProductionStatus =
  | "Current Production"
  | "Discontinued"
  | "Foundation Placeholder";

export type CartierSantosReferenceSeedStatus =
  | "Reference Factory Family"
  | "Reference Factory Placeholder";

export interface CartierSantosCollectionIntelligence {
  readonly questLuxoOverview: string;
  readonly collectorProfile: string;
  readonly marketPositioning: string;
  readonly liquidityAssessment: string;
  readonly allocationDemandDifficulty: string;
  readonly investmentConsiderations: string;
  readonly ownershipExperience: string;
  readonly buyingRecommendations: string;
}

export interface CartierSantosReferenceFamilyFoundation {
  readonly referenceFamily: CartierSantosReferenceFamily;
  readonly model: string;
  readonly caseProfile: string;
  readonly productionStatus: CartierSantosProductionStatus;
  readonly targetBuyer: string;
  readonly marketPositioning: string;
  readonly brokerageNotes: string;
  readonly intelligenceSummary: string;
  readonly sourcingConsiderations: string;
  readonly collectorAppeal: string;
}

export interface CartierSantosCollectionDataset {
  readonly brand: "Cartier";
  readonly collection: "Santos";
  readonly slug: "santos";
  readonly originalLaunchYear: 1904;
  readonly modernLaunchReferenceEra: 2018;
  readonly category: "Iconic luxury design watch / integrated bracelet sports-dress watch";
  readonly positioning: readonly string[];
  readonly intelligence: CartierSantosCollectionIntelligence;
  readonly referenceFamilies: readonly CartierSantosReferenceFamilyFoundation[];
}

export type CartierSantosReferenceAsset = QuestLuxoAsset & {
  readonly brand: "Cartier";
  readonly collection: "Santos";
  readonly referenceFamily: CartierSantosReferenceFamily;
  readonly seedStatus: CartierSantosReferenceSeedStatus;
};

export const cartierSantosCollectionIntelligence = Object.freeze({
  questLuxoOverview:
    "Cartier Santos is the natural first Cartier launch collection because it connects the 1904 Alberto Santos-Dumont aviation origin story with a modern 2018 bracelet architecture, unmistakable square-case design, strong unisex demand, and broad private brokerage relevance.",
  collectorProfile:
    "Best suited for clients who want a serious luxury watch with design credibility, daily wearability, high recognition, and proportion-led Cartier character rather than a watch defined only by traditional steel sports-watch scarcity.",
  marketPositioning:
    "Santos sits between dress watch, integrated bracelet sports-dress watch, and design icon. Its market strength comes from Cartier design permanence, exposed screws, square geometry, QuickSwitch bracelet and strap versatility, and demand across steel, two-tone, ADLC, and precious-metal examples.",
  liquidityAssessment:
    "Liquidity is strongest for modern Santos de Cartier Large and Medium families, especially clean full-set steel and two-tone examples with complete bracelet and strap inventory. Dumont, Chronograph, Skeleton, and Galbee lanes are more configuration-sensitive and benefit from precise buyer matching.",
  allocationDemandDifficulty:
    "Demand difficulty is moderate to high for desirable modern sizes, blue or distinctive dial executions, two-tone configurations, precious-metal examples, and skeletonized Santos references. Santos is easier to explain than many niche collector watches, but condition, sizing, and completeness still matter.",
  investmentConsiderations:
    "The investment case should be framed around design durability, heritage, and collector breadth rather than short-term guarantees. Santos has resilient long-term relevance because it is historically important, visually distinct, and accessible enough to support a broad buyer base.",
  ownershipExperience:
    "Modern Santos ownership is anchored by comfortable case geometry, QuickSwitch bracelet and strap changes, SmartLink sizing practicality, and enough formal polish to move between casual, business, travel, and evening settings.",
  buyingRecommendations:
    "Prioritize wrist fit, full-set condition, bracelet and strap completeness, bezel and case polish quality, dial preference, metal configuration, and whether the buyer wants modern Santos versatility, Santos-Dumont elegance, or discontinued Galbee charm.",
} satisfies CartierSantosCollectionIntelligence);

export const cartierSantosReferenceFamilies = Object.freeze([
  {
    referenceFamily: "large",
    model: "Santos de Cartier Large",
    caseProfile: "Large modern Santos case",
    productionStatus: "Current Production",
    targetBuyer:
      "Client seeking the most recognizable modern Santos presence, confident wrist impact, QuickSwitch bracelet versatility, and a design-led Cartier alternative to mainstream steel sport watches.",
    marketPositioning:
      "The Large family is the broadest modern Santos discovery lane, with strong private-market relevance across steel, two-tone, ADLC, blue-dial, and precious-metal configurations introduced around the 2018 modern architecture.",
    brokerageNotes:
      "Use for clients who want high recognition, integrated bracelet styling, daily-wear Cartier design, and a stronger wrist presence than the Medium family while still avoiding a purely tool-watch feel.",
    intelligenceSummary:
      "Flagship modern Santos lane with broad appeal, high recognition, strong liquidity, and the clearest first conversation for Cartier clients comparing sports-dress watches.",
    sourcingConsiderations:
      "Confirm size fit, full-set completeness, QuickSwitch strap and bracelet inventory, SmartLink condition, bezel marks, polish history, dial preference, and whether the client wants steel, two-tone, ADLC, or precious metal.",
    collectorAppeal:
      "Appeals to collectors who want Cartier's design authority in a modern sports-dress format that feels substantial, versatile, and unmistakably Cartier without leaning on traditional sports-watch scarcity alone.",
  },
  {
    referenceFamily: "medium",
    model: "Santos de Cartier Medium",
    caseProfile: "Medium modern Santos case",
    productionStatus: "Current Production",
    targetBuyer:
      "Client seeking the most balanced modern Santos proportions, strong unisex fit, QuickSwitch ownership practicality, and a refined daily luxury watch with clear Cartier design identity.",
    marketPositioning:
      "The Medium family often carries the strongest design-purist argument because its proportions feel close to Cartier's dress-sport language while retaining the modern bracelet architecture and broad private-market demand.",
    brokerageNotes:
      "Use for clients comparing Santos sizing, shopping unisex Cartier, or seeking a more elegant daily watch that avoids the larger sport-watch feel of the Large family.",
    intelligenceSummary:
      "High-confidence unisex Santos lane with strong daily-wear logic, clean design appeal, and excellent suitability for clients entering serious luxury watches through Cartier design rather than hype.",
    sourcingConsiderations:
      "Confirm wrist fit, dial preference, bracelet and strap completeness, case edge condition, bezel marks, and whether the client values elegance and proportion over maximum wrist presence.",
    collectorAppeal:
      "Appeals to collectors who prioritize Cartier proportion, understated sophistication, and a watch that can move comfortably across formal, casual, and shared-wear use cases.",
  },
  {
    referenceFamily: "dumont",
    model: "Santos-Dumont",
    caseProfile: "Thin dress-oriented Santos profile",
    productionStatus: "Current Production",
    targetBuyer:
      "Design-led client who prefers a slimmer, more formal Santos expression with stronger dress-watch character, a clearer Santos-Dumont aviation lineage, and less emphasis on bracelet-led sportiness.",
    marketPositioning:
      "Santos-Dumont expands the collection beyond bracelet-led sports-dress demand into refined Cartier dress-watch territory, where case thinness, dial restraint, and historical design purity matter more than integrated-bracelet utility.",
    brokerageNotes:
      "Position for clients who value thinness, elegance, strap wear, precious-metal or lacquered design details, and a quieter Santos profile than Santos de Cartier bracelet models.",
    intelligenceSummary:
      "Elegant Santos lane with strong design credibility, useful collector education value, and a more formal ownership proposition than the modern Santos de Cartier families.",
    sourcingConsiderations:
      "Validate case size, movement type, metal, dial execution, strap condition, limited or special edition details, and whether the buyer expects a dress watch rather than an integrated bracelet watch.",
    collectorAppeal:
      "Appeals to collectors who want the Santos origin story, Cartier restraint, and refined proportions more than sport-watch versatility or bracelet-driven wrist presence.",
  },
  {
    referenceFamily: "chronograph",
    model: "Santos de Cartier Chronograph",
    caseProfile: "Large complication case",
    productionStatus: "Current Production",
    targetBuyer:
      "Client who wants Santos design with a more technical, larger, and complication-driven personality than the time-only families while staying inside Cartier's square-case vocabulary.",
    marketPositioning:
      "The Chronograph family gives Santos coverage a sportier complication lane, useful for clients comparing Cartier design against broader luxury chronograph options without moving into conventional round sports-watch territory.",
    brokerageNotes:
      "Use when a client likes Santos visual identity but wants greater complication presence, larger case architecture, and a more assertive daily-wear profile than the time-only Large or Medium families.",
    intelligenceSummary:
      "Specialized Santos family with useful brokerage coverage for clients who want Cartier design, chronograph functionality, and stronger wrist presence in one recognizable package.",
    sourcingConsiderations:
      "Check chronograph operation, pusher feel, case and bezel condition, strap or bracelet completeness, service history, and whether the buyer accepts the larger and more technical case profile.",
    collectorAppeal:
      "Appeals to buyers who want a more technical Santos without leaving Cartier's recognizable square-case design language, especially those who find time-only Santos too restrained.",
  },
  {
    referenceFamily: "skeleton",
    model: "Santos Skeleton",
    caseProfile: "Openworked collector case",
    productionStatus: "Current Production",
    targetBuyer:
      "Advanced Cartier client seeking high-design skeletonized execution, visible architecture, elevated materials, and a more collector-focused Santos expression than steel or two-tone time-only models.",
    marketPositioning:
      "Skeletonized Santos references sit in a specialist lane where Cartier case design and movement architecture become the primary collector story, with stronger ticket potential and narrower liquidity than mainstream Santos families.",
    brokerageNotes:
      "Treat as a high-touch advisory family because exact reference, metal, skeleton architecture, condition, service history, and buyer education materially affect liquidity and pricing.",
    intelligenceSummary:
      "High-interest collector Santos lane with strong visual impact, elevated ticket potential, and more specialized sourcing requirements than steel time-only models.",
    sourcingConsiderations:
      "Validate exact reference, metal, movement condition, case integrity, service history, completeness, and recent market comparables before giving pricing guidance.",
    collectorAppeal:
      "Appeals to collectors who want Cartier's design vocabulary pushed into visible horological architecture rather than conventional sports-dress utility or simple daily-wear versatility.",
  },
  {
    referenceFamily: "galbee-vintage-inspired",
    model: "Santos Galb\u00e9e / Vintage-Inspired",
    caseProfile: "Discontinued and vintage-inspired Santos profile",
    productionStatus: "Foundation Placeholder",
    targetBuyer:
      "Collector or style-focused client drawn to smaller, softer, and more vintage Cartier proportions with a warmer design language than the modern 2018-era Santos de Cartier architecture.",
    marketPositioning:
      "Galbee and vintage-inspired Santos coverage preserves the heritage lane for clients who want Cartier charm, discontinued-market value, bracelet nuance, and smaller proportions outside the current-production Santos architecture.",
    brokerageNotes:
      "Use as a careful advisory lane for clients exploring discontinued Santos charm; keep exact Galbee, Carree, and vintage-inspired references separate once stronger reference-level data is modeled.",
    intelligenceSummary:
      "Important Santos research lane for neo-vintage Cartier demand, smaller proportions, and collector education beyond the current-production Large, Medium, Dumont, Chronograph, and Skeleton families.",
    sourcingConsiderations:
      "Require careful condition review, bracelet fit and stretch assessment, case polish history, dial originality, service history, period-correct parts, and exact reference validation before matching buyers.",
    collectorAppeal:
      "Appeals to collectors who prefer period Cartier design, smaller sizing, softer case lines, and the charm of discontinued Santos references over modern QuickSwitch bracelet systems.",
  },
] as const satisfies readonly CartierSantosReferenceFamilyFoundation[]);

const getReferenceFactoryReference = (
  referenceFamily: CartierSantosReferenceFamily
): string => {
  if (referenceFamily === "large") {
    return "Santos de Cartier Large";
  }

  if (referenceFamily === "medium") {
    return "Santos de Cartier Medium";
  }

  if (referenceFamily === "dumont") {
    return "Santos Dumont";
  }

  if (referenceFamily === "chronograph") {
    return "Santos Chronograph";
  }

  if (referenceFamily === "skeleton") {
    return "Santos Skeleton";
  }

  return "Santos Galb\u00e9e";
};

const getReferenceFactoryLiquidity = (
  reference: CartierSantosReferenceFamilyFoundation
): string => {
  if (reference.productionStatus === "Foundation Placeholder") {
    return "Specialized";
  }

  if (reference.referenceFamily === "large" || reference.referenceFamily === "medium") {
    return "High";
  }

  if (reference.referenceFamily === "skeleton") {
    return "Specialized";
  }

  return "Moderate to High";
};

const getReferenceFactoryAllocationDifficulty = (
  reference: CartierSantosReferenceFamilyFoundation
): string => {
  if (reference.productionStatus === "Foundation Placeholder") {
    return "Research Pending";
  }

  if (reference.referenceFamily === "skeleton") {
    return "Very High";
  }

  return "Moderate to High";
};

const getReferenceFactoryIntelligence = (
  reference: CartierSantosReferenceFamilyFoundation
): QuestLuxoAsset["intelligence"] => {
  if (reference.productionStatus === "Foundation Placeholder") {
    return {
      collectorDemand: 4,
      liquidity: 3,
      wearability: 4,
      collectability: 4,
      allocationDifficulty: 3,
      versatility: 4,
      brokerOpportunity: 4,
    };
  }

  if (reference.referenceFamily === "skeleton") {
    return {
      collectorDemand: 5,
      liquidity: 3,
      wearability: 3,
      collectability: 5,
      allocationDifficulty: 5,
      versatility: 3,
      brokerOpportunity: 5,
    };
  }

  if (reference.referenceFamily === "large" || reference.referenceFamily === "medium") {
    return {
      collectorDemand: 5,
      liquidity: 4,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 4,
      versatility: 5,
      brokerOpportunity: 5,
    };
  }

  return {
    collectorDemand: 4,
    liquidity: 4,
    wearability: 4,
    collectability: 4,
    allocationDifficulty: 4,
    versatility: 4,
    brokerOpportunity: 4,
  };
};

export const cartierSantosReferenceAssets = Object.freeze(
  cartierSantosReferenceFamilies.map((reference) =>
    Object.freeze({
      reference: getReferenceFactoryReference(reference.referenceFamily),
      model: reference.model,
      brand: "Cartier",
      collection: "Santos",
      referenceFamily: reference.referenceFamily,
      seedStatus:
        reference.productionStatus === "Foundation Placeholder"
          ? "Reference Factory Placeholder"
          : "Reference Factory Family",
      configurations: [
        {
          nickname: reference.caseProfile,
          bracelet: "Cartier bracelet or strap system dependent",
          dial: "Reference family dependent",
          originalMSRP: null,
        },
      ],
      material: "Reference family dependent",
      bezel: "Cartier Santos square bezel",
      productionStatus: reference.productionStatus,
      marketPosition: reference.marketPositioning,
      liquidity: getReferenceFactoryLiquidity(reference),
      allocationDifficulty: getReferenceFactoryAllocationDifficulty(reference),
      questLuxoView: reference.intelligenceSummary,
      intelligence: getReferenceFactoryIntelligence(reference),
    })
  )
) satisfies readonly CartierSantosReferenceAsset[];

export const cartierSantosReferenceMetadata = listReferenceMetadataFromAssets({
  brand: "Cartier",
  brandSlug: "cartier",
  collection: "Santos",
  collectionSlug: "santos",
  assets: cartierSantosReferenceAssets,
  basePath: "/collections/cartier/santos",
});

export const cartierSantosReferenceFactoryInput = createReferenceFactoryInput({
  brand: "Cartier",
  brandSlug: "cartier",
  collection: "Santos",
  collectionSlug: "santos",
  assets: cartierSantosReferenceAssets,
  basePath: "/collections/cartier/santos",
});

export const cartierSantosCollection = Object.freeze({
  brand: "Cartier",
  collection: "Santos",
  slug: "santos",
  originalLaunchYear: 1904,
  modernLaunchReferenceEra: 2018,
  category: "Iconic luxury design watch / integrated bracelet sports-dress watch",
  positioning: Object.freeze([
    "First purpose-built pilot's wristwatch heritage",
    "Cartier design icon",
    "Strong unisex appeal",
    "High brand recognition",
    "Excellent entry point into serious luxury watches",
    "Strong brokerage potential across steel, two-tone, and precious metal examples",
  ]),
  intelligence: cartierSantosCollectionIntelligence,
  referenceFamilies: cartierSantosReferenceFamilies,
} satisfies CartierSantosCollectionDataset);

export function getCartierSantosCollection(): CartierSantosCollectionDataset {
  return cartierSantosCollection;
}

export function getCartierSantosReferenceFamilies(): readonly CartierSantosReferenceFamilyFoundation[] {
  return cartierSantosReferenceFamilies;
}

export function getCartierSantosReferenceAssets(): readonly CartierSantosReferenceAsset[] {
  return cartierSantosReferenceAssets;
}

export function getCartierSantosReferenceFactoryProps(): {
  readonly brand: string;
  readonly collection: string;
  readonly assets: CartierSantosReferenceAsset[];
  readonly basePath: string;
} {
  return {
    brand: cartierSantosReferenceFactoryInput.brand,
    collection: cartierSantosReferenceFactoryInput.collection,
    assets: [...cartierSantosReferenceAssets],
    basePath: cartierSantosReferenceFactoryInput.basePath,
  };
}
