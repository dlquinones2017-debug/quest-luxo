import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import {
  getFactoryCollectionPath,
  getFactoryReferencePath,
} from "./brandFactory";

export type CollectionFactoryStatus = "live" | "dormant";

export type CollectionGenerationBrand = Readonly<
  Pick<FactoryBrand, "name" | "slug" | "factoryLive">
>;

export type CollectionGenerationCollection = Readonly<FactoryCollection>;

export type CollectionGenerationFactory = Readonly<
  Omit<FactoryBrand, "collections"> & {
    collections: readonly CollectionGenerationCollection[];
  }
>;

export interface CollectionGenerationConfig<
  TCollection extends CollectionGenerationCollection =
    CollectionGenerationCollection
> {
  readonly brand: CollectionGenerationBrand;
  readonly collection: TCollection;
  readonly references?: readonly string[];
  readonly basePath?: string;
}

export interface CollectionMetadataListConfig<
  TFactory extends CollectionGenerationFactory = CollectionGenerationFactory
> {
  readonly factory: TFactory;
  readonly referencesByCollectionSlug?: Readonly<
    Record<string, readonly string[]>
  >;
  readonly basePathByCollectionSlug?: Readonly<Record<string, string>>;
}

export interface GeneratedReferencePath {
  readonly reference: string;
  readonly path: string;
}

export interface GeneratedCollectionMetadata<
  TCollection extends CollectionGenerationCollection =
    CollectionGenerationCollection
> {
  readonly brandName: string;
  readonly brandSlug: string;
  readonly collectionName: string;
  readonly collectionSlug: string;
  readonly normalizedCollectionSlug: string;
  readonly category: string;
  readonly collectionStatus: string;
  readonly factoryStatus: CollectionFactoryStatus;
  readonly tagline: string;
  readonly description: string;
  readonly assetCount: number;
  readonly collectionPath: string;
  readonly referencePaths: readonly GeneratedReferencePath[];
  readonly collection: TCollection;
}

export function normalizeCollectionSlug(value: string): string {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCollectionPath(
  brandSlug: string,
  collectionSlug: string
): string {
  return getFactoryCollectionPath(
    normalizeCollectionSlug(brandSlug),
    normalizeCollectionSlug(collectionSlug)
  );
}

export function buildCollectionReferencePath(
  brandSlug: string,
  collectionSlug: string,
  reference: string
): string {
  return getFactoryReferencePath(
    normalizeCollectionSlug(brandSlug),
    normalizeCollectionSlug(collectionSlug),
    reference.trim()
  );
}

export function createCollectionMetadata<
  TCollection extends CollectionGenerationCollection
>(
  config: CollectionGenerationConfig<TCollection>
): GeneratedCollectionMetadata<TCollection> {
  const normalizedCollectionSlug = normalizeCollectionSlug(
    config.collection.slug || config.collection.name
  );
  const brandSlug = normalizeCollectionSlug(config.brand.slug);
  const referencePaths = Object.freeze(
    (config.references ?? []).map((reference) =>
      Object.freeze({
        reference,
        path: buildCollectionReferencePath(
          brandSlug,
          normalizedCollectionSlug,
          reference
        ),
      })
    )
  );

  return Object.freeze({
    brandName: config.brand.name,
    brandSlug,
    collectionName: config.collection.name,
    collectionSlug: config.collection.slug,
    normalizedCollectionSlug,
    category: config.collection.category,
    collectionStatus: config.collection.status,
    factoryStatus: config.brand.factoryLive ? "live" : "dormant",
    tagline: config.collection.tagline,
    description: config.collection.description,
    assetCount: config.collection.assetCount ?? referencePaths.length,
    collectionPath:
      config.basePath ?? buildCollectionPath(brandSlug, normalizedCollectionSlug),
    referencePaths,
    collection: Object.freeze({ ...config.collection }) as TCollection,
  });
}

export function listCollectionMetadataFromFactory<
  TFactory extends CollectionGenerationFactory
>(
  config: CollectionMetadataListConfig<TFactory>
): readonly GeneratedCollectionMetadata[] {
  return Object.freeze(
    config.factory.collections.map((collection) => {
      const normalizedCollectionSlug = normalizeCollectionSlug(
        collection.slug || collection.name
      );
      const references =
        config.referencesByCollectionSlug?.[collection.slug] ??
        config.referencesByCollectionSlug?.[normalizedCollectionSlug] ??
        [];
      const basePath =
        config.basePathByCollectionSlug?.[collection.slug] ??
        config.basePathByCollectionSlug?.[normalizedCollectionSlug];

      return createCollectionMetadata({
        brand: config.factory,
        collection,
        references,
        basePath,
      });
    })
  );
}

export function getLiveCollectionMetadataFromFactory<
  TFactory extends CollectionGenerationFactory
>(
  config: CollectionMetadataListConfig<TFactory>
): readonly GeneratedCollectionMetadata[] {
  return listCollectionMetadataFromFactory(config).filter(
    (metadata) => metadata.factoryStatus === "live"
  );
}

export function getDormantCollectionMetadataFromFactory<
  TFactory extends CollectionGenerationFactory
>(
  config: CollectionMetadataListConfig<TFactory>
): readonly GeneratedCollectionMetadata[] {
  return listCollectionMetadataFromFactory(config).filter(
    (metadata) => metadata.factoryStatus === "dormant"
  );
}
