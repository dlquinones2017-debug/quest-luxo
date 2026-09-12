import {
  patekPhilippeAquanautAssets,
  patekPhilippeCubitusAssets,
  patekPhilippeNautilusAssets,
  type PatekPhilippeCollectionSlug,
} from "../../data/patek-philippe";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";
import { getExpansionReferences } from "../../data/reference-expansion";

export type PatekPhilippeLaunchStage =
  | "first-launch"
  | "second-launch"
  | "future-dormant";

export interface PatekPhilippeLaunchCollection {
  readonly order: number;
  readonly name: string;
  readonly slug: PatekPhilippeCollectionSlug;
  readonly stage: PatekPhilippeLaunchStage;
}

export interface PatekPhilippeActivationPlanMetadata {
  readonly brandName: "Patek Philippe";
  readonly brandSlug: "patek-philippe";
  readonly factoryLive: boolean;
  readonly launchPhase: FactoryBrand["launchPhase"];
  readonly firstLaunchCollection: "Nautilus";
  readonly secondLaunchCollection: "Aquanaut";
  readonly plannedCollectionCount: number;
  readonly launchSeedReferenceCount: number;
}

export const patekPhilippeLaunchOrder = Object.freeze([
  Object.freeze({
    order: 1,
    name: "Nautilus",
    slug: "nautilus",
    stage: "first-launch",
  }),
  Object.freeze({
    order: 2,
    name: "Aquanaut",
    slug: "aquanaut",
    stage: "second-launch",
  }),
  Object.freeze({
    order: 3,
    name: "Calatrava",
    slug: "calatrava",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 4,
    name: "Cubitus",
    slug: "cubitus",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 5,
    name: "Grand Complications",
    slug: "grand-complications",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 6,
    name: "Complications",
    slug: "complications",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 7,
    name: "Golden Ellipse",
    slug: "golden-ellipse",
    stage: "future-dormant",
  }),
  Object.freeze({
    order: 8,
    name: "Twenty~4",
    slug: "twenty-4",
    stage: "future-dormant",
  }),
] satisfies readonly PatekPhilippeLaunchCollection[]);

export const patekPhilippeReadySeedAssetCounts: Readonly<
  Record<PatekPhilippeCollectionSlug, number>
> = Object.freeze({
  nautilus: patekPhilippeNautilusAssets.length,
  aquanaut: patekPhilippeAquanautAssets.length,
  calatrava: getExpansionReferences("patek-philippe", "calatrava").length,
  cubitus: patekPhilippeCubitusAssets.length + getExpansionReferences("patek-philippe", "cubitus").length,
  "grand-complications": 0,
  complications: 0,
  "golden-ellipse": 0,
  "twenty-4": 0,
});

export function getPatekPhilippeReadySeedAssetCount(
  slug: PatekPhilippeCollectionSlug
): number {
  return patekPhilippeReadySeedAssetCounts[slug];
}

export const patekPhilippeCollections: FactoryCollection[] = [
  {
    name: "Nautilus",
    slug: "nautilus",
    category: "Integrated Bracelet",
    status: "Factory Scaffold - Launch Seed Ready",
    tagline: "The Patek luxury-sport benchmark.",
    description:
      "Nautilus coverage is the first planned Patek launch collection, backed by dormant seed data for steel and precious-metal luxury-sport demand.",
    assetCount: getPatekPhilippeReadySeedAssetCount("nautilus"),
  },
  {
    name: "Aquanaut",
    slug: "aquanaut",
    category: "Sport Watch",
    status: "Factory Scaffold - Launch Seed Ready",
    tagline: "The casual Patek sport-watch platform.",
    description:
      "Aquanaut coverage is the second planned Patek launch collection, prepared for casual sport-watch demand after Nautilus.",
    assetCount: getPatekPhilippeReadySeedAssetCount("aquanaut"),
  },
  {
    name: "Calatrava",
    slug: "calatrava",
    category: "Dress Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Classic Patek Philippe dress-watch design.",
    description:
      "Calatrava coverage will support classic dress-watch heritage, precious-metal references, and understated private sourcing once the Patek factory expands.",
    assetCount: getPatekPhilippeReadySeedAssetCount("calatrava"),
  },
  {
    name: "Cubitus",
    slug: "cubitus",
    category: "Contemporary Sport",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Patek Philippe's contemporary square-format collection.",
    description:
      "Collection-level guidance for Cubitus configuration, fit, ownership, and developing secondary-market context.",
    assetCount: getPatekPhilippeReadySeedAssetCount("cubitus"),
  },
  {
    name: "Grand Complications",
    slug: "grand-complications",
    category: "High Horology",
    status: "Factory Scaffold",
    tagline: "Patek Philippe's highest complication tier.",
    description:
      "Grand Complications coverage will support perpetual calendars, chiming watches, split-seconds, and elite collector demand in later Patek factory phases.",
    assetCount: 0,
  },
  {
    name: "Complications",
    slug: "complications",
    category: "Complication",
    status: "Factory Scaffold",
    tagline: "Practical Patek Philippe high watchmaking.",
    description:
      "Complications coverage will support annual calendars, travel time, chronographs, and practical high-watchmaking Patek references.",
    assetCount: 0,
  },
  {
    name: "Golden Ellipse",
    slug: "golden-ellipse",
    category: "Design Icon",
    status: "Factory Scaffold",
    tagline: "A design-led Patek dress-watch signature.",
    description:
      "Golden Ellipse coverage will support design-history collectors and specialized Patek dress-watch demand in later factory phases.",
    assetCount: 0,
  },
  {
    name: "Twenty~4",
    slug: "twenty-4",
    category: "Bracelet Watch",
    status: "Factory Scaffold",
    tagline: "Refined daily Patek bracelet-watch coverage.",
    description:
      "Twenty~4 coverage will support Patek bracelet-watch discovery, daily wear, gifting, and non-sport client demand.",
    assetCount: 0,
  },
];

export const patekPhilippeFactory: FactoryBrand = {
  name: "Patek Philippe",
  slug: "patek-philippe",
  factoryLive: false,
  launchPhase: "v1",
  collections: patekPhilippeCollections,
};

export const patekPhilippeFactoryScaffold = buildBrandFactoryScaffoldMetadata({
  brand: {
    name: patekPhilippeFactory.name,
    slug: patekPhilippeFactory.slug,
    factoryLive: patekPhilippeFactory.factoryLive,
    launchPhase: patekPhilippeFactory.launchPhase,
  },
  collections: patekPhilippeFactory.collections,
});

export const patekPhilippeActivationPlanMetadata: PatekPhilippeActivationPlanMetadata =
  Object.freeze({
    brandName: "Patek Philippe",
    brandSlug: "patek-philippe",
    factoryLive: patekPhilippeFactory.factoryLive,
    launchPhase: patekPhilippeFactory.launchPhase,
    firstLaunchCollection: "Nautilus",
    secondLaunchCollection: "Aquanaut",
    plannedCollectionCount: patekPhilippeLaunchOrder.length,
    launchSeedReferenceCount:
      patekPhilippeReadySeedAssetCounts.nautilus +
      patekPhilippeReadySeedAssetCounts.aquanaut,
  });

export function getPatekPhilippeLaunchOrder(): readonly PatekPhilippeLaunchCollection[] {
  return patekPhilippeLaunchOrder;
}

export function getPatekPhilippeCollectionFactory(
  slug: string
): FactoryCollection | undefined {
  return patekPhilippeFactory.collections.find(
    (collection) => collection.slug === slug
  );
}

export function getPatekPhilippeCollectionPath(slug: string): string {
  return getFactoryCollectionPath(patekPhilippeFactory.slug, slug);
}
