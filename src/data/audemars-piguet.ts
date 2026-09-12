import type { QuestLuxoAsset } from "../types/questLuxo";

export type AudemarsPiguetCollectionSlug =
  | "royal-oak"
  | "royal-oak-jumbo"
  | "royal-oak-chronograph"
  | "royal-oak-offshore"
  | "offshore-diver"
  | "code-1159"
  | "royal-oak-concept";

export type AudemarsPiguetAsset = QuestLuxoAsset & {
  brand: "Audemars Piguet";
  collection: string;
  collectionSlug: AudemarsPiguetCollectionSlug;
  seedStatus: "Seed Reference";
};

export interface AudemarsPiguetCollection {
  name: string;
  slug: AudemarsPiguetCollectionSlug;
  category: string;
  status: "Data Seed";
  tagline: string;
  description: string;
  assets: AudemarsPiguetAsset[];
}

export const audemarsPiguetRoyalOakAssets: AudemarsPiguetAsset[] = [
  {
    reference: "15510ST",
    model: "Royal Oak Selfwinding 41mm",
    brand: "Audemars Piguet",
    collection: "Royal Oak",
    collectionSlug: "royal-oak",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "41mm Selfwinding",
        bracelet: "Integrated Bracelet",
        dial: "Blue, Black, Silver, Grey, or Green",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Octagonal Steel",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Modern Royal Oak Selfwinding seed for the core 41mm integrated-bracelet market.",
    liquidity: "Very High",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "The 15510ST should anchor modern Royal Oak discovery for clients who want current-generation AP presence, strong daily wearability, and durable private-market demand.",
    intelligence: {
      collectorDemand: 5,
      liquidity: 5,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 5,
      versatility: 5,
    },
  },
  {
    reference: "16202ST",
    model: "Royal Oak Jumbo Extra-Thin 39mm",
    brand: "Audemars Piguet",
    collection: "Royal Oak",
    collectionSlug: "royal-oak",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Jumbo Extra-Thin",
        bracelet: "Integrated Bracelet",
        dial: "Blue Petite Tapisserie",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Octagonal Steel",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Collector-led Jumbo seed for AP's most recognizable extra-thin Royal Oak format.",
    liquidity: "Very High",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "The 16202ST should sit at the top of Royal Oak launch planning because it carries the strongest Jumbo identity, high allocation pressure, and elite collector recognition.",
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
    reference: "15400ST",
    model: "Royal Oak Selfwinding 41mm",
    brand: "Audemars Piguet",
    collection: "Royal Oak",
    collectionSlug: "royal-oak",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Early 41mm Selfwinding",
        bracelet: "Integrated Bracelet",
        dial: "Blue, Black, White, or Silver",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Octagonal Steel",
    productionStatus: "Discontinued Seed Reference",
    marketPosition:
      "Important discontinued 41mm Royal Oak seed that bridges earlier 39mm proportions and later modern selfwinding references.",
    liquidity: "High",
    allocationDifficulty: "High",
    questLuxoView:
      "The 15400ST gives the AP factory a strong discontinued-market anchor for clients who want a larger Royal Oak with established recognition and broad dial-option appeal.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 4,
      wearability: 4,
      collectability: 4,
      allocationDifficulty: 4,
      versatility: 4,
    },
  },
  {
    reference: "15202ST",
    model: "Royal Oak Jumbo Extra-Thin 39mm",
    brand: "Audemars Piguet",
    collection: "Royal Oak",
    collectionSlug: "royal-oak",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Jumbo Extra-Thin",
        bracelet: "Integrated Bracelet",
        dial: "Blue Petite Tapisserie",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Octagonal Steel",
    productionStatus: "Discontinued Seed Reference",
    marketPosition:
      "Highly collectible discontinued Jumbo seed with strong Royal Oak heritage positioning.",
    liquidity: "Very High",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "The 15202ST should remain a major AP recommendation candidate because it combines Jumbo proportions, discontinued status, and enduring collector demand.",
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
    reference: "15500ST",
    model: "Royal Oak Selfwinding 41mm",
    brand: "Audemars Piguet",
    collection: "Royal Oak",
    collectionSlug: "royal-oak",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "41mm Selfwinding",
        bracelet: "Integrated Bracelet",
        dial: "Blue, Black, Grey, or Silver",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Octagonal Steel",
    productionStatus: "Discontinued Seed Reference",
    marketPosition:
      "Recent discontinued 41mm Royal Oak seed that remains highly visible in the modern secondary market.",
    liquidity: "High",
    allocationDifficulty: "High",
    questLuxoView:
      "The 15500ST is a useful bridge between current-production AP demand and discontinued Royal Oak sourcing, especially for clients comparing value against the 15510ST.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 5,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 4,
      versatility: 5,
    },
  },
  {
    reference: "14790ST",
    model: "Royal Oak Selfwinding 36mm",
    brand: "Audemars Piguet",
    collection: "Royal Oak",
    collectionSlug: "royal-oak",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "36mm Neo-Vintage",
        bracelet: "Integrated Bracelet",
        dial: "Blue, Black, White, or Grey",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Octagonal Steel",
    productionStatus: "Discontinued Seed Reference",
    marketPosition:
      "Neo-vintage Royal Oak seed for smaller-case collectors and clients seeking a more understated AP profile.",
    liquidity: "Medium-High",
    allocationDifficulty: "Medium",
    questLuxoView:
      "The 14790ST expands Royal Oak coverage beyond current hype references, giving Quest Luxo a credible path into neo-vintage AP recommendations.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 3,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 3,
      versatility: 4,
    },
  },
];

export const audemarsPiguetRoyalOakOffshoreAssets: AudemarsPiguetAsset[] = [
  {
    reference: "royal-oak-offshore-chronograph-seed",
    model: "Royal Oak Offshore Chronograph",
    brand: "Audemars Piguet",
    collection: "Royal Oak Offshore",
    collectionSlug: "royal-oak-offshore",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Offshore Chronograph",
        bracelet: "Rubber Strap",
        dial: "Black",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Ceramic or Steel",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Royal Oak Offshore seed for bold AP sport-watch coverage.",
    liquidity: "Medium",
    allocationDifficulty: "Medium",
    questLuxoView:
      "Royal Oak Offshore coverage should help position larger AP sport references, chronographs, and limited-edition demand for private sourcing clients.",
  },
];

export const audemarsPiguetCode1159Assets: AudemarsPiguetAsset[] = [
  {
    reference: "code-1159-chronograph-seed",
    model: "Code 11.59 Chronograph",
    brand: "Audemars Piguet",
    collection: "Code 11.59",
    collectionSlug: "code-1159",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Code 11.59 Chronograph",
        bracelet: "Leather Strap",
        dial: "Gradient",
        originalMSRP: null,
      },
    ],
    material: "18k Gold",
    bezel: "Round Gold",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Code 11.59 seed for AP modern round-watch coverage.",
    liquidity: "Medium",
    allocationDifficulty: "Medium",
    questLuxoView:
      "Code 11.59 coverage should give Quest Luxo a path into AP complications, dress-sport positioning, and clients seeking AP beyond the Royal Oak family.",
  },
];

export const audemarsPiguetRoyalOakConceptAssets: AudemarsPiguetAsset[] = [
  {
    reference: "royal-oak-concept-tourbillon-seed",
    model: "Royal Oak Concept Tourbillon",
    brand: "Audemars Piguet",
    collection: "Royal Oak Concept",
    collectionSlug: "royal-oak-concept",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Concept Tourbillon",
        bracelet: "Rubber Strap",
        dial: "Openworked",
        originalMSRP: null,
      },
    ],
    material: "Titanium or Ceramic",
    bezel: "Concept Case Architecture",
    productionStatus: "Seed Reference",
    marketPosition:
      "Representative Royal Oak Concept seed for AP high-horology coverage.",
    liquidity: "Specialized",
    allocationDifficulty: "Extremely High",
    questLuxoView:
      "Royal Oak Concept coverage should support ultra-technical AP demand, limited-production collecting, and high-value private-market conversations.",
  },
];

export const audemarsPiguetCollections: AudemarsPiguetCollection[] = [
  {
    name: "Royal Oak",
    slug: "royal-oak",
    category: "Integrated Bracelet",
    status: "Data Seed",
    tagline: "The integrated luxury-sport icon.",
    description:
      "Seed coverage for Royal Oak time-only, Jumbo, chronograph, precious-metal, and complication demand.",
    assets: audemarsPiguetRoyalOakAssets,
  },
  {
    name: "Royal Oak Jumbo",
    slug: "royal-oak-jumbo",
    category: "Integrated Bracelet",
    status: "Data Seed",
    tagline: "The extra-thin expression of the Royal Oak.",
    description:
      "Collection-level Royal Oak Jumbo coverage without generating standalone reference records.",
    assets: [],
  },
  {
    name: "Royal Oak Chronograph",
    slug: "royal-oak-chronograph",
    category: "Sport Chronograph",
    status: "Data Seed",
    tagline: "Royal Oak design with chronograph utility.",
    description:
      "Collection-level Royal Oak Chronograph coverage without generating standalone reference records.",
    assets: [],
  },
  {
    name: "Royal Oak Offshore",
    slug: "royal-oak-offshore",
    category: "Sport Chronograph",
    status: "Data Seed",
    tagline: "The bold AP sport-watch platform.",
    description:
      "Seed coverage for oversized Royal Oak Offshore chronographs, divers, limited editions, and private-client sport-watch demand.",
    assets: audemarsPiguetRoyalOakOffshoreAssets,
  },
  {
    name: "Offshore Diver",
    slug: "offshore-diver",
    category: "Professional Dive Watch",
    status: "Data Seed",
    tagline: "The dive-focused Royal Oak Offshore.",
    description:
      "Collection-level Offshore Diver coverage without generating standalone reference records.",
    assets: [],
  },
  {
    name: "Code 11.59",
    slug: "code-1159",
    category: "Modern Complication",
    status: "Data Seed",
    tagline: "Audemars Piguet's modern round-watch architecture.",
    description:
      "Seed coverage for Code 11.59 time-only, chronograph, perpetual calendar, tourbillon, and complicated references.",
    assets: audemarsPiguetCode1159Assets,
  },
  {
    name: "Royal Oak Concept",
    slug: "royal-oak-concept",
    category: "High Horology",
    status: "Data Seed",
    tagline: "Experimental AP high-horology engineering.",
    description:
      "Seed coverage for Royal Oak Concept tourbillon, GMT, split-second, and limited high-complication references.",
    assets: audemarsPiguetRoyalOakConceptAssets,
  },
];

export const audemarsPiguetAssets = audemarsPiguetCollections.flatMap(
  (collection) => collection.assets
);
