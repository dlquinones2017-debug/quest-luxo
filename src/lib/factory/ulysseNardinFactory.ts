import { ulysseNardinCollections } from "../../data/ulysse-nardin";
import { getUlysseNardinReferencesForCollection } from "../../data/ulysse-nardin-references";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";

export const ulysseNardinFactoryCollections: FactoryCollection[] =
  ulysseNardinCollections.map((collection) => ({
    name: collection.name,
    slug: collection.slug,
    category: collection.category,
    status: collection.status,
    tagline: collection.tagline,
    description: collection.description,
    assetCount: getUlysseNardinReferencesForCollection(collection.slug).length,
  }));

export const ulysseNardinFactory: FactoryBrand = {
  name: "Ulysse Nardin",
  slug: "ulysse-nardin",
  factoryLive: false,
  launchPhase: "v1.1",
  collections: ulysseNardinFactoryCollections,
};

export const ulysseNardinFactoryScaffold = buildBrandFactoryScaffoldMetadata({
  brand: {
    name: ulysseNardinFactory.name,
    slug: ulysseNardinFactory.slug,
    factoryLive: ulysseNardinFactory.factoryLive,
    launchPhase: ulysseNardinFactory.launchPhase,
  },
  collections: ulysseNardinFactory.collections,
});

export function getUlysseNardinFactoryCollection(slug: string): FactoryCollection | undefined {
  return ulysseNardinFactory.collections.find((collection) => collection.slug === slug);
}

export function getUlysseNardinCollectionPath(slug: string): string {
  return getFactoryCollectionPath(ulysseNardinFactory.slug, slug);
}
