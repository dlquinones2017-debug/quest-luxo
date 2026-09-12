import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { audemarsPiguetFactory } from "./audemarsPiguetFactory";
import { breitlingFactory } from "./breitlingFactory";
import { cartierFactory } from "./cartierFactory";
import { iwcFactory } from "./iwcFactory";
import { omegaFactory } from "./omegaFactory";
import { paneraiFactory } from "./paneraiFactory";
import { patekPhilippeFactory } from "./patekPhilippeFactory";
import { rolexFactory } from "./rolexFactory";
import { tudorFactory } from "./tudorFactory";
import { ulysseNardinFactory } from "./ulysseNardinFactory";

import { bellRossFactory } from "./bellRossFactory";

export const registeredFactoryNames = [
  "Bell & Ross",
  "Rolex",
  "Audemars Piguet",
  "Patek Philippe",
  "Omega",
  "Panerai",
  "Breitling",
  "Cartier",
  "IWC",
  "Tudor",
  "Ulysse Nardin",
] as const;

export const futureFactoryNames = [
  "Vacheron Constantin",
  "A. Lange & S\u00f6hne",
  "F.P. Journe",
  "Richard Mille",
  "Grand Seiko",
  "Jaeger-LeCoultre",
] as const;

export type RegisteredFactoryName = (typeof registeredFactoryNames)[number];
export type FutureFactoryName = (typeof futureFactoryNames)[number];
export type FactoryRegistryStatus = "live" | "dormant";
export type FactoryLookupKey = RegisteredFactoryName | string;

export type ReadonlyFactoryCollection = Readonly<FactoryCollection>;

export type ReadonlyFactoryBrand = Readonly<
  Omit<FactoryBrand, "collections"> & {
    collections: readonly ReadonlyFactoryCollection[];
  }
>;

export interface FactoryRegistryEntry {
  readonly name: RegisteredFactoryName;
  readonly slug: string;
  readonly status: FactoryRegistryStatus;
  readonly factoryLive: boolean;
  readonly launchPhase: FactoryBrand["launchPhase"];
  readonly collectionCount: number;
  readonly referenceCount: number;
  readonly factory: ReadonlyFactoryBrand;
}

export interface FactoryRegistryMetadata {
  readonly totalCount: number;
  readonly liveCount: number;
  readonly dormantCount: number;
  readonly registeredFactoryNames: readonly RegisteredFactoryName[];
  readonly futureFactoryNames: readonly FutureFactoryName[];
}

const freezeCollection = (
  collection: FactoryCollection
): ReadonlyFactoryCollection => Object.freeze({ ...collection });

const freezeFactory = (factory: FactoryBrand): ReadonlyFactoryBrand =>
  Object.freeze({
    ...factory,
    collections: Object.freeze(factory.collections.map(freezeCollection)),
  });

const getReferenceCount = (factory: ReadonlyFactoryBrand): number =>
  factory.collections.reduce(
    (total, collection) => total + (collection.assetCount ?? 0),
    0
  );

const createRegistryEntry = (
  name: RegisteredFactoryName,
  factory: FactoryBrand
): FactoryRegistryEntry => {
  const frozenFactory = freezeFactory(factory);

  return Object.freeze({
    name,
    slug: frozenFactory.slug,
    status: frozenFactory.factoryLive ? "live" : "dormant",
    factoryLive: frozenFactory.factoryLive,
    launchPhase: frozenFactory.launchPhase,
    collectionCount: frozenFactory.collections.length,
    referenceCount: getReferenceCount(frozenFactory),
    factory: frozenFactory,
  });
};

const normalizeFactoryKey = (name: string): string =>
  name.trim().toLowerCase();

export const factoryRegistry = Object.freeze([
  createRegistryEntry("Bell & Ross", bellRossFactory),
  createRegistryEntry("Rolex", rolexFactory),
  createRegistryEntry("Audemars Piguet", audemarsPiguetFactory),
  createRegistryEntry("Patek Philippe", patekPhilippeFactory),
  createRegistryEntry("Omega", omegaFactory),
  createRegistryEntry("Panerai", paneraiFactory),
  createRegistryEntry("Breitling", breitlingFactory),
  createRegistryEntry("Cartier", cartierFactory),
  createRegistryEntry("IWC", iwcFactory),
  createRegistryEntry("Tudor", tudorFactory),
  createRegistryEntry("Ulysse Nardin", ulysseNardinFactory),
] satisfies readonly FactoryRegistryEntry[]);

export const factoryRegistryMetadata: FactoryRegistryMetadata = Object.freeze({
  totalCount: factoryRegistry.length,
  liveCount: factoryRegistry.filter((entry) => entry.status === "live").length,
  dormantCount: factoryRegistry.filter((entry) => entry.status === "dormant")
    .length,
  registeredFactoryNames,
  futureFactoryNames,
});

export function getFactory(
  name: FactoryLookupKey
): FactoryRegistryEntry | undefined {
  const lookupKey = normalizeFactoryKey(name);

  return factoryRegistry.find(
    (entry) =>
      normalizeFactoryKey(entry.name) === lookupKey ||
      normalizeFactoryKey(entry.slug) === lookupKey
  );
}

export function getLiveFactories(): readonly FactoryRegistryEntry[] {
  return factoryRegistry.filter((entry) => entry.status === "live");
}

export function getDormantFactories(): readonly FactoryRegistryEntry[] {
  return factoryRegistry.filter((entry) => entry.status === "dormant");
}

export function getFactoryNames(): readonly RegisteredFactoryName[] {
  return registeredFactoryNames;
}

export function hasFactory(name: FactoryLookupKey): boolean {
  return Boolean(getFactory(name));
}

export function getFactoryMetadata(): FactoryRegistryMetadata {
  return factoryRegistryMetadata;
}
