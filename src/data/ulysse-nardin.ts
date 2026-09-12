import type { BrokerageEvidenceSource } from "../types/brokerageIntelligence";

export type UlysseNardinCollectionSlug =
  | "marine"
  | "diver"
  | "freak"
  | "executive"
  | "blast"
  | "moonstruck";

export interface UlysseNardinCollectionIntelligence {
  readonly historicalOverview: string;
  readonly whyCollectorsBuy: string;
  readonly signatureDesignLanguage: string;
  readonly technicalHighlights: string;
  readonly notableComplications: string;
  readonly marketPositioning: string;
  readonly collectorProfile: string;
  readonly buyingConsiderations: string;
  readonly ownershipExperience: string;
  readonly servicingConsiderations: string;
  readonly liquidityObservations: string;
  readonly brokerageConsiderations: string;
  readonly relatedCollections: string;
  readonly perspective: string;
}

export interface UlysseNardinCollection {
  readonly name: string;
  readonly slug: UlysseNardinCollectionSlug;
  readonly category: string;
  readonly status: "Launch Intelligence Ready";
  readonly tagline: string;
  readonly description: string;
  readonly models: readonly string[];
  readonly intelligence: UlysseNardinCollectionIntelligence;
  readonly evidenceSources: readonly BrokerageEvidenceSource[];
}

export const ulysseNardinSources = Object.freeze({
  heritage: Object.freeze({
    label: "Ulysse Nardin - Heritage",
    url: "https://www.ulysse-nardin.com/about-us/heritage",
  }),
  marine: Object.freeze({
    label: "Ulysse Nardin - Marine History",
    url: "https://www.ulysse-nardin.com/en-us/watches/marine/history",
  }),
  freak: Object.freeze({
    label: "Ulysse Nardin - Freak Collection",
    url: "https://www.ulysse-nardin.com/en-us/watches/freak",
  }),
  blast: Object.freeze({
    label: "Ulysse Nardin - Blast Collection",
    url: "https://www.ulysse-nardin.com/watches/blast",
  }),
  moonstruck: Object.freeze({
    label: "Ulysse Nardin - Blast Moonstruck",
    url: "https://www.ulysse-nardin.com/watches/blast/1063-400-2a-3b",
  }),
});

export const ulysseNardinBrandSections = Object.freeze([
  Object.freeze({
    title: "Brand History",
    body: "Ulysse Nardin founded his workshop in Le Locle, Switzerland, in 1846. The manufacture built its early authority through precision timekeeping and complicated watchmaking, then carried that technical identity into modern wristwatches.",
  }),
  Object.freeze({
    title: "Marine Chronometer Legacy",
    body: "High-precision marine deck chronometers made the name useful to naval navigation long before it became associated with contemporary luxury watches. Marine remains the clearest visual bridge to that history.",
  }),
  Object.freeze({
    title: "Swiss Manufacturing",
    body: "The brand remains anchored in Le Locle as an integrated Swiss manufacture. Its strongest watches combine in-house mechanical development with a willingness to use unconventional displays, materials, and case architecture.",
  }),
  Object.freeze({
    title: "Technical Innovation",
    body: "Modern Ulysse Nardin is defined by more than chronometry. The Freak, astronomical watches, constant-force research, tourbillons, chiming mechanisms, and openworked movements give the manufacture a broad experimental vocabulary.",
  }),
  Object.freeze({
    title: "Silicon Technology Leadership",
    body: "The original Freak helped establish silicon components in modern mechanical watchmaking in 2001. Silicon escapement and regulating technology has since become a recurring part of the brand's technical identity.",
  }),
  Object.freeze({
    title: "Modern Independent Spirit",
    body: "Ulysse Nardin presents itself as an independent manufacture with a deliberately unconventional point of view. That independence is most visible where the brand departs from familiar dial layouts and traditional complication displays.",
  }),
  Object.freeze({
    title: "Collector Profile",
    body: "The natural buyer is design- and mechanics-led: someone who already understands mainstream Swiss luxury and wants marine heritage, visible engineering, a distinctive complication, or a less obvious high-horology choice.",
  }),
  Object.freeze({
    title: "Buying Considerations",
    body: "Reference identification, generation, case size, service history, movement support, complete accessories, and condition matter more than the collection name alone. Complicated and discontinued pieces deserve specialist inspection and conservative service planning.",
  }),
  Object.freeze({
    title: "Quest Luxo Perspective",
    body: "Ulysse Nardin works best when the client is buying a specific idea: marine chronometry, the Freak's architecture, a modern dive watch, or a serious astronomical complication. We would rather match the right watch to an informed collector than sell the brand as a generic alternative to something more familiar.",
  }),
]);

export const ulysseNardinCollections = Object.freeze([
  {
    name: "Marine",
    slug: "marine",
    category: "Marine Chronometry",
    status: "Launch Intelligence Ready",
    tagline: "The direct line from deck chronometers to the wrist.",
    description: "Marine Chronometer and Marine Torpilleur guidance rooted in Ulysse Nardin's precision-navigation heritage.",
    models: ["Marine Chronometer", "Marine Torpilleur"],
    intelligence: {
      historicalOverview: "Marine translates the manufacture's nineteenth-century deck-chronometer authority into wristwatches. Marine Torpilleur later offered a lighter, more restrained interpretation of the same chronometric design language.",
      whyCollectorsBuy: "Collectors buy Marine for authentic brand continuity: this is the collection where the Roman numerals, power-reserve displays, precision narrative, and nautical identity feel earned rather than decorative.",
      signatureDesignLanguage: "Roman numerals, cathedral-style hands, fluted or coin-edged bezels, strong minute tracks, power-reserve indications, and numbered case-side plates are recurring signatures.",
      technicalHighlights: "Modern examples use in-house automatic or manual movements, silicon regulating components, and chronometer-focused architecture. Exact caliber and certification depend on the reference.",
      notableComplications: "The family has included power reserve, small seconds, annual calendars, chronographs, dual time, moon phases, tourbillons, and high-end marine-inspired complications.",
      marketPositioning: "Marine occupies a connoisseur dress-sport lane. It is more historically legible than many modern Ulysse Nardin collections, but secondary demand is selective by size, dial, metal, and complication.",
      collectorProfile: "Best for clients who value chronometry, traditional dials, independent-manufacture credibility, and quieter ownership over immediate public recognition.",
      buyingConsiderations: "Choose the exact Marine branch first: time and date, Torpilleur, calendar, chronograph, or high complication. Then confirm case size, caliber, dial technique, service record, and whether the complete set supports the watch's description.",
      ownershipExperience: "Marine wears as the brand's most traditional proposition. Roman numerals and instrument-like displays are easy to understand, while larger cases, polished surfaces, leather straps, and reference-specific water resistance shape daily use.",
      servicingConsiderations: "Base UN-118 examples are less complex than calendar, tourbillon, or enamel variants, but all deserve qualified movement assessment. Complications, correctors, water resistance, and replacement dial or strap parts should be evaluated reference by reference.",
      liquidityObservations: "Demand is selective rather than uniform. Straightforward steel models generally have a broader comparison set, while precious-metal, enamel, limited, and complicated pieces require a narrower buyer and more patient timing.",
      brokerageConsiderations: "Separate Marine Chronometer, Torpilleur, discontinued generations, and complications before comparing value. Full sets, service documentation, dial condition, case finishing, and realistic pricing materially affect placement.",
      relatedCollections: "Compare Marine with Freak when innovation is the priority, Diver when water-oriented sport use matters, and Blast when the client wants the same manufacture identity in a more architectural form.",
      perspective: "Marine is the most natural first Ulysse Nardin for a collector who wants the brand's history in the watch. We would prioritize a clean, well-documented configuration with proportions that suit the client over a more complicated but less wearable example.",
    },
    evidenceSources: [ulysseNardinSources.heritage, ulysseNardinSources.marine],
  },
  {
    name: "Diver",
    slug: "diver",
    category: "Professional Dive Watch",
    status: "Launch Intelligence Ready",
    tagline: "Modern marine engineering with strong wrist presence.",
    description: "Coverage for Diver, Diver Chronograph, Diver X Skeleton, and the discontinued Maxi Marine Diver family.",
    models: ["Diver", "Diver Chronograph", "Diver X Skeleton", "Maxi Marine Diver"],
    intelligence: {
      historicalOverview: "Ulysse Nardin's modern dive-watch line grew from its broader marine identity, with Maxi Marine Diver establishing a recognizable earlier generation before the current Diver design language and experimental Diver X models.",
      whyCollectorsBuy: "Collectors choose Diver for a less conventional professional-sport watch, often with bold dials, limited editions, unusual materials, or openworked mechanics unavailable from more conservative dive-watch brands.",
      signatureDesignLanguage: "Substantial cases, deeply notched rotating bezels, prominent guards, rubber or textile straps, strong lume, marine motifs, and numbered limited-edition details define much of the family.",
      technicalHighlights: "Depending on the model, highlights include in-house automatic calibers, silicon escapement parts, lightweight case materials, openworked movement construction, and contemporary water-resistant cases.",
      notableComplications: "Time and date models form the practical core, while chronographs, skeletonized displays, limited editions, and specialist material executions broaden the collection.",
      marketPositioning: "Diver competes in a crowded luxury-sport category but differentiates through lower-volume identity and technical design. Liquidity is more configuration sensitive than for the largest mainstream dive-watch families.",
      collectorProfile: "The right buyer wants a bold, genuinely different sports watch and is comfortable with larger dimensions, reference-specific demand, and a more selective resale audience.",
      buyingConsiderations: "Start with wrist fit and intended use, then separate standard Diver, Chronograph, X Skeleton, limited editions, and Maxi Marine generations. Verify material, water resistance, strap or bracelet completeness, and service state before comparing acquisition terms.",
      ownershipExperience: "Most Diver references feel substantial and visually assertive. Rubber and textile straps can make the size manageable, while rotating bezels, crown security, lume, and current water-resistance testing determine whether the watch is ready for active wear.",
      servicingConsiderations: "Pressure testing, seals, crown and bezel function are essential. Chronographs and openworked models add movement complexity, and discontinued Maxi Marine pieces may require advance confirmation of external and movement-parts support.",
      liquidityObservations: "Liquidity depends heavily on size, material, edition, and complication. Conventional time-and-date configurations have the clearest audience; skeleton, chronograph, and discontinued references need reference-specific expectations.",
      brokerageConsiderations: "Confirm size and fit, bezel and crown operation, current water resistance, strap and buckle completeness, service status, material wear, and limited-edition contents. Maxi Marine Diver and Diver X should not share one comparable set.",
      relatedCollections: "Marine provides the more traditional nautical expression, Freak supplies greater mechanical theater, and Blast offers related modern materials and openworked architecture without the dive-watch brief.",
      perspective: "A Ulysse Nardin Diver should win on the wrist. We would buy the configuration whose scale, material, and dial feel intentional for the client, then price it with conservative assumptions about exit speed.",
    },
    evidenceSources: [ulysseNardinSources.heritage],
  },
  {
    name: "Freak",
    slug: "freak",
    category: "Experimental Horology",
    status: "Launch Intelligence Ready",
    tagline: "The movement becomes the display.",
    description: "Coverage for the original Freak concept, Freak X, and Freak ONE.",
    models: ["Freak", "Freak X", "Freak ONE"],
    intelligence: {
      historicalOverview: "Introduced in 2001, Freak rejected a conventional dial-and-hands layout by using the movement itself to indicate time. It also became an important early platform for silicon technology in mechanical watchmaking.",
      whyCollectorsBuy: "Collectors buy Freak because the architecture is unmistakable and historically relevant. It offers a mechanical idea that remains difficult to confuse with any conventional luxury watch.",
      signatureDesignLanguage: "A rotating movement or flying carousel indicates the minutes, while the collection minimizes or eliminates conventional dial furniture. Original Freak models used bezel-based setting; later branches vary in operation and wearability.",
      technicalHighlights: "Silicon components, carousel movement architecture, highly visible gear trains, unusual winding and setting systems, and successive in-house calibers define the technical story.",
      notableComplications: "The core complication is the movement-as-display concept itself. Across the wider family, tourbillon-like carousels, advanced escapements, dual oscillators, and experimental materials add complexity.",
      marketPositioning: "Freak is Ulysse Nardin's clearest high-horology signature. Freak X offers a more accessible, crown-operated path, while Freak ONE and higher complications sit in a more specialized collector tier.",
      collectorProfile: "Best for an experienced collector who values invention, visible mechanics, and design independence more than conventional status signals or effortless liquidity.",
      buyingConsiderations: "Identify the generation before discussing value. Crownless Freak, Freak X, Freak ONE, and higher complications differ in winding, setting, movement, dimensions, materials, and service exposure even when their rotating displays appear related.",
      ownershipExperience: "Freak ownership is intentionally participatory: the movement is the display, and some generations use bezel-based winding or setting. The scale and unconventional operation are part of the appeal but should be experienced before purchase.",
      servicingConsiderations: "Use manufacturer-qualified support and confirm the carousel, escapement generation, winding and setting systems, shock history, and complete service record. Transportation and handling also deserve more care than with a conventional three-hand watch.",
      liquidityObservations: "The collection has strong recognition among informed enthusiasts but thin transaction depth at the individual-reference level. Provenance, mechanical credibility, and generation accuracy carry unusual weight.",
      brokerageConsiderations: "Generation and operating system must be explained precisely. Confirm service history, manufacturer support, case and crystal condition, winding and setting function, complete set, and whether the buyer understands the reference's daily-use differences.",
      relatedCollections: "Blast is the closest contemporary alternative for visible mechanics, while Marine expresses the manufacture's traditional side and Moonstruck extends its unconventional thinking into astronomical display.",
      perspective: "Freak is the collection we would recommend when a client wants the Ulysse Nardin idea at full strength. The right example should be mechanically sound, well documented, and chosen with a long ownership horizon rather than a quick-exit assumption.",
    },
    evidenceSources: [ulysseNardinSources.heritage, ulysseNardinSources.freak],
  },
  {
    name: "Executive",
    slug: "executive",
    category: "Modern Complication",
    status: "Launch Intelligence Ready",
    tagline: "Architectural complications from an earlier modern era.",
    description: "Collection guidance for Executive Dual Time and Executive Skeleton.",
    models: ["Executive Dual Time", "Executive Skeleton"],
    intelligence: {
      historicalOverview: "Executive represents an earlier modern Ulysse Nardin design language built around architectural cases, Roman numerals, travel functionality, and openworked complications. Much of the family now belongs to the discontinued market.",
      whyCollectorsBuy: "Collectors are drawn to Executive for strong design, useful Dual Time functionality, and skeletonized mechanics at a different market position from the better-known Freak and Blast families.",
      signatureDesignLanguage: "Large Roman numerals, assertive lugs, geometric bezels, open dial structures, visible movement elements, and strong contrast give Executive its identity.",
      technicalHighlights: "The Dual Time system emphasizes practical local-time adjustment, while skeleton and tourbillon executions expose more of the manufacture's movement architecture.",
      notableComplications: "Dual time, big date, small seconds, skeletonization, and tourbillon variants are the collection's principal complication lanes.",
      marketPositioning: "Executive is a discontinued or legacy specialist category with potentially attractive entry value, but lower market depth and greater dependence on exact reference, condition, and service support.",
      collectorProfile: "It suits buyers who like bold 2000s and 2010s independent watch design, want useful complications, and are comfortable owning outside today's most promoted collections.",
      buyingConsiderations: "Distinguish Dual Time, Skeleton, and tourbillon references before comparing examples. The full reference, operating system, caliber, case material, original buckle, service documentation, and parts outlook should all be known before purchase.",
      ownershipExperience: "Executive combines large architectural cases with practical or openworked complications. Dual Time can be genuinely useful, while the collection's assertive Roman numerals and proportions make fit and personal taste decisive.",
      servicingConsiderations: "Discontinued status raises the importance of manufacturer parts support. Test travel-time adjustment, correctors, date change, skeleton or tourbillon functions, and confirm the condition of proprietary straps, buckles, pushers, and crowns.",
      liquidityObservations: "This is a legacy specialist market with limited buyer depth. Complete, mechanically healthy Dual Time examples are easier to explain than unusual skeleton or tourbillon variants, but none should be underwritten for a quick exit.",
      brokerageConsiderations: "Verify the exact reference, production era, movement function, service history, case and strap condition, original buckle, and replacement-part path. Asking-price discounts are not useful without service and condition context.",
      relatedCollections: "Blast evolved the brand's architectural language into a current platform. Freak offers a more historically important experimental proposition, while Marine is the calmer choice for traditional buyers.",
      perspective: "Executive can be a smart enthusiast purchase when the watch is complete, mechanically healthy, and priced for a selective market. We would avoid buying solely because a complicated watch appears inexpensive relative to retail.",
    },
    evidenceSources: [ulysseNardinSources.heritage],
  },
  {
    name: "Blast",
    slug: "blast",
    category: "Contemporary High Horology",
    status: "Launch Intelligence Ready",
    tagline: "Openworked architecture and modern complications.",
    description: "Launch-quality guidance for Blast and Blast Tourbillon.",
    models: ["Blast", "Blast Tourbillon"],
    intelligence: {
      historicalOverview: "Blast is Ulysse Nardin's contemporary high-horology platform, bringing openworked movements, angular cases, modern materials, and major complications into a deliberately architectural design.",
      whyCollectorsBuy: "Collectors choose Blast for visual mechanics and technical presence: flying tourbillons, skeletonized structures, chiming watches, astronomical displays, and unconventional finishing are meant to be seen.",
      signatureDesignLanguage: "Faceted lugs, X-shaped geometry, openworked dials, sharply layered cases, integrated-looking straps, and high contrast create the collection's modern identity.",
      technicalHighlights: "In-house openworked movements, flying tourbillons, silicon technology, constant-force research, advanced materials, and technically ambitious finishing define the platform.",
      notableComplications: "Blast includes tourbillons, Skeleton X models, Dual Time, Hourstriker and chiming mechanisms, Free Wheel constructions, and Moonstruck astronomical functions.",
      marketPositioning: "Blast occupies a specialized contemporary high-horology lane. It offers technical content and strong design, but buyer matching is narrower and configuration differences have a large effect on liquidity.",
      collectorProfile: "Best for clients who want visible mechanics and modern independent design, and who accept large cases, high service complexity, and a less standardized secondary market.",
      buyingConsiderations: "Select the complication before the color or material. Dual Time, Skeleton X, Tourbillon, Hourstriker, Free Wheel, and Moonstruck occupy different ownership and service tiers and should never share one undifferentiated comparable set.",
      ownershipExperience: "Blast is visually and physically assertive, with faceted cases, integrated-looking straps, and exposed mechanics. Simpler 42 mm models can be more adaptable; 45 mm high complications are deliberate statement pieces.",
      servicingConsiderations: "The exact caliber governs the plan. Openworked, tourbillon, chiming, and astronomical movements require manufacturer-qualified assessment, while coatings, composite case components, proprietary straps, and clasps need material-specific inspection.",
      liquidityObservations: "Demand is complication and configuration specific. Recognizable tourbillons may have a clearer narrative, but buyer pools remain narrow and no Blast execution should inherit another's liquidity assumptions.",
      brokerageConsiderations: "Separate time-only, skeleton, tourbillon, chiming, and astronomical references. Confirm exact material, movement, limited status, service path, strap and buckle, case condition, and realistic market depth.",
      relatedCollections: "Freak is the historical counterpart for movement-as-display innovation, Executive is the design predecessor, and Moonstruck represents the astronomical extreme within the broader Blast platform.",
      perspective: "Blast is most convincing when the complication and case architecture feel inseparable. We would guide a client toward the simplest model that fully delivers the experience they want, rather than paying for complexity they will not use or understand.",
    },
    evidenceSources: [ulysseNardinSources.blast, ulysseNardinSources.heritage],
  },
  {
    name: "Moonstruck",
    slug: "moonstruck",
    category: "Astronomical Complication",
    status: "Launch Intelligence Ready",
    tagline: "A celestial display built for the wrist.",
    description: "Dedicated guidance for Moonstruck, world time, moon-phase innovation, and astronomical display mechanics.",
    models: ["Moonstruck", "Blast Moonstruck"],
    intelligence: {
      historicalOverview: "The Moonstruck concept appeared in 2009 and continued Ulysse Nardin's astronomical-watch tradition. The later Blast Moonstruck translates that work into the brand's contemporary openworked case language.",
      whyCollectorsBuy: "Collectors buy Moonstruck for intellectual and visual depth. It turns the relationship between local time, world time, the sun, the moon, lunar phases, and tides into a display that is both technical and poetic.",
      signatureDesignLanguage: "A geocentric world map, orbital indications, layered celestial displays, peripheral time information, and a large modern case distinguish Moonstruck from a conventional world timer or moon-phase watch.",
      technicalHighlights: "The current expression uses an automatic manufacture caliber with silicon escapement technology and coordinated astronomical indications designed to show the apparent paths of the sun and moon.",
      notableComplications: "World time, dual time, date, precision moon phase, lunar month, tidal coefficients, and indications for the positions of the sun and moon form the core complication set.",
      marketPositioning: "Moonstruck is an ultra-specialized astronomical complication. Public transaction depth is limited, and value depends on exact generation, completeness, condition, service support, and finding a collector who understands the display.",
      collectorProfile: "The natural owner is an advanced collector interested in astronomy, Ludwig Oechslin's complication legacy, unconventional displays, and the practical responsibility of owning a complex independent-manufacture watch.",
      buyingConsiderations: "Separate the 2009 concept and later Blast Moonstruck before reviewing an example. Require exact-generation documentation, a complete functional demonstration, setting instructions, service history, full accessories, and confirmation that the 45 mm current case suits the buyer.",
      ownershipExperience: "Moonstruck is an educational object as much as a timekeeper. Reading and setting its world-time, solar, lunar, and tidal information rewards engagement, but the scale and complication density make it unsuitable as an effortless everyday watch for many clients.",
      servicingConsiderations: "Astronomical synchronization, correctors, world-time and dual-time functions, display discs, and the base movement require manufacturer-level expertise. A written service path and operating demonstration should precede any transaction.",
      liquidityObservations: "The buyer market is exceptionally narrow and public listings are weak evidence of executable value. Generation, completeness, recent specialist service, and access to a knowledgeable collector dominate liquidity.",
      brokerageConsiderations: "Require complete documentation, demonstration of every function, confirmed setting procedures, recent specialist service evidence, accessory completeness, case and dial inspection, and a realistic acquisition horizon.",
      relatedCollections: "Blast supplies the current case architecture, Freak offers similarly unconventional mechanics with a simpler information display, and Marine links lunar and nautical themes in a more traditional format.",
      perspective: "Moonstruck is not a casual complication purchase. For the right collector it can be one of the most expressive astronomical watches available; for everyone else, the setting complexity, service exposure, size, and thin buyer market deserve real restraint.",
    },
    evidenceSources: [ulysseNardinSources.moonstruck, ulysseNardinSources.heritage],
  },
] as const satisfies readonly UlysseNardinCollection[]);

export function getUlysseNardinCollection(slug: string): UlysseNardinCollection | undefined {
  return ulysseNardinCollections.find((collection) => collection.slug === slug);
}
