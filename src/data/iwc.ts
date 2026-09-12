import type { QuestLuxoAsset } from "../types/questLuxo";

export type IwcCollectionSlug = "pilots-watch" | "portugieser";

export type IwcAsset = QuestLuxoAsset & {
  brand: "IWC";
  collection: "Pilot's Watch" | "Portugieser";
  collectionSlug: IwcCollectionSlug;
};

export interface IwcCollection {
  name: IwcAsset["collection"];
  slug: IwcCollectionSlug;
  category: string;
  tagline: string;
  description: string;
  assets: IwcAsset[];
}

export const iwcPilotsWatchAssets: IwcAsset[] = [
  {
    reference: "IW328201",
    model: "Pilot's Watch Mark XX",
    brand: "IWC",
    collection: "Pilot's Watch",
    collectionSlug: "pilots-watch",
    configurations: [{ nickname: "Mark XX Black", bracelet: "Black Calfskin Strap", dial: "Black" }],
    material: "Stainless Steel",
    bezel: "Fixed Stainless Steel",
    productionStatus: "Current Production",
    marketPosition: "A 40 mm, time-and-date continuation of IWC's practical Mark-series pilot-watch lineage.",
    liquidity: "Moderate",
    allocationDifficulty: "Lower",
    questLuxoView: "The IW328201 is best judged on fit, strap and buckle condition, complete delivery contents, service evidence, and a price supported by like-for-like Mark XX examples.",
  },
  {
    reference: "IW329301",
    model: "Big Pilot's Watch 43",
    brand: "IWC",
    collection: "Pilot's Watch",
    collectionSlug: "pilots-watch",
    configurations: [{ nickname: "Big Pilot 43 Black", bracelet: "Brown Calfskin Strap", dial: "Black" }],
    material: "Stainless Steel",
    bezel: "Fixed Stainless Steel",
    productionStatus: "Current Production",
    marketPosition: "A streamlined 43 mm interpretation of IWC's Big Pilot design with a manufacture automatic movement and display back.",
    liquidity: "Moderate",
    allocationDifficulty: "Lower",
    questLuxoView: "The IW329301 works when its scale and crown suit the wrist; condition, strap completeness, documented performance, and acquisition basis should lead the brokerage decision.",
  },
];

export const iwcPortugieserAssets: IwcAsset[] = [
  {
    reference: "IW358303",
    model: "Portugieser Automatic 40",
    brand: "IWC",
    collection: "Portugieser",
    collectionSlug: "portugieser",
    configurations: [{ nickname: "Automatic 40 Silver", bracelet: "Black Alligator Leather Strap", dial: "Silver-Plated" }],
    material: "Stainless Steel",
    bezel: "Fixed Polished Stainless Steel",
    productionStatus: "Current Production",
    marketPosition: "A compact, time-only expression of the Portugieser's marine-chronometer-inspired design language.",
    liquidity: "Moderate",
    allocationDifficulty: "Lower",
    questLuxoView: "The IW358303 is a proportion-led dress watch; dial, polished-case and strap condition, service state, completeness, and disciplined comparison determine the right example.",
  },
];

export const iwcCollections: IwcCollection[] = [
  {
    name: "Pilot's Watch",
    slug: "pilots-watch",
    category: "Pilot Watch",
    tagline: "Functional aviation design across Mark and Big Pilot proportions.",
    description: "Launch coverage for the Pilot's Watch Mark XX and Big Pilot's Watch 43.",
    assets: iwcPilotsWatchAssets,
  },
  {
    name: "Portugieser",
    slug: "portugieser",
    category: "Classic Watch",
    tagline: "Marine-instrument clarity translated into an enduring dress-watch family.",
    description: "Launch coverage centered on the Portugieser Automatic 40.",
    assets: iwcPortugieserAssets,
  },
];

export const iwcAssets = iwcCollections.flatMap((collection) => collection.assets);
