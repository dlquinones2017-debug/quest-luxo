import {
  cartierSantosCollection,
  cartierSantosReferenceAssets,
} from "./cartier/santos";

export * from "./cartier/santos";

export type CartierCollectionSlug =
  | "santos"
  | "tank"
  | "ballon-bleu"
  | "panthere"
  | "pasha"
  | "drive"
  | "prive";

export type CartierCollectionPriority =
  | "flagship-high-priority"
  | "second-priority"
  | "dormant-placeholder";

export type CartierLaunchStage =
  | "first-launch-priority"
  | "second-launch-priority"
  | "future-dormant";

export interface CartierBrandIntelligence {
  readonly heritage: string;
  readonly designPhilosophy: string;
  readonly collectorProfile: string;
  readonly brokerageOpportunity: string;
  readonly marketPositioning: string;
  readonly liquidity: string;
  readonly questLuxoOverview: string;
}

export interface CartierCollectionFoundation {
  readonly name: string;
  readonly slug: CartierCollectionSlug;
  readonly category: string;
  readonly priority: CartierCollectionPriority;
  readonly launchStage: CartierLaunchStage;
  readonly status: "Factory Foundation - Priority" | "Factory Foundation";
  readonly tagline: string;
  readonly description: string;
  readonly assetCount: number;
}

export interface CartierBrandFoundation {
  readonly name: "Cartier";
  readonly slug: "cartier";
  readonly founded: 1847;
  readonly factoryLive: false;
  readonly launchPhase: "v2";
  readonly flagshipCollection: "Santos";
  readonly flagshipCollectionSlug: "santos";
  readonly secondPriorityCollection: "Tank";
  readonly secondPriorityCollectionSlug: "tank";
  readonly brandIntelligence: CartierBrandIntelligence;
  readonly collections: readonly CartierCollectionFoundation[];
}

export interface CartierFactoryFoundationMetadata {
  readonly brandName: "Cartier";
  readonly brandSlug: "cartier";
  readonly factoryLive: false;
  readonly launchPhase: "v2";
  readonly flagshipCollection: "Santos";
  readonly secondPriorityCollection: "Tank";
  readonly plannedCollectionCount: number;
  readonly referenceBackedCollectionCount: number;
}

export const cartierCollections = Object.freeze([
  {
    name: "Santos",
    slug: "santos",
    category: cartierSantosCollection.category,
    priority: "flagship-high-priority",
    launchStage: "first-launch-priority",
    status: "Factory Foundation - Priority",
    tagline: "Cartier's aviation-born design icon.",
    description:
      "Santos is the prioritized Cartier launch collection because it combines historic watch design, modern bracelet versatility, strong unisex demand, and broad private-client brokerage relevance across modern and vintage-inspired families.",
    assetCount: cartierSantosReferenceAssets.length,
  },
  {
    name: "Tank",
    slug: "tank",
    category: "Dress Watch Icon",
    priority: "second-priority",
    launchStage: "second-launch-priority",
    status: "Factory Foundation - Priority",
    tagline: "Cartier's definitive rectangular dress watch.",
    description:
      "Tank is the second Cartier priority because it anchors Cartier's design authority, celebrity and collector recognition, precious-metal demand, and enduring formal-watch relevance.",
    assetCount: 0,
  },
  {
    name: "Ballon Bleu",
    slug: "ballon-bleu",
    category: "Modern Dress Watch",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Rounded Cartier dress-watch presence.",
    description:
      "Ballon Bleu coverage will support clients seeking recognizable modern Cartier design, refined daily wear, and approachable luxury-market liquidity.",
    assetCount: 0,
  },
  {
    name: "Panth\u00e8re",
    slug: "panthere",
    category: "Jewelry Watch",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Cartier jewelry-watch elegance.",
    description:
      "Panth\u00e8re coverage will support bracelet-led Cartier demand, jewelry-watch styling, small-case collector interest, and gifting-driven brokerage conversations.",
    assetCount: 0,
  },
  {
    name: "Pasha",
    slug: "pasha",
    category: "Design Sport",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Distinctive round Cartier sport design.",
    description:
      "Pasha coverage will support clients drawn to bolder Cartier design, rounded case identity, crown-guard signatures, and under-the-radar collector appeal.",
    assetCount: 0,
  },
  {
    name: "Drive",
    slug: "drive",
    category: "Dress Sport",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Automotive-inspired Cartier dress sport.",
    description:
      "Drive coverage will preserve a future path into cushion-case Cartier design, discontinued-market value, and refined dress-sport advisory.",
    assetCount: 0,
  },
  {
    name: "Priv\u00e9",
    slug: "prive",
    category: "Collector Reissue",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Cartier's collector-focused heritage series.",
    description:
      "Priv\u00e9 coverage will support advanced collectors comparing limited Cartier design revivals, shaped cases, precious metals, and high-design collectability.",
    assetCount: 0,
  },
] as const satisfies readonly CartierCollectionFoundation[]);

export const cartierBrandIntelligence = Object.freeze({
  heritage:
    "Cartier brings one of the deepest design legacies in luxury watches, with Santos and Tank anchoring more than a century of recognizable wristwatch history.",
  designPhilosophy:
    "Cartier value is driven by proportion, shape, bracelet integration, dial restraint, and design permanence rather than technical specification alone.",
  collectorProfile:
    "Cartier clients often value taste, design literacy, cultural relevance, wearability, and quieter sophistication across both watch and jewelry contexts.",
  brokerageOpportunity:
    "Cartier gives Quest Luxo a high-conviction brokerage lane for clients seeking design-led luxury, unisex sizing, iconic references, precious metals, and giftable watches with strong recognition.",
  marketPositioning:
    "Cartier sits at the intersection of jewelry maison, historic watchmaker, and design authority, with Santos and Tank offering the clearest first launch paths.",
  liquidity:
    "Liquidity is strongest for recognizable Santos and Tank references, especially clean full-set examples, desirable metals, strong proportions, and current or recently discontinued configurations.",
  questLuxoOverview:
    "Cartier Factory v1 remains dormant, with Santos prioritized first and Tank second so future launch work can focus on the brand's most commercially important and collector-legible collections.",
} satisfies CartierBrandIntelligence);

export const cartierBrandFoundation = Object.freeze({
  name: "Cartier",
  slug: "cartier",
  founded: 1847,
  factoryLive: false,
  launchPhase: "v2",
  flagshipCollection: "Santos",
  flagshipCollectionSlug: "santos",
  secondPriorityCollection: "Tank",
  secondPriorityCollectionSlug: "tank",
  brandIntelligence: cartierBrandIntelligence,
  collections: cartierCollections,
} satisfies CartierBrandFoundation);

export const cartierFactoryFoundationMetadata = Object.freeze({
  brandName: "Cartier",
  brandSlug: "cartier",
  factoryLive: false,
  launchPhase: "v2",
  flagshipCollection: "Santos",
  secondPriorityCollection: "Tank",
  plannedCollectionCount: cartierCollections.length,
  referenceBackedCollectionCount: cartierCollections.filter(
    (collection) => collection.assetCount > 0
  ).length,
} satisfies CartierFactoryFoundationMetadata);

export function getCartierCollections(): readonly CartierCollectionFoundation[] {
  return cartierCollections;
}

export function getCartierCollectionFoundation(
  slug: string
): CartierCollectionFoundation | undefined {
  return cartierCollections.find((collection) => collection.slug === slug);
}

export function getCartierFlagshipCollection(): CartierCollectionFoundation {
  return cartierCollections[0];
}

export function getCartierSecondPriorityCollection(): CartierCollectionFoundation {
  return cartierCollections[1];
}
