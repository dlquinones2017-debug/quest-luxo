import type { FactoryBrand } from "./brandFactory";
import { rolexRegistry } from "../../data/rolex";

export const rolexFactory: FactoryBrand = {
  name: "Rolex",
  slug: "rolex",
  factoryLive: true,
  launchPhase: "v1",
  collections: rolexRegistry.map((collection) => ({
    name: collection.name,
    slug: collection.slug,
    category: collection.category,
    status: collection.status,
    tagline: collection.tagline,
    description: collection.description,
    assetCount: collection.assets.length,
  })),
};