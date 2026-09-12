import {
  factoryRegistry,
  getDormantFactories,
  getFactory,
  getLiveFactories,
  type FactoryLookupKey,
  type FactoryRegistryEntry,
  type RegisteredFactoryName,
} from "./factoryRegistry";

export type FactoryActivationRequirement =
  | "metadata"
  | "collections"
  | "dataSource"
  | "registryEntry";

export type FactoryActivationState = "live" | "activatable" | "blocked";

export type FactoryActivationTarget =
  | FactoryLookupKey
  | FactoryRegistryEntry;

export interface FactoryActivationValidation {
  readonly requirement: FactoryActivationRequirement;
  readonly passed: boolean;
  readonly message: string;
}

export interface FactoryActivationReport {
  readonly name: string;
  readonly slug: string;
  readonly currentState: "live" | "dormant" | "unknown";
  readonly activationState: FactoryActivationState;
  readonly factoryLive: boolean;
  readonly collectionCount: number;
  readonly referenceCount: number;
  readonly canActivate: boolean;
  readonly validations: readonly FactoryActivationValidation[];
  readonly blockingIssues: readonly string[];
}

export interface FactoryActivationSummary {
  readonly totalFactories: number;
  readonly liveCount: number;
  readonly dormantCount: number;
  readonly activatableCount: number;
  readonly blockedCount: number;
  readonly liveFactoryNames: readonly RegisteredFactoryName[];
  readonly dormantFactoryNames: readonly RegisteredFactoryName[];
  readonly activatableFactoryNames: readonly string[];
  readonly reports: readonly FactoryActivationReport[];
}

const unknownFactoryReportDefaults = {
  slug: "unknown",
  currentState: "unknown",
  activationState: "blocked",
  factoryLive: false,
  collectionCount: 0,
  referenceCount: 0,
  canActivate: false,
} as const;

const isRegistryEntry = (
  target: FactoryActivationTarget
): target is FactoryRegistryEntry =>
  typeof target === "object" && "factory" in target && "slug" in target;

const resolveFactoryEntry = (
  target: FactoryActivationTarget
): FactoryRegistryEntry | undefined =>
  isRegistryEntry(target) ? getFactory(target.slug) : getFactory(target);

const targetName = (target: FactoryActivationTarget): string =>
  isRegistryEntry(target) ? target.name : target;

const isBlank = (value: string | undefined): boolean =>
  !value || value.trim().length === 0;

const createValidation = (
  requirement: FactoryActivationRequirement,
  passed: boolean,
  message: string
): FactoryActivationValidation =>
  Object.freeze({
    requirement,
    passed,
    message,
  });

export function isFactoryLive(target: FactoryActivationTarget): boolean {
  return resolveFactoryEntry(target)?.status === "live";
}

export function validateFactoryRegistryEntry(
  target: FactoryActivationTarget
): FactoryActivationValidation {
  const entry = resolveFactoryEntry(target);

  return createValidation(
    "registryEntry",
    Boolean(entry),
    entry
      ? `${entry.name} is registered in the factory registry.`
      : `${targetName(target)} is not registered in the factory registry.`
  );
}

export function validateFactoryMetadata(
  target: FactoryActivationTarget
): FactoryActivationValidation {
  const entry = resolveFactoryEntry(target);
  const hasMetadata = Boolean(
    entry &&
      !isBlank(entry.name) &&
      !isBlank(entry.slug) &&
      !isBlank(entry.launchPhase)
  );

  return createValidation(
    "metadata",
    hasMetadata,
    hasMetadata
      ? `${entry?.name} has activation metadata.`
      : `${targetName(target)} is missing required factory metadata.`
  );
}

export function validateFactoryCollections(
  target: FactoryActivationTarget
): FactoryActivationValidation {
  const entry = resolveFactoryEntry(target);
  const collections = entry?.factory.collections ?? [];
  const hasCollections =
    collections.length > 0 &&
    collections.every(
      (collection) => !isBlank(collection.name) && !isBlank(collection.slug)
    );

  return createValidation(
    "collections",
    hasCollections,
    hasCollections
      ? `${entry?.name} has ${collections.length} collection definition${
          collections.length === 1 ? "" : "s"
        }.`
      : `${targetName(target)} needs at least one named collection with a slug.`
  );
}

export function validateFactoryDataSource(
  target: FactoryActivationTarget
): FactoryActivationValidation {
  const entry = resolveFactoryEntry(target);
  const hasDataSource = Boolean(entry && entry.referenceCount > 0);

  return createValidation(
    "dataSource",
    hasDataSource,
    hasDataSource
      ? `${entry?.name} has ${entry?.referenceCount} reference-backed data source item${
          entry?.referenceCount === 1 ? "" : "s"
        }.`
      : `${targetName(target)} needs reference-backed collection data before activation.`
  );
}

export function createFactoryActivationReport(
  target: FactoryActivationTarget
): FactoryActivationReport {
  const entry = resolveFactoryEntry(target);
  const validations = Object.freeze([
    validateFactoryRegistryEntry(target),
    validateFactoryMetadata(target),
    validateFactoryCollections(target),
    validateFactoryDataSource(target),
  ]);
  const blockingIssues = Object.freeze(
    validations
      .filter((validation) => !validation.passed)
      .map((validation) => validation.message)
  );
  const activationState: FactoryActivationState = entry?.factoryLive
    ? "live"
    : blockingIssues.length === 0
      ? "activatable"
      : "blocked";

  if (!entry) {
    return Object.freeze({
      name: targetName(target),
      ...unknownFactoryReportDefaults,
      validations,
      blockingIssues,
    });
  }

  return Object.freeze({
    name: entry.name,
    slug: entry.slug,
    currentState: entry.status,
    activationState,
    factoryLive: entry.factoryLive,
    collectionCount: entry.collectionCount,
    referenceCount: entry.referenceCount,
    canActivate: activationState === "activatable",
    validations,
    blockingIssues,
  });
}

export function canActivateFactory(target: FactoryActivationTarget): boolean {
  return createFactoryActivationReport(target).canActivate;
}

export function getActivatableFactories(): readonly FactoryActivationReport[] {
  return Object.freeze(
    factoryRegistry
      .map((entry) => createFactoryActivationReport(entry))
      .filter((report) => report.canActivate)
  );
}

export function getLiveFactoryNames(): readonly RegisteredFactoryName[] {
  return Object.freeze(getLiveFactories().map((factory) => factory.name));
}

export function getDormantFactoryNames(): readonly RegisteredFactoryName[] {
  return Object.freeze(getDormantFactories().map((factory) => factory.name));
}

export function createFactoryActivationSummary(): FactoryActivationSummary {
  const reports = Object.freeze(
    factoryRegistry.map((entry) => createFactoryActivationReport(entry))
  );
  const activatableFactoryNames = Object.freeze(
    reports
      .filter((report) => report.canActivate)
      .map((report) => report.name)
  );

  return Object.freeze({
    totalFactories: reports.length,
    liveCount: reports.filter((report) => report.activationState === "live")
      .length,
    dormantCount: reports.filter((report) => report.currentState === "dormant")
      .length,
    activatableCount: activatableFactoryNames.length,
    blockedCount: reports.filter((report) => report.activationState === "blocked")
      .length,
    liveFactoryNames: getLiveFactoryNames(),
    dormantFactoryNames: getDormantFactoryNames(),
    activatableFactoryNames,
    reports,
  });
}
