import type { QuestLuxoAsset } from "../types/questLuxo";

export type BreitlingCollectionSlug = "navitimer" | "chronomat";

export type BreitlingAsset = QuestLuxoAsset & {
  brand: "Breitling";
  collection: "Navitimer" | "Chronomat";
  collectionSlug: BreitlingCollectionSlug;
};

export interface BreitlingCollection {
  name: BreitlingAsset["collection"];
  slug: BreitlingCollectionSlug;
  category: string;
  tagline: string;
  description: string;
  assets: BreitlingAsset[];
}

export const breitlingNavitimerAssets: BreitlingAsset[] = [
  {
    reference: "AB0138211B1A1",
    model: "Navitimer B01 Chronograph 43",
    brand: "Breitling",
    collection: "Navitimer",
    collectionSlug: "navitimer",
    configurations: [{ nickname: "B01 Chronograph 43 Black", bracelet: "Stainless Steel Navitimer Bracelet", dial: "Black" }],
    material: "Stainless Steel",
    bezel: "Bidirectional Slide Rule",
    productionStatus: "Current Production",
    marketPosition: "A current 43 mm manufacture-calibre expression of Breitling's signature aviation chronograph.",
    liquidity: "Moderate",
    allocationDifficulty: "Lower",
    questLuxoView: "The AB0138211B1A1 is best evaluated as a complete, configuration-specific modern Navitimer: fit, dial condition, bracelet completeness, service evidence, and acquisition basis should lead the decision.",
  },
  {
    reference: "A17329171C1A1",
    model: "Navitimer Automatic 41",
    brand: "Breitling",
    collection: "Navitimer",
    collectionSlug: "navitimer",
    configurations: [{ nickname: "Automatic 41 Blue", bracelet: "Stainless Steel Navitimer Bracelet", dial: "Blue" }],
    material: "Stainless Steel",
    bezel: "Bidirectional Slide Rule",
    productionStatus: "Current Production",
    marketPosition: "A time-and-date Navitimer that preserves the slide-rule identity in a slimmer 41 mm format.",
    liquidity: "Moderate",
    allocationDifficulty: "Lower",
    questLuxoView: "The A17329171C1A1 suits clients who want Navitimer design without a chronograph, provided its water-resistance limits, movement platform, bracelet, and market position are understood.",
  },
];

export const breitlingChronomatAssets: BreitlingAsset[] = [
  {
    reference: "AB0134101B1A1",
    model: "Chronomat B01 42",
    brand: "Breitling",
    collection: "Chronomat",
    collectionSlug: "chronomat",
    configurations: [{ nickname: "Chronomat B01 42 Black", bracelet: "Stainless Steel Rouleaux Bracelet", dial: "Black" }],
    material: "Stainless Steel",
    bezel: "Unidirectional Ratcheted Bezel with Rider Tabs",
    productionStatus: "Current Production",
    marketPosition: "A robust 42 mm manufacture chronograph combining Chronomat rider-tab design, Rouleaux bracelet, and 200 m specification.",
    liquidity: "Moderate",
    allocationDifficulty: "Lower",
    questLuxoView: "The AB0134101B1A1 is a capable all-purpose chronograph when its substantial proportions, polished surfaces, bracelet condition, service state, and realistic secondary-market basis align with the client.",
  },
];

export const breitlingCollections: BreitlingCollection[] = [
  {
    name: "Navitimer",
    slug: "navitimer",
    category: "Aviation Watch",
    tagline: "Breitling's slide-rule aviation icon.",
    description: "Launch coverage for the B01 Chronograph 43 and the time-and-date Automatic 41.",
    assets: breitlingNavitimerAssets,
  },
  {
    name: "Chronomat",
    slug: "chronomat",
    category: "Sport Chronograph",
    tagline: "Breitling's versatile mechanical sport-watch platform.",
    description: "Launch coverage centered on the steel Chronomat B01 42.",
    assets: breitlingChronomatAssets,
  },
];

export const breitlingAssets = breitlingCollections.flatMap((collection) => collection.assets);
