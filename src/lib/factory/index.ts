import type { FactoryBrand } from "./brandFactory";
import { rolexFactory } from "./rolexFactory";

export * from "./audemarsPiguetFactory";
export * from "./audemarsPiguetActivationPlan";
export * from "./breitlingFactory";
export * from "./cartierFactory";
export * from "./collectionGenerator";
export {
  canActivateFactory,
  createFactoryActivationReport,
  createFactoryActivationSummary,
  getActivatableFactories,
  getDormantFactoryNames,
  getLiveFactoryNames,
  validateFactoryCollections,
  validateFactoryDataSource,
  validateFactoryMetadata,
  validateFactoryRegistryEntry,
} from "./factoryActivation";
export type {
  FactoryActivationReport,
  FactoryActivationRequirement,
  FactoryActivationState,
  FactoryActivationSummary,
  FactoryActivationTarget,
  FactoryActivationValidation,
} from "./factoryActivation";
export * from "./factoryGenerator";
export * from "./factoryRegistry";
export * from "./iwcFactory";
export * from "./omegaFactory";
export * from "./paneraiFactory";
export * from "./patekPhilippeFactory";
export * from "./referenceGenerator";
export * from "./tudorFactory";
export * from "./ulysseNardinFactory";

export const liveFactories: FactoryBrand[] = [
  rolexFactory,
];

export function getLiveFactoryBySlug(slug: string): FactoryBrand | undefined {
  return liveFactories.find((factory) => factory.slug === slug);
}

export function isFactoryLive(slug: string): boolean {
  return Boolean(getLiveFactoryBySlug(slug));
}
