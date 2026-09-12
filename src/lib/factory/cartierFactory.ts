import { cartierSantosReferenceAssets } from "../../data/brands/cartier/santos";
import { cartierSantosLaunchAssets, cartierTankLaunchAssets } from "../../data/cartier-intelligence";
import { cartierBrandFoundation } from "../../data/brands/cartier";
import type { FactoryBrand, FactoryCollection } from "./brandFactory";
import { getFactoryCollectionPath } from "./brandFactory";
import { buildBrandFactoryScaffoldMetadata } from "./factoryGenerator";
import { getExpansionReferences } from "../../data/reference-expansion";

const cartierLaunchIntelligenceSlugs = new Set(["santos", "tank", "ballon-bleu", "pasha"]);

export const cartierFactoryCollections: FactoryCollection[] = cartierBrandFoundation.collections.map((collection) => ({
  name: collection.name,
  slug: collection.slug,
  category: collection.category,
  status: cartierLaunchIntelligenceSlugs.has(collection.slug) ? "Factory Scaffold - Launch Intelligence Ready" : collection.status,
  tagline: collection.tagline,
  description: collection.description,
  assetCount: collection.slug === "santos" ? cartierSantosReferenceAssets.length + cartierSantosLaunchAssets.length : collection.slug === "tank" ? cartierTankLaunchAssets.length + getExpansionReferences("cartier", "tank").length : collection.assetCount + getExpansionReferences("cartier", collection.slug).length,
}));

export const cartierFactory: FactoryBrand = { name: "Cartier", slug: "cartier", factoryLive: false, launchPhase: "v2", collections: cartierFactoryCollections };

export const cartierFactoryScaffold = buildBrandFactoryScaffoldMetadata({ brand: { name: cartierFactory.name, slug: cartierFactory.slug, factoryLive: cartierFactory.factoryLive, launchPhase: cartierFactory.launchPhase }, collections: cartierFactory.collections });

export function getCartierFactoryCollection(slug: string): FactoryCollection | undefined { return cartierFactory.collections.find((collection) => collection.slug === slug); }
export function getCartierFactoryCollectionPath(slug: string): string { return getFactoryCollectionPath(cartierFactory.slug, slug); }
