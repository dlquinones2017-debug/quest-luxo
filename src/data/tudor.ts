import type { QuestLuxoAsset } from "../types/questLuxo";

export type TudorCollectionSlug = "black-bay" | "pelagos";

export type TudorAsset = QuestLuxoAsset & {
  brand: "Tudor";
  collection: "Black Bay" | "Pelagos";
  collectionSlug: TudorCollectionSlug;
};

export interface TudorCollection {
  name: TudorAsset["collection"];
  slug: TudorCollectionSlug;
  category: string;
  tagline: string;
  description: string;
  assets: TudorAsset[];
}

export const tudorBlackBayAssets: TudorAsset[] = [
  {
    reference: "79030N",
    model: "Black Bay 58",
    brand: "Tudor",
    collection: "Black Bay",
    collectionSlug: "black-bay",
    configurations: [{ nickname: "Black Bay 58 Black", bracelet: "Riveted Steel Bracelet", dial: "Black" }],
    material: "Stainless Steel",
    bezel: "Black Anodized Aluminum Insert",
    productionStatus: "Current Production",
    marketPosition: "A compact, heritage-led Black Bay with broad recognition in Tudor's modern dive-watch range.",
    liquidity: "High",
    allocationDifficulty: "Lower",
    questLuxoView: "The 79030N is a strong entry point for clients who prioritize restrained proportions, recognizable Tudor dive-watch design, and a comparatively broad secondary market.",
  },
  {
    reference: "M7941A1A0NU",
    model: "Black Bay Monochrome",
    brand: "Tudor",
    collection: "Black Bay",
    collectionSlug: "black-bay",
    configurations: [{ nickname: "Black Bay Monochrome", bracelet: "Three-Link Steel Bracelet", dial: "Black" }],
    material: "Stainless Steel",
    bezel: "Black Anodized Aluminum Insert",
    productionStatus: "Current Production",
    marketPosition: "A current-generation 41 mm Black Bay with monochrome styling and METAS-certified manufacture movement.",
    liquidity: "High",
    allocationDifficulty: "Moderate",
    questLuxoView: "The Monochrome is best approached as a configuration-specific modern Black Bay: bracelet choice, condition, completeness, and acquisition basis matter more than launch novelty alone.",
  },
];

export const tudorPelagosAssets: TudorAsset[] = [
  {
    reference: "M25407N",
    model: "Pelagos 39",
    brand: "Tudor",
    collection: "Pelagos",
    collectionSlug: "pelagos",
    configurations: [{ nickname: "Pelagos 39", bracelet: "Grade 2 Titanium Bracelet", dial: "Black" }],
    material: "Grade 2 Titanium",
    bezel: "Titanium with Black Ceramic Insert",
    productionStatus: "Current Production",
    marketPosition: "A compact titanium Pelagos that blends professional dive-watch construction with everyday proportions.",
    liquidity: "High",
    allocationDifficulty: "Lower",
    questLuxoView: "The Pelagos 39 is compelling for clients who want low weight and modern dive-watch utility, provided the titanium finish, clasp, accessories, and water-use readiness are assessed carefully.",
  },
];

export const tudorCollections: TudorCollection[] = [
  {
    name: "Black Bay",
    slug: "black-bay",
    category: "Heritage Dive Watch",
    tagline: "Tudor's heritage-led modern dive-watch platform.",
    description: "Launch coverage for the compact Black Bay 58 and current Black Bay Monochrome.",
    assets: tudorBlackBayAssets,
  },
  {
    name: "Pelagos",
    slug: "pelagos",
    category: "Professional Dive Watch",
    tagline: "Tudor's titanium professional dive-watch family.",
    description: "Launch coverage centered on the compact titanium Pelagos 39.",
    assets: tudorPelagosAssets,
  },
];

export const tudorAssets = tudorCollections.flatMap((collection) => collection.assets);
