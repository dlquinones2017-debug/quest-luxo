export interface FactoryCollection {
  name: string;
  slug: string;
  category: string;
  status: string;
  tagline: string;
  description: string;
  assetCount?: number;
}

export interface FactoryBrand {
  name: string;
  slug: string;
  factoryLive: boolean;
  launchPhase: "v1" | "v1.1" | "v2";
  collections: FactoryCollection[];
}

export function getFactoryCollectionPath(
  brandSlug: string,
  collectionSlug: string
): string {
  return `/collections/${brandSlug}/${collectionSlug}`;
}

export function getFactoryReferencePath(
  brandSlug: string,
  collectionSlug: string,
  reference: string
): string {
  return `/collections/${brandSlug}/${collectionSlug}/${reference}`;
}

export function sortFactoryCollections(collections: FactoryCollection[]) {
  return [...collections].sort((a, b) => a.name.localeCompare(b.name));
}