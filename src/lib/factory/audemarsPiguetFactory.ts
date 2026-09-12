import {
  audemarsPiguetRoyalOakAssets,
  type AudemarsPiguetCollectionSlug,
} from "../../data/audemars-piguet";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";
import { getExpansionReferences } from "../../data/reference-expansion";

export const audemarsPiguetReadySeedAssetCounts: Readonly<
  Record<AudemarsPiguetCollectionSlug, number>
> = Object.freeze({
  "royal-oak": audemarsPiguetRoyalOakAssets.length,
  "royal-oak-jumbo": getExpansionReferences("audemars-piguet", "royal-oak-jumbo").length,
  "royal-oak-chronograph": getExpansionReferences("audemars-piguet", "royal-oak-chronograph").length,
  "royal-oak-offshore": 0,
  "offshore-diver": getExpansionReferences("audemars-piguet", "offshore-diver").length,
  "code-1159": getExpansionReferences("audemars-piguet", "code-1159").length,
  "royal-oak-concept": 0,
});

export function getAudemarsPiguetReadySeedAssetCount(
  slug: AudemarsPiguetCollectionSlug
): number {
  return audemarsPiguetReadySeedAssetCounts[slug];
}

export const audemarsPiguetCollections: FactoryCollection[] = [
  {
    name: "Royal Oak",
    slug: "royal-oak",
    category: "Integrated Bracelet",
    status: "Factory Scaffold - Royal Oak Seed Ready",
    tagline: "The integrated luxury-sport icon.",
    description:
      "Royal Oak coverage is the first planned AP launch collection, backed by reference seed data for steel Selfwinding, Jumbo, and neo-vintage demand.",
    assetCount: getAudemarsPiguetReadySeedAssetCount("royal-oak"),
  },
  {
    name: "Royal Oak Jumbo",
    slug: "royal-oak-jumbo",
    category: "Integrated Bracelet",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "The extra-thin expression of the Royal Oak.",
    description:
      "Collection-level guidance for Royal Oak Jumbo proportions, condition, completeness, and specialized collector demand.",
    assetCount: getAudemarsPiguetReadySeedAssetCount("royal-oak-jumbo"),
  },
  {
    name: "Royal Oak Chronograph",
    slug: "royal-oak-chronograph",
    category: "Sport Chronograph",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Royal Oak design with chronograph utility.",
    description:
      "Collection-level guidance for Royal Oak Chronograph generations, wear, service exposure, and configuration-specific demand.",
    assetCount: getAudemarsPiguetReadySeedAssetCount("royal-oak-chronograph"),
  },
  {
    name: "Royal Oak Offshore",
    slug: "royal-oak-offshore",
    category: "Sport Chronograph",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "The bold AP sport-watch platform.",
    description:
      "Royal Oak Offshore coverage will support oversized chronographs, diver references, limited editions, and private-client sport-watch demand.",
    assetCount: getAudemarsPiguetReadySeedAssetCount("royal-oak-offshore"),
  },
  {
    name: "Offshore Diver",
    slug: "offshore-diver",
    category: "Professional Dive Watch",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "The dive-focused Royal Oak Offshore.",
    description:
      "Collection-level guidance for Offshore Diver case wear, rubber components, service history, and fit.",
    assetCount: getAudemarsPiguetReadySeedAssetCount("offshore-diver"),
  },
  {
    name: "Code 11.59",
    slug: "code-1159",
    category: "Modern Complication",
    status: "Factory Scaffold - Launch Intelligence Ready",
    tagline: "Audemars Piguet's modern round-watch architecture.",
    description:
      "Code 11.59 coverage will support time-only, chronograph, perpetual calendar, tourbillon, and complicated AP references as the factory expands.",
    assetCount: getAudemarsPiguetReadySeedAssetCount("code-1159"),
  },
  {
    name: "Royal Oak Concept",
    slug: "royal-oak-concept",
    category: "High Horology",
    status: "Factory Scaffold",
    tagline: "Experimental AP high-horology engineering.",
    description:
      "Royal Oak Concept coverage will support AP's most technical tourbillon, GMT, split-second, and limited high-complication references.",
    assetCount: 0,
  },
];

export const audemarsPiguetFactory: FactoryBrand = {
  name: "Audemars Piguet",
  slug: "audemars-piguet",
  factoryLive: false,
  launchPhase: "v1",
  collections: audemarsPiguetCollections,
};

export const audemarsPiguetFactoryScaffold =
  buildBrandFactoryScaffoldMetadata({
    brand: {
      name: audemarsPiguetFactory.name,
      slug: audemarsPiguetFactory.slug,
      factoryLive: audemarsPiguetFactory.factoryLive,
      launchPhase: audemarsPiguetFactory.launchPhase,
    },
    collections: audemarsPiguetFactory.collections,
  });

export function getAudemarsPiguetCollectionFactory(
  slug: string
): FactoryCollection | undefined {
  return audemarsPiguetFactory.collections.find(
    (collection) => collection.slug === slug
  );
}

export function getAudemarsPiguetCollectionPath(slug: string): string {
  return getFactoryCollectionPath(audemarsPiguetFactory.slug, slug);
}
