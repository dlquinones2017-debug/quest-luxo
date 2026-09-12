import {
  patekPhilippeAquanautAssets,
  patekPhilippeNautilusAssets,
  type PatekPhilippeAsset,
} from "./patek-philippe";
import type {
  BrandBrokerageIntelligence,
  CollectionBrokerageIntelligence,
  ReferenceBrokerageIntelligence,
} from "../types/brokerageIntelligence";

const patekHistorySource = Object.freeze({
  label: "Patek Philippe - Origins of the Manufacture",
  url: "https://www.patek.com/en/manufacture/a-story-of-independence/anchored-in-geneva-and-switzerland",
});

const nautilusHistorySource = Object.freeze({
  label: "Patek Philippe - Nautilus collection history and design",
  url: "https://www.patek.com/en/collection/nautilus",
});

const nautilusMarketSource = Object.freeze({
  label: "WatchCharts - Nautilus market overview, July 2026",
  url: "https://watchcharts.com/watches/brand/patek%20philippe/nautilus",
});

const aquanautHistorySource = Object.freeze({
  label: "Patek Philippe - Aquanaut collection history and design",
  url: "https://www.patek.com/en/collection/aquanaut",
});

const aquanautMarketSource = Object.freeze({
  label: "WatchCharts - 5167A market overview, June 2026",
  url: "https://watchcharts.com/watch_model/22557-patek-philippe-aquanaut-5167-stainless-steel-5167a/overview",
});

export const patekPhilippeBrandIntelligence = Object.freeze({
  brokeragePositioning:
    "Patek Philippe brokerage requires exact reference and suffix identification, disciplined provenance and condition review, and clear separation between allocation-driven sport-watch demand and the more specialized markets for dress and complicated references. Prestige does not make configurations interchangeable.",
  overview:
    "Established in Geneva in 1839 and family-owned by the Stern family since 1932, Patek Philippe spans classical watchmaking, complications, and highly visible sport collections. Quest Luxo launch coverage is deliberately reference-led, beginning with Nautilus and the Aquanaut 5167A rather than implying equivalent market depth across the full catalog.",
  perspective:
    "Patek Philippe is most compelling when the client values long-term ownership, fine execution, and reference-specific character enough to accept careful diligence and a high-touch service relationship. Quest Luxo's role is to distinguish the watch's historical importance from the realities of its exact condition, documentation, configuration, and current buyer pool.",
  evidenceSources: [patekHistorySource, nautilusHistorySource, aquanautHistorySource],
} satisfies BrandBrokerageIntelligence);

export const patekPhilippeCollectionSummaries = Object.freeze({
  nautilus:
    "Launch coverage for the integrated-bracelet collection, led by the discontinued steel 5711/1A and current white-gold 5811/1G, with supporting complicated references retained for collection-level guidance.",
  aquanaut:
    "Focused launch coverage for the steel 5167A, connecting Patek Philippe's casual sport-watch design language with configuration, condition, strap, and current-market diligence.",
});

export const patekPhilippeNautilusIntelligence = Object.freeze({
  overview:
    "Introduced in 1976, Nautilus established Patek Philippe's elegant sports-watch design around a rounded octagonal bezel, porthole-inspired case construction, horizontally embossed dial, and integrated bracelet. This launch set covers six modern references spanning time-only and complicated, current and discontinued configurations.",
  marketPosition:
    "Nautilus has broad recognition but is not one uniform market. The discontinued steel 5711/1A, current white-gold 5811/1G, and complicated steel references differ in material, function, production status, buyer pool, and valuation evidence; comparison must remain reference- and configuration-specific.",
  liquidityBand: "High",
  liquidityGuidance:
    "Structured market coverage shows recurring activity across the principal modern Nautilus references. Correct identification, realistic pricing, dial and suffix, case and bracelet condition, full-set status, and service evidence materially affect saleability. High collection-level liquidity is not a promise for a particular example.",
  buyerProfile:
    "Best suited to a buyer who values the Nautilus design language and is prepared to choose deliberately between steel and precious metal, time-only and complications, and current and discontinued production. Buyers seeking interchangeable pricing or low-sensitivity daily wear should consider alternatives.",
  sellerProfile:
    "A seller should provide the complete reference and suffix, year, dial, box and papers, bracelet links, service record, ownership history, and clear condition photographs. Brokerage adds the most value when presentation and valuation must be tailored to the exact reference rather than a broad Nautilus headline.",
  ownershipConsiderations:
    "Alternating polished and satin-brushed surfaces make case and bracelet condition commercially important. Confirm bracelet fit and links, clasp operation, service history, water-resistance expectations, insurance, secure storage, and documentation before purchase. Complicated references carry additional setting and service considerations.",
  brokerageInsight:
    "Quest Luxo can add value by validating the full reference and configuration, separating listing evidence from defensible comparables, evaluating completeness and refinishing, and matching the client's use case to the correct generation. A famous family name does not remove example-specific risk.",
  marketCommentary:
    "Reviewed July 16, 2026: current structured market data shows meaningful activity across modern Nautilus references, with material dispersion by reference, metal, complication, and condition. This supports a High collection-level liquidity band while making family-wide price conclusions inappropriate.",
  perspective:
    "Nautilus is Patek Philippe's clearest launch-quality sport-watch brokerage lane because design recognition and observable buyer activity are both strong. Its principal risk is overgeneralization: material, reference, suffix, originality, and condition must carry more weight than the collection name alone.",
  reviewedAt: "July 16, 2026",
  evidenceSources: [nautilusHistorySource, nautilusMarketSource],
} satisfies CollectionBrokerageIntelligence);

export const patekPhilippeAquanautIntelligence = Object.freeze({
  overview:
    "Introduced in 1997, Aquanaut translated Patek Philippe's rounded-octagonal sport-watch language into a more casual format with a patterned dial and composite strap. Launch coverage is intentionally limited to the steel 5167A priority reference.",
  marketPosition:
    "The 5167A is a recognizable current-production Aquanaut, but material, suffix, dial, strap, and production status distinguish it from other Aquanaut references. Collection-level conclusions should not be transferred to travel-time, chronograph, precious-metal, or gem-set variants.",
  liquidityBand: "High",
  liquidityGuidance:
    "Structured market coverage shows recurring 5167A activity and multiple configurations. Correct suffix identification, condition, completeness, strap and clasp state, service evidence, and pricing discipline remain decisive for a specific example.",
  buyerProfile:
    "Best suited to a buyer seeking a lighter, casual Patek sport watch and willing to prioritize fit, strap condition, and exact configuration. A client wanting an integrated bracelet, precious-metal presence, or lower allocation sensitivity may prefer another collection.",
  sellerProfile:
    "Sellers should document the exact suffix, dial, original and replacement straps where applicable, clasp, full set, service history, and condition. Brokerage is useful when configuration and completeness need to be translated into a defensible market position.",
  ownershipConsiderations:
    "Composite-strap fit and cut length, clasp condition, polished and brushed case surfaces, current function, water-resistance expectations, insurance, and service documentation should be reviewed before purchase. Replacement strap availability and fit should be confirmed rather than assumed.",
  brokerageInsight:
    "The brokerage opportunity is to verify that the example matches the advertised suffix and delivery set, assess case and strap condition, and compare it only with relevant 5167A configurations. Broad Aquanaut asking prices are not a substitute for example-level diligence.",
  marketCommentary:
    "Reviewed July 16, 2026: structured data shows an active market for the steel 5167A and visible dispersion among its configurations. This supports a High liquidity band for correctly represented examples, not a forecast or guaranteed sale timeline.",
  perspective:
    "The 5167A gives Patek Philippe launch coverage a distinct casual sport-watch lane. Its strength is recognizable, wearable design; its central risk is assuming that every dial, suffix, strap state, and condition level deserves the same comparison set.",
  reviewedAt: "July 16, 2026",
  evidenceSources: [aquanautHistorySource, aquanautMarketSource],
} satisfies CollectionBrokerageIntelligence);

const priorityReferenceIntelligence = Object.freeze({
  "5711/1A": Object.freeze({
    overview:
      "The discontinued steel 5711/1A is the defining modern time-only Nautilus reference family and a central comparison point for later Nautilus generations. Its visibility makes exact suffix, dial, year, and condition especially important.",
    configurationSummary:
      "Stainless-steel Nautilus with integrated steel bracelet, rounded octagonal bezel, date display, and horizontally embossed dial. This launch record represents a blue-dial configuration; the complete suffix and dial variant must be verified before valuation.",
    liquidityBand: "High",
    liquidityObservations:
      "Current structured market data shows substantial recurring activity for the 5711/1A family. Buyer depth supports a High band, while dial, suffix, year, set completeness, condition, and price discipline create meaningful differences between examples.",
    serviceExposure: "Moderate",
    serviceConsiderations:
      "Confirm current operation, movement and case numbers where appropriate, service history, warranty or service documents, and water-resistance testing for intended use. Obtain current manufacturer or qualified-specialist guidance instead of assuming scope, timing, or cost.",
    ownershipComplexity: "Elevated",
    conditionConsiderations:
      "Inspect case and bezel geometry, brushed and polished transitions, bracelet and clasp wear, retained links, dial and hands, engravings, crystal, and evidence of refinishing or replacement components. Condition and originality can materially affect buyer confidence.",
    marketCommentary:
      "Reviewed July 16, 2026: the 5711/1A remains actively represented in structured market data, but observed estimates vary by configuration and condition. The record supports active demand, not a price forecast or a universal value for the base reference.",
    brokerageOpportunities:
      "Brokerage value centers on suffix and dial verification, provenance and completeness review, condition-adjusted comparable selection, and comparison with current precious-metal successors or other Nautilus configurations.",
    buyerGuidance:
      "Best for a collector prioritizing the discontinued steel, time-only Nautilus format. Buy the exact suffix and example: verify fit, links, dial, case integrity, service evidence, and set completeness; consider 5811/1G if current production and precious-metal weight matter more.",
    sellerGuidance:
      "Provide the full reference and suffix, year, dial, box and papers, links, service documentation, ownership history, and detailed unedited photographs. Avoid anchoring the ask to a different dial, year, or condition state.",
    perspective:
      "The 5711/1A is the strongest recognition-led Nautilus brokerage reference in this launch set. Its opportunity is genuine buyer depth; its main risk is allowing fame to substitute for exact configuration, condition, and provenance work.",
    reviewedAt: "July 16, 2026",
    evidenceSources: [
      nautilusHistorySource,
      {
        label: "WatchCharts - 5711/1A market overview, June 2026",
        url: "https://watchcharts.com/watch_model/22871-patek-philippe-nautilus-5711-stainless-steel-5711-1a/overview",
      },
    ],
  } satisfies ReferenceBrokerageIntelligence),
  "5811/1G": Object.freeze({
    overview:
      "The 5811/1G is the current-generation time-only Nautilus in white gold, carrying forward the core design language in a materially different ownership and buyer lane from the discontinued steel 5711/1A.",
    configurationSummary:
      "White-gold Nautilus on an integrated white-gold bracelet with blue dial and date display. Exact suffix, delivery year, set, bracelet links, and current-production configuration should be confirmed for the specific watch.",
    liquidityBand: "High",
    liquidityObservations:
      "Structured data shows recurring activity for the 5811/1G, supporting a High band for correctly positioned examples. Its higher-value precious-metal buyer pool remains sensitive to condition, completeness, and realistic comparison selection.",
    serviceExposure: "Moderate",
    serviceConsiderations:
      "Confirm current function, service and warranty documentation, clasp operation, and water-resistance expectations. White-gold case and bracelet work should be assessed by a qualified party; do not infer service cost or scope from steel Nautilus references.",
    ownershipComplexity: "Elevated",
    conditionConsiderations:
      "Inspect the white-gold case, bezel, bracelet, clasp, adjustment system, retained links, polished and satin-brushed surfaces, dial, hands, and crystal. Precious-metal wear and prior refinishing require direct disclosure and careful photography.",
    marketCommentary:
      "Reviewed July 16, 2026: the 5811/1G has an observable current market with recurring public activity, but its white-gold construction and higher-value positioning make 5711/1A comparisons incomplete. This is a liquidity observation, not a performance forecast.",
    brokerageOpportunities:
      "Quest Luxo can validate current-production configuration, separate relevant 5811/1G evidence from steel 5711 comparisons, assess precious-metal condition and completeness, and structure sourcing or trade discussions around the client's ownership priorities.",
    buyerGuidance:
      "Best for a buyer who wants the current time-only Nautilus expression and values white-gold presence. Confirm weight and fit preferences, bracelet links, condition tolerance, and whether the discreet steel character of a 5711/1A is actually the better match.",
    sellerGuidance:
      "Prepare the exact suffix, delivery date, complete set, bracelet links, service and warranty documents, and detailed images of high-contact white-gold surfaces. Use 5811/1G-specific evidence rather than broad Nautilus headlines.",
    perspective:
      "The 5811/1G is the clearest current-generation Nautilus anchor in this launch set. Its strength is continuity with meaningful material distinction; its risk is being valued as though it were simply a newer steel 5711.",
    reviewedAt: "July 16, 2026",
    evidenceSources: [
      {
        label: "Patek Philippe - Nautilus 5811/1G-001",
        url: "https://www.patek.com/collection/nautilus/5811-1g-001",
      },
      {
        label: "WatchCharts - 5811/1G market overview, June 2026",
        url: "https://watchcharts.com/watch_model/44202-patek-philippe-nautilus-5811-1g/overview",
      },
    ],
  } satisfies ReferenceBrokerageIntelligence),
  "5167A": Object.freeze({
    overview:
      "The current-production steel 5167A is the time-only Aquanaut anchor and the launch set's clearest expression of Patek Philippe's casual sport-watch identity.",
    configurationSummary:
      "Stainless-steel Aquanaut with rounded octagonal bezel, self-winding time-and-date movement, embossed dial, composite strap, and steel fold-over clasp. Exact suffix, dial, strap, clasp, and delivery set must be verified.",
    liquidityBand: "High",
    liquidityObservations:
      "Current structured data shows recurring 5167A activity across multiple configurations. Demand breadth supports a High band, while suffix, dial, strap condition and fit, completeness, case condition, and asking price remain material.",
    serviceExposure: "Moderate",
    serviceConsiderations:
      "Confirm current operation, service and warranty documentation, crown and clasp function, and water-resistance testing for intended use. Seek current manufacturer or qualified-specialist guidance rather than assuming service timing or cost.",
    ownershipComplexity: "Moderate",
    conditionConsiderations:
      "Inspect polished and satin-brushed case surfaces, bezel definition, crystal, dial, hands, crown, clasp, and composite strap. Confirm whether the strap has been cut, whether it fits the buyer, and what original or replacement components accompany the watch.",
    marketCommentary:
      "Reviewed July 16, 2026: structured market data shows an active 5167A market and variation among suffixes and dials. That supports recurring demand while making exact-configuration comparisons essential; it is not a forecast or guaranteed sale timeline.",
    brokerageOpportunities:
      "Brokerage value centers on suffix and dial verification, strap and clasp assessment, condition-adjusted comparable selection, completeness review, and matching the casual 5167A use case against Nautilus or precious-metal Aquanaut alternatives.",
    buyerGuidance:
      "Best for a buyer seeking a light, casual, current-production Patek sport watch. Confirm strap fit before committing, assess case and clasp condition, and decide whether composite-strap utility matters more than the integrated-bracelet identity of a Nautilus.",
    sellerGuidance:
      "Provide the full suffix, year, dial, complete set, original and replacement straps where applicable, clasp, service history, and clear condition photographs. Disclose strap sizing and any refinishing or replaced components directly.",
    perspective:
      "The 5167A is the strongest Aquanaut launch reference because it combines identifiable design with an observable buyer market. Its main transaction risk is configuration and fit: suffix, strap state, completeness, and condition cannot be treated as minor details.",
    reviewedAt: "July 16, 2026",
    evidenceSources: [
      {
        label: "Patek Philippe - Aquanaut 5167A-001",
        url: "https://www.patek.com/collection/aquanaut/5167a-001",
      },
      aquanautMarketSource,
    ],
  } satisfies ReferenceBrokerageIntelligence),
} satisfies Readonly<Record<string, ReferenceBrokerageIntelligence>>);

const nautilusLaunchPresentation = Object.freeze({
  "5711/1A": {
    productionStatus: "Discontinued",
    marketPosition: "Discontinued steel time-only benchmark with broad collector recognition.",
    liquidity: "High",
  },
  "5811/1G": {
    productionStatus: "Current Production",
    marketPosition: "Current white-gold time-only Nautilus and successor-generation anchor.",
    liquidity: "High",
  },
  "5712/1A": {
    productionStatus: "Current Production",
    marketPosition: "Steel complication-led Nautilus with a distinct asymmetrical dial and buyer lane.",
    liquidity: "High",
  },
  "5990/1A": {
    productionStatus: "Discontinued",
    marketPosition: "Discontinued steel travel-time chronograph for complication-focused buyers.",
    liquidity: "High",
  },
  "5980/1A": {
    productionStatus: "Discontinued",
    marketPosition: "Discontinued steel chronograph with a specialized sport-complication market.",
    liquidity: "High",
  },
  "5726/1A": {
    productionStatus: "Current Production",
    marketPosition: "Current steel annual-calendar Nautilus for complication-led ownership.",
    liquidity: "High",
  },
} satisfies Readonly<Record<string, { productionStatus: string; marketPosition: string; liquidity: string }>>);

export const patekPhilippeNautilusLaunchAssets: PatekPhilippeAsset[] =
  patekPhilippeNautilusAssets.map((asset) => {
    const brokerageIntelligence = priorityReferenceIntelligence[asset.reference as keyof typeof priorityReferenceIntelligence];

    return {
      ...asset,
      ...nautilusLaunchPresentation[asset.reference as keyof typeof nautilusLaunchPresentation],
      ...(brokerageIntelligence
        ? { brokerageIntelligence, questLuxoView: brokerageIntelligence.perspective }
        : {}),
    };
  });

const aquanautSeedAsset = patekPhilippeAquanautAssets[0];

if (!aquanautSeedAsset) {
  throw new Error("Patek Philippe Aquanaut launch asset is missing.");
}

export const patekPhilippeAquanautLaunchAssets: PatekPhilippeAsset[] = [
  {
    ...aquanautSeedAsset,
    reference: "5167A",
    model: "Aquanaut 5167A",
    productionStatus: "Current Production",
    marketPosition: "Current steel time-only Aquanaut and casual sport-watch anchor.",
    liquidity: "High",
    brokerageIntelligence: priorityReferenceIntelligence["5167A"],
    questLuxoView: priorityReferenceIntelligence["5167A"].perspective,
  },
];

export function isPatekPhilippePriorityReference(asset: PatekPhilippeAsset): boolean {
  return Boolean(asset.brokerageIntelligence);
}
