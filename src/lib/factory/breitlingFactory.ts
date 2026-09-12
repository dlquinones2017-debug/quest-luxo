import { breitlingChronomatAssets, breitlingNavitimerAssets } from "../../data/breitling";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";

export const breitlingCollections: FactoryCollection[] = [
  {
    name: "Navitimer",
    slug: "navitimer",
    category: "Aviation Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Breitling's slide-rule aviation icon.",
    description: "Launch-quality coverage for the B01 Chronograph 43 and Automatic 41.",
    assetCount: breitlingNavitimerAssets.length,
  },
  {
    name: "Chronomat",
    slug: "chronomat",
    category: "Sport Chronograph",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Breitling's versatile mechanical sport-watch platform.",
    description: "Launch-quality coverage centered on the Chronomat B01 42.",
    assetCount: breitlingChronomatAssets.length,
  },
];

export const breitlingFactory: FactoryBrand = {
  name: "Breitling",
  slug: "breitling",
  factoryLive: false,
  launchPhase: "v1",
  collections: breitlingCollections,
};

export const breitlingFactoryScaffold = buildBrandFactoryScaffoldMetadata({
  brand: {
    name: breitlingFactory.name,
    slug: breitlingFactory.slug,
    factoryLive: breitlingFactory.factoryLive,
    launchPhase: breitlingFactory.launchPhase,
  },
  collections: breitlingFactory.collections,
});

export function getBreitlingCollectionFactory(slug: string): FactoryCollection | undefined {
  return breitlingFactory.collections.find((collection) => collection.slug === slug);
}

export function getBreitlingCollectionPath(slug: string): string {
  return getFactoryCollectionPath(breitlingFactory.slug, slug);
}
