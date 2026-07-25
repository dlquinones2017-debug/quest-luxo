import { datejustAssets } from "./assets/rolex-datejust";
import { dayDateAssets } from "./assets/rolex-day-date";
import { daytonaAssets } from "./assets/rolex-daytona";
import { gmtMasterIIAssets } from "./assets/rolex-gmt-master-ii";
import { skyDwellerAssets } from "./assets/rolex-sky-dweller";
import { submarinerAssets } from "./assets/rolex-submariner";
import { yachtMasterAssets } from "./assets/rolex-yacht-master";
import type { QuestLuxoAsset } from "../types/questLuxo";

export interface CollectionDefinition {
  brand: string;
  brandSlug: string;
  name: string;
  slug: string;
  description: string;
  intelligenceTitle: string;
  intelligenceParagraphs: string[];
  signalsDescription: string;
  directoryDescription: string;
  sourcingText: string;
  assets: QuestLuxoAsset[];
}

const defineCollection = (
  definition: CollectionDefinition
): CollectionDefinition => ({
  ...definition,
  assets: definition.assets.map((asset) => ({
    ...asset,
    image:
      asset.image && asset.imageVerified
        ? asset.image
        : "/images/watch-reference-placeholder.svg",
  })),
});

const rolexCollections = [
  defineCollection({
    brand: "Rolex",
    brandSlug: "rolex",
    name: "GMT-Master II",
    slug: "gmt-master-ii",
    description:
      "The Rolex GMT-Master II is the benchmark dual-time travel watch, spanning current steel, two-tone, precious-metal, and discontinued collector references.",
    intelligenceTitle: "GMT-Master II Market Position",
    intelligenceParagraphs: [
      "The GMT-Master II combines global recognition, deep secondary-market liquidity, and persistent demand across current and discontinued bezel configurations.",
      "Quest Luxo evaluates GMT-Master II acquisitions by reference, bezel, bracelet, material, production status, condition, set completeness, and current sourcing availability.",
    ],
    signalsDescription:
      "These scores summarize the current GMT-Master II reference set inside Quest Luxo's Rolex intelligence directory.",
    directoryDescription:
      "Search, filter, and sort GMT-Master II references by generation, nickname, material, production status, and Quest Luxo intelligence score.",
    sourcingText:
      "Quest Luxo coordinates discreet sourcing for clients seeking current, discontinued, and collector-grade Rolex GMT-Master II references.",
    assets: gmtMasterIIAssets,
  }),
  defineCollection({
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Daytona",
    slug: "daytona",
    description:
      "The Rolex Cosmograph Daytona is one of the most important modern luxury chronographs, combining motorsport heritage, extreme allocation pressure, and deep collector demand across steel, precious-metal, Oysterflex, and platinum references.",
    intelligenceTitle: "Daytona Market Position",
    intelligenceParagraphs: [
      "The Daytona sits at the center of modern Rolex collecting, supported by iconic design, strong secondary-market liquidity, and persistent allocation pressure across steel and select precious-metal configurations.",
      "Quest Luxo evaluates Daytona references by generation, bezel type, dial configuration, production status, material, collector recognition, and long-term market desirability.",
    ],
    signalsDescription:
      "These scores summarize the current Daytona reference set inside Quest Luxo's Rolex intelligence directory.",
    directoryDescription:
      "Search, filter, and sort Daytona references by generation, nickname, material, production status, and Quest Luxo intelligence score.",
    sourcingText:
      "Quest Luxo coordinates discreet sourcing for clients seeking current, discontinued, and collector-grade Rolex Daytona references.",
    assets: daytonaAssets,
  }),
  defineCollection({
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Submariner",
    slug: "submariner",
    description:
      "The Rolex Submariner remains the benchmark luxury dive watch, with enduring demand across no-date, date, green-bezel, two-tone, and precious-metal references.",
    intelligenceTitle: "Submariner Market Position",
    intelligenceParagraphs: [
      "The Submariner is one of Rolex's most liquid and universally recognized sports watch categories, supported by decades of dive-watch heritage and broad collector demand.",
      "Quest Luxo evaluates Submariner acquisitions by reference, bezel, dial, metal, production status, condition, set completeness, and current sourcing availability.",
    ],
    signalsDescription:
      "These scores summarize the current reference set inside Quest Luxo's Submariner directory.",
    directoryDescription:
      "Search, filter, and sort the directory by reference, nickname, production status, material, and Quest Luxo intelligence score.",
    sourcingText:
      "Quest Luxo coordinates discreet sourcing for clients seeking current, discontinued, and collector-grade Rolex Submariner references.",
    assets: submarinerAssets,
  }),
  defineCollection({
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Datejust",
    slug: "datejust",
    description:
      "The Rolex Datejust is the classic everyday Rolex, known for its versatility across sizes, bezels, bracelets, metals, and dial configurations.",
    intelligenceTitle: "Datejust Market Position",
    intelligenceParagraphs: [
      "The Datejust remains one of Rolex's most versatile acquisition categories, with demand driven by dial selection, bracelet configuration, bezel type, size, and metal combination.",
      "Quest Luxo evaluates Datejust acquisitions by reference, size, dial, bezel, bracelet, condition, set completeness, and current sourcing availability.",
    ],
    signalsDescription:
      "Collection-level scoring will appear as reference intelligence coverage expands.",
    directoryDescription:
      "Search, filter, and sort Datejust references by configuration, material, production status, and reference number.",
    sourcingText:
      "Quest Luxo coordinates discreet sourcing for clients seeking specific Rolex Datejust references, dial configurations, and bracelet combinations.",
    assets: datejustAssets,
  }),
  defineCollection({
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Day-Date",
    slug: "day-date",
    description:
      "The Rolex Day-Date is the brand's iconic precious-metal flagship, long associated with leadership, legacy, and enduring prestige.",
    intelligenceTitle: "Day-Date Market Position",
    intelligenceParagraphs: [
      "The Day-Date remains one of Rolex's strongest classic luxury categories, supported by precious-metal construction, President bracelet recognition, and broad demand across 36mm and 40mm configurations.",
      "Quest Luxo evaluates Day-Date acquisitions by reference, metal, dial, bracelet condition, production status, set completeness, and current sourcing availability.",
    ],
    signalsDescription:
      "Collection-level scoring will appear as reference intelligence coverage expands.",
    directoryDescription:
      "Search, filter, and sort Day-Date references by configuration, material, production status, and reference number.",
    sourcingText:
      "Quest Luxo coordinates discreet sourcing for clients seeking current, discontinued, and collector-grade Rolex Day-Date references.",
    assets: dayDateAssets,
  }),
  defineCollection({
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Sky-Dweller",
    slug: "sky-dweller",
    description:
      "The Rolex Sky-Dweller combines annual calendar functionality with dual-time capability, making it one of Rolex's most sophisticated modern travel watches.",
    intelligenceTitle: "Sky-Dweller Market Position",
    intelligenceParagraphs: [
      "The Sky-Dweller occupies a unique position within Rolex as one of the brand's most complicated modern watches, with strong demand across steel, two-tone, precious-metal, and Oysterflex configurations.",
      "Quest Luxo evaluates Sky-Dweller acquisitions by reference, dial, bracelet, production generation, metal configuration, condition, set completeness, and current sourcing availability.",
    ],
    signalsDescription:
      "Collection-level scoring will appear as reference intelligence coverage expands.",
    directoryDescription:
      "Search, filter, and sort Sky-Dweller references by configuration, material, production status, and reference number.",
    sourcingText:
      "Quest Luxo coordinates discreet sourcing for clients seeking current, discontinued, and collector-grade Rolex Sky-Dweller references.",
    assets: skyDwellerAssets,
  }),
  defineCollection({
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Yacht-Master",
    slug: "yacht-master",
    description:
      "The Rolex Yacht-Master blends nautical sport design with luxury finishing, spanning Rolesium, Everose Rolesor, precious metal, and Oysterflex references.",
    intelligenceTitle: "Yacht-Master Market Position",
    intelligenceParagraphs: [
      "The Yacht-Master occupies a refined position within Rolex's professional collection, appealing to clients who want sport utility with a softer luxury profile than the Submariner or GMT-Master II.",
      "Quest Luxo evaluates Yacht-Master acquisitions by reference, case size, material, bezel, bracelet, condition, set completeness, and current sourcing availability.",
    ],
    signalsDescription:
      "Collection-level scoring will appear as reference intelligence coverage expands.",
    directoryDescription:
      "Search, filter, and sort Yacht-Master references by configuration, material, production status, and reference number.",
    sourcingText:
      "Quest Luxo coordinates discreet sourcing for clients seeking current, discontinued, and collector-grade Rolex Yacht-Master references.",
    assets: yachtMasterAssets,
  }),
] satisfies CollectionDefinition[];

interface HouseCollectionSeed {
  brand: string;
  brandSlug: string;
  name: string;
  slug: string;
  reference: string;
  model?: string;
  material: string;
  productionStatus?: string;
  marketPosition: string;
}

const houseCollectionSeeds: HouseCollectionSeed[] = [
  {
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Explorer",
    slug: "explorer",
    reference: "224270",
    material: "Oystersteel",
    marketPosition: "Expedition-Inspired Professional Watch",
  },
  {
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Explorer II",
    slug: "explorer-ii",
    reference: "226570",
    material: "Oystersteel",
    marketPosition: "24-Hour Expedition Tool Watch",
  },
  {
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Sea-Dweller",
    slug: "sea-dweller",
    reference: "126600",
    material: "Oystersteel",
    marketPosition: "Professional Saturation-Dive Watch",
  },
  {
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Oyster Perpetual",
    slug: "oyster-perpetual",
    reference: "124300",
    material: "Oystersteel",
    marketPosition: "Essential Everyday Automatic Watch",
  },
  {
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Air-King",
    slug: "air-king",
    reference: "126900",
    material: "Oystersteel",
    marketPosition: "Aviation-Inspired Professional Watch",
  },
  {
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Perpetual 1908",
    slug: "1908",
    reference: "52508",
    material: "Yellow Gold",
    marketPosition: "Contemporary Formal Watch",
  },
  {
    brand: "Rolex",
    brandSlug: "rolex",
    name: "Milgauss",
    slug: "milgauss",
    reference: "116400GV",
    material: "Oystersteel",
    productionStatus: "Discontinued",
    marketPosition: "Anti-Magnetic Collector Watch",
  },
  {
    brand: "Patek Philippe",
    brandSlug: "patek-philippe",
    name: "Nautilus",
    slug: "nautilus",
    reference: "5811-1G-001",
    material: "White Gold",
    marketPosition: "Contemporary Integrated-Bracelet Sports Watch",
  },
  {
    brand: "Audemars Piguet",
    brandSlug: "audemars-piguet",
    name: "Royal Oak",
    slug: "royal-oak",
    reference: "16202ST",
    material: "Stainless Steel",
    marketPosition: "Ultra-Thin Integrated-Bracelet Sports Watch",
  },
  {
    brand: "Richard Mille",
    brandSlug: "richard-mille",
    name: "RM 11",
    slug: "rm-11",
    reference: "RM11-03",
    material: "Titanium",
    marketPosition: "High-Performance Flyback Chronograph",
  },
  {
    brand: "Vacheron Constantin",
    brandSlug: "vacheron-constantin",
    name: "Overseas",
    slug: "overseas",
    reference: "4520V",
    material: "Stainless Steel",
    marketPosition: "Integrated-Bracelet Travel Sports Watch",
  },
  {
    brand: "F.P. Journe",
    brandSlug: "fp-journe",
    name: "Chronomètre Bleu",
    slug: "chronometre-bleu",
    reference: "CB",
    material: "Tantalum",
    marketPosition: "Independent Precision Dress Watch",
  },
  {
    brand: "Hublot",
    brandSlug: "hublot",
    name: "Big Bang",
    slug: "big-bang",
    reference: "441-NX-1171-RX",
    material: "Titanium",
    marketPosition: "Contemporary Fusion Chronograph",
  },
  {
    brand: "Cartier",
    brandSlug: "cartier",
    name: "Santos de Cartier",
    slug: "santos-de-cartier",
    reference: "WSSA0018",
    material: "Stainless Steel",
    marketPosition: "Design-Led Integrated-Bracelet Watch",
  },
  {
    brand: "Omega",
    brandSlug: "omega",
    name: "Speedmaster",
    slug: "speedmaster",
    reference: "310-30-42-50-01-002",
    material: "Stainless Steel",
    marketPosition: "Manual-Wind Heritage Chronograph",
  },
  {
    brand: "Tudor",
    brandSlug: "tudor",
    name: "Black Bay",
    slug: "black-bay",
    reference: "M7941A1A0RU-0003",
    material: "Stainless Steel",
    marketPosition: "Heritage-Inspired Dive Watch",
  },
  {
    brand: "Panerai",
    brandSlug: "panerai",
    name: "Luminor",
    slug: "luminor",
    reference: "PAM01312",
    material: "Stainless Steel",
    marketPosition: "Crown-Guard Sports Watch",
  },
  {
    brand: "Breitling",
    brandSlug: "breitling",
    name: "Navitimer",
    slug: "navitimer",
    reference: "AB0138211B1P1",
    material: "Stainless Steel",
    marketPosition: "Aviation Slide-Rule Chronograph",
  },
  {
    brand: "IWC",
    brandSlug: "iwc",
    name: "Pilot's Watch",
    slug: "pilots-watch",
    reference: "IW388102",
    material: "Stainless Steel",
    marketPosition: "Modern Aviation Chronograph",
  },
  {
    brand: "Blancpain",
    brandSlug: "blancpain",
    name: "Fifty Fathoms",
    slug: "fifty-fathoms",
    reference: "5015-1130-52A",
    material: "Stainless Steel",
    marketPosition: "Historic Professional Dive Watch",
  },
  {
    brand: "Jaeger-LeCoultre",
    brandSlug: "jaeger-lecoultre",
    name: "Reverso",
    slug: "reverso",
    reference: "Q3848422",
    material: "Stainless Steel",
    marketPosition: "Reversible Art Deco Dress Watch",
  },
  {
    brand: "Ulysse Nardin",
    brandSlug: "ulysse-nardin",
    name: "Freak",
    slug: "freak",
    reference: "2303-270-1",
    material: "Titanium",
    marketPosition: "Avant-Garde Carousel Timepiece",
  },
  {
    brand: "Franck Muller",
    brandSlug: "franck-muller",
    name: "Vanguard",
    slug: "vanguard",
    reference: "V45",
    material: "Titanium",
    marketPosition: "Contemporary Tonneau Sports Watch",
  },
  {
    brand: "Bell & Ross",
    brandSlug: "bell-and-ross",
    name: "BR 03",
    slug: "br-03",
    reference: "BR03A-BL-ST",
    material: "Stainless Steel",
    marketPosition: "Instrument-Inspired Aviation Watch",
  },
  {
    brand: "A. Lange & Söhne",
    brandSlug: "a-lange-and-sohne",
    name: "Lange 1",
    slug: "lange-1",
    reference: "191-032",
    material: "Pink Gold",
    marketPosition: "Asymmetrical German Haute Horlogerie",
  },
  {
    brand: "Breguet",
    brandSlug: "breguet",
    name: "Classique",
    slug: "classique",
    reference: "5177",
    material: "White Gold",
    marketPosition: "Traditional Guilloché Dress Watch",
  },
  {
    brand: "Girard-Perregaux",
    brandSlug: "girard-perregaux",
    name: "Laureato",
    slug: "laureato",
    reference: "81010-11-431-11A",
    material: "Stainless Steel",
    marketPosition: "Integrated-Bracelet Manufacture Sports Watch",
  },
  {
    brand: "Zenith",
    brandSlug: "zenith",
    name: "Chronomaster Sport",
    slug: "chronomaster-sport",
    reference: "03-3100-3600-69-M3100",
    material: "Stainless Steel",
    marketPosition: "High-Frequency Automatic Chronograph",
  },
];

const buildHouseCollection = (
  seed: HouseCollectionSeed
): CollectionDefinition => {
  const asset: QuestLuxoAsset = {
    reference: seed.reference,
    model: seed.model ?? seed.name,
    brand: seed.brand,
    collection: seed.name,
    configurations: [
      {
        nickname: `${seed.name} representative reference`,
        dial: "Configuration details available through private advisory",
        bracelet: "Reference dependent",
        originalMSRP: null,
      },
    ],
    material: seed.material,
    bezel: "Reference dependent",
    productionStatus: seed.productionStatus ?? "Current",
    marketPosition: seed.marketPosition,
    liquidity: "Under review",
    allocationDifficulty: "Contact for availability",
    questLuxoView:
      `Quest Luxo tracks the ${seed.brand} ${seed.name} by reference, configuration, condition, provenance, and current sourcing availability.`,
    image: "/images/watch-reference-placeholder.svg",
  };

  return defineCollection({
    brand: seed.brand,
    brandSlug: seed.brandSlug,
    name: seed.name,
    slug: seed.slug,
    description:
      `Explore the ${seed.brand} ${seed.name} through the shared Quest Luxo collection directory and private sourcing workflow.`,
    intelligenceTitle: `${seed.name} Collection Position`,
    intelligenceParagraphs: [
      `The ${seed.name} is represented in Quest Luxo's unified watch-house architecture with the same navigation, reference profiles, and sourcing workflow used across the platform.`,
      "Reference-level market scoring is published only after its underlying intelligence coverage has been reviewed.",
    ],
    signalsDescription:
      "Collection-level scoring will appear as verified reference intelligence coverage expands.",
    directoryDescription:
      `Search, filter, and sort ${seed.name} reference profiles using the shared Quest Luxo directory.`,
    sourcingText:
      `Quest Luxo coordinates discreet sourcing for clients seeking ${seed.brand} ${seed.name} references.`,
    assets: [asset],
  });
};

export const collectionRegistry = [
  ...rolexCollections,
  ...houseCollectionSeeds.map(buildHouseCollection),
] satisfies CollectionDefinition[];

export const getCollection = (brandSlug: string, collectionSlug: string) =>
  collectionRegistry.find(
    (definition) =>
      definition.brandSlug === brandSlug &&
      definition.slug === collectionSlug
  );

export const getCollectionsForBrand = (brandSlug: string) =>
  collectionRegistry.filter(
    (definition) => definition.brandSlug === brandSlug
  );
