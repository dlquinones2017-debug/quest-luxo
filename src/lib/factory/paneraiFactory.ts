import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";
import { getExpansionReferences } from "../../data/reference-expansion";

export const paneraiCollections: FactoryCollection[] = [
  {
    name: "Submersible",
    slug: "submersible",
    category: "Professional Dive Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Panerai's purpose-built modern dive-watch collection.",
    description:
      "Collection-level guidance for Submersible sizing, materials, condition, service history, and specialized buyer demand.",
    assetCount: getExpansionReferences("panerai", "submersible").length,
  },
];

export const paneraiFactory: FactoryBrand = {
  name: "Panerai",
  slug: "panerai",
  factoryLive: false,
  launchPhase: "v1",
  collections: paneraiCollections,
};

export const paneraiFactoryScaffold = buildBrandFactoryScaffoldMetadata({
  brand: {
    name: paneraiFactory.name,
    slug: paneraiFactory.slug,
    factoryLive: paneraiFactory.factoryLive,
    launchPhase: paneraiFactory.launchPhase,
  },
  collections: paneraiFactory.collections,
});

export function getPaneraiCollectionFactory(slug: string): FactoryCollection | undefined {
  return paneraiFactory.collections.find((collection) => collection.slug === slug);
}

export function getPaneraiCollectionPath(slug: string): string {
  return getFactoryCollectionPath(paneraiFactory.slug, slug);
}
