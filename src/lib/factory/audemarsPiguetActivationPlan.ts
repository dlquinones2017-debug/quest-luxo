import {
  audemarsPiguetAssets,
  audemarsPiguetCollections as audemarsPiguetSeedCollections,
  type AudemarsPiguetAsset,
  type AudemarsPiguetCollection,
  type AudemarsPiguetCollectionSlug,
} from "../../data/audemars-piguet";
import type { FactoryCollection } from "./brandFactory";
import {
  audemarsPiguetCollections as audemarsPiguetFactoryCollections,
  audemarsPiguetFactory,
} from "./audemarsPiguetFactory";
import {
  createCollectionMetadata,
  type GeneratedCollectionMetadata,
} from "./collectionGenerator";
import {
  createFactoryActivationReport,
  type FactoryActivationReport,
  type FactoryActivationRequirement,
} from "./factoryActivation";
import {
  listReferenceMetadataFromAssets,
  type GeneratedReferenceMetadata,
} from "./referenceGenerator";

export type AudemarsPiguetLaunchStage =
  | "first-launch"
  | "second-launch"
  | "later-dormant";

export type AudemarsPiguetLaunchRequirement =
  | FactoryActivationRequirement
  | "seedData"
  | "launchOrder"
  | "royalOakLaunchPath";

export type AudemarsPiguetReadinessState = "ready" | "blocked";

export interface AudemarsPiguetActivationPlanMetadata {
  readonly brandName: "Audemars Piguet";
  readonly brandSlug: "audemars-piguet";
  readonly factoryLive: boolean;
  readonly launchPhase: string;
  readonly firstLaunchCollection: "Royal Oak";
  readonly secondLaunchCollection: "Royal Oak Offshore";
  readonly plannedCollectionCount: number;
  readonly seedReferenceCount: number;
}

export interface AudemarsPiguetLaunchCollectionPlan {
  readonly order: number;
  readonly name: string;
  readonly slug: AudemarsPiguetCollectionSlug;
  readonly stage: AudemarsPiguetLaunchStage;
  readonly factoryCollection?: Readonly<FactoryCollection>;
  readonly seedCollection?: Readonly<Omit<AudemarsPiguetCollection, "assets">> & {
    readonly assets: readonly AudemarsPiguetAsset[];
  };
  readonly seedReferenceCount: number;
  readonly plannedCollectionPath?: string;
  readonly plannedReferencePaths: readonly string[];
  readonly collectionMetadata?: GeneratedCollectionMetadata;
  readonly referenceMetadata: readonly GeneratedReferenceMetadata<AudemarsPiguetAsset>[];
}

export interface AudemarsPiguetLaunchValidation {
  readonly requirement: AudemarsPiguetLaunchRequirement;
  readonly passed: boolean;
  readonly message: string;
}

export interface AudemarsPiguetLaunchReadiness {
  readonly state: AudemarsPiguetReadinessState;
  readonly canActivate: boolean;
  readonly launchPathPrepared: boolean;
  readonly factoryActivationReport: FactoryActivationReport;
  readonly validations: readonly AudemarsPiguetLaunchValidation[];
  readonly missingRequirements: readonly string[];
}

export interface AudemarsPiguetActivationSummary {
  readonly brandName: "Audemars Piguet";
  readonly brandSlug: "audemars-piguet";
  readonly factoryStatus: "live" | "dormant" | "unknown";
  readonly readinessState: AudemarsPiguetReadinessState;
  readonly canActivate: boolean;
  readonly launchPathPrepared: boolean;
  readonly firstLaunchCollection: "Royal Oak";
  readonly secondLaunchCollection: "Royal Oak Offshore";
  readonly laterCollections: readonly string[];
  readonly missingRequirements: readonly string[];
  readonly summary: string;
}

const apLaunchSequence = Object.freeze([
  Object.freeze({
    order: 1,
    slug: "royal-oak",
    stage: "first-launch",
  }),
  Object.freeze({
    order: 2,
    slug: "royal-oak-offshore",
    stage: "second-launch",
  }),
  Object.freeze({
    order: 3,
    slug: "code-1159",
    stage: "later-dormant",
  }),
  Object.freeze({
    order: 4,
    slug: "royal-oak-concept",
    stage: "later-dormant",
  }),
] satisfies readonly {
  readonly order: number;
  readonly slug: AudemarsPiguetCollectionSlug;
  readonly stage: AudemarsPiguetLaunchStage;
}[]);

const findFactoryCollection = (
  slug: AudemarsPiguetCollectionSlug
): FactoryCollection | undefined =>
  audemarsPiguetFactoryCollections.find(
    (collection) => collection.slug === slug
  );

const findSeedCollection = (
  slug: AudemarsPiguetCollectionSlug
): AudemarsPiguetCollection | undefined =>
  audemarsPiguetSeedCollections.find((collection) => collection.slug === slug);

const createValidation = (
  requirement: AudemarsPiguetLaunchRequirement,
  passed: boolean,
  message: string
): AudemarsPiguetLaunchValidation =>
  Object.freeze({
    requirement,
    passed,
    message,
  });

const createLaunchCollectionPlan = (
  order: number,
  slug: AudemarsPiguetCollectionSlug,
  stage: AudemarsPiguetLaunchStage
): AudemarsPiguetLaunchCollectionPlan => {
  const factoryCollection = findFactoryCollection(slug);
  const seedCollection = findSeedCollection(slug);
  const seedAssets = seedCollection?.assets ?? [];
  const collectionMetadata = factoryCollection
    ? createCollectionMetadata({
        brand: audemarsPiguetFactory,
        collection: factoryCollection,
        references: seedAssets.map((asset) => asset.reference),
      })
    : undefined;
  const referenceMetadata: readonly GeneratedReferenceMetadata<AudemarsPiguetAsset>[] =
    seedCollection
      ? listReferenceMetadataFromAssets({
          brand: audemarsPiguetFactory.name,
          brandSlug: audemarsPiguetFactory.slug,
          collection: seedCollection.name,
          collectionSlug: seedCollection.slug,
          assets: seedAssets,
          basePath: collectionMetadata?.collectionPath,
        })
      : Object.freeze([]);

  return Object.freeze({
    order,
    name: seedCollection?.name ?? factoryCollection?.name ?? slug,
    slug,
    stage,
    factoryCollection: factoryCollection
      ? Object.freeze({ ...factoryCollection })
      : undefined,
    seedCollection: seedCollection
      ? Object.freeze({
          ...seedCollection,
          assets: Object.freeze([...seedCollection.assets]),
        })
      : undefined,
    seedReferenceCount: seedAssets.length,
    plannedCollectionPath: collectionMetadata?.collectionPath,
    plannedReferencePaths: Object.freeze(
      referenceMetadata.map((metadata) => metadata.referencePath)
    ),
    collectionMetadata,
    referenceMetadata,
  });
};

const createLaunchOrder = (): readonly AudemarsPiguetLaunchCollectionPlan[] =>
  Object.freeze(
    apLaunchSequence.map((collection) =>
      createLaunchCollectionPlan(
        collection.order,
        collection.slug,
        collection.stage
      )
    )
  );

const getRoyalOakPlan = (
  launchOrder: readonly AudemarsPiguetLaunchCollectionPlan[]
): AudemarsPiguetLaunchCollectionPlan | undefined =>
  launchOrder.find((collection) => collection.slug === "royal-oak");

const getLaterCollectionNames = (
  launchOrder: readonly AudemarsPiguetLaunchCollectionPlan[]
): readonly string[] =>
  Object.freeze(
    launchOrder
      .filter((collection) => collection.stage === "later-dormant")
      .map((collection) => collection.name)
  );

export const audemarsPiguetActivationPlanMetadata: AudemarsPiguetActivationPlanMetadata =
  Object.freeze({
    brandName: "Audemars Piguet",
    brandSlug: "audemars-piguet",
    factoryLive: audemarsPiguetFactory.factoryLive,
    launchPhase: audemarsPiguetFactory.launchPhase,
    firstLaunchCollection: "Royal Oak",
    secondLaunchCollection: "Royal Oak Offshore",
    plannedCollectionCount: apLaunchSequence.length,
    seedReferenceCount: audemarsPiguetAssets.length,
  });

export function getAudemarsPiguetLaunchOrder(): readonly AudemarsPiguetLaunchCollectionPlan[] {
  return createLaunchOrder();
}

export function validateAudemarsPiguetLaunchReadiness(): AudemarsPiguetLaunchReadiness {
  const launchOrder = getAudemarsPiguetLaunchOrder();
  const royalOakPlan = getRoyalOakPlan(launchOrder);
  const factoryActivationReport = createFactoryActivationReport(
    audemarsPiguetFactory.slug
  );
  const hasSeedData =
    audemarsPiguetSeedCollections.length === apLaunchSequence.length &&
    launchOrder.every((collection) => collection.seedReferenceCount > 0);
  const hasLaunchOrder =
    launchOrder.length === apLaunchSequence.length &&
    launchOrder[0]?.slug === "royal-oak" &&
    launchOrder[1]?.slug === "royal-oak-offshore";
  const hasRoyalOakLaunchPath = Boolean(
    royalOakPlan?.plannedCollectionPath &&
      royalOakPlan.plannedReferencePaths.length > 0
  );
  const validations = Object.freeze([
    ...factoryActivationReport.validations.map((validation) =>
      createValidation(
        validation.requirement,
        validation.passed,
        validation.message
      )
    ),
    createValidation(
      "seedData",
      hasSeedData,
      hasSeedData
        ? "AP seed data exists for all planned launch collections."
        : "AP needs seed data for every planned launch collection."
    ),
    createValidation(
      "launchOrder",
      hasLaunchOrder,
      hasLaunchOrder
        ? "AP launch order starts with Royal Oak, then Royal Oak Offshore."
        : "AP launch order must start with Royal Oak, then Royal Oak Offshore."
    ),
    createValidation(
      "royalOakLaunchPath",
      hasRoyalOakLaunchPath,
      hasRoyalOakLaunchPath
        ? "Royal Oak has a planned collection path and seed reference paths."
        : "Royal Oak needs a planned collection path and seed reference paths."
    ),
  ]);
  const missingRequirements = Object.freeze(
    validations
      .filter((validation) => !validation.passed)
      .map((validation) => validation.message)
  );
  const launchPathPrepared = hasSeedData && hasLaunchOrder && hasRoyalOakLaunchPath;
  const canActivate = factoryActivationReport.canActivate && launchPathPrepared;

  return Object.freeze({
    state: canActivate ? "ready" : "blocked",
    canActivate,
    launchPathPrepared,
    factoryActivationReport,
    validations,
    missingRequirements,
  });
}

export function getMissingAudemarsPiguetLaunchRequirements(): readonly string[] {
  return validateAudemarsPiguetLaunchReadiness().missingRequirements;
}

export function createAudemarsPiguetActivationSummary(): AudemarsPiguetActivationSummary {
  const launchOrder = getAudemarsPiguetLaunchOrder();
  const readiness = validateAudemarsPiguetLaunchReadiness();
  const laterCollections = getLaterCollectionNames(launchOrder);
  const summary = readiness.canActivate
    ? "Audemars Piguet is ready for controlled activation, with Royal Oak planned first and Royal Oak Offshore planned second."
    : "Audemars Piguet remains dormant. The launch order and Royal Oak seed path are prepared, but activation is blocked until the factory satisfies all activation requirements.";

  return Object.freeze({
    brandName: "Audemars Piguet",
    brandSlug: "audemars-piguet",
    factoryStatus: readiness.factoryActivationReport.currentState,
    readinessState: readiness.state,
    canActivate: readiness.canActivate,
    launchPathPrepared: readiness.launchPathPrepared,
    firstLaunchCollection: "Royal Oak",
    secondLaunchCollection: "Royal Oak Offshore",
    laterCollections,
    missingRequirements: readiness.missingRequirements,
    summary,
  });
}
