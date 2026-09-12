import { omegaSpeedmasterAssets, type OmegaAsset } from "./omega";
import type {
  BrandBrokerageIntelligence,
  CollectionBrokerageIntelligence,
  ReferenceBrokerageIntelligence,
} from "../types/brokerageIntelligence";

const omegaHistorySource = Object.freeze({
  label: "Omega - Our Past, Present and Future",
  url: "https://press.omegawatches.com/our-past-present-and-future/",
});
const speedmasterHistorySource = Object.freeze({
  label: "Omega - 60 Years Since NASA Qualification",
  url: "https://press.omegawatches.com/60-years-since-nasa-qualification/",
});
const speedmasterMarketSource = Object.freeze({
  label: "WatchCharts - Speedmaster market overview, July 2026",
  url: "https://watchcharts.com/watches/brand/omega/speedmaster",
});
const seamasterHistorySource = Object.freeze({
  label: "Omega - Seamaster Diver 300M history and design",
  url: "https://press.omegawatches.com/omega-launches-new-range-of-seamaster-diver-300m-watches/",
});
const seamasterMarketSource = Object.freeze({
  label: "WatchCharts - 210.30.42.20.01.001 market overview, June 2026",
  url: "https://watchcharts.com/watch_model/869-omega-seamaster-diver-300m-210-30-42-20-01-001/overview",
});

export const omegaBrandIntelligence = Object.freeze({
  brokeragePositioning:
    "Omega brokerage benefits from broad public recognition and observable secondary-market activity, but decisions still depend on exact reference, generation, configuration, condition, completeness, and service history. Moonwatch heritage and dive-watch capability should inform the evaluation without becoming substitutes for example-specific diligence.",
  overview:
    "Founded in 1848, Omega combines chronograph, dive-watch, precision-timing, and space-exploration history with a large modern catalog. Quest Luxo launch coverage begins with the Speedmaster and Seamaster Diver 300M, where reference-level comparison is more useful than a generic brand premium.",
  perspective:
    "Omega is strongest for clients who want recognizable heritage, practical ownership, and comparatively broad market choice. The brokerage opportunity is disciplined selection: identify the generation and configuration that fits the client, then assess service, condition, completeness, and market position without overstating scarcity or future value.",
  evidenceSources: [omegaHistorySource, speedmasterHistorySource, seamasterHistorySource],
} satisfies BrandBrokerageIntelligence);

export const omegaCollectionSummaries = Object.freeze({
  speedmaster:
    "Launch coverage for current and discontinued Moonwatch references, led by the 3570.50 and current Hesalite 310.30.42.50.01.001, with supporting configurations retained for collection-level comparison.",
  seamaster:
    "Focused Diver 300M coverage led by the black-dial steel 210.30.42.20.01.001, including dive-watch ownership, condition, service, and current-market considerations.",
});

export const omegaSpeedmasterIntelligence = Object.freeze({
  overview:
    "Introduced in 1957 and flight-qualified by NASA in 1965, the Speedmaster spans Moonwatch references, racing chronographs, special editions, and modern material variations. This launch set concentrates on six existing modern references plus the discontinued 3570.50 comparison anchor.",
  marketPosition:
    "Speedmaster has a broad and active buyer market, but it is not one interchangeable category. Current calibre 3861 Moonwatches, earlier 1861-era pieces, strap variants, sapphire and Hesalite configurations, and collector editions require separate comparisons.",
  liquidityBand: "High",
  liquidityGuidance:
    "Structured market data shows recurring activity across both current and discontinued Moonwatch references. Correct reference identification, realistic pricing, condition, full-set status, bracelet or strap configuration, service evidence, and production generation materially affect saleability.",
  buyerProfile:
    "Best suited to a buyer who values chronograph heritage and is prepared to choose deliberately between current and discontinued generations, Hesalite and sapphire, bracelet and strap, and standard versus collector-led editions. A buyer needing automatic winding or higher water-use practicality may prefer another collection.",
  sellerProfile:
    "A seller should provide the full reference, year, configuration, box and cards, bracelet links or straps, service history, and detailed condition photographs. Brokerage adds value when generation-specific comparisons and realistic presentation matter more than a generic Moonwatch label.",
  ownershipConsiderations:
    "Manual winding, chronograph function, crystal material, water-resistance expectations, service history, bracelet fit, bezel and case condition, and accessory completeness should be understood before purchase. Hesalite can mark in use; older references need age-appropriate inspection rather than assumptions based on current models.",
  brokerageInsight:
    "Quest Luxo can separate current 3861 and discontinued generations, validate exact configuration and delivery contents, evaluate service and condition, and select comparables that reflect the same crystal, bracelet, and production era. Broad Speedmaster averages are rarely sufficient.",
  marketCommentary:
    "Reviewed July 16, 2026: structured market coverage shows substantial recurring activity across standard Moonwatch generations, with visible value differences by reference and configuration. This supports a High collection-level liquidity band, not a guaranteed result for any example.",
  perspective:
    "Speedmaster is Omega's strongest launch-quality brokerage lane because it combines durable historical recognition with a broad observable market. Its principal risk is reference compression: current, discontinued, sapphire, Hesalite, and special-edition pieces should not share one conclusion.",
  reviewedAt: "July 16, 2026",
  evidenceSources: [speedmasterHistorySource, speedmasterMarketSource],
} satisfies CollectionBrokerageIntelligence);

export const omegaSeamasterDiver300MIntelligence = Object.freeze({
  overview:
    "Introduced in 1993, the Seamaster Diver 300M established a recognizable modern Omega dive-watch identity through its wave-pattern dial, scalloped bezel, skeletonized hands, and helium escape valve. Launch coverage is focused on the steel black-dial 210.30.42.20.01.001.",
  marketPosition:
    "The Diver 300M occupies Omega's widely recognized modern dive-watch lane, but dial color, bracelet or rubber strap, metal, bezel and dial material, age, and movement generation affect comparison. This launch view should not be extended to Planet Ocean or heritage Seamaster families.",
  liquidityBand: "High",
  liquidityGuidance:
    "Structured market data shows substantial recurring activity for the 210.30.42.20.01.001. Correct configuration, realistic pricing, case and bracelet condition, full-set status, service evidence, and water-use history still influence a specific watch's buyer pool.",
  buyerProfile:
    "Best suited to a buyer seeking a robust automatic Omega dive watch with modern dimensions and visible design identity. Confirm bracelet fit, helium-valve preference, intended water use, and tolerance for polished surfaces; consider Aqua Terra or smaller alternatives when versatility or proportions matter more than dive-watch character.",
  sellerProfile:
    "Sellers should document the exact reference, year, dial and bracelet configuration, box and cards, links, service history, water-resistance testing where available, and detailed condition images. Recent service or testing should be evidenced, not implied.",
  ownershipConsiderations:
    "Review bezel action and alignment, crown and helium-valve operation, bracelet and clasp wear, retained links, polished case surfaces, crystal, dial, hands, service history, and current water-resistance testing before water use. A physical inspection remains essential.",
  brokerageInsight:
    "The brokerage opportunity is to distinguish the exact black-dial steel configuration from adjacent Diver 300M variants, assess whether condition and completeness support the ask, and match the client's intended use to the watch's size, bracelet, and service state.",
  marketCommentary:
    "Reviewed July 16, 2026: structured data shows an active secondary market for the 210.30.42.20.01.001 with recurring public activity. That supports a High liquidity band for correctly represented examples, not a forecast or fixed sale timeline.",
  perspective:
    "The black-dial steel Diver 300M is a strong Omega launch reference because it combines recognizable design, practical capability, and observable buyer activity. Its main risk is treating dive-watch specifications as proof that a used example is ready for water without current inspection and testing.",
  reviewedAt: "July 16, 2026",
  evidenceSources: [seamasterHistorySource, seamasterMarketSource],
} satisfies CollectionBrokerageIntelligence);

const priorityReferenceIntelligence = Object.freeze({
  "3570.50": Object.freeze({
    overview:
      "The discontinued 3570.50 is a long-running modern Moonwatch reference and an important bridge between vintage-informed design and later 1861 and 3861 generations.",
    configurationSummary:
      "Stainless-steel 42mm manual-wind Speedmaster Professional with black dial, black tachymeter bezel, Hesalite crystal, solid caseback, and steel bracelet. Year, bracelet generation, accessories, and service components must be verified for the exact watch.",
    liquidityBand: "High",
    liquidityObservations:
      "Structured market coverage shows recurring 3570.50 activity and an established comparison set. Condition, service history, production era, bracelet, accessories, originality, and realistic pricing still create meaningful variation between examples.",
    serviceExposure: "Elevated",
    serviceConsiderations:
      "Age and service history are central. Confirm chronograph operation, winding and setting, movement condition, service documentation, replaced components, and current water-resistance expectations through qualified inspection rather than assuming readiness from appearance.",
    ownershipComplexity: "Moderate",
    conditionConsiderations:
      "Inspect the Hesalite crystal, bezel, case and lug geometry, pushers and crown, bracelet and clasp, dial and hands, engravings, and evidence of refinishing or service replacement parts. Period-correctness should be judged against the watch's actual production era.",
    marketCommentary:
      "Reviewed July 16, 2026: current structured market data continues to show an observable 3570.50 market. That supports active demand, while the breadth of production years makes age, service, condition, and accessories essential to any example-level conclusion.",
    brokerageOpportunities:
      "Quest Luxo can validate era and configuration, review service and replacement components, select condition-appropriate comparables, and compare the 3570.50 with later 1861 and current 3861 Moonwatches.",
    buyerGuidance:
      "Best for a buyer seeking a discontinued, traditional Hesalite Moonwatch with an established secondary market. Prioritize service evidence, chronograph function, case integrity, bracelet fit, and production-era details; consider the current 3861 reference when warranty and modern specification matter more.",
    sellerGuidance:
      "Provide serial-era context where appropriate, service records, box and cards, bracelet and links, replaced parts, and detailed photographs. Present the watch against comparable 3570.50 examples rather than newer Moonwatch references.",
    perspective:
      "The 3570.50 is a compelling discontinued Moonwatch brokerage lane because it combines familiar design with meaningful market depth. Its risk is age-related variability: service, components, case condition, and completeness can outweigh a headline average.",
    reviewedAt: "July 16, 2026",
    evidenceSources: [speedmasterHistorySource, speedmasterMarketSource],
  } satisfies ReferenceBrokerageIntelligence),
  "310.30.42.50.01.001": Object.freeze({
    overview:
      "The current-production 310.30.42.50.01.001 is the Hesalite calibre 3861 Moonwatch on steel bracelet and the launch set's primary modern Speedmaster reference.",
    configurationSummary:
      "Stainless-steel 42mm manual-wind Moonwatch with black dial, Hesalite crystal, black aluminum tachymeter bezel, solid caseback, and steel bracelet. Confirm the full reference, delivery year, current bracelet links, and set completeness.",
    liquidityBand: "High",
    liquidityObservations:
      "Structured data shows substantial recurring activity for this exact current reference. High buyer recognition supports a High band, while condition, completeness, age, warranty status, bracelet links, and pricing discipline still matter.",
    serviceExposure: "Moderate",
    serviceConsiderations:
      "Confirm winding, setting, chronograph reset and operation, service and warranty documentation, and current water-resistance expectations. No service interval or cost should be assumed without current manufacturer guidance.",
    ownershipComplexity: "Lower",
    conditionConsiderations:
      "Inspect the Hesalite crystal, bezel, case and lugs, pushers and crown, bracelet, clasp and links, dial, hands, and evidence of impact or refinishing. Crystal marks may be cosmetic, but function and case condition require separate assessment.",
    marketCommentary:
      "Reviewed July 16, 2026: current structured data shows broad recurring activity for the 310.30.42.50.01.001. The observed market supports High liquidity while also showing that retail pricing and secondary-market positioning are distinct questions.",
    brokerageOpportunities:
      "Brokerage value centers on comparing the exact Hesalite bracelet configuration, evaluating completeness and warranty context, selecting current comparables, and helping buyers distinguish it from the sapphire 310.30.42.50.01.002 and discontinued generations.",
    buyerGuidance:
      "Best for a client wanting the current purist-leaning Moonwatch configuration. Confirm manual-wind preference, Hesalite tolerance, bracelet fit, and intended water use; choose the sapphire version when scratch resistance and a display back matter more.",
    sellerGuidance:
      "Provide delivery date, cards, box, bracelet links, service or warranty documentation, and clear photographs of the crystal, bezel, case, clasp, and accessories. Compare like-for-like Hesalite bracelet examples.",
    perspective:
      "The 310.30.42.50.01.001 is the broadest modern Speedmaster brokerage candidate in this launch set. Its strength is recognizable current specification; its main risk is assuming every current Moonwatch configuration shares the same buyer priorities.",
    reviewedAt: "July 16, 2026",
    evidenceSources: [
      speedmasterHistorySource,
      {
        label: "WatchCharts - 310.30.42.50.01.001 market overview, July 2026",
        url: "https://watchcharts.com/watch_model/30920-omega-speedmaster-professional-moonwatch-310-30-42-50-01-001/overview",
      },
    ],
  } satisfies ReferenceBrokerageIntelligence),
  "210.30.42.20.01.001": Object.freeze({
    overview:
      "The current-production 210.30.42.20.01.001 is the black-dial, steel-bracelet Seamaster Diver 300M and the launch set's modern Omega dive-watch anchor.",
    configurationSummary:
      "Stainless-steel 42mm automatic Diver 300M with black wave-pattern ceramic dial, black ceramic diving bezel, steel bracelet, date display, helium escape valve, and display caseback. Confirm exact reference, year, links, and delivery set.",
    liquidityBand: "High",
    liquidityObservations:
      "Structured market data shows substantial recurring activity for the exact reference. Configuration, condition, completeness, service evidence, water-use history, and realistic pricing can still affect buyer confidence and saleability.",
    serviceExposure: "Moderate",
    serviceConsiderations:
      "Confirm timekeeping, crown, date, bezel and helium-valve operation, service history, warranty documents, and current pressure testing before water use. Manufacturer specifications do not establish the condition of an individual used watch.",
    ownershipComplexity: "Lower",
    conditionConsiderations:
      "Inspect polished case surfaces, bezel alignment and action, ceramic dial and bezel, crown and valve, bracelet and clasp, retained links, crystal, hands, and evidence of impact or refinishing. Review current water-resistance evidence separately.",
    marketCommentary:
      "Reviewed July 16, 2026: current structured data shows an active and recurring market for the 210.30.42.20.01.001. That supports High liquidity for correctly priced examples without implying future price direction or a guaranteed sale period.",
    brokerageOpportunities:
      "Quest Luxo can validate the exact dial and bracelet configuration, assess condition and service evidence, separate bracelet from rubber-strap comparisons, and align the watch with the client's intended water and daily-wear use.",
    buyerGuidance:
      "Best for a buyer wanting a modern automatic Omega dive watch with strong public recognition. Confirm proportions, bracelet fit, valve preference, service evidence, and pressure testing; consider a Speedmaster when chronograph heritage matters more than water capability.",
    sellerGuidance:
      "Provide the full reference, year, cards and box, bracelet links, service and pressure-test documentation where available, and detailed images of the bezel, case, clasp, dial, and accessories. Do not describe water readiness without current evidence.",
    perspective:
      "The 210.30.42.20.01.001 is a strong launch-quality Omega brokerage reference because it balances recognizable design, practical capability, and market depth. Its key diligence point is physical readiness: specifications alone do not verify condition or water resistance.",
    reviewedAt: "July 16, 2026",
    evidenceSources: [seamasterHistorySource, seamasterMarketSource],
  } satisfies ReferenceBrokerageIntelligence),
} satisfies Readonly<Record<string, ReferenceBrokerageIntelligence>>);

const speedmasterPresentation = Object.freeze({
  "310.30.42.50.01.002": { productionStatus: "Current Production", marketPosition: "Current sapphire-crystal 3861 Moonwatch with display back.", liquidity: "High" },
  "310.30.42.50.01.001": { productionStatus: "Current Production", marketPosition: "Current Hesalite 3861 Moonwatch and modern purist anchor.", liquidity: "High" },
  "311.30.42.30.01.005": { productionStatus: "Discontinued", marketPosition: "Discontinued 1861-era Hesalite Moonwatch with broad comparison relevance.", liquidity: "High" },
  "310.33.42.50.01.002": { productionStatus: "Current Production", marketPosition: "Current sapphire 3861 Moonwatch on leather strap.", liquidity: "Moderate" },
  "310.32.42.50.01.001": { productionStatus: "Current Production", marketPosition: "Current Hesalite 3861 Moonwatch on nylon strap.", liquidity: "Moderate" },
  "310.32.42.50.02.001": { productionStatus: "Current Production", marketPosition: "Collector-led Silver Snoopy configuration with a distinct buyer lane.", liquidity: "High" },
} satisfies Readonly<Record<string, { productionStatus: string; marketPosition: string; liquidity: string }>>);

const speedmaster357050: OmegaAsset = {
  reference: "3570.50",
  model: "Speedmaster Professional Moonwatch 3570.50",
  brand: "Omega",
  collection: "Speedmaster",
  collectionSlug: "speedmaster",
  seedStatus: "Seed Reference",
  configurations: [{ nickname: "3570.50 Moonwatch", bracelet: "Stainless Steel Bracelet", dial: "Black", originalMSRP: null }],
  material: "Stainless Steel",
  bezel: "Black Aluminum Tachymeter",
  productionStatus: "Discontinued",
  marketPosition: "Discontinued long-running Hesalite Moonwatch and generational comparison anchor.",
  liquidity: "High",
  allocationDifficulty: "Lower",
  questLuxoView: priorityReferenceIntelligence["3570.50"].perspective,
  brokerageIntelligence: priorityReferenceIntelligence["3570.50"],
};

export const omegaSpeedmasterLaunchAssets: OmegaAsset[] = [
  ...omegaSpeedmasterAssets.map((asset) => {
    const brokerageIntelligence = priorityReferenceIntelligence[asset.reference as keyof typeof priorityReferenceIntelligence];
    return {
      ...asset,
      ...speedmasterPresentation[asset.reference as keyof typeof speedmasterPresentation],
      ...(brokerageIntelligence ? { brokerageIntelligence, questLuxoView: brokerageIntelligence.perspective } : {}),
    };
  }),
  speedmaster357050,
];

export const omegaSeamasterLaunchAssets: OmegaAsset[] = [
  {
    reference: "210.30.42.20.01.001",
    model: "Seamaster Diver 300M",
    brand: "Omega",
    collection: "Seamaster Diver 300M",
    collectionSlug: "seamaster",
    seedStatus: "Seed Reference",
    configurations: [{ nickname: "Black Ceramic Diver 300M", bracelet: "Stainless Steel Bracelet", dial: "Black Wave" }],
    material: "Stainless Steel",
    bezel: "Black Ceramic Diving Bezel",
    productionStatus: "Current Production",
    marketPosition: "Current black-dial steel Diver 300M and modern Omega dive-watch anchor.",
    liquidity: "High",
    allocationDifficulty: "Lower",
    questLuxoView: priorityReferenceIntelligence["210.30.42.20.01.001"].perspective,
    collectorNotes: "Confirm bezel alignment and action, helium-valve and crown operation, bracelet links and clasp condition, polished-surface wear, service history, and a current pressure test before water use.",
    brokerageIntelligence: priorityReferenceIntelligence["210.30.42.20.01.001"],
  },
];

export function isOmegaPriorityReference(asset: OmegaAsset): boolean {
  return Boolean(asset.brokerageIntelligence);
}
