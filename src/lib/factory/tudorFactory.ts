import { tudorBlackBayAssets, tudorPelagosAssets } from "../../data/tudor";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";
import { getExpansionReferences } from "../../data/reference-expansion";

export const tudorCollections: FactoryCollection[] = [
  {
    name: "Black Bay",
    slug: "black-bay",
    category: "Heritage Dive Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Tudor's heritage-led modern dive-watch platform.",
    description: "Launch-quality coverage for Black Bay 58 and Black Bay Monochrome brokerage decisions.",
    assetCount: tudorBlackBayAssets.length,
  },
  {
    name: "Pelagos",
    slug: "pelagos",
    category: "Professional Dive Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Tudor's titanium professional dive-watch family.",
    description: "Launch-quality coverage centered on the Pelagos 39.",
    assetCount: tudorPelagosAssets.length,
  },
  {
    name: "Prince",
    slug: "prince",
    category: "Classic Everyday Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Tudor's broad vintage and neo-vintage classic-watch family.",
    description:
      "Collection-level guidance for Prince-era identification, condition, originality, and specialized-market demand.",
    assetCount: getExpansionReferences("tudor", "prince").length,
  },
  {
    name: "Royal",
    slug: "royal",
    category: "Integrated Dress Sport",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Tudor's accessible integrated-bracelet dress-sport line.",
    description:
      "Collection-level guidance for Tudor Royal sizing, configuration, wearability, and resale expectations.",
    assetCount: getExpansionReferences("tudor", "royal").length,
  },
];

export const tudorFactory: FactoryBrand = {
  name: "Tudor",
  slug: "tudor",
  factoryLive: false,
  launchPhase: "v1",
  collections: tudorCollections,
};

export const tudorFactoryScaffold = buildBrandFactoryScaffoldMetadata({
  brand: {
    name: tudorFactory.name,
    slug: tudorFactory.slug,
    factoryLive: tudorFactory.factoryLive,
    launchPhase: tudorFactory.launchPhase,
  },
  collections: tudorFactory.collections,
});

export function getTudorCollectionFactory(slug: string): FactoryCollection | undefined {
  return tudorFactory.collections.find((collection) => collection.slug === slug);
}

export function getTudorCollectionPath(slug: string): string {
  return getFactoryCollectionPath(tudorFactory.slug, slug);
}
