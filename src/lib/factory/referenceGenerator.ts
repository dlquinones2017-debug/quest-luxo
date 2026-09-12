import type {
  QuestLuxoAsset,
  QuestLuxoConfiguration,
} from "../../types/questLuxo";
import {
  getFactoryCollectionPath,
  getFactoryReferencePath,
} from "./brandFactory";
import { normalizeCollectionSlug } from "./collectionGenerator";

export interface ReferenceGenerationConfig<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly brand: string;
  readonly brandSlug: string;
  readonly collection: string;
  readonly collectionSlug: string;
  readonly asset: TAsset;
  readonly basePath?: string;
  readonly referencePath?: string;
}

export interface ReferenceMetadataListConfig<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly brand: string;
  readonly brandSlug: string;
  readonly collection: string;
  readonly collectionSlug: string;
  readonly assets: readonly TAsset[];
  readonly basePath?: string;
}

export interface ReferenceFactoryInput<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly brand: string;
  readonly collection: string;
  readonly assets: readonly TAsset[];
  readonly basePath: string;
}

export type ReferenceFactoryInputCandidate<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> = Partial<ReferenceFactoryInput<TAsset>>;

export interface ReferenceGeneratorIssue {
  readonly field: string;
  readonly message: string;
}

export interface GeneratedReferenceMetadata<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
> {
  readonly brand: string;
  readonly brandSlug: string;
  readonly collection: string;
  readonly collectionSlug: string;
  readonly reference: string;
  readonly normalizedReferenceSlug: string;
  readonly model: string;
  readonly pageTitle: string;
  readonly basePath: string;
  readonly referencePath: string;
  readonly material: string | undefined;
  readonly bezel: string | undefined;
  readonly productionStatus: string | undefined;
  readonly marketPosition: string | undefined;
  readonly liquidity: string | undefined;
  readonly allocationDifficulty: string | undefined;
  readonly questLuxoView: string | undefined;
  readonly configurations: readonly Readonly<QuestLuxoConfiguration>[];
  readonly asset: Readonly<TAsset>;
}

const isBlank = (value: string | undefined): boolean =>
  !value || value.trim().length === 0;

const freezeConfigurations = (
  configurations: readonly QuestLuxoConfiguration[] | undefined
): readonly Readonly<QuestLuxoConfiguration>[] =>
  Object.freeze(
    (configurations ?? []).map((configuration) =>
      Object.freeze({ ...configuration })
    )
  );

export function normalizeReferenceSlug(value: string): string {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildReferencePath(
  brandSlug: string,
  collectionSlug: string,
  reference: string
): string {
  return getFactoryReferencePath(
    normalizeCollectionSlug(brandSlug),
    normalizeCollectionSlug(collectionSlug),
    normalizeReferenceSlug(reference)
  );
}

export function createReferenceMetadata<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  config: ReferenceGenerationConfig<TAsset>
): GeneratedReferenceMetadata<TAsset> {
  const brandSlug = normalizeCollectionSlug(config.brandSlug);
  const collectionSlug = normalizeCollectionSlug(config.collectionSlug);
  const normalizedReferenceSlug = normalizeReferenceSlug(config.asset.reference);
  const basePath =
    config.basePath ?? getFactoryCollectionPath(brandSlug, collectionSlug);

  return Object.freeze({
    brand: config.brand,
    brandSlug,
    collection: config.collection,
    collectionSlug: config.collectionSlug,
    reference: config.asset.reference,
    normalizedReferenceSlug,
    model: config.asset.model,
    pageTitle: `${config.brand} ${config.asset.reference} | Quest Luxo`,
    basePath,
    referencePath:
      config.referencePath ??
      getFactoryReferencePath(brandSlug, collectionSlug, normalizedReferenceSlug),
    material: config.asset.material,
    bezel: config.asset.bezel,
    productionStatus: config.asset.productionStatus,
    marketPosition: config.asset.marketPosition,
    liquidity: config.asset.liquidity,
    allocationDifficulty: config.asset.allocationDifficulty,
    questLuxoView: config.asset.questLuxoView,
    configurations: freezeConfigurations(config.asset.configurations),
    asset: Object.freeze({ ...config.asset }) as Readonly<TAsset>,
  });
}

export function listReferenceMetadataFromAssets<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  config: ReferenceMetadataListConfig<TAsset>
): readonly GeneratedReferenceMetadata<TAsset>[] {
  return Object.freeze(
    config.assets.map((asset) =>
      createReferenceMetadata({
        brand: config.brand,
        brandSlug: config.brandSlug,
        collection: config.collection,
        collectionSlug: config.collectionSlug,
        asset,
        basePath: config.basePath,
      })
    )
  );
}

export function validateReferenceFactoryInput(
  input: ReferenceFactoryInputCandidate
): ReferenceGeneratorIssue[] {
  const issues: ReferenceGeneratorIssue[] = [];

  if (isBlank(input.brand)) {
    issues.push({
      field: "brand",
      message: "Brand name is required.",
    });
  }

  if (isBlank(input.collection)) {
    issues.push({
      field: "collection",
      message: "Collection name is required.",
    });
  }

  if (isBlank(input.basePath)) {
    issues.push({
      field: "basePath",
      message: "Base path is required.",
    });
  }

  if (!Array.isArray(input.assets)) {
    issues.push({
      field: "assets",
      message: "Assets must be an array.",
    });

    return issues;
  }

  input.assets.forEach((asset, index) => {
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

export function assertReferenceFactoryInput(
  input: ReferenceFactoryInputCandidate
): void {
  const issues = validateReferenceFactoryInput(input);

  if (issues.length > 0) {
    const summary = issues
      .map((issue) => `${issue.field}: ${issue.message}`)
      .join("; ");

    throw new Error(`Invalid ReferenceFactory input. ${summary}`);
  }
}

export function createReferenceFactoryInput<
  TAsset extends QuestLuxoAsset = QuestLuxoAsset
>(
  config: ReferenceMetadataListConfig<TAsset>
): ReferenceFactoryInput<TAsset> {
  const input: ReferenceFactoryInput<TAsset> = Object.freeze({
    brand: config.brand,
    collection: config.collection,
    assets: Object.freeze([...config.assets]) as readonly TAsset[],
    basePath:
      config.basePath ??
      getFactoryCollectionPath(
        normalizeCollectionSlug(config.brandSlug),
        normalizeCollectionSlug(config.collectionSlug)
      ),
  });

  assertReferenceFactoryInput(input);

  return input;
}
