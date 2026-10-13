import type { QuestLuxoAsset, QuestLuxoConfiguration } from "../types/questLuxo";
import type { CollectionDefinition } from "./collectionRegistry";

interface LaunchReferenceSeed {
  brand: string;
  brandSlug: string;
  collection: string;
  collectionSlug: string;
  reference: string;
  model: string;
  configuration: QuestLuxoConfiguration;
  material?: string;
  bezel?: string;
  overview: string;
  sourceUrl: string;
  sourceLabel?: string;
  reviewedAt?: string;
}

// Only source-verified facts belong here. Photography clearance is separate.
const launchReferenceSeeds: readonly LaunchReferenceSeed[] = [
  {
    brand: "Patek Philippe", brandSlug: "patek-philippe", collection: "Aquanaut", collectionSlug: "aquanaut",
    reference: "5167A-001", model: "Aquanaut Date",
    configuration: { caseSize: "40.8 mm", movement: "Self-winding calibre 26-330 S C", dial: "Charcoal gray with black-gradient rim", bracelet: "Black composite strap", waterResistance: "30 m" },
    material: "Stainless Steel", overview: "A steel Aquanaut with date, central seconds and a black composite strap. The specifications describe the manufacturer's currently listed configuration; earlier production examples require individual verification.",
    sourceUrl: "https://www.patek.com/en/collection/aquanaut/5167A-001",
  },
  {
    brand: "Tudor", brandSlug: "tudor", collection: "Pelagos", collectionSlug: "pelagos",
    reference: "M25600TN-0001", model: "Pelagos 42",
    configuration: { caseSize: "42 mm", movement: "Self-winding manufacture calibre MT5612 (COSC)", dial: "Black", bracelet: "Titanium bracelet", waterResistance: "500 m" },
    material: "Titanium and Steel", bezel: "Unidirectional titanium bezel with matte black ceramic insert",
    overview: "The black-dial Pelagos 42 pairs a titanium-and-steel case with a titanium bracelet and manufacture automatic movement. Water resistance describes the manufacturer's rating, not a pressure test of a sourced watch.",
    sourceUrl: "https://www.tudorwatch.com/en/watches/pelagos/m25600tn-0001",
  },
  {
    brand: "Breitling", brandSlug: "breitling", collection: "Superocean", collectionSlug: "superocean",
    reference: "A17376211B1A1", model: "Superocean Automatic 44",
    configuration: { caseSize: "44 mm", movement: "Self-winding Breitling 17", bracelet: "Stainless-steel bracelet", waterResistance: "300 m" },
    material: "Stainless Steel", bezel: "Unidirectional ratcheted bezel",
    overview: "A 44 mm steel Superocean with automatic calibre Breitling 17. Condition, bracelet completeness, service history and a current pressure test must be established for an individual sourcing request.",
    sourceUrl: "https://www.breitling.com/gb-en/watches/superocean/superocean-automatic-44-my22/A17376211B1A1/",
  },
  {
    brand: "Hublot", brandSlug: "hublot", collection: "Classic Fusion", collectionSlug: "classic-fusion",
    reference: "542.NX.1171.RX", model: "Classic Fusion Titanium 42",
    configuration: { caseSize: "42 mm", movement: "Self-winding HUB1110", dial: "Matte Black", bracelet: "Black lined rubber strap", waterResistance: "50 m" },
    material: "Titanium", bezel: "Titanium with six H-shaped screws",
    overview: "The time-and-date Classic Fusion Titanium 42 uses a black dial and rubber strap. It is distinct from the skeleton chronograph Aerofusion configuration.",
    sourceUrl: "https://www.hublot.com/en-us/watches/classic-fusion/classic-fusion-titanium-rubber-42-mm",
  },
  {
    brand: "Hublot", brandSlug: "hublot", collection: "Aerofusion", collectionSlug: "aerofusion",
    reference: "525.NX.0170.RX", model: "Classic Fusion Aerofusion Titanium 45",
    configuration: { caseSize: "45 mm", movement: "Self-winding skeleton chronograph HUB1155", dial: "Sapphire", bracelet: "Black lined rubber strap", waterResistance: "50 m" },
    material: "Titanium", bezel: "Titanium with six H-shaped screws",
    overview: "Aerofusion is a skeleton chronograph within Hublot's Classic Fusion family. Quest Luxo provides this dedicated entry for Aerofusion sourcing without treating it as a separate manufacturer family.",
    sourceUrl: "https://www.hublot.com/en-us/watches/classic-fusion/classic-fusion-aerofusion-titanium-45-mm",
  },
  {
    brand: "Hublot", brandSlug: "hublot", collection: "Big Bang Unico", collectionSlug: "big-bang-unico",
    reference: "441.NX.1171.RX", model: "Big Bang Unico Titanium 42",
    configuration: { caseSize: "42 mm", movement: "Self-winding HUB1280 UNICO flyback chronograph", dial: "Matte black skeleton", bracelet: "Black lined rubber strap", waterResistance: "100 m" },
    material: "Titanium", bezel: "Titanium with six H-shaped screws",
    overview: "This titanium Big Bang Unico 42 features a manufacture flyback chronograph. This entry identifies the non-diamond reference; gem-set and other case-material editions require their own verification.",
    sourceUrl: "https://www.hublot.com/fr-fr/watches/big-bang/big-bang-unico-titanium-42-mm",
  },
  {
    brand: "Hublot", brandSlug: "hublot", collection: "Spirit of Big Bang", collectionSlug: "spirit-of-big-bang",
    reference: "642.NX.0170.RX", model: "Spirit of Big Bang Titanium 42",
    configuration: { caseSize: "42 mm", movement: "Self-winding skeleton chronograph HUB4700", dial: "Sapphire", bracelet: "Black structured lined rubber strap", waterResistance: "100 m" },
    material: "Titanium", bezel: "Titanium with six H-shaped screws",
    overview: "The tonneau-shaped Spirit of Big Bang Titanium 42 uses the HUB4700 skeleton chronograph. It is a different case and movement platform from Big Bang Unico.",
    sourceUrl: "https://www.hublot.com/en-us/watches/big-bang/spirit-of-big-bang-titanium-42-mm",
  },
  {
    brand: "Vacheron Constantin", brandSlug: "vacheron-constantin", collection: "Historiques", collectionSlug: "historiques",
    reference: "4200H/222A-B934", model: "Historiques 222",
    configuration: { caseSize: "37 mm", movement: "Self-winding calibre 2455/2", dial: "Matte Blue", bracelet: "Integrated stainless-steel bracelet", waterResistance: "50 m" },
    material: "Stainless Steel", bezel: "Fluted bezel",
    overview: "The steel Historiques 222 revisits the integrated-bracelet design of the original 1970s watch. The blue-dial steel reference is distinct from the yellow-gold version.",
    sourceUrl: "https://www.vacheron-constantin.com/hk/en/collections/historiques/4200h-222a-b934.html",
  },
  {
    brand: "Vacheron Constantin", brandSlug: "vacheron-constantin", collection: "Traditionnelle", collectionSlug: "traditionnelle",
    reference: "82172/000R-9382", model: "Traditionnelle Manual-Winding",
    configuration: { caseSize: "38 mm", movement: "Manual-winding calibre 4400 AS", dial: "Silver-toned opaline", bracelet: "Brown alligator leather strap", waterResistance: "30 m" },
    material: "18K Pink Gold",
    overview: "A manually wound Traditionnelle in pink gold with small seconds and a transparent caseback. Case finish, dial condition and service documentation are central to an individual watch review.",
    sourceUrl: "https://www.vacheron-constantin.com/us/en/collections/traditionnelle/82172-000r-9382.html",
  },
  {
    brand: "Vacheron Constantin", brandSlug: "vacheron-constantin", collection: "American 1921", collectionSlug: "american-1921",
    reference: "82035/000R-H114", model: "Historiques American 1921",
    configuration: { caseSize: "40 × 40 mm", movement: "Manual-winding calibre 4400 AS", dial: "Grained silver-toned with blue numerals", bracelet: "Blue calfskin leather strap", waterResistance: "30 m" },
    material: "18K Pink Gold",
    overview: "American 1921 belongs to Vacheron Constantin's Historiques family. Its diagonal display and offset crown are represented here by the verified pink-gold H114 configuration, rather than an earlier dial or strap variant.",
    sourceUrl: "https://www.vacheron-constantin.com/us/en/collections/historiques/82035-000r-h114.html",
  },
  {
    brand: "Franck Muller", brandSlug: "franck-muller", collection: "Rabbit", collectionSlug: "rabbit",
    reference: "V 41 SC DT FR2 GFGRNR (NR)", model: "#FR2NCK MULLER Vanguard",
    configuration: { caseSize: "41 mm", movement: "Self-winding FM 800-DT", dial: "Matte White", bracelet: "White textile strap", waterResistance: "30 m" },
    material: "Carbon and Glass Fibre",
    overview: "The Rabbit entry covers the #FR2NCK MULLER Vanguard collaboration, a limited edition documented by collaboration retailer Cortina Watch. It is separate from the later colourful Vanguard Beach editions.",
    sourceUrl: "https://www.cortinawatch.com/en/franck-muller/limited-edition/v-41-sc-dt-fr2-gfgrnr-nr/", sourceLabel: "Cortina Watch collaboration reference",
  },
  {
    brand: "Franck Muller", brandSlug: "franck-muller", collection: "Crazy Hours", collectionSlug: "crazy-hours",
    reference: "8880CHACLB", model: "Cintrée Curvex Crazy Hours",
    configuration: { caseSize: "55.4 × 39.6 mm", movement: "Self-winding MVD FM 2800-CHR", dial: "Powder blue sunray guilloché", bracelet: "Blue alligator leather strap" },
    material: "Stainless Steel",
    overview: "This steel Crazy Hours configuration is listed by Franck Muller USA. The hour hand jumps between non-sequential numerals while the minute display follows the usual cycle. The manufacturer's detailed technical table specifies a 55.4 mm length, 39.6 mm width and hand-sewn alligator strap; the exact-reference photograph depicts the blue strap.",
    sourceUrl: "https://franckmuller-usa.com/cintree_curvex_men_crazy_hours/8880CHACLB_Cintr%C3%A9e_Curvex_Crazy_Hours",
    reviewedAt: "2026-10-13",
  },
  {
    brand: "Franck Muller", brandSlug: "franck-muller", collection: "Yachting", collectionSlug: "yachting",
    reference: "V 45 SC DT YACHT CR BL (BL)", model: "Vanguard Yachting Ceramic",
    configuration: {}, material: "Blue Ceramic",
    overview: "Yachting is a nautical branch of the Vanguard family. This manufacturer-listed blue ceramic edition remains queued for detailed dimension, movement, dial and strap verification; those specifications are not inferred from other Vanguard models.",
    sourceUrl: "https://www.franckmuller.com/fr/vanguard-yachting-ceramic",
  },
  {
    brand: "Jaeger-LeCoultre", brandSlug: "jaeger-lecoultre", collection: "Master Control", collectionSlug: "master-control",
    reference: "Q4018421", model: "Master Control Date",
    configuration: { caseSize: "40 mm", movement: "Automatic calibre 899", dial: "Silvered gray sunray", bracelet: "Light-brown calfskin strap", waterResistance: "5 bar" },
    material: "Stainless Steel",
    overview: "The manufacturer currently lists Q4018421 for the steel Master Control Date. The older Q4018420 product address redirects to this reference, so its suffix is not silently reused.",
    sourceUrl: "https://www.jaeger-lecoultre.com/us-en/watches/master-control/master-control-date-stainless-steel-q4018421",
  },
  {
    brand: "Jaeger-LeCoultre", brandSlug: "jaeger-lecoultre", collection: "Master Grande Tradition", collectionSlug: "master-grande-tradition",
    reference: "Q52334E1", model: "Master Grande Tradition Calibre 950",
    configuration: { caseSize: "43 mm", movement: "Automatic calibre 950; minute repeater and perpetual calendar", dial: "Blue guilloché enamel", bracelet: "Blue alligator leather strap", waterResistance: "5 bar" },
    material: "18K White Gold",
    overview: "This white-gold Master Grande Tradition combines a minute repeater and perpetual calendar. Specialist inspection and documented service support are necessary before any transaction. No price or sourcing availability is asserted.",
    sourceUrl: "https://www.jaeger-lecoultre.com/us-en/watches/master-grande-tradition/master-grande-tradition-calibre-950-white-gold-q52334e1",
  },
];

export const launchCatalogAssets = launchReferenceSeeds.map((seed): QuestLuxoAsset => ({
  reference: seed.reference,
  model: seed.model,
  brand: seed.brand,
  collection: seed.collection,
  configurations: [{ ...seed.configuration, originalMSRP: null, currentMSRP: null }],
  material: seed.material,
  bezel: seed.bezel,
  productionStatus: "Availability not confirmed",
  liquidity: "Not assessed",
  allocationDifficulty: "Availability requires a market check",
  questLuxoView: seed.overview,
  specificationSources: [{ label: seed.sourceLabel ?? `${seed.brand} official reference`, url: seed.sourceUrl }],
  specificationsReviewedAt: seed.reviewedAt ?? "2026-10-12",
}));

export const launchCatalogCollections = launchReferenceSeeds.map((seed, index): CollectionDefinition => ({
  brand: seed.brand,
  brandSlug: seed.brandSlug,
  name: seed.collection,
  slug: seed.collectionSlug,
  description: seed.overview,
  intelligenceTitle: `${seed.collection} Reference Guidance`,
  intelligenceParagraphs: [seed.overview, "Listed references are catalog profiles, not stock offers. Availability and transaction pricing require an individual market check."],
  signalsDescription: "Market scores remain unpublished until supporting transaction evidence has been reviewed.",
  directoryDescription: "Explore the verified reference identity and documented specifications. Missing details and authentic photography remain explicitly queued.",
  sourcingText: `Request a market check for ${seed.brand} ${seed.collection}.`,
  assets: [launchCatalogAssets[index]],
}));
