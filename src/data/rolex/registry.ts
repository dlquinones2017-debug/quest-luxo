import {
  rolexDatejustAssets,
  rolexSubmarinerAssets,
  rolexDaytonaAssets,
  rolexGMTMasterIIAssets,
  rolexDayDateAssets,
  rolexExplorerAssets,
  rolexExplorerIIAssets,
  rolexYachtMasterAssets,
  rolexSeaDwellerAssets,
  rolexAirKingAssets,
  rolexMilgaussAssets,
  rolexOysterPerpetualAssets,
  rolexSkyDwellerAssets,
  rolex1908Assets,
} from "./index";

export const rolexRegistry = [
  {
    name: "Daytona",
    slug: "daytona",
    assets: rolexDaytonaAssets,
    category: "Professional",
    status: "Current Production",
    tagline: "The Rolex chronograph icon.",
    description:
      "The Daytona remains one of the most important modern Rolex collections, driven by motorsport heritage, scarcity, allocation pressure, and strong collector demand.",
  },
  {
    name: "Submariner",
    slug: "submariner",
    assets: rolexSubmarinerAssets,
    category: "Professional",
    status: "Current Production",
    tagline: "The definitive luxury dive watch.",
    description:
      "The Submariner is one of the strongest daily-wear Rolex collections, combining durability, liquidity, collector recognition, and broad private sourcing demand.",
  },
  {
    name: "Sea-Dweller",
    slug: "sea-dweller",
    assets: rolexSeaDwellerAssets,
    category: "Professional",
    status: "Current Production",
    tagline: "The professional deep-sea Rolex diver.",
    description:
      "The Sea-Dweller and Deepsea line gives Quest Luxo coverage for Rolex’s most capable professional dive references, including red-text collector appeal, D-Blue demand, and technical saturation-diving identity.",
  },
  {
    name: "GMT-Master II",
    slug: "gmt-master-ii",
    assets: rolexGMTMasterIIAssets,
    category: "Professional",
    status: "Current Production",
    tagline: "The modern travel-watch benchmark.",
    description:
      "The GMT-Master II is driven by bezel configuration demand, steel sports watch liquidity, and strong collector interest across Pepsi, Batman, Sprite, Root Beer, and precious-metal references.",
  },
  {
    name: "Explorer",
    slug: "explorer",
    assets: rolexExplorerAssets,
    category: "Professional",
    status: "Current Production",
    tagline: "The purest Rolex field watch.",
    description:
      "The Explorer is one of Rolex’s cleanest professional collections, defined by heritage, everyday wearability, steel sports liquidity, and strong appeal among understated collectors.",
  },
  {
    name: "Explorer II",
    slug: "explorer-ii",
    assets: rolexExplorerIIAssets,
    category: "Professional",
    status: "Current Production",
    tagline: "The rugged Rolex adventure GMT.",
    description:
      "The Explorer II offers strong private-market appeal through Polar dial demand, 24-hour bezel utility, discontinued-reference interest, and one of Rolex’s most distinctive professional designs.",
  },
  {
    name: "Yacht-Master",
    slug: "yacht-master",
    assets: rolexYachtMasterAssets,
    category: "Professional",
    status: "Current Production",
    tagline: "The refined nautical Rolex sports watch.",
    description:
      "The Yacht-Master blends Rolex sports-watch durability with elevated precious-metal and platinum details, creating strong appeal for collectors who want a luxury-sport profile beyond the Submariner.",
  },
  {
    name: "Air-King",
    slug: "air-king",
    assets: rolexAirKingAssets,
    category: "Professional",
    status: "Current Production",
    tagline: "The aviation-inspired Rolex professional watch.",
    description:
      "The Air-King gives Quest Luxo coverage for Rolex’s aviation-inspired professional line, including the current 126900, discontinued 116900, and approachable neo-vintage entry references.",
  },
  {
    name: "Milgauss",
    slug: "milgauss",
    assets: rolexMilgaussAssets,
    category: "Discontinued",
    status: "Discontinued",
    tagline: "The scientist Rolex with cult collector appeal.",
    description:
      "The Milgauss gives Quest Luxo coverage for Rolex’s discontinued antimagnetic line, including Z-Blue demand, green sapphire crystal recognition, lightning-bolt seconds-hand identity, and growing collector interest.",
  },
  {
    name: "Oyster Perpetual",
    slug: "oyster-perpetual",
    assets: rolexOysterPerpetualAssets,
    category: "Classic",
    status: "Current Production",
    tagline: "The purest expression of modern Rolex.",
    description:
      "The Oyster Perpetual collection represents Rolex's most versatile everyday watches, spanning classic black dials, colorful lacquer dials, and highly sought-after Celebration configurations with exceptional collector demand.",
  },
  {
    name: "Sky-Dweller",
    slug: "sky-dweller",
    assets: rolexSkyDwellerAssets,
    category: "Complication",
    status: "Current Production",
    tagline: "Rolex’s annual calendar travel complication.",
    description:
      "The Sky-Dweller gives Quest Luxo coverage for Rolex’s most complicated modern collection, combining annual calendar functionality, luxury positioning, high allocation pressure, and strong private-client demand.",
  },
  {
    name: "1908",
    slug: "1908",
    assets: rolex1908Assets,
    category: "Dress",
    status: "Current Production",
    tagline: "Rolex’s modern dress-watch collection.",
    description:
      "The 1908 collection gives Quest Luxo coverage for Rolex’s modern dress-watch line, spanning yellow gold, white gold, and platinum references with refined private-client appeal.",
  },
  {
    name: "Datejust",
    slug: "datejust",
    assets: rolexDatejustAssets,
    category: "Classic",
    status: "Current Production",
    tagline: "The essential Rolex dress-sport icon.",
    description:
      "The Datejust spans steel, two-tone, fluted, smooth, Oyster, Jubilee, and dial-driven demand across one of Rolex’s most commercially important collections.",
  },
  {
    name: "Day-Date",
    slug: "day-date",
    assets: rolexDayDateAssets,
    category: "Prestige",
    status: "Current Production",
    tagline: "The President bracelet flagship.",
    description:
      "The Day-Date is Rolex’s precious-metal leadership watch, defined by the President bracelet, flagship positioning, and strong appeal among high-net-worth collectors.",
  },
];

export const rolexRegistryAssets = rolexRegistry.flatMap((collection) =>
  collection.assets.map((asset) => ({
    ...asset,
    collection: collection.name,
    collectionSlug: collection.slug,
  }))
);