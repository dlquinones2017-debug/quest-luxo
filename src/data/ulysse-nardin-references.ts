import type { QuestLuxoAsset } from "../types/questLuxo";
import type {
  BrokerageEvidenceSource,
  BrokerageExposureBand,
  BrokerageLiquidityBand,
  ReferenceBrokerageIntelligence,
} from "../types/brokerageIntelligence";
import type { UlysseNardinCollectionSlug } from "./ulysse-nardin";

export type UlysseNardinReferenceAsset = QuestLuxoAsset & {
  brand: "Ulysse Nardin";
  collection: "Marine" | "Diver" | "Freak" | "Executive" | "Blast" | "Moonstruck";
  collectionSlug: UlysseNardinCollectionSlug;
};

interface ReferenceGuideSpec {
  reference: string;
  collection: UlysseNardinReferenceAsset["collection"];
  collectionSlug: UlysseNardinCollectionSlug;
  caseSize: string;
  movement: string;
  material: string;
  bezel: string;
  productionStatus: string;
  overview: string;
  configurationSummary: string;
  collectorNotes: string;
  typicalBuyer: string;
  marketPosition: string;
  liquidityBand: BrokerageLiquidityBand;
  liquidityDiscussion: string;
  serviceExposure: BrokerageExposureBand;
  serviceConsiderations: string;
  ownershipComplexity: BrokerageExposureBand;
  conditionConsiderations: string;
  brokerageOpportunities: string;
  buyerGuidance: string;
  sellerGuidance: string;
  perspective: string;
  evidenceSources: readonly BrokerageEvidenceSource[];
}

const officialSources = {
  marine: [{ label: "Ulysse Nardin - Marine Collection", url: "https://www.ulysse-nardin.com/watches/marine" }],
  diver: [{ label: "Ulysse Nardin - Diver Collection", url: "https://www.ulysse-nardin.com/watches/diver" }],
  freak: [{ label: "Ulysse Nardin - Freak Collection", url: "https://www.ulysse-nardin.com/en-us/watches/freak" }],
  blast: [{ label: "Ulysse Nardin - Blast Collection", url: "https://www.ulysse-nardin.com/watches/blast" }],
  moonstruck: [{ label: "Ulysse Nardin - Blast Moonstruck", url: "https://www.ulysse-nardin.com/en-eu/watches/blast/1063-400-2a-3b" }],
  heritage: [{ label: "Ulysse Nardin - Heritage", url: "https://www.ulysse-nardin.com/about-us/heritage" }],
} as const;

interface ReferenceIntelligenceExpansion {
  history: string;
  innovations: string;
  complications: string;
  ownershipExperience: string;
  relatedCollections: string;
}

const referenceIntelligenceExpansion: Readonly<Record<string, ReferenceIntelligenceExpansion>> = {
  "Marine Chronometer": {
    history: "Marine Chronometer carries the manufacture's deck-chronometer identity into a modern wristwatch format, preserving a direct connection between Ulysse Nardin's nineteenth-century precision work and its contemporary catalog.",
    innovations: "Representative modern examples pair traditional instrument styling with the manufacture UN-118, silicon-related regulating technology, and a movement architecture intended to make chronometric credibility part of daily ownership.",
    complications: "The core display typically combines hours, minutes, small seconds, date, and power reserve; calendar, chronograph, tourbillon, and other Marine relatives must be treated as separate references.",
    ownershipExperience: "It is a substantial but conventional watch to operate, with high dial legibility and a stronger dress-sport character than a pure dress watch. Case size, strap choice, and water-resistance status determine everyday versatility.",
    relatedCollections: "Marine Torpilleur offers a lighter expression of the same heritage; Diver moves the nautical identity into a sports case; Freak and Blast emphasize the manufacture's experimental side.",
  },
  "Marine Torpilleur": {
    history: "Marine Torpilleur reframed the Marine design vocabulary in a more restrained form, drawing its name from smaller naval torpedo boats while retaining the collection's chronometer-inspired identity.",
    innovations: "The family combines in-house movements and silicon-related technology with traditional displays, and has served as a platform for enamel dials, moon phases, annual chronographs, dual time, and constant-force tourbillons.",
    complications: "Core pieces are time, date, small seconds, and power reserve watches; moon phase, annual chronograph, dual time, and tourbillon executions add materially different setting and service requirements.",
    ownershipExperience: "The cleaner proportions make Torpilleur one of the easier Ulysse Nardin families to wear regularly, though dial technique, complication, strap, and case metal can shift it from everyday dress watch to specialist collectible.",
    relatedCollections: "Marine Chronometer is the more assertive traditional sibling, while Freak and Blast offer progressively more experimental alternatives and Moonstruck takes the nautical-celestial connection to its extreme.",
  },
  "Diver Chronograph": {
    history: "Diver Chronograph belongs to the modernized Diver generation that followed the Maxi Marine era, adding a manufacture chronograph to Ulysse Nardin's contemporary 44 mm dive-watch platform.",
    innovations: "Its UN-150 automatic chronograph, material variety, silicon-related movement technology, dive-case construction, and reference-specific limited editions distinguish it from conventional modular sports chronographs.",
    complications: "Central chronograph seconds, elapsed-minute and hour registers, small seconds, and date sit alongside a rotating dive bezel; exact layouts and water resistance must be confirmed from the full reference.",
    ownershipExperience: "The watch is large, sporty, and mechanically engaging. Chronograph operation adds useful interaction, while wrist fit, strap condition, bezel action, and current pressure testing determine whether it is ready for active use.",
    relatedCollections: "The standard Diver is the simpler functional alternative, Diver X Skeleton adds visible architecture, and Maxi Marine Diver provides the discontinued design predecessor.",
  },
  "Diver X Skeleton": {
    history: "Diver X Skeleton extends the modern Diver line into openworked high horology, combining the brand's sports-watch platform with a movement-forward design language associated with Freak and Blast.",
    innovations: "The automatic UN-372, openworked display, contemporary composites, and dive-watch case construction unite visible mechanics with a format that is normally closed and instrument focused.",
    complications: "Its defining feature is the openworked time display rather than a long complication list; exact references add edition-specific materials, bezel construction, and water-resistance specifications.",
    ownershipExperience: "It feels more like an architectural sports watch than a conventional diver. The exposed mechanics reward close viewing, while 44 mm proportions, material care, and strap integration make fit and handling central.",
    relatedCollections: "Diver Chronograph is the function-led sibling, standard Diver is the cleaner sports choice, Freak supplies the movement-as-display heritage, and Blast offers the closest architectural counterpart.",
  },
  "Maxi Marine Diver": {
    history: "Maxi Marine Diver represents the earlier modern Ulysse Nardin dive-watch era and established the bold numerals, marine motifs, power-reserve displays, and substantial cases that preceded today's Diver family.",
    innovations: "Across its generations, the family combined chronometer-minded automatic movements, nautical design, robust cases, and a wide range of materials and limited themes rather than one uniform technical formula.",
    complications: "Time, date, small seconds, and power reserve are common, while exact functions and movements vary by case reference and production era.",
    ownershipExperience: "The design is unmistakably of its period and often wears with considerable presence. A healthy example can be an engaging daily sports watch, but aging rubber, seals, bezels, bracelets, and lume affect the experience.",
    relatedCollections: "Current Diver is the direct successor, Marine Chronometer shares the nautical instrument language, and Executive reflects a related era of bold Ulysse Nardin case design.",
  },
  "Freak": {
    history: "Introduced in 2001, the original Freak became a defining modern Ulysse Nardin watch by eliminating the conventional dial, hands, and crown and using the movement itself to indicate time.",
    innovations: "Freak became an early proving ground for silicon in mechanical watchmaking, carousel displays, novel escapements, and unconventional winding and setting systems that evolved substantially across generations.",
    complications: "The foundational complication is the rotating movement display. Later Freak references add advanced escapements, dual oscillators, tourbillon-like carousels, and material experiments that require exact-generation identification.",
    ownershipExperience: "Operating a crownless Freak can be part of the pleasure: winding and setting through bezel systems makes the watch feel mechanically direct. Large cases and unconventional handling reward deliberate ownership.",
    relatedCollections: "Freak X is the crown-operated entry, Freak ONE is the current crownless flagship, Blast translates visible mechanics into an angular case, and Moonstruck applies similar independence to astronomy.",
  },
  "Freak X": {
    history: "Freak X broadened the collection by translating the rotating movement display into a smaller, crown-operated, self-winding package with more conventional daily usability.",
    innovations: "The UN-230 combines Freak's flying-carousel display with automatic winding and crown setting, while titanium, Carbonium, and limited material executions expand the platform.",
    complications: "Hours and minutes are displayed through the rotating movement architecture; the principal distinction is the display and operating system rather than an added calendar or chronograph.",
    ownershipExperience: "A crown and automatic winding make Freak X easier to integrate into a rotation. It retains mechanical theater but asks less of the owner than crownless or more complicated Freak generations.",
    relatedCollections: "Freak ONE delivers the crownless flagship experience, earlier Freak watches carry greater historical variety, and Blast Skeleton X provides another wearable openworked route.",
  },
  "Freak ONE": {
    history: "Freak ONE consolidates more than two decades of Freak development into a current flagship that restores the collection's no-dial, no-hands, and no-crown identity.",
    innovations: "The automatic UN-240 flying carousel, DIAMonSIL escapement, automatic winding, and bezel-based interaction bring foundational Freak ideas into a modern operating package.",
    complications: "Hours and minutes are expressed through the flying carousel, with the movement itself forming the visual display and bezel systems handling winding and setting.",
    ownershipExperience: "Freak ONE is deliberately immersive: its 44 mm scale, moving architecture, and crownless ritual make interaction part of the product. It suits a collector who wants the watch to feel unlike a conventional daily wearer.",
    relatedCollections: "Freak X is the more conventional entry point, historical Freak provides deeper generational variety, and Blast Tourbillon offers comparable theater in a different case architecture.",
  },
  "Executive Dual Time": {
    history: "Executive Dual Time belongs to the bold pre-Blast era of Ulysse Nardin design, pairing architectural cases and Roman numerals with a practical travel-time system.",
    innovations: "Its independently adjustable local-hour display makes travel-time changes direct, while the collection's case and dial architecture anticipated elements later developed in Blast.",
    complications: "Dual time, date, small seconds, and generation-specific adjustment systems form the practical complication set; exact caliber and controls depend on the full reference.",
    ownershipExperience: "The travel function can be genuinely useful, but large proportions and assertive styling make fit personal. As a discontinued watch, confidence in service and proprietary external parts strongly shapes ownership.",
    relatedCollections: "Blast is the architectural successor, Freak is the more radical mechanical alternative, and Marine dual-time references provide a more traditional travel-watch expression.",
  },
  "Blast": {
    history: "Blast developed from Ulysse Nardin's earlier Executive and Skeleton design language into a current platform for angular cases, exposed mechanics, modern materials, and major complications.",
    innovations: "The family combines openworked calibers, flying tourbillons, dual time, chiming systems, silicon technology, artistic techniques, and advanced case materials under one architectural identity.",
    complications: "Blast is a platform rather than one complication: Dual Time, Skeleton X, Tourbillon, Hourstriker, Free Wheel, and Moonstruck must each be evaluated as distinct mechanical propositions.",
    ownershipExperience: "Depending on the submodel, Blast can range from a wearable 42 mm openworked watch to a 45 mm specialist complication. Strong case geometry and proprietary straps make wrist fit and configuration selection essential.",
    relatedCollections: "Executive is the design predecessor, Freak is the innovation-led counterpart, Diver X Skeleton adds a sports brief, and Moonstruck is the astronomical branch of the Blast platform.",
  },
  "Blast Tourbillon": {
    history: "Blast Tourbillon established the collection's flagship mechanical identity by placing an automatic flying tourbillon and visible winding architecture inside the angular 45 mm Blast case.",
    innovations: "The UN-172 uses a flying tourbillon, silicon escapement technology, and a front-visible micro-rotor within an extensively openworked layout.",
    complications: "The flying tourbillon is the central complication, with hours and minutes presented through the open architecture; artistic and material editions add execution complexity rather than new core functions.",
    ownershipExperience: "It is a high-presence tourbillon intended to be seen. Three-dimensional mechanics and a substantial case reward visual engagement, while fit, careful handling, and specialist service define practical ownership.",
    relatedCollections: "Blast Skeleton X offers a simpler openworked route, Freak ONE provides a different movement-as-display experience, and Moonstruck adds astronomical information to the broader Blast design language.",
  },
  "Moonstruck": {
    history: "The Moonstruck concept appeared in 2009 as part of Ulysse Nardin's long astronomical tradition; Blast Moonstruck later translated the geocentric display into the current 45 mm architectural platform.",
    innovations: "The UN-106 coordinates world time, dual time, lunar phase and month, tidal information, and the apparent positions of the sun and moon in an integrated geocentric display.",
    complications: "World time, dual time, date, precision moon phase, lunar month, tidal coefficients, and solar and lunar position indications operate as one astronomical system.",
    ownershipExperience: "Reading and setting Moonstruck is part of its appeal. The watch rewards an owner willing to learn the display, preserve its synchronization, accommodate a large case, and plan for specialist support.",
    relatedCollections: "Blast supplies the current case architecture, Marine connects astronomy with navigation in a traditional format, and Freak offers comparable conceptual independence with fewer displayed indications.",
  },
};

function buildReferenceAsset(spec: ReferenceGuideSpec): UlysseNardinReferenceAsset {
  const expansion = referenceIntelligenceExpansion[spec.reference];

  if (!expansion) {
    throw new Error(`Missing Ulysse Nardin intelligence expansion for ${spec.reference}.`);
  }

  const brokerageIntelligence: ReferenceBrokerageIntelligence = {
    history: expansion.history,
    overview: spec.overview,
    innovations: expansion.innovations,
    collectorAppeal: spec.collectorNotes,
    configurationSummary: spec.configurationSummary,
    complications: expansion.complications,
    buyingConsiderations: spec.buyerGuidance,
    liquidityBand: spec.liquidityBand,
    liquidityObservations: spec.liquidityDiscussion,
    serviceExposure: spec.serviceExposure,
    serviceConsiderations: spec.serviceConsiderations,
    ownershipComplexity: spec.ownershipComplexity,
    conditionConsiderations: spec.conditionConsiderations,
    ownershipExperience: expansion.ownershipExperience,
    marketCommentary: `${spec.marketPosition} Public asking prices should not be treated as completed-sale evidence, and this guide intentionally makes no price or performance claim.`,
    brokerageOpportunities: spec.brokerageOpportunities,
    buyerGuidance: `${spec.typicalBuyer} ${spec.buyerGuidance}`,
    sellerGuidance: spec.sellerGuidance,
    relatedCollections: expansion.relatedCollections,
    perspective: spec.perspective,
    reviewedAt: "July 2026",
    evidenceSources: spec.evidenceSources,
  };

  return {
    reference: spec.reference,
    model: spec.reference,
    brand: "Ulysse Nardin",
    collection: spec.collection,
    collectionSlug: spec.collectionSlug,
    configurations: [{
      nickname: "Reference-family configuration",
      caseSize: spec.caseSize,
      movement: spec.movement,
      bracelet: "Strap or bracelet varies by exact reference",
      dial: "Dial and material vary by exact reference",
      originalMSRP: null,
    }],
    material: spec.material,
    bezel: spec.bezel,
    productionStatus: spec.productionStatus,
    marketPosition: spec.marketPosition,
    liquidity: spec.liquidityBand,
    allocationDifficulty: "Reference and configuration dependent",
    questLuxoView: spec.perspective,
    collectorNotes: spec.collectorNotes,
    brokerageIntelligence,
  };
}

const referenceSpecs: readonly ReferenceGuideSpec[] = [
  {
    reference: "Marine Chronometer", collection: "Marine", collectionSlug: "marine",
    caseSize: "43 mm for the representative modern generation; verify exact reference", movement: "Manufacture UN-118 self-winding movement in representative modern examples",
    material: "Steel or precious metal, reference dependent", bezel: "Fluted fixed bezel, reference dependent", productionStatus: "Current and discontinued generations",
    overview: "Marine Chronometer is the direct wristwatch expression of Ulysse Nardin's marine-precision identity, combining instrument-style displays with modern manufacture movements.",
    configurationSummary: "Representative modern pieces are 43 mm and commonly use the automatic UN-118, but dial, metal, strap, water resistance, certification, and complication details must be tied to the full reference.",
    collectorNotes: "Roman numerals, power-reserve indication, small seconds, and a fluted bezel make the family immediately legible as a Ulysse Nardin Marine. Generation accuracy matters more than the shared model name.",
    typicalBuyer: "The typical buyer values real chronometer heritage and a substantial dress-sport watch more than broad brand recognition.",
    marketPosition: "A specialist marine-chronometry watch with selective demand by generation, dial, metal, and completeness.", liquidityBand: "Specialized",
    liquidityDiscussion: "The name is recognizable to informed collectors, but transaction depth is narrower than for mainstream sports watches. Steel, wearable proportions, documentation, and disciplined pricing generally broaden the audience.",
    serviceExposure: "Moderate", serviceConsiderations: "Confirm caliber, service history, rate performance, water-resistance needs, and access to manufacturer-qualified support before purchase.",
    ownershipComplexity: "Moderate", conditionConsiderations: "Inspect polished surfaces, bezel definition, dial and hand condition, crown operation, strap or bracelet completeness, and numbered case details.",
    brokerageOpportunities: "Strongest when matching a marine-history buyer with a clean, correctly identified example rather than treating all Marine Chronometers as interchangeable.",
    buyerGuidance: "Prioritize condition, documented service, fit, and exact configuration over a superficially attractive discount.",
    sellerGuidance: "Provide the complete reference, movement and case documentation, service records, accessories, and clear macro photographs before establishing expectations.",
    perspective: "This is the sensible entry point when a client wants Ulysse Nardin's heritage on the wrist; buy the most coherent example, not automatically the most complicated one.", evidenceSources: officialSources.marine,
  },
  {
    reference: "Marine Torpilleur", collection: "Marine", collectionSlug: "marine",
    caseSize: "42 mm for core time-and-date examples; some complications are 44 mm", movement: "UN-118 self-winding in core models; complication calibers vary",
    material: "Primarily steel, with precious-metal and limited variants", bezel: "Slim fixed bezel", productionStatus: "Current and limited references",
    overview: "Marine Torpilleur is the lighter, more restrained branch of the Marine family, drawing its name and visual cues from smaller, faster naval vessels.",
    configurationSummary: "Core time-and-date models are commonly 42 mm with UN-118, while moon-phase, annual chronograph, dual-time, tourbillon, enamel, and precious-metal versions require separate comparison sets.",
    collectorNotes: "Its appeal is proportion and clarity: Roman numerals, small seconds, power reserve, and open dial space deliver the marine-chronometer idea with less bulk than many earlier Marine watches.",
    typicalBuyer: "The typical buyer wants traditional Ulysse Nardin design in a more versatile, less assertive package.",
    marketPosition: "A connoisseur dress watch whose demand is configuration led, with enamel and limited editions attracting a different audience from standard steel models.", liquidityBand: "Specialized",
    liquidityDiscussion: "Liquidity varies materially by complication and dial. Core steel pieces are easier to compare, while limited or artisanal configurations need a patient, correctly targeted sale.",
    serviceExposure: "Moderate", serviceConsiderations: "Confirm the exact caliber and complication before estimating service exposure; tourbillon, annual-calendar, and moon-phase examples should not inherit assumptions from the base model.",
    ownershipComplexity: "Moderate", conditionConsiderations: "Evaluate dial surface carefully, especially enamel or decorative executions, along with polished case edges, strap, deployant, and complete limited-edition contents.",
    brokerageOpportunities: "Useful for clients seeking independent manufacture substance in a traditional format, particularly when exact-reference research can expose meaningful configuration differences.",
    buyerGuidance: "Choose the complication only if it adds lasting personal value and verify that the watch's dimensions and dial balance work on the wrist.",
    sellerGuidance: "Separate standard, limited, enamel, and complicated references in the presentation and support the watch with service and provenance records.",
    perspective: "Torpilleur is often the more wearable Marine. A well-chosen steel or enamel example can communicate the brand clearly without forcing the client into oversized or overly complex territory.", evidenceSources: officialSources.marine,
  },
  {
    reference: "Diver Chronograph", collection: "Diver", collectionSlug: "diver",
    caseSize: "44 mm", movement: "Manufacture UN-150 self-winding chronograph",
    material: "Titanium, steel, or precious metal by reference", bezel: "Unidirectional rotating dive bezel", productionStatus: "Current and discontinued references",
    overview: "Diver Chronograph combines a modern Ulysse Nardin dive case with elapsed-time registers and the automatic UN-150 chronograph movement.",
    configurationSummary: "The representative family is 44 mm, uses UN-150, and includes multiple case materials, straps or bracelets, dial treatments, and limited editions. Exact water-resistance and edition details must be verified.",
    collectorNotes: "This is a large, technical sports watch. Bezel action, chronograph reset, case material, strap integration, and wrist balance matter as much as the dial color.",
    typicalBuyer: "The typical buyer wants a distinctive, full-size dive chronograph and is comfortable with visible wrist presence and specialist resale demand.",
    marketPosition: "A low-volume alternative to mainstream luxury dive chronographs, differentiated by manufacture identity and material variety.", liquidityBand: "Specialized",
    liquidityDiscussion: "Buyer depth is selective and size narrows the pool. Desirable limited editions can attract enthusiasts but should not be assumed to sell faster than standard configurations.",
    serviceExposure: "Elevated", serviceConsiderations: "Chronograph function, rate, reserve, water resistance, pushers, crown, and bezel should be tested; budget and timing should reflect manufacture chronograph servicing.",
    ownershipComplexity: "Moderate", conditionConsiderations: "Inspect bezel, case edges, DLC or titanium surfaces, seals, bracelet links, rubber condition, clasp, and evidence of saltwater or impact exposure.",
    brokerageOpportunities: "Best positioned through exact material, edition, condition, and fit rather than broad Diver Chronograph comparables.",
    buyerGuidance: "Try the 44 mm case, require a functional inspection, and buy only after confirming that service and replacement strap support suit the intended use.",
    sellerGuidance: "Document chronograph operation, water-resistance testing where recent, full accessories, link count, service history, and all material wear.",
    perspective: "The Diver Chronograph succeeds as an expressive sports watch, not a universal one. The right transaction begins with fit and mechanical condition, then addresses price.", evidenceSources: officialSources.diver,
  },
  {
    reference: "Diver X Skeleton", collection: "Diver", collectionSlug: "diver",
    caseSize: "44 mm", movement: "Manufacture UN-372 self-winding openworked movement",
    material: "Titanium and composite materials, execution dependent", bezel: "Unidirectional rotating dive bezel", productionStatus: "Current and limited references",
    overview: "Diver X Skeleton places an openworked manufacture movement inside the visual and functional framework of a 44 mm Ulysse Nardin dive watch.",
    configurationSummary: "The family is 44 mm and associated with the automatic UN-372, with material, color, edition, strap, and water-resistance details varying by full reference.",
    collectorNotes: "Openworking makes condition and mechanical presentation unusually visible. It is a design-led high-horology diver rather than a simple professional instrument.",
    typicalBuyer: "The typical buyer wants modern materials and visible mechanics in a sporty format and accepts a narrow, taste-specific market.",
    marketPosition: "A specialist openworked sports watch with limited direct comparables and strong dependence on exact edition and condition.", liquidityBand: "Specialized",
    liquidityDiscussion: "The pool of buyers is narrower than for a conventional Diver. Edition appeal does not remove the need for conservative timing and a reference-specific acquisition basis.",
    serviceExposure: "Specialist", serviceConsiderations: "Use manufacturer-qualified inspection for the openworked caliber and confirm operating history, water resistance, shock exposure, and support for edition-specific external components.",
    ownershipComplexity: "Elevated", conditionConsiderations: "Inspect skeletonized components, crystal, composite case sections, bezel, strap and inserts, buckle, and complete limited-edition documentation under magnification.",
    brokerageOpportunities: "A good match for an established collector seeking something genuinely different, provided the broker can verify the exact edition and mechanical state.",
    buyerGuidance: "Do not substitute another Diver X execution as a comparable without reconciling material, edition, movement, completeness, and condition.",
    sellerGuidance: "Lead with the full reference and edition, then supply detailed movement, case, accessory, and service evidence rather than relying on rarity language.",
    perspective: "This watch should be bought for its architecture. If the client does not specifically value the openworked display, a simpler Diver will usually be the clearer ownership decision.", evidenceSources: officialSources.diver,
  },
  {
    reference: "Maxi Marine Diver", collection: "Diver", collectionSlug: "diver",
    caseSize: "Approximately 43 mm for many examples; verify exact generation", movement: "Self-winding movement; caliber varies by generation and reference",
    material: "Steel, titanium, or precious metal by reference", bezel: "Unidirectional rotating dive bezel", productionStatus: "Discontinued",
    overview: "Maxi Marine Diver is the earlier modern dive-watch generation that established many of Ulysse Nardin's bold marine-sport design cues before the current Diver line.",
    configurationSummary: "The family spans numerous generations, metals, dials, limited editions, and movements. Many examples are around 43 mm, but no specification should be assigned without the full case reference.",
    collectorNotes: "Large numerals, small seconds, power reserve on some versions, nautical motifs, and strong case-side identity distinguish the line. Age and configuration variance make catalog accuracy essential.",
    typicalBuyer: "The typical buyer appreciates early-2000s luxury sports-watch design and is willing to research a discontinued reference carefully.",
    marketPosition: "A discontinued enthusiast diver with potentially compelling ownership value but uneven public information and selective demand.", liquidityBand: "Specialized",
    liquidityDiscussion: "Liquidity is highly fragmented by age, material, edition, dial, and condition. A low asking price may simply reflect service exposure or an incomplete set.",
    serviceExposure: "Elevated", serviceConsiderations: "Confirm caliber, parts path, last service, crown and bezel function, water-resistance test, and whether age-related strap or insert components remain available.",
    ownershipComplexity: "Elevated", conditionConsiderations: "Check for polishing, corrosion, moisture, damaged lume, bezel wear, tired rubber, incomplete bracelet links, replacement components, and mismatched papers.",
    brokerageOpportunities: "The opportunity is reference identification and risk control: a properly documented example can be differentiated from loosely described inventory.",
    buyerGuidance: "Require the full reference and a specialist inspection; reserve funds and time for service rather than assuming discontinued equals undervalued.",
    sellerGuidance: "Disclose service needs and replacement parts clearly, and present serial-consistent papers, accessories, link count, and water-resistance status.",
    perspective: "Maxi Marine Diver can be rewarding for the right enthusiast, but it is a condition-and-service purchase first. Apparent value without technical clarity is not a bargain.", evidenceSources: [...officialSources.diver, ...officialSources.heritage],
  },
  {
    reference: "Freak", collection: "Freak", collectionSlug: "freak",
    caseSize: "Approximately 44-45 mm across many generations; verify exact reference", movement: "Manual-winding carousel movement in foundational generations; architecture varies",
    material: "Precious metal, titanium, or advanced materials by generation", bezel: "Time-setting bezel on crownless generations", productionStatus: "Multiple historic generations",
    overview: "The foundational Freak turns the movement into the minute display and rejects the conventional dial, hands, and crown formula that defines most mechanical watches.",
    configurationSummary: "Freak is a multi-generation family rather than one specification. Case size, winding and setting method, escapement, movement, material, and complication must be mapped to the exact reference.",
    collectorNotes: "The value is architectural and historical. Early silicon work, carousel displays, and unusual operating systems make originality, documentation, and specialist knowledge particularly important.",
    typicalBuyer: "The typical buyer is an experienced collector who wants consequential modern horology and accepts unconventional operation, fit, and service responsibility.",
    marketPosition: "A historically important specialist watch with wide variation between foundational, complicated, limited, and later executions.", liquidityBand: "Specialized",
    liquidityDiscussion: "Recognition among informed collectors is high, but individual references trade in thin markets. Provenance and exact generation can matter more than broad Freak branding.",
    serviceExposure: "Specialist", serviceConsiderations: "Manufacturer-qualified assessment is essential. Verify setting and winding systems, carousel operation, escapement generation, service history, parts support, and transport handling.",
    ownershipComplexity: "Specialist", conditionConsiderations: "Inspect movement components, display integrity, case and bezel operation, crystal, original strap and buckle, and any evidence of nonstandard intervention.",
    brokerageOpportunities: "Brokerage adds value by translating generation differences and locating a mechanically credible example for a collector with the right ownership horizon.",
    buyerGuidance: "Understand how the exact watch winds, sets, and wears before committing, and make service documentation a core part of valuation.",
    sellerGuidance: "Provide full provenance, service invoices, operating demonstrations, original accessories, and precise reference identification to reach the correct specialist audience.",
    perspective: "A foundational Freak is bought for the idea as much as the object. We would favor a documented, mechanically understood watch over a more dramatic example with unanswered history.", evidenceSources: [...officialSources.freak, ...officialSources.heritage],
  },
  {
    reference: "Freak X", collection: "Freak", collectionSlug: "freak",
    caseSize: "43 mm", movement: "Manufacture UN-230 self-winding movement",
    material: "Titanium, precious metal, or Carbonium depending on reference", bezel: "Fixed bezel with conventional crown setting", productionStatus: "Current and discontinued references",
    overview: "Freak X packages the flying-carousel display in a smaller, self-winding, crown-operated format intended to be easier to wear and use than the foundational Freak.",
    configurationSummary: "The family is 43 mm and uses the automatic UN-230, while case material, dial treatment, strap, limited status, and color vary across the range.",
    collectorNotes: "Freak X retains the rotating movement display but changes the ownership experience through automatic winding and a crown. It should not be described as operationally identical to a crownless Freak.",
    typicalBuyer: "The typical buyer wants the Freak visual language with more conventional daily operation and a comparatively approachable ownership profile.",
    marketPosition: "The more accessible branch of Freak, with clearer daily-wear appeal but a different collector proposition from the foundational and flagship models.", liquidityBand: "Specialized",
    liquidityDiscussion: "Demand is configuration sensitive. Lightweight and limited variants may attract focused interest, but the overall buyer pool remains specialist.",
    serviceExposure: "Elevated", serviceConsiderations: "Confirm UN-230 performance, carousel operation, crown function, service history, material-specific component support, and correct handling by a qualified service provider.",
    ownershipComplexity: "Elevated", conditionConsiderations: "Inspect the visible movement, crystal, case material, crown, strap, buckle, and edition-specific components; lightweight composites need material-appropriate evaluation.",
    brokerageOpportunities: "A useful bridge for clients intrigued by Freak who do not want the operating or pricing commitment of more complex generations.",
    buyerGuidance: "Compare exact case material and edition, verify fit, and do not value the watch solely by its relationship to higher-tier Freak models.",
    sellerGuidance: "Show the carousel and crown operating correctly and document service, complete accessories, case material, and edition status.",
    perspective: "Freak X is the pragmatic Freak. It is strongest when the client values the display itself and prefers a crown and automatic winding over historical purity.", evidenceSources: officialSources.freak,
  },
  {
    reference: "Freak ONE", collection: "Freak", collectionSlug: "freak",
    caseSize: "44 mm", movement: "Manufacture UN-240 self-winding flying-carousel movement",
    material: "Titanium and reference-specific bezel materials", bezel: "Winding and time-setting bezel system", productionStatus: "Current production",
    overview: "Freak ONE consolidates the collection's defining ideas into a modern flagship: no conventional dial, hands, or crown, with the movement serving as the display.",
    configurationSummary: "The 44 mm platform uses the automatic UN-240 flying-carousel movement. Full reference determines bezel material, color, strap, and edition details.",
    collectorNotes: "It restores the crownless operating ritual while adding automatic winding and contemporary movement technology. The experience is intentionally different from Freak X.",
    typicalBuyer: "The typical buyer wants the clearest current expression of Freak and is comfortable with a large, highly technical, crownless watch.",
    marketPosition: "A current high-horology flagship with strong conceptual identity and a selective collector market.", liquidityBand: "Specialized",
    liquidityDiscussion: "The model has meaningful recognition within modern independent horology, but transaction depth remains limited and configuration-specific. A quick exit should not be assumed.",
    serviceExposure: "Specialist", serviceConsiderations: "Verify UN-240 operation, bezel winding and setting, carousel performance, warranty or service history, and manufacturer support before acquisition.",
    ownershipComplexity: "Elevated", conditionConsiderations: "Inspect the exposed movement, crystal, bezel interfaces, titanium case, strap and buckle, and complete delivery set with particular care.",
    brokerageOpportunities: "Ideal for matching an informed collector to the current flagship while explaining how its operating system differs from Freak X and earlier Freak generations.",
    buyerGuidance: "Spend time operating and wearing the watch, confirm service coverage, and enter with a long ownership horizon.",
    sellerGuidance: "Present warranty and service status, a clear operating demonstration, complete accessories, and detailed condition photography.",
    perspective: "Freak ONE is the modern reference point for the collection. It should be chosen because the crownless ritual and moving architecture feel essential, not merely unusual.", evidenceSources: officialSources.freak,
  },
  {
    reference: "Executive Dual Time", collection: "Executive", collectionSlug: "executive",
    caseSize: "Approximately 43 mm for representative modern examples; verify exact reference", movement: "Self-winding dual-time movement; caliber varies by generation",
    material: "Steel, titanium, or precious metal by reference", bezel: "Fixed architectural bezel", productionStatus: "Discontinued",
    overview: "Executive Dual Time is a discontinued travel-watch family pairing bold Roman-numeral design with independently adjustable local time and a home-time display.",
    configurationSummary: "Representative modern examples are around 43 mm, but the Executive name covers several eras. Exact caliber, case, date display, dial, strap, and water resistance require the full reference.",
    collectorNotes: "The practical local-time system is the central attraction. Buyers should distinguish earlier and later case generations rather than relying on the shared Executive label.",
    typicalBuyer: "The typical buyer wants useful travel functionality and assertive Ulysse Nardin design at a discontinued-market entry point.",
    marketPosition: "A legacy complication with selective enthusiast demand and potentially wide variation in condition and service state.", liquidityBand: "Specialized",
    liquidityDiscussion: "Public demand is thin and exact configuration matters. Discount to original retail is not evidence of value without service, condition, and parts-support context.",
    serviceExposure: "Elevated", serviceConsiderations: "Test local-time adjustment, home-time indication, date change, pushers or correctors where fitted, rate, reserve, and manufacturer parts support.",
    ownershipComplexity: "Elevated", conditionConsiderations: "Inspect large polished surfaces, lugs, crown and pushers, dial and numerals, original strap and deployant, and any replacement components.",
    brokerageOpportunities: "The broker's role is to identify the exact generation and find a complete, mechanically credible travel watch for a buyer who understands the legacy design.",
    buyerGuidance: "Buy on function, condition, completeness, and supportability; do not let apparent complication-per-dollar override ownership risk.",
    sellerGuidance: "Demonstrate every travel-time function and provide full reference, service history, accessories, and transparent condition disclosure.",
    perspective: "Executive Dual Time can be a clever enthusiast choice when it is healthy and correctly priced. It is not a substitute for a current watch with simpler support merely because it looks inexpensive.", evidenceSources: officialSources.heritage,
  },
  {
    reference: "Blast", collection: "Blast", collectionSlug: "blast",
    caseSize: "42-45 mm depending on complication and execution", movement: "Manufacture self-winding movement; caliber depends on the exact Blast model",
    material: "Titanium, steel, ceramic, Carbonium, or precious metal by reference", bezel: "Fixed architectural bezel", productionStatus: "Current collection",
    overview: "Blast is Ulysse Nardin's contemporary architectural platform, spanning openworked, dual-time, tourbillon, chiming, and artistic executions rather than one uniform reference.",
    configurationSummary: "Cases generally fall in the 42-45 mm range, but movement, complication, material, strap, and dimensions must be established from the full reference before comparison.",
    collectorNotes: "Faceted lugs, X-shaped structures, open displays, and modern materials define the family. The complication is not a minor variant; it changes service exposure and market audience.",
    typicalBuyer: "The typical buyer wants visible mechanics and assertive contemporary high horology, and is comfortable choosing design over universal wearability.",
    marketPosition: "A specialist modern high-horology family whose submodels occupy materially different price, complexity, and liquidity tiers.", liquidityBand: "Specialized",
    liquidityDiscussion: "There is no responsible family-wide liquidity claim. Dual Time, Skeleton X, tourbillon, chiming, and artistic pieces require distinct comparable and buyer sets.",
    serviceExposure: "Specialist", serviceConsiderations: "Identify the exact caliber and complication first, then confirm service history, warranty, parts support, setting procedures, and expected manufacturer turnaround.",
    ownershipComplexity: "Elevated", conditionConsiderations: "Inspect layered case components, openworked movement areas, crystals, coatings, straps, deployants, and limited or artistic elements using material-specific standards.",
    brokerageOpportunities: "Brokerage is most useful in narrowing the broad family to the complication and execution that genuinely fits the client's taste and ownership tolerance.",
    buyerGuidance: "Start with the complication, size, and material, then compare only genuinely similar references and confirm long-term service support.",
    sellerGuidance: "Lead with the exact reference and complication, supported by complete documentation, service evidence, and detailed material-condition photographs.",
    perspective: "Blast is not one watch. The right purchase is the least complicated reference that fully delivers the architecture and experience the client actually wants.", evidenceSources: officialSources.blast,
  },
  {
    reference: "Blast Tourbillon", collection: "Blast", collectionSlug: "blast",
    caseSize: "45 mm", movement: "Manufacture UN-172 self-winding flying tourbillon",
    material: "Titanium and precious-metal combinations, reference dependent", bezel: "Fixed architectural bezel", productionStatus: "Current and limited references",
    overview: "Blast Tourbillon is the collection's core 45 mm openworked flying-tourbillon expression, using the automatic UN-172 and a visible micro-rotor architecture.",
    configurationSummary: "The platform is 45 mm with UN-172, while case material, coating, strap, color, artistic treatment, and limited status vary by complete reference.",
    collectorNotes: "The flying tourbillon and front-visible winding architecture are central to the design. Material and edition differences can materially alter both condition assessment and buyer appeal.",
    typicalBuyer: "The typical buyer wants a dramatic modern tourbillon and accepts large proportions, specialist servicing, and a concentrated resale audience.",
    marketPosition: "A contemporary independent-manufacture tourbillon with strong visual identity and a narrow transaction market.", liquidityBand: "Specialized",
    liquidityDiscussion: "Tourbillon recognition does not create broad liquidity. Exact material, edition, completeness, service status, and acquisition basis determine practical exit options.",
    serviceExposure: "Specialist", serviceConsiderations: "Require manufacturer-qualified assessment of UN-172, tourbillon operation, automatic winding, shock history, warranty status, and service documentation.",
    ownershipComplexity: "Specialist", conditionConsiderations: "Inspect the exposed caliber, cage, crystals, case junctions, coatings, strap and buckle, and any gem-set or artistic work under magnification.",
    brokerageOpportunities: "A broker can compare truly like-for-like executions and connect a mechanically credible example with a client specifically seeking modern tourbillon architecture.",
    buyerGuidance: "Treat service support and fit as gating questions, then value the exact material and edition without assuming rarity guarantees demand.",
    sellerGuidance: "Provide operating video, service and warranty records, full-set documentation, exact material description, and transparent macro condition evidence.",
    perspective: "Blast Tourbillon is compelling when the movement and case architecture feel inseparable. It should be acquired for long-term enjoyment, with no assumption of fast resale.", evidenceSources: officialSources.blast,
  },
  {
    reference: "Moonstruck", collection: "Moonstruck", collectionSlug: "moonstruck",
    caseSize: "45 mm for Blast Moonstruck; legacy generations differ", movement: "Manufacture UN-106 self-winding astronomical movement in Blast Moonstruck",
    material: "Titanium and ceramic for Blast Moonstruck; legacy references vary", bezel: "Fixed bezel with layered astronomical display", productionStatus: "Current Blast model and discontinued predecessors",
    overview: "Moonstruck is Ulysse Nardin's geocentric astronomical concept, coordinating world time, sun and moon positions, lunar information, and tidal indications in a wristwatch display.",
    configurationSummary: "The current Blast Moonstruck is 45 mm with automatic UN-106. Earlier Moonstruck generations use different cases and calibers and must not inherit the current model's specification.",
    collectorNotes: "The attraction is intellectual as well as visual: the display links civil time, lunar cycles, solar position, and tides. Correct setting knowledge and documentation are part of ownership.",
    typicalBuyer: "The typical buyer is an advanced collector interested in astronomy and Ludwig Oechslin's complication legacy, with patience for a large and complex watch.",
    marketPosition: "An ultra-specialized astronomical complication with very limited direct comparables and a correspondingly narrow buyer pool.", liquidityBand: "Specialized",
    liquidityDiscussion: "Transactions are infrequent enough that public listings provide weak guidance. Generation, completeness, service, and access to a qualified buyer dominate practical liquidity.",
    serviceExposure: "Specialist", serviceConsiderations: "Require manufacturer involvement to confirm every astronomical indication, setting procedure, UN-106 condition, calibration, warranty, and future service path.",
    ownershipComplexity: "Specialist", conditionConsiderations: "Inspect all display discs and indications, correctors, crystals, case materials, strap and buckle, documentation, setting tools, and complete accessories.",
    brokerageOpportunities: "The highest-value work is education, mechanical verification, provenance review, and matching the watch with a collector who understands the display and ownership obligations.",
    buyerGuidance: "Do not proceed without a full functional demonstration, written setting guidance, service clarity, complete documentation, and a long ownership horizon.",
    sellerGuidance: "Supply a complete function demonstration, manufacturer service evidence, every accessory and document, and precise disclosure of any setting or display issue.",
    perspective: "Moonstruck can be one of the brand's most rewarding watches for the right collector. For anyone uncertain about its scale, operation, or service responsibility, restraint is the better advice.", evidenceSources: officialSources.moonstruck,
  },
];

export const ulysseNardinReferenceAssets = referenceSpecs.map(buildReferenceAsset);

export function getUlysseNardinReferencesForCollection(collectionSlug: string): UlysseNardinReferenceAsset[] {
  return ulysseNardinReferenceAssets.filter((asset) => asset.collectionSlug === collectionSlug);
}
