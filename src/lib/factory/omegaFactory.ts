import {
  omegaAquaTerraAssets,
  omegaConstellationAssets,
  omegaDeVilleAssets,
  omegaPlanetOceanAssets,
  omegaRailmasterAssets,
  omegaSeamasterAssets,
  omegaSpeedmasterAssets,
  type OmegaCollectionSlug,
} from "../../data/omega";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";
import { getExpansionReferences } from "../../data/reference-expansion";

export type OmegaLaunchStage =
  | "first-launch"
  | "second-launch"
  | "future-dormant";

export interface OmegaLaunchCollection {
  readonly order: number;
  readonly name: string;
  readonly slug: OmegaCollectionSlug;
  readonly stage: OmegaLaunchStage;
}

export interface OmegaActivationPlanMetadata {
  readonly brandName: "Omega";
  readonly brandSlug: "omega";
  readonly factoryLive: boolean;
  readonly launchPhase: FactoryBrand["launchPhase"];
  readonly firstLaunchCollection: "Speedmaster";
  readonly secondLaunchCollection: "Seamaster";
  readonly plannedCollectionCount: number;
  readonly launchSeedReferenceCount: number;
}

export const omegaLaunchOrder = Object.freeze([
  Object.freeze({
    order: 1,
    name: "Speedmaster",
    slug: "speedmaster",
    stage: "first-launch",
  }),
  Object.freeze({
    order: 2,
    name: "Seamaster",
    slug: "seamaster",
    stage: "second-launch",
  }),
  Object.freeze({
    order: 3,
    name: "Seamaster Planet Ocean",
    slug: "planet-ocean",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 4,
    name: "Aqua Terra",
    slug: "aqua-terra",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 5,
    name: "Constellation",
    slug: "constellation",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 6,
    name: "De Ville",
    slug: "de-ville",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 7,
    name: "Railmaster",
    slug: "railmaster",
    stage: "future-dormant",
  }),
] satisfies readonly OmegaLaunchCollection[]);

export const omegaReadySeedAssetCounts: Readonly<
  Record<OmegaCollectionSlug, number>
> = Object.freeze({
  speedmaster: omegaSpeedmasterAssets.length,
  seamaster: omegaSeamasterAssets.length + getExpansionReferences("omega", "seamaster").length + 1,
  "planet-ocean": omegaPlanetOceanAssets.length + getExpansionReferences("omega", "planet-ocean").length,
  "aqua-terra": omegaAquaTerraAssets.length + getExpansionReferences("omega", "aqua-terra").length,
  constellation: omegaConstellationAssets.length,
  "de-ville": omegaDeVilleAssets.length,
  railmaster: omegaRailmasterAssets.length,
});

export function getOmegaReadySeedAssetCount(slug: OmegaCollectionSlug): number {
  return omegaReadySeedAssetCounts[slug];
}

export const omegaCollections: FactoryCollection[] = [
  {
    name: "Speedmaster",
    slug: "speedmaster",
    category: "Chronograph",
    status: "Factory Scaffold - Launch Seed Ready",
    tagline: "Omega's moonwatch and chronograph platform.",
    description:
      "Speedmaster coverage is the first planned Omega launch collection, backed by dormant seed data for current Moonwatch, discontinued Moonwatch, and collectible special-edition demand.",
    assetCount: getOmegaReadySeedAssetCount("speedmaster"),
  },
  {
    name: "Seamaster Diver 300M",
    slug: "seamaster",
    category: "Dive Watch",
    status: "Factory Scaffold - Launch Planned",
    tagline: "Omega's professional dive-watch family.",
    description:
      "Seamaster Diver 300M coverage preserves the existing canonical Seamaster route and its launch-priority brokerage intelligence.",
    assetCount: getOmegaReadySeedAssetCount("seamaster"),
  },
  {
    name: "Seamaster Planet Ocean",
    slug: "planet-ocean",
    category: "Professional Dive Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Omega's deeper-rated modern dive-watch platform.",
    description:
      "Collection-level guidance for Planet Ocean sizing, materials, movement generations, and ownership considerations.",
    assetCount: getOmegaReadySeedAssetCount("planet-ocean"),
  },
  {
    name: "Aqua Terra",
    slug: "aqua-terra",
    category: "Everyday Sport",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Omega's versatile daily sport-watch platform.",
    description:
      "Aqua Terra coverage will support refined daily sport-watch discovery, teak-dial demand, and broad wearable Omega sourcing once the factory expands.",
    assetCount: getOmegaReadySeedAssetCount("aqua-terra"),
  },
  {
    name: "Constellation",
    slug: "constellation",
    category: "Dress Sport",
    status: "Factory Scaffold",
    tagline: "Omega's integrated dress-sport signature.",
    description:
      "Constellation coverage will support Manhattan, heritage, bracelet, and precious-metal Omega demand in later factory phases.",
    assetCount: getOmegaReadySeedAssetCount("constellation"),
  },
  {
    name: "De Ville",
    slug: "de-ville",
    category: "Dress Watch",
    status: "Factory Scaffold",
    tagline: "Omega's formal and complicated dress-watch line.",
    description:
      "De Ville coverage will support formal Omega dress watches, chronometer positioning, annual calendars, and elegant client demand.",
    assetCount: getOmegaReadySeedAssetCount("de-ville"),
  },
  {
    name: "Railmaster",
    slug: "railmaster",
    category: "Tool Watch",
    status: "Factory Scaffold",
    tagline: "Omega's anti-magnetic heritage tool watch.",
    description:
      "Railmaster coverage will support understated heritage tool-watch demand and anti-magnetic Omega collecting in later factory phases.",
    assetCount: getOmegaReadySeedAssetCount("railmaster"),
  },
];

export const omegaFactory: FactoryBrand = {
  name: "Omega",
  slug: "omega",
  factoryLive: false,
  launchPhase: "v1",
  collections: omegaCollections,
};

export const omegaFactoryScaffold = buildBrandFactoryScaffoldMetadata({
  brand: {
    name: omegaFactory.name,
    slug: omegaFactory.slug,
    factoryLive: omegaFactory.factoryLive,
    launchPhase: omegaFactory.launchPhase,
  },
  collections: omegaFactory.collections,
});

export const omegaActivationPlanMetadata: OmegaActivationPlanMetadata =
  Object.freeze({
    brandName: "Omega",
    brandSlug: "omega",
    factoryLive: omegaFactory.factoryLive,
    launchPhase: omegaFactory.launchPhase,
    firstLaunchCollection: "Speedmaster",
    secondLaunchCollection: "Seamaster",
    plannedCollectionCount: omegaLaunchOrder.length,
    launchSeedReferenceCount:
      omegaReadySeedAssetCounts.speedmaster +
      omegaReadySeedAssetCounts.seamaster,
  });

export function getOmegaLaunchOrder(): readonly OmegaLaunchCollection[] {
  return omegaLaunchOrder;
}

export function getOmegaCollectionFactory(
  slug: string
): FactoryCollection | undefined {
  return omegaFactory.collections.find((collection) => collection.slug === slug);
}

export function getOmegaCollectionPath(slug: string): string {
  return getFactoryCollectionPath(omegaFactory.slug, slug);
}
