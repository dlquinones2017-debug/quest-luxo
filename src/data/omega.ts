import type { QuestLuxoAsset } from "../types/questLuxo";

export type OmegaCollectionSlug =
  | "speedmaster"
  | "seamaster"
  | "planet-ocean"
  | "aqua-terra"
  | "constellation"
  | "de-ville"
  | "railmaster";

export type OmegaAsset = QuestLuxoAsset & {
  brand: "Omega";
  collection: string;
  collectionSlug: OmegaCollectionSlug;
  seedStatus: "Placeholder Seed" | "Seed Reference";
};

export interface OmegaCollection {
  name: string;
  slug: OmegaCollectionSlug;
  category: string;
  status: "Placeholder Seed" | "Data Seed";
  tagline: string;
  description: string;
  assets: OmegaAsset[];
}

export const omegaSpeedmasterAssets: OmegaAsset[] = [
  {
    reference: "310.30.42.50.01.002",
    model: "Speedmaster Moonwatch Professional 3861 Sapphire",
    brand: "Omega",
    collection: "Speedmaster",
    collectionSlug: "speedmaster",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "3861 Moonwatch Sapphire",
        bracelet: "Stainless Steel Bracelet",
        dial: "Black",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Black Anodized Aluminum Tachymeter",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Modern Sapphire Sandwich Moonwatch seed for clients seeking the current-production Speedmaster with applied logo, display caseback, and polished bracelet details.",
    liquidity: "High",
    allocationDifficulty: "Medium",
    questLuxoView:
      "The 310.30.42.50.01.002 should anchor Speedmaster launch planning because it is the cleanest current-generation bridge between daily-wear utility, Moonwatch heritage, and modern finishing.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 4,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 3,
      versatility: 5,
    },
  },
  {
    reference: "310.30.42.50.01.001",
    model: "Speedmaster Moonwatch Professional 3861 Hesalite",
    brand: "Omega",
    collection: "Speedmaster",
    collectionSlug: "speedmaster",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "3861 Moonwatch Hesalite",
        bracelet: "Stainless Steel Bracelet",
        dial: "Black",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Black Anodized Aluminum Tachymeter",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Current Hesalite Moonwatch seed for clients prioritizing NASA-linked visual character, warm crystal distortion, and classic Speedmaster feel.",
    liquidity: "High",
    allocationDifficulty: "Medium",
    questLuxoView:
      "The 310.30.42.50.01.001 gives Quest Luxo the purist current-production Moonwatch lane, balancing access, heritage credibility, and practical everyday wear.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 4,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 3,
      versatility: 5,
    },
  },
  {
    reference: "311.30.42.30.01.005",
    model: "Speedmaster Moonwatch Professional 1861 Hesalite",
    brand: "Omega",
    collection: "Speedmaster",
    collectionSlug: "speedmaster",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "1861 Moonwatch",
        bracelet: "Stainless Steel Bracelet",
        dial: "Black",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Black Anodized Aluminum Tachymeter",
    productionStatus: "Discontinued Seed Reference",
    marketPosition:
      "Discontinued Moonwatch seed for clients comparing pre-3861 Speedmaster value, older bracelet feel, and long-running modern Moonwatch recognition.",
    liquidity: "High",
    allocationDifficulty: "Medium",
    questLuxoView:
      "The 311.30.42.30.01.005 is an important discontinued-market anchor because it remains widely understood, liquid, and useful for clients who want a classic Moonwatch below newer-generation pricing.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 4,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 3,
      versatility: 5,
    },
  },
  {
    reference: "310.33.42.50.01.002",
    model: "Speedmaster Moonwatch Professional 3861 Sapphire Strap",
    brand: "Omega",
    collection: "Speedmaster",
    collectionSlug: "speedmaster",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "3861 Moonwatch Sapphire Strap",
        bracelet: "Leather Strap",
        dial: "Black",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Black Anodized Aluminum Tachymeter",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Current Sapphire Moonwatch strap seed for clients seeking the display-back 3861 platform with a dressier, lighter-wearing configuration.",
    liquidity: "Medium-High",
    allocationDifficulty: "Medium",
    questLuxoView:
      "The 310.33.42.50.01.002 helps separate bracelet demand from strap-led Speedmaster clients and gives the Omega factory a practical advisory lane for slimmer, less sporty wear.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 4,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 3,
      versatility: 5,
    },
  },
  {
    reference: "310.32.42.50.01.001",
    model: "Speedmaster Moonwatch Professional 3861 Hesalite Strap",
    brand: "Omega",
    collection: "Speedmaster",
    collectionSlug: "speedmaster",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "3861 Moonwatch Hesalite Strap",
        bracelet: "Nylon Strap",
        dial: "Black",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Black Anodized Aluminum Tachymeter",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "Current Hesalite Moonwatch strap seed for clients who want the most traditional 3861 Moonwatch expression without bracelet weight or polished bracelet finishing.",
    liquidity: "Medium-High",
    allocationDifficulty: "Medium",
    questLuxoView:
      "The 310.32.42.50.01.001 broadens Speedmaster discovery for clients who value tool-watch restraint, NASA-adjacent character, and simple strap versatility.",
    intelligence: {
      collectorDemand: 4,
      liquidity: 4,
      wearability: 5,
      collectability: 4,
      allocationDifficulty: 3,
      versatility: 5,
    },
  },
  {
    reference: "310.32.42.50.02.001",
    model: "Speedmaster Silver Snoopy Award 50th Anniversary",
    brand: "Omega",
    collection: "Speedmaster",
    collectionSlug: "speedmaster",
    seedStatus: "Seed Reference",
    configurations: [
      {
        nickname: "Silver Snoopy Award 50th Anniversary",
        bracelet: "Blue Nylon Strap",
        dial: "Silver",
        originalMSRP: null,
      },
    ],
    material: "Stainless Steel",
    bezel: "Blue Ceramic Tachymeter",
    productionStatus: "Current-Generation Seed Reference",
    marketPosition:
      "High-demand Silver Snoopy seed for collectible Speedmaster clients seeking special-edition storytelling, animation caseback appeal, and stronger allocation pressure.",
    liquidity: "Very High",
    allocationDifficulty: "High",
    questLuxoView:
      "The 310.32.42.50.02.001 gives the Omega factory a collector-led Speedmaster lane with stronger scarcity signals and emotional demand than standard Moonwatch references.",
    intelligence: {
      collectorDemand: 5,
      liquidity: 5,
      wearability: 4,
      collectability: 5,
      allocationDifficulty: 4,
      versatility: 4,
    },
  },
];

export const omegaSeamasterAssets: OmegaAsset[] = [];

export const omegaPlanetOceanAssets: OmegaAsset[] = [];

export const omegaAquaTerraAssets: OmegaAsset[] = [];

export const omegaConstellationAssets: OmegaAsset[] = [];

export const omegaDeVilleAssets: OmegaAsset[] = [];

export const omegaRailmasterAssets: OmegaAsset[] = [];

export const omegaCollections: OmegaCollection[] = [
  {
    name: "Speedmaster",
    slug: "speedmaster",
    category: "Chronograph",
    status: "Data Seed",
    tagline: "Omega's moonwatch and chronograph platform.",
    description:
      "Seed coverage for current and discontinued Moonwatch references, Sapphire and Hesalite configurations, and collectible Speedmaster special-edition demand.",
    assets: omegaSpeedmasterAssets,
  },
  {
    name: "Seamaster Diver 300M",
    slug: "seamaster",
    category: "Dive Watch",
    status: "Placeholder Seed",
    tagline: "Omega's professional dive-watch family.",
    description:
      "Launch-quality collection coverage for the Seamaster Diver 300M, with reference-specific guidance retained for existing priority models.",
    assets: omegaSeamasterAssets,
  },
  {
    name: "Seamaster Planet Ocean",
    slug: "planet-ocean",
    category: "Professional Dive Watch",
    status: "Placeholder Seed",
    tagline: "Omega's deeper-rated modern dive-watch platform.",
    description:
      "Collection-level coverage for Planet Ocean sizing, materials, movement generations, and professional dive-watch ownership without placeholder references.",
    assets: omegaPlanetOceanAssets,
  },
  {
    name: "Aqua Terra",
    slug: "aqua-terra",
    category: "Everyday Sport",
    status: "Placeholder Seed",
    tagline: "Omega's versatile daily sport-watch platform.",
    description:
      "Placeholder structure for future Aqua Terra coverage across daily wear, teak dials, and refined sport-watch demand.",
    assets: omegaAquaTerraAssets,
  },
  {
    name: "Constellation",
    slug: "constellation",
    category: "Dress Sport",
    status: "Placeholder Seed",
    tagline: "Omega's integrated dress-sport signature.",
    description:
      "Placeholder structure for future Constellation coverage across Manhattan, heritage, bracelet, and precious-metal demand.",
    assets: omegaConstellationAssets,
  },
  {
    name: "De Ville",
    slug: "de-ville",
    category: "Dress Watch",
    status: "Placeholder Seed",
    tagline: "Omega's formal and complicated dress-watch line.",
    description:
      "Placeholder structure for future De Ville coverage across dress, chronometer, annual calendar, and elegant client demand.",
    assets: omegaDeVilleAssets,
  },
  {
    name: "Railmaster",
    slug: "railmaster",
    category: "Tool Watch",
    status: "Placeholder Seed",
    tagline: "Omega's anti-magnetic heritage tool watch.",
    description:
      "Placeholder structure for future Railmaster coverage across heritage tool-watch and understated collector demand.",
    assets: omegaRailmasterAssets,
  },
];

export const omegaAssets = omegaCollections.flatMap(
  (collection) => collection.assets
);
