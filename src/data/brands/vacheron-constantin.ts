import { vacheronConstantinOverseasReferenceAssets } from "./vacheron-constantin/overseas";

export * from "./vacheron-constantin/overseas";

export type VacheronConstantinCollectionSlug =
  | "overseas"
  | "patrimony"
  | "traditionnelle"
  | "fiftysix"
  | "historiques";

export type VacheronConstantinCollectionPriority =
  | "flagship-high-priority"
  | "dormant-placeholder";

export type VacheronConstantinLaunchStage =
  | "first-launch-priority"
  | "future-dormant";

export interface VacheronConstantinQuestLuxoPositioning {
  readonly holyTrinityPrestige: string;
  readonly integratedSportsWatchMomentum: string;
  readonly overseasBrokerageOpportunity: string;
  readonly collectorSophistication: string;
}

export interface VacheronConstantinCollectionFoundation {
  readonly name: string;
  readonly slug: VacheronConstantinCollectionSlug;
  readonly category: string;
  readonly priority: VacheronConstantinCollectionPriority;
  readonly launchStage: VacheronConstantinLaunchStage;
  readonly status: "Factory Foundation - Priority" | "Factory Foundation";
  readonly tagline: string;
  readonly description: string;
  readonly assetCount: number;
}

export interface VacheronConstantinBrandFoundation {
  readonly name: "Vacheron Constantin";
  readonly slug: "vacheron-constantin";
  readonly founded: 1755;
  readonly factoryLive: false;
  readonly launchPhase: "v2";
  readonly flagshipCollection: "Overseas";
  readonly flagshipCollectionSlug: "overseas";
  readonly questLuxoPositioning: VacheronConstantinQuestLuxoPositioning;
  readonly collections: readonly VacheronConstantinCollectionFoundation[];
}

export interface VacheronConstantinFactoryFoundationMetadata {
  readonly brandName: "Vacheron Constantin";
  readonly brandSlug: "vacheron-constantin";
  readonly factoryLive: false;
  readonly launchPhase: "v2";
  readonly flagshipCollection: "Overseas";
  readonly plannedCollectionCount: number;
  readonly referenceBackedCollectionCount: number;
}

export const vacheronConstantinCollections = Object.freeze([
  {
    name: "Overseas",
    slug: "overseas",
    category: "Integrated Sports Watch",
    priority: "flagship-high-priority",
    launchStage: "first-launch-priority",
    status: "Factory Foundation - Priority",
    tagline: "Vacheron Constantin's modern sport-luxury platform.",
    description:
      "Overseas is the prioritized Vacheron launch collection because it combines Holy Trinity prestige, integrated sports watch momentum, and strong brokerage opportunity across steel, precious-metal, and complicated references.",
    assetCount: vacheronConstantinOverseasReferenceAssets.length,
  },
  {
    name: "Patrimony",
    slug: "patrimony",
    category: "Dress Watch",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Minimal Vacheron dress-watch elegance.",
    description:
      "Patrimony coverage will support refined dress-watch clients, precious-metal advisory, and classic Geneva watchmaking once the Vacheron factory expands.",
    assetCount: 0,
  },
  {
    name: "Traditionnelle",
    slug: "traditionnelle",
    category: "High Horology",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Classical Vacheron high-watchmaking depth.",
    description:
      "Traditionnelle coverage will support collectors comparing formal complications, hand-finishing, perpetual calendars, chronographs, and elite Vacheron craft.",
    assetCount: 0,
  },
  {
    name: "Fiftysix",
    slug: "fiftysix",
    category: "Everyday Dress Sport",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Accessible vintage-inspired Vacheron daily wear.",
    description:
      "Fiftysix coverage will support clients seeking a more approachable Vacheron entry point with heritage-inspired daily-wear positioning.",
    assetCount: 0,
  },
  {
    name: "Historiques",
    slug: "historiques",
    category: "Heritage Reissue",
    priority: "dormant-placeholder",
    launchStage: "future-dormant",
    status: "Factory Foundation",
    tagline: "Vacheron heritage design for sophisticated collectors.",
    description:
      "Historiques coverage will support collector-led conversations around reissues, shaped cases, and historically important Vacheron design language.",
    assetCount: 0,
  },
] as const satisfies readonly VacheronConstantinCollectionFoundation[]);

export const vacheronConstantinQuestLuxoPositioning =
  Object.freeze({
    holyTrinityPrestige:
      "Vacheron Constantin brings Holy Trinity credibility and long-running Geneva manufacture heritage into Quest Luxo's upper-tier advisory stack.",
    integratedSportsWatchMomentum:
      "The Overseas gives Quest Luxo a high-conviction integrated sports watch lane alongside Royal Oak and Nautilus demand.",
    overseasBrokerageOpportunity:
      "Overseas sourcing, trade, and valuation conversations can anchor Vacheron expansion because the collection has strong collector visibility and dealer-network relevance.",
    collectorSophistication:
      "Vacheron clients tend to value nuance, finishing, history, and quieter status, making the brand a natural fit for higher-touch brokerage guidance.",
  } satisfies VacheronConstantinQuestLuxoPositioning);

export const vacheronConstantinBrandFoundation =
  Object.freeze({
    name: "Vacheron Constantin",
    slug: "vacheron-constantin",
    founded: 1755,
    factoryLive: false,
    launchPhase: "v2",
    flagshipCollection: "Overseas",
    flagshipCollectionSlug: "overseas",
    questLuxoPositioning: vacheronConstantinQuestLuxoPositioning,
    collections: vacheronConstantinCollections,
  } satisfies VacheronConstantinBrandFoundation);

export const vacheronConstantinFactoryFoundationMetadata =
  Object.freeze({
    brandName: "Vacheron Constantin",
    brandSlug: "vacheron-constantin",
    factoryLive: false,
    launchPhase: "v2",
    flagshipCollection: "Overseas",
    plannedCollectionCount: vacheronConstantinCollections.length,
    referenceBackedCollectionCount: vacheronConstantinCollections.filter(
      (collection) => collection.assetCount > 0
    ).length,
  } satisfies VacheronConstantinFactoryFoundationMetadata);

export function getVacheronConstantinCollections(): readonly VacheronConstantinCollectionFoundation[] {
  return vacheronConstantinCollections;
}

export function getVacheronConstantinCollectionFoundation(
  slug: string
): VacheronConstantinCollectionFoundation | undefined {
  return vacheronConstantinCollections.find(
    (collection) => collection.slug === slug
  );
}

export function getVacheronConstantinFlagshipCollection(): VacheronConstantinCollectionFoundation {
  return vacheronConstantinCollections[0];
}
