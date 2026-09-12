import type { QuestLuxoAsset } from "../types/questLuxo";

export type PatekPhilippeCollectionSlug =
  | "nautilus"
  | "aquanaut"
  | "calatrava"
  | "cubitus"
  | "grand-complications"
  | "complications"
  | "golden-ellipse"
  | "twenty-4";

export type PatekPhilippeAsset = QuestLuxoAsset & {
  brand: "Patek Philippe";
  collection: string;
  collectionSlug: PatekPhilippeCollectionSlug;
  seedStatus: "Seed Reference";
};

export interface PatekPhilippeCollection {
  name: string;
  slug: PatekPhilippeCollectionSlug;
  category: string;
  status: "Data Seed";
  tagline: string;
  description: string;
  assets: PatekPhilippeAsset[];
}

export const patekPhilippeNautilusAssets: PatekPhilippeAsset[] = [
  {
    reference: "5711/1A",
    model: "Nautilus 5711/1A",
    brand: "Patek Philippe",
    collection: "Nautilus",
    collectionSlug: "nautilus",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Steel Nautilus",
        bracelet: "Integrated Bracelet",
        dial: "Blue",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Rounded Octagonal Steel",
    productionStatus: "Discontinued Seed Reference",
    marketPosition:
      "The benchmark discontinued steel Nautilus seed for high-demand private-market Patek coverage.",
    liquidity: "Very High",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "The 5711/1A should anchor Nautilus launch planning because it carries the strongest modern Nautilus recognition, elite collector demand, and deep private-market liquidity.",
    intelligence: {
      collectorDemand: 5,
      liquidity: 5,
      wearability: 5,
      collectability: 5,
      allocationDifficulty: 5,
      versatility: 4,
    },
  },
  {
    reference: "5811/1G",
    model: "Nautilus 5811/1G",
    brand: "Patek Philippe",
    collection: "Nautilus",
    collectionSlug: "nautilus",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "White Gold Nautilus",
        bracelet: "Integrated Bracelet",
        dial: "Blue",
        originalMSRP: null,
      },
    ],
    material: "White Gold",
    bezel: "Rounded Octagonal White Gold",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Current-generation precious-metal Nautilus seed for modern sport-luxury Patek allocation demand.",
    liquidity: "High",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "The 5811/1G gives Quest Luxo a current-production Nautilus anchor for clients comparing modern Patek allocation, precious-metal presence, and post-5711 collecting.",
    intelligence: {
      collectorDemand: 5,
      liquidity: 4,
      wearability: 4,
      collectability: 5,
      allocationDifficulty: 5,
      versatility: 4,
    },
  },
  {
    reference: "5712/1A",
    model: "Nautilus Moon Phase 5712/1A",
    brand: "Patek Philippe",
    collection: "Nautilus",
    collectionSlug: "nautilus",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Moon Phase",
        bracelet: "Integrated Bracelet",
        dial: "Blue",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Rounded Octagonal Steel",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Complication-led steel Nautilus seed for clients seeking sport-luxury Patek with asymmetrical dial identity.",
    liquidity: "Very High",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "The 5712/1A strengthens Nautilus coverage beyond time-only demand with moon phase, power reserve, and small seconds appeal in one of Patek's most recognizable steel formats.",
    intelligence: {
      collectorDemand: 5,
      liquidity: 5,
      wearability: 4,
      collectability: 5,
      allocationDifficulty: 5,
      versatility: 4,
    },
  },
  {
    reference: "5990/1A",
    model: "Nautilus Travel Time Chronograph 5990/1A",
    brand: "Patek Philippe",
    collection: "Nautilus",
    collectionSlug: "nautilus",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Travel Time Chronograph",
        bracelet: "Integrated Bracelet",
        dial: "Blue or Grey",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Rounded Octagonal Steel",
    productionStatus: "Discontinued Seed Reference",
    marketPosition:
      "High-utility complicated steel Nautilus seed for travel time and chronograph collector demand.",
    liquidity: "High",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "The 5990/1A gives the Patek factory a heavier sport-complication lane for clients who want Nautilus status with practical travel and chronograph utility.",
    intelligence: {
      collectorDemand: 5,
      liquidity: 4,
      wearability: 4,
      collectability: 5,
      allocationDifficulty: 5,
      versatility: 4,
    },
  },
  {
    reference: "5980/1A",
    model: "Nautilus Chronograph 5980/1A",
    brand: "Patek Philippe",
    collection: "Nautilus",
    collectionSlug: "nautilus",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Chronograph",
        bracelet: "Integrated Bracelet",
        dial: "Blue or White",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Rounded Octagonal Steel",
    productionStatus: "Discontinued Seed Reference",
    marketPosition:
      "Discontinued steel Nautilus chronograph seed with strong sport-complication recognition.",
    liquidity: "High",
    allocationDifficulty: "High",
    questLuxoView:
      "The 5980/1A broadens Nautilus coverage into chronograph demand and helps compare older steel sport-complication appeal against newer travel-time references.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 4,
      wearability: 4,
      collectability: 5,
      allocationDifficulty: 4,
      versatility: 4,
    },
  },
  {
    reference: "5726/1A",
    model: "Nautilus Annual Calendar 5726/1A",
    brand: "Patek Philippe",
    collection: "Nautilus",
    collectionSlug: "nautilus",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Annual Calendar",
        bracelet: "Integrated Bracelet",
        dial: "Blue, Grey, or White",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Rounded Octagonal Steel",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Annual calendar Nautilus seed for clients seeking practical Patek complication value inside the Nautilus case.",
    liquidity: "High",
    allocationDifficulty: "High",
    questLuxoView:
      "The 5726/1A adds an annual-calendar advisory lane to Nautilus discovery, balancing everyday wear with genuine Patek complication credibility.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 4,
      wearability: 4,
      collectability: 4,
      allocationDifficulty: 4,
      versatility: 4,
    },
  },
];

export const patekPhilippeAquanautAssets: PatekPhilippeAsset[] = [
  {
    reference: "aquanaut-5167a-seed",
    model: "Aquanaut 5167A",
    brand: "Patek Philippe",
    collection: "Aquanaut",
    collectionSlug: "aquanaut",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Steel Aquanaut",
        bracelet: "Tropical Strap",
        dial: "Embossed Black",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Rounded Octagonal Steel",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Aquanaut seed for modern casual Patek sport-watch demand.",
    liquidity: "Very High",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "Aquanaut should follow Nautilus in the Patek launch order because it broadens private-client demand into casual, wearable, and younger-collector Patek positioning.",
    intelligence: {
      collectorDemand: 5,
      liquidity: 5,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 5,
      versatility: 5,
    },
  },
];

export const patekPhilippeCalatravaAssets: PatekPhilippeAsset[] = [
  {
    reference: "calatrava-5227-seed",
    model: "Calatrava 5227",
    brand: "Patek Philippe",
    collection: "Calatrava",
    collectionSlug: "calatrava",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Officer Caseback Calatrava",
        bracelet: "Leather Strap",
        dial: "Cream or Black",
        originalMSRP: null,
      },
    ],
    material: "18k Gold",
    bezel: "Polished Gold",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Calatrava seed for dress-watch heritage and classic Patek coverage.",
    liquidity: "Medium",
    allocationDifficulty: "Medium",
    questLuxoView:
      "Calatrava coverage should support clients seeking understated Patek heritage, dress-watch elegance, and lower-noise private sourcing than sport models.",
  },
];

export const patekPhilippeCubitusAssets: PatekPhilippeAsset[] = [];

export const patekPhilippeGrandComplicationsAssets: PatekPhilippeAsset[] = [
  {
    reference: "grand-complications-perpetual-calendar-seed",
    model: "Grand Complications Perpetual Calendar",
    brand: "Patek Philippe",
    collection: "Grand Complications",
    collectionSlug: "grand-complications",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Perpetual Calendar",
        bracelet: "Leather Strap",
        dial: "Blue or Silver",
        originalMSRP: null,
      },
    ],
    material: "Precious Metal",
    bezel: "Polished Precious Metal",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Grand Complications seed for elite calendar, chiming, and high-horology Patek coverage.",
    liquidity: "Specialized",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "Grand Complications coverage should remain dormant until the Patek factory is ready for high-value advisory content and specialized collector sourcing.",
  },
];

export const patekPhilippeComplicationsAssets: PatekPhilippeAsset[] = [
  {
    reference: "complications-annual-calendar-seed",
    model: "Complications Annual Calendar",
    brand: "Patek Philippe",
    collection: "Complications",
    collectionSlug: "complications",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Annual Calendar",
        bracelet: "Leather Strap",
        dial: "Silver or Blue",
        originalMSRP: null,
      },
    ],
    material: "Precious Metal",
    bezel: "Polished Precious Metal",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Complications seed for annual calendar, travel time, and chronograph Patek demand.",
    liquidity: "Medium",
    allocationDifficulty: "High",
    questLuxoView:
      "Complications coverage should give Quest Luxo a future path into practical Patek high watchmaking beyond the sport-watch launch sequence.",
  },
];

export const patekPhilippeGoldenEllipseAssets: PatekPhilippeAsset[] = [
  {
    reference: "golden-ellipse-seed",
    model: "Golden Ellipse",
    brand: "Patek Philippe",
    collection: "Golden Ellipse",
    collectionSlug: "golden-ellipse",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Ellipse",
        bracelet: "Leather Strap",
        dial: "Blue Gold",
        originalMSRP: null,
      },
    ],
    material: "18k Gold",
    bezel: "Elliptical Gold",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Golden Ellipse seed for design-led Patek dress coverage.",
    liquidity: "Specialized",
    allocationDifficulty: "Medium",
    questLuxoView:
      "Golden Ellipse coverage should remain a later factory lane for clients drawn to Patek design history rather than sport allocation pressure.",
  },
];

export const patekPhilippeTwenty4Assets: PatekPhilippeAsset[] = [
  {
    reference: "twenty-4-seed",
    model: "Twenty~4",
    brand: "Patek Philippe",
    collection: "Twenty~4",
    collectionSlug: "twenty-4",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Twenty~4",
        bracelet: "Integrated Bracelet",
        dial: "Blue, Grey, or Silver",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel or Gold",
    bezel: "Gem-Set or Polished",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Twenty~4 seed for Patek bracelet-watch and client gifting coverage.",
    liquidity: "Medium",
    allocationDifficulty: "Medium",
    questLuxoView:
      "Twenty~4 coverage should support future Patek discovery for clients seeking refined daily wear, bracelet watches, and non-sport Patek entry points.",
  },
];

export const patekPhilippeCollections: PatekPhilippeCollection[] = [
  {
    name: "Nautilus",
    slug: "nautilus",
    category: "Integrated Bracelet",
    status: "Data Seed",
    tagline: "The Patek luxury-sport benchmark.",
    description:
      "Seed coverage for Nautilus steel, precious-metal, discontinued, and current-era private-market demand.",
    assets: patekPhilippeNautilusAssets,
  },
  {
    name: "Aquanaut",
    slug: "aquanaut",
    category: "Sport Watch",
    status: "Data Seed",
    tagline: "The casual Patek sport-watch platform.",
    description:
      "Seed coverage for Aquanaut steel, travel time, tropical strap, and modern casual Patek demand.",
    assets: patekPhilippeAquanautAssets,
  },
  {
    name: "Calatrava",
    slug: "calatrava",
    category: "Dress Watch",
    status: "Data Seed",
    tagline: "Classic Patek Philippe dress-watch design.",
    description:
      "Seed coverage for Calatrava heritage, precious-metal dress watches, and understated private sourcing.",
    assets: patekPhilippeCalatravaAssets,
  },
  {
    name: "Cubitus",
    slug: "cubitus",
    category: "Contemporary Sport",
    status: "Data Seed",
    tagline: "Patek Philippe's contemporary square-format collection.",
    description:
      "Collection-level Cubitus coverage for configuration, wearability, ownership, and developing market context without placeholder references.",
    assets: patekPhilippeCubitusAssets,
  },
  {
    name: "Grand Complications",
    slug: "grand-complications",
    category: "High Horology",
    status: "Data Seed",
    tagline: "Patek Philippe's highest complication tier.",
    description:
      "Seed coverage for perpetual calendars, chiming watches, split-seconds, and elite collector demand.",
    assets: patekPhilippeGrandComplicationsAssets,
  },
  {
    name: "Complications",
    slug: "complications",
    category: "Complication",
    status: "Data Seed",
    tagline: "Practical Patek Philippe high watchmaking.",
    description:
      "Seed coverage for annual calendars, travel time, chronographs, and practical complications.",
    assets: patekPhilippeComplicationsAssets,
  },
  {
    name: "Golden Ellipse",
    slug: "golden-ellipse",
    category: "Design Icon",
    status: "Data Seed",
    tagline: "A design-led Patek dress-watch signature.",
    description:
      "Seed coverage for Golden Ellipse design history, precious metal, and specialized collector demand.",
    assets: patekPhilippeGoldenEllipseAssets,
  },
  {
    name: "Twenty~4",
    slug: "twenty-4",
    category: "Bracelet Watch",
    status: "Data Seed",
    tagline: "Refined daily Patek bracelet-watch coverage.",
    description:
      "Seed coverage for Twenty~4 daily wear, gifting, bracelet formats, and non-sport Patek discovery.",
    assets: patekPhilippeTwenty4Assets,
  },
];

export const patekPhilippeAssets = patekPhilippeCollections.flatMap(
  (collection) => collection.assets
);
