import type { FactoryBrand } from "./brandFactory";
import { bellRossCollections } from "../../data/bell-and-ross";
export const bellRossFactory: FactoryBrand = {
  name: "Bell & Ross", slug: "bell-and-ross", factoryLive: false, launchPhase: "v1",
  collections: bellRossCollections.map(c => ({ name: c.name, slug: c.slug, category: "Square instrument watches", status: "Intelligence coverage; photography and editorial acceptance pending", tagline: c.description, description: c.description, assetCount: c.assets.length })),
};
