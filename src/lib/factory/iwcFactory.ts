import { iwcPilotsWatchAssets, iwcPortugieserAssets } from "../../data/iwc";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";

export const iwcCollections: FactoryCollection[] = [
  {
    name: "Pilot's Watch",
    slug: "pilots-watch",
    category: "Pilot Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Functional aviation design across Mark and Big Pilot proportions.",
    description: "Launch-quality coverage for the Mark XX and Big Pilot's Watch 43.",
    assetCount: iwcPilotsWatchAssets.length,
  },
  {
    name: "Portugieser",
    slug: "portugieser",
    category: "Classic Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Marine-instrument clarity in an enduring dress-watch family.",
    description: "Launch-quality coverage centered on the Portugieser Automatic 40.",
    assetCount: iwcPortugieserAssets.length,
  },
];

export const iwcFactory: FactoryBrand = {
  name: "IWC",
  slug: "iwc",
  factoryLive: false,
  launchPhase: "v2",
  collections: iwcCollections,
};

export const iwcFactoryScaffold = buildBrandFactoryScaffoldMetadata({
  brand: {
    name: iwcFactory.name,
    slug: iwcFactory.slug,
    factoryLive: iwcFactory.factoryLive,
    launchPhase: iwcFactory.launchPhase,
  },
  collections: iwcFactory.collections,
});

export function getIwcCollectionFactory(slug: string): FactoryCollection | undefined {
  return iwcFactory.collections.find((collection) => collection.slug === slug);
}

export function getIwcCollectionPath(slug: string): string {
  return getFactoryCollectionPath(iwcFactory.slug, slug);
}
