import type { QuestLuxoAsset } from "../../../types/questLuxo";
import {
  createReferenceFactoryInput,
  listReferenceMetadataFromAssets,
} from "../../../lib/factory/referenceGenerator";

export type VacheronConstantinOverseasReferenceFamily =
  | "4520V"
  | "4500V"
  | "7900V"
  | "5500V"
  | "4300V"
  | "skeleton"
  | "perpetual-calendar-ultra-thin";

export type VacheronConstantinOverseasProductionStatus =
  | "Current Production"
  | "Discontinued"
  | "Foundation Placeholder";

export type VacheronConstantinOverseasReferenceSeedStatus =
  | "Reference Factory Family"
  | "Reference Factory Placeholder";

export interface VacheronConstantinOverseasCollectionIntelligence {
  readonly questLuxoOverview: string;
  readonly collectorProfile: string;
  readonly marketPositioning: string;
  readonly liquidityAssessment: string;
  readonly allocationDifficulty: string;
  readonly investmentConsiderations: string;
  readonly ownershipExperience: string;
  readonly buyingRecommendations: string;
}

export interface VacheronConstantinOverseasSeoMetadata {
  readonly title: string;
  readonly description: string;
  readonly canonicalUrl: string;
}

export interface VacheronConstantinOverseasReferenceFoundation {
  readonly referenceFamily: VacheronConstantinOverseasReferenceFamily;
  readonly model: string;
  readonly complication: string;
  readonly productionStatus: VacheronConstantinOverseasProductionStatus;
  readonly targetBuyer: string;
  readonly marketPositioning: string;
  readonly brokerageNotes: string;
  readonly sourcingConsiderations: string;
  readonly collectorAppeal: string;
  readonly intelligenceSummary: string;
  readonly seo: VacheronConstantinOverseasSeoMetadata;
}

export type VacheronConstantinOverseasReferenceAsset = QuestLuxoAsset & {
  readonly brand: "Vacheron Constantin";
  readonly collection: "Overseas";
  readonly referenceFamily: VacheronConstantinOverseasReferenceFamily;
  readonly seedStatus: VacheronConstantinOverseasReferenceSeedStatus;
};

export interface VacheronConstantinOverseasCollectionDataset {
  readonly brand: "Vacheron Constantin";
  readonly collection: "Overseas";
  readonly slug: "overseas";
  readonly launchYear: 1996;
  readonly category: "Luxury Integrated Sports Watch";
  readonly positioning: readonly string[];
  readonly intelligence: VacheronConstantinOverseasCollectionIntelligence;
  readonly seo: VacheronConstantinOverseasSeoMetadata;
  readonly references: readonly VacheronConstantinOverseasReferenceFoundation[];
}

export const vacheronConstantinOverseasCollectionIntelligence =
  Object.freeze({
    questLuxoOverview:
      "The Vacheron Constantin Overseas is Quest Luxo's highest-priority Vacheron launch collection because it combines Holy Trinity prestige, integrated sports watch momentum, exceptional Geneva finishing, and meaningful private brokerage opportunity.",
    collectorProfile:
      "Best suited for clients who understand Royal Oak and Nautilus demand but want a quieter, highly finished Geneva manufacture sport watch with connoisseur credibility, strap versatility, and a more understated ownership signal.",
    marketPositioning:
      "Overseas sits beside Royal Oak and Nautilus as a serious integrated sports watch alternative, but its value case is different: softer public recognition, strong Holy Trinity credibility, excellent finishing, and strongest collector pull around blue-dial steel and high-complication precious-metal families.",
    liquidityAssessment:
      "Liquidity is strongest for steel self-winding, dual time, and chronograph families, especially when dial color, full-set condition, and strap completeness are strong. Skeletonized and ultra-thin perpetual calendar examples require more specialized buyer matching.",
    allocationDifficulty:
      "Sourcing complexity is elevated for desirable steel and blue-dial configurations because demand concentrates around a small set of recognizable families. Precious-metal and complicated references are more relationship-driven and require careful education around condition, service history, and true market depth.",
    investmentConsiderations:
      "The strongest investment case is not hype alone; it is the combination of Vacheron's heritage, restrained production, interchangeable strap utility, and rising collector interest in alternatives to AP and Patek sport watches. Brokerage guidance should separate enduring collector quality from short-term price movement.",
    ownershipExperience:
      "The interchangeable bracelet, rubber, and leather strap system gives Overseas ownership unusual range for a high-end integrated sports watch, supporting travel, formal wear, and daily use without diluting the collector seriousness of the platform.",
    buyingRecommendations:
      "Prioritize full-set examples, condition, bracelet and strap completeness, dial desirability, service history, and reference-family clarity before comparing price alone. For blue dials and complicated families, confirm whether the premium is supported by configuration strength and actual sourcing scarcity.",
  } satisfies VacheronConstantinOverseasCollectionIntelligence);

export const vacheronConstantinOverseasReferences = Object.freeze([
  {
    referenceFamily: "4520V",
    model: "Overseas Self-Winding 41mm",
    complication: "Time and Date",
    productionStatus: "Current Production",
    targetBuyer:
      "Client seeking the cleanest current-generation Overseas daily-wear expression, modern case refinement, and the clearest entry into Vacheron's integrated sports watch language.",
    marketPositioning:
      "The 4520V family is the current self-winding anchor for Overseas discovery, positioned as the most direct Royal Oak and Nautilus alternative for clients who prioritize finishing, discretion, and daily versatility.",
    brokerageNotes:
      "Use for clients comparing current Royal Oak, Nautilus, and Overseas options where finishing, restraint, strap versatility, and blue-dial demand are major decision points.",
    sourcingConsiderations:
      "Verify bracelet and strap completeness, warranty status, dial color, and condition around polished surfaces. Blue-dial examples should be benchmarked carefully because demand can compress clean supply.",
    collectorAppeal:
      "The appeal is strongest for collectors who want the modern Overseas identity without moving into complications, precious metals, or more specialized sizing decisions.",
    intelligenceSummary:
      "High-confidence flagship family with broad buyer relevance, strong liquidity, and excellent fit for first-wave Vacheron brokerage conversations around modern Holy Trinity sports watch demand.",
    seo: {
      title:
        "Vacheron Constantin Overseas 4520V | Quest Luxo Reference Intelligence",
      description:
        "Review Vacheron Constantin Overseas 4520V intelligence, current self-winding positioning, blue dial demand, sourcing complexity, and Quest Luxo brokerage guidance.",
      canonicalUrl: "/collections/vacheron-constantin/overseas/4520v",
    },
  },
  {
    referenceFamily: "4500V",
    model: "Overseas Self-Winding 41mm",
    complication: "Time and Date",
    productionStatus: "Discontinued",
    targetBuyer:
      "Client who wants the established modern Overseas look, strong blue-dial recognition, and a discontinued-market alternative with a proven secondary-market footprint.",
    marketPositioning:
      "The 4500V remains a core Overseas reference family for secondary-market comparison, previous-generation value discovery, and collector education around the transition into the current 4520V era.",
    brokerageNotes:
      "Use when clients want recognizable modern Overseas presence, are open to discontinued references, and may value a more established market history over current-production status.",
    sourcingConsiderations:
      "Compare condition, service timing, box and paper completeness, bracelet stretch, strap inventory, and dial desirability. Discontinued status makes full-set quality more important than headline price.",
    collectorAppeal:
      "The 4500V appeals to collectors who want a known modern Overseas benchmark and may see previous-generation design as a stable, mature buying lane.",
    intelligenceSummary:
      "Important discontinued anchor with strong name recognition, useful pricing comparison value, and durable collector demand for clients entering Overseas through the secondary market.",
    seo: {
      title:
        "Vacheron Constantin Overseas 4500V | Quest Luxo Reference Intelligence",
      description:
        "Explore Vacheron Constantin Overseas 4500V intelligence, discontinued self-winding market context, blue dial relevance, collector demand, and brokerage guidance.",
      canonicalUrl: "/collections/vacheron-constantin/overseas/4500v",
    },
  },
  {
    referenceFamily: "7900V",
    model: "Overseas Dual Time",
    complication: "Dual Time",
    productionStatus: "Current Production",
    targetBuyer:
      "Traveler or collector who wants Overseas sport-watch versatility with a practical second-time-zone complication and a more technical dial than the self-winding family.",
    marketPositioning:
      "The 7900V family gives Overseas coverage a utility-led complication lane, sitting between everyday self-winding demand and high-complication collector pieces.",
    brokerageNotes:
      "Position for clients who travel frequently or want more technical interest than time-and-date while preserving daily-wear practicality and the interchangeable strap advantage.",
    sourcingConsiderations:
      "Confirm dial preference, strap set, functional condition, and whether the buyer values the complication enough to justify the step up from self-winding pricing.",
    collectorAppeal:
      "Collector appeal comes from practical complication value rather than pure scarcity, making it a strong advisory choice for clients who actually use travel functionality.",
    intelligenceSummary:
      "Strong advisory family because the complication is useful, legible, and easy to explain to clients comparing practical luxury sports watches with real travel utility.",
    seo: {
      title:
        "Vacheron Constantin Overseas 7900V Dual Time | Quest Luxo Intelligence",
      description:
        "Evaluate the Vacheron Constantin Overseas 7900V Dual Time with Quest Luxo intelligence on travel utility, Holy Trinity sports watch demand, sourcing, and liquidity.",
      canonicalUrl: "/collections/vacheron-constantin/overseas/7900v",
    },
  },
  {
    referenceFamily: "5500V",
    model: "Overseas Chronograph",
    complication: "Chronograph",
    productionStatus: "Current Production",
    targetBuyer:
      "Client who prefers a larger, more technical Overseas with sport chronograph presence, higher visual complexity, and more wrist presence than the time-and-date models.",
    marketPositioning:
      "The 5500V family broadens Overseas beyond time-and-date and dual time into a more assertive sports-watch lane, useful for Daytona, Royal Oak Chronograph, and Nautilus Chronograph comparisons.",
    brokerageNotes:
      "Use for clients who like premium chronograph comparisons but want Vacheron's finishing, strap system, and a less obvious collector signal.",
    sourcingConsiderations:
      "Assess case condition closely because larger chronograph cases show wear quickly. Confirm complete strap inventory, chronograph function, service history, and dial-market preference.",
    collectorAppeal:
      "Collector appeal is strongest for buyers who want a sporty Vacheron complication with enough visual presence to feel distinct from the cleaner self-winding family.",
    intelligenceSummary:
      "High-utility brokerage family with strong comparison value against other premium chronographs, meaningful collection-page depth, and strong fit for clients wanting a technical Overseas.",
    seo: {
      title:
        "Vacheron Constantin Overseas 5500V Chronograph | Quest Luxo Intelligence",
      description:
        "Review Vacheron Constantin Overseas 5500V Chronograph intelligence, premium sports chronograph positioning, collector appeal, sourcing notes, and brokerage context.",
      canonicalUrl: "/collections/vacheron-constantin/overseas/5500v",
    },
  },
  {
    referenceFamily: "4300V",
    model: "Overseas Perpetual Calendar Ultra-Thin",
    complication: "Perpetual Calendar",
    productionStatus: "Current Production",
    targetBuyer:
      "Advanced collector seeking high horology in an Overseas case, typically with precious-metal presence, ultra-thin sophistication, and a more nuanced investment thesis.",
    marketPositioning:
      "The 4300V family moves Overseas into high-complication Vacheron territory and should be treated as a specialist advisory lane rather than a simple extension of steel sports watch demand.",
    brokerageNotes:
      "Use for sophisticated buyers who understand complication value, condition sensitivity, service implications, and the difference between liquid steel demand and rarer high-horology sourcing.",
    sourcingConsiderations:
      "Prioritize provenance, service history, movement condition, calendar function, case integrity, precious-metal wear, and completeness. Buyer matching matters more than speed.",
    collectorAppeal:
      "Collector appeal is high for clients who want Vacheron's high-watchmaking credibility inside the Overseas platform rather than a pure sports-watch allocation play.",
    intelligenceSummary:
      "Collector-focused flagship complication family with high ticket potential, strong connoisseur value, and more specialized liquidity than self-winding steel references.",
    seo: {
      title:
        "Vacheron Constantin Overseas 4300V Perpetual Calendar | Quest Luxo",
      description:
        "Study the Vacheron Constantin Overseas 4300V perpetual calendar with Quest Luxo intelligence on high horology, sourcing complexity, collector demand, and brokerage fit.",
      canonicalUrl: "/collections/vacheron-constantin/overseas/4300v",
    },
  },
  {
    referenceFamily: "skeleton",
    model: "Overseas Skeleton",
    complication: "Skeletonized Movement",
    productionStatus: "Foundation Placeholder",
    targetBuyer:
      "Design- and movement-focused collector who wants openworked Vacheron craft in an Overseas format and is comfortable with a more specialized buying process.",
    marketPositioning:
      "Skeletonized Overseas references should be handled as a specialist layer that emphasizes movement architecture, finishing visibility, and rarity rather than broad sports-watch liquidity.",
    brokerageNotes:
      "Keep as a placeholder until exact reference coverage, materials, and production details are modeled with reference-backed data. Treat early inquiries as high-touch collector research.",
    sourcingConsiderations:
      "Require exact reference validation, material confirmation, condition review, and careful buyer education before pricing guidance. Avoid treating skeleton demand as interchangeable with steel Overseas demand.",
    collectorAppeal:
      "Collector appeal centers on visible craft, scarcity, and Vacheron's finishing story, making this more connoisseur-led than mainstream integrated sports watch demand.",
    intelligenceSummary:
      "Future high-interest research lane with strong visual appeal and meaningful brokerage potential, but best handled as a specialist family until exact reference data is modeled.",
    seo: {
      title:
        "Vacheron Constantin Overseas Skeleton | Quest Luxo Intelligence",
      description:
        "Explore Vacheron Constantin Overseas Skeleton intelligence with Quest Luxo notes on openworked craft, specialist sourcing, collector appeal, and brokerage research.",
      canonicalUrl: "/collections/vacheron-constantin/overseas/skeleton",
    },
  },
  {
    referenceFamily: "perpetual-calendar-ultra-thin",
    model: "Overseas Perpetual Calendar Ultra-Thin",
    complication: "Perpetual Calendar Ultra-Thin",
    productionStatus: "Foundation Placeholder",
    targetBuyer:
      "High-horology client comparing complicated Overseas references across precious metals, dial variants, strap configurations, and ultra-thin perpetual calendar execution.",
    marketPositioning:
      "This placeholder preserves the broader perpetual-calendar ultra-thin lane beyond a single 4300V family entry, keeping Quest Luxo prepared for high-ticket collector requests.",
    brokerageNotes:
      "Use as a future modeling bucket before separating exact references into public collection and reference pages. Conversations should be treated as advisory-led, not commodity-led.",
    sourcingConsiderations:
      "Validate exact reference, metal, dial, service history, calendar function, strap set, and market comparables. Thin complicated pieces require a more cautious condition and liquidity review.",
    collectorAppeal:
      "Collector appeal comes from the rare mix of sports-watch architecture, ultra-thin complication, precious-metal execution, and Vacheron's high-horology identity.",
    intelligenceSummary:
      "High-ticket, high-sophistication family that improves future launch planning while preserving the distinction between broad Overseas demand and specialist perpetual calendar demand.",
    seo: {
      title:
        "Vacheron Constantin Overseas Perpetual Calendar Ultra-Thin | Quest Luxo",
      description:
        "Review Overseas Perpetual Calendar Ultra-Thin intelligence for Vacheron Constantin collectors, including ultra-thin high horology, sourcing, liquidity, and brokerage guidance.",
      canonicalUrl:
        "/collections/vacheron-constantin/overseas/perpetual-calendar-ultra-thin",
    },
  },
] as const satisfies readonly VacheronConstantinOverseasReferenceFoundation[]);

const getReferenceFactoryReference = (
  referenceFamily: VacheronConstantinOverseasReferenceFamily
): string => {
  if (referenceFamily === "skeleton") {
    return "Skeleton";
  }

  if (referenceFamily === "perpetual-calendar-ultra-thin") {
    return "Perpetual Calendar Ultra-Thin";
  }

  return referenceFamily;
};

const getReferenceFactoryLiquidity = (
  reference: VacheronConstantinOverseasReferenceFoundation
): string => {
  if (reference.productionStatus === "Foundation Placeholder") {
    return "Specialized";
  }

  if (reference.complication.includes("Perpetual")) {
    return "Specialized";
  }

  return "High";
};

const getReferenceFactoryAllocationDifficulty = (
  reference: VacheronConstantinOverseasReferenceFoundation
): string => {
  if (reference.productionStatus === "Foundation Placeholder") {
    return "Research Pending";
  }

  if (
    reference.complication.includes("Perpetual") ||
    reference.complication.includes("Skeleton")
  ) {
    return "Very High";
  }

  return "High";
};

const getReferenceFactoryIntelligence = (
  reference: VacheronConstantinOverseasReferenceFoundation
): QuestLuxoAsset["intelligence"] => {
  if (reference.productionStatus === "Foundation Placeholder") {
    return {
      collectorDemand: 4,
      liquidity: 3,
      wearability: 3,
      collectability: 5,
      allocationDifficulty: 5,
      versatility: 3,
      brokerOpportunity: 5,
    };
  }

  if (reference.complication.includes("Perpetual")) {
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

  return {
    collectorDemand: 5,
    liquidity: 4,
    wearability: 5,
    collectability: 4,
    allocationDifficulty: 4,
    versatility: 5,
    brokerOpportunity: 5,
  };
};

export const vacheronConstantinOverseasReferenceAssets = Object.freeze(
  vacheronConstantinOverseasReferences.map((reference) =>
    Object.freeze({
      reference: getReferenceFactoryReference(reference.referenceFamily),
      model: reference.model,
      brand: "Vacheron Constantin",
      collection: "Overseas",
      referenceFamily: reference.referenceFamily,
      seedStatus:
        reference.productionStatus === "Foundation Placeholder"
          ? "Reference Factory Placeholder"
          : "Reference Factory Family",
      configurations: [
        {
          nickname: reference.complication,
          bracelet: "Integrated Bracelet with Interchangeable Strap System",
          dial: "Reference family dependent",
          originalMSRP: null,
        },
      ],
      material: "Reference family dependent",
      bezel: "Overseas integrated bezel",
      productionStatus: reference.productionStatus,
      marketPosition: reference.marketPositioning,
      liquidity: getReferenceFactoryLiquidity(reference),
      allocationDifficulty: getReferenceFactoryAllocationDifficulty(reference),
      questLuxoView: reference.intelligenceSummary,
      intelligence: getReferenceFactoryIntelligence(reference),
    })
  )
) satisfies readonly VacheronConstantinOverseasReferenceAsset[];

export const vacheronConstantinOverseasReferenceMetadata =
  listReferenceMetadataFromAssets({
    brand: "Vacheron Constantin",
    brandSlug: "vacheron-constantin",
    collection: "Overseas",
    collectionSlug: "overseas",
    assets: vacheronConstantinOverseasReferenceAssets,
    basePath: "/collections/vacheron-constantin/overseas",
  });

export const vacheronConstantinOverseasReferenceFactoryInput =
  createReferenceFactoryInput({
    brand: "Vacheron Constantin",
    brandSlug: "vacheron-constantin",
    collection: "Overseas",
    collectionSlug: "overseas",
    assets: vacheronConstantinOverseasReferenceAssets,
    basePath: "/collections/vacheron-constantin/overseas",
  });

export function getVacheronConstantinOverseasReferenceAssets(): readonly VacheronConstantinOverseasReferenceAsset[] {
  return vacheronConstantinOverseasReferenceAssets;
}

export function getVacheronConstantinOverseasReferenceFactoryProps(): {
  readonly brand: string;
  readonly collection: string;
  readonly assets: VacheronConstantinOverseasReferenceAsset[];
  readonly basePath: string;
} {
  return {
    brand: vacheronConstantinOverseasReferenceFactoryInput.brand,
    collection: vacheronConstantinOverseasReferenceFactoryInput.collection,
    assets: [...vacheronConstantinOverseasReferenceAssets],
    basePath: vacheronConstantinOverseasReferenceFactoryInput.basePath,
  };
}

export const vacheronConstantinOverseasCollection = Object.freeze({
  brand: "Vacheron Constantin",
  collection: "Overseas",
  slug: "overseas",
  launchYear: 1996,
  category: "Luxury Integrated Sports Watch",
  positioning: Object.freeze([
    "Holy Trinity sports watch",
    "Exceptional finishing",
    "Interchangeable strap system",
    "Collector-focused",
    "High brokerage potential",
  ]),
  intelligence: vacheronConstantinOverseasCollectionIntelligence,
  seo: {
    title:
      "Vacheron Constantin Overseas Collection | Quest Luxo Brokerage Intelligence",
    description:
      "Explore Vacheron Constantin Overseas intelligence for Holy Trinity sports watch collectors, including blue dial demand, reference families, sourcing, and Quest Luxo brokerage guidance.",
    canonicalUrl: "/collections/vacheron-constantin/overseas",
  },
  references: vacheronConstantinOverseasReferences,
} satisfies VacheronConstantinOverseasCollectionDataset);

export function getVacheronConstantinOverseasCollection(): VacheronConstantinOverseasCollectionDataset {
  return vacheronConstantinOverseasCollection;
}

export function getVacheronConstantinOverseasReferences(): readonly VacheronConstantinOverseasReferenceFoundation[] {
  return vacheronConstantinOverseasReferences;
}
