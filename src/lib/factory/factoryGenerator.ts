import type { QuestLuxoAsset } from "../../types/questLuxo";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import {
  getFactoryCollectionPath,
  getFactoryReferencePath,
} from "./brandFactory";

export interface ReferenceFactoryPageConfig<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  brand: string;
  brandSlug: string;
  collection: string;
  collectionSlug: string;
  assets: TAsset[];
  basePath?: string;
}

export interface FactoryGeneratorIssue {
  field: string;
  message: string;
}

export interface ReferenceFactoryPageMetadata {
  brand: string;
  brandSlug: string;
  collection: string;
  collectionSlug: string;
  basePath: string;
  pageTitle: string;
  referenceCount: number;
  references: string[];
  getReferencePath: (reference: string) => string;
}

export interface BrandFactoryScaffoldConfig {
  brand: Omit<FactoryBrand, "collections">;
  collections: FactoryCollection[];
}

export interface BrandFactoryScaffoldMetadata {
  brand: FactoryBrand;
  collectionCount: number;
  referenceCount: number;
  collectionPaths: Array<{
    name: string;
    slug: string;
    path: string;
    assetCount: number;
  }>;
}

const isBlank = (value: string | undefined): boolean =>
  !value || value.trim().length === 0;

export function validateReferenceFactoryPageConfig(
  config: ReferenceFactoryPageConfig
): FactoryGeneratorIssue[] {
  const issues: FactoryGeneratorIssue[] = [];

  if (isBlank(config.brand)) {
    issues.push({
      field: "brand",
      message: "Brand name is required.",
    });
  }

  if (isBlank(config.brandSlug)) {
    issues.push({
      field: "brandSlug",
      message: "Brand slug is required.",
    });
  }

  if (isBlank(config.collection)) {
    issues.push({
      field: "collection",
      message: "Collection name is required.",
    });
  }

  if (isBlank(config.collectionSlug)) {
    issues.push({
      field: "collectionSlug",
      message: "Collection slug is required.",
    });
  }

  if (!Array.isArray(config.assets)) {
    issues.push({
      field: "assets",
      message: "Assets must be an array.",
    });

    return issues;
  }

  config.assets.forEach((asset, index) => {
    if (isBlank(asset.reference)) {
      issues.push({
        field: `assets[${index}].reference`,
        message: "Reference is required.",
      });
    }

    if (isBlank(asset.model)) {
      issues.push({
        field: `assets[${index}].model`,
        message: "Model is required.",
      });
    }
  });

  return issues;
}

export function assertReferenceFactoryPageConfig(
  config: ReferenceFactoryPageConfig
): void {
  const issues = validateReferenceFactoryPageConfig(config);

  if (issues.length > 0) {
    const summary = issues
      .map((issue) => `${issue.field}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid reference factory page config. ${summary}`);
  }
}

export function buildReferenceFactoryPageMetadata(
  config: ReferenceFactoryPageConfig
): ReferenceFactoryPageMetadata {
  assertReferenceFactoryPageConfig(config);

  const basePath =
    config.basePath ??
    getFactoryCollectionPath(config.brandSlug, config.collectionSlug);

  return {
    brand: config.brand,
    brandSlug: config.brandSlug,
    collection: config.collection,
    collectionSlug: config.collectionSlug,
    basePath,
    pageTitle: `${config.brand} ${config.collection} | Quest Luxo`,
    referenceCount: config.assets.length,
    references: config.assets.map((asset) => asset.reference),
    getReferencePath: (reference: string) =>
      getFactoryReferencePath(
        config.brandSlug,
        config.collectionSlug,
        reference
      ),
  };
}

export function buildBrandFactoryScaffoldMetadata(
  config: BrandFactoryScaffoldConfig
): BrandFactoryScaffoldMetadata {
  const brand: FactoryBrand = {
    ...config.brand,
    collections: config.collections,
  };

  return {
    brand,
    collectionCount: config.collections.length,
    referenceCount: config.collections.reduce(
      (total, collection) => total + (collection.assetCount ?? 0),
      0
    ),
    collectionPaths: config.collections.map((collection) => ({
      name: collection.name,
      slug: collection.slug,
      path: getFactoryCollectionPath(config.brand.slug, collection.slug),
      assetCount: collection.assetCount ?? 0,
    })),
  };
}
