import { tudorBlackBayAssets, tudorPelagosAssets, type TudorAsset } from "./tudor";
import type { BrandBrokerageIntelligence, CollectionBrokerageIntelligence, ReferenceBrokerageIntelligence } from "../types/brokerageIntelligence";

const tudorHistorySource = Object.freeze({ label: "Tudor - History", url: "https://www.tudorwatch.com/en/pressroom/about-tudor/tudor-history" });
const blackBaySource = Object.freeze({ label: "Tudor - Black Bay", url: "https://www.tudorwatch.com/en/pressroom/products/black-bay" });
const blackBay58Source = Object.freeze({ label: "Tudor - Black Bay 58", url: "https://www.tudorwatch.com/en/watch-family/black-bay-58" });
const monochromeSource = Object.freeze({ label: "Tudor - Black Bay M7941A1A0NU", url: "https://www.tudorwatch.com/en/watches/black-bay/m7941a1a0nu-0001" });
const pelagosSource = Object.freeze({ label: "Tudor - Pelagos 39 M25407N", url: "https://www.tudorwatch.com/en/watches/pelagos/m25407n-0001" });
const tudorMarketSource = Object.freeze({ label: "WatchCharts - Tudor market overview, July 2026", url: "https://watchcharts.com/watches/brand/tudor?page=1" });
const monochromeMarketSource = Object.freeze({ label: "WatchCharts - Black Bay M7941A1A0NU market overview, July 2026", url: "https://watchcharts.com/watch_model/50854-tudor-black-bay-7941a1a0nu/overview" });
const pelagosMarketSource = Object.freeze({ label: "WatchCharts - Pelagos 39 M25407N market overview, July 2026", url: "https://watchcharts.com/watch_model/43942-tudor-pelagos-39-25407n/overview" });

export const tudorBrandIntelligence = Object.freeze({
  brokeragePositioning: "Tudor brokerage combines recognizable Swiss tool-watch design with comparatively accessible entry points, but a strong brand name does not make references interchangeable. Generation, case size, bracelet or strap, condition, completeness, service evidence, and acquisition basis remain central.",
  overview: "Tudor was established by Hans Wilsdorf to pair dependable watchmaking with a more accessible proposition. Its modern identity is led by heritage-informed Black Bay models and the more technical Pelagos family; launch coverage is deliberately limited to those two collections.",
  perspective: "Quest Luxo treats Tudor as a reference-selection exercise rather than a shortcut to value. The best result aligns proportions, material, movement, intended use, and condition with the client's priorities while using observable market activity only as context.",
  evidenceSources: [tudorHistorySource, blackBaySource, pelagosSource],
} satisfies BrandBrokerageIntelligence);

export const tudorCollectionSummaries = Object.freeze({
  "black-bay": "Heritage-led launch coverage for the compact 79030N Black Bay 58 and the current 41 mm M7941A1A0NU Black Bay Monochrome.",
  pelagos: "Technical titanium dive-watch coverage centered on the compact M25407N Pelagos 39.",
});

export const tudorBlackBayIntelligence = Object.freeze({
  overview: "Black Bay translates Tudor dive-watch cues into a broad modern family. Launch coverage narrows that family to two black-bezel steel references with meaningfully different proportions and movement specifications: the 39 mm 79030N and 41 mm M7941A1A0NU.",
  marketPosition: "Black Bay is Tudor's best-known modern collection, with substantial choice across sizes, colors, metals, bracelets, chronographs, and GMT models. That breadth creates liquidity but also makes exact-reference comparison essential.",
  liquidityBand: "High", liquidityGuidance: "Public market coverage shows recurring activity for both priority references. Realistic pricing, correct reference and bracelet identification, full-set status, condition, age, and service evidence still determine how readily a specific example trades.",
  buyerProfile: "Best suited to buyers who want recognizable dive-watch styling and a choice between compact heritage proportions and a more substantial current-generation platform. Buyers should decide on size and bracelet before treating the watches as substitutes.",
  sellerProfile: "Sellers should provide the full reference and suffix, year, original bracelet or strap, retained links, box and card, service records, and clear images of the case, bezel, clasp, and crystal.",
  ownershipConsiderations: "Inspect bezel action and alignment, crown operation, crystal and lume, case and bracelet finishing, clasp wear, service history, and current water resistance before water use. Bracelet sizing and all delivered accessories should be confirmed.",
  brokerageInsight: "Quest Luxo can separate 39 mm and 41 mm demand, identify the exact bracelet and movement configuration, and select comparables matched to condition and completeness rather than using a blended Black Bay average.",
  marketCommentary: "Reviewed July 16, 2026: structured market coverage shows recurring public activity for both the 79030N and M7941A1A0NU. This supports a High collection band, not a guaranteed price or sale timeline.",
  perspective: "Black Bay offers a broad buyer pool, but the brokerage value lies in preventing family-level recognition from obscuring reference-specific ergonomics, configuration, and condition.",
  reviewedAt: "July 16, 2026", evidenceSources: [blackBaySource, blackBay58Source, monochromeSource, tudorMarketSource, monochromeMarketSource],
} satisfies CollectionBrokerageIntelligence);

export const tudorPelagosIntelligence = Object.freeze({
  overview: "Pelagos is Tudor's technical dive-watch family. The launch set focuses on the 39 mm M25407N, whose grade 2 titanium construction, ceramic bezel insert, compact proportions, bracelet, and supplied rubber strap distinguish it from larger Pelagos references.",
  marketPosition: "Pelagos 39 occupies a lightweight, compact professional-sport position. It should be compared with the same reference and accessory set, not blended with larger Pelagos, FXD, or left-hand-drive variants.",
  liquidityBand: "High", liquidityGuidance: "Structured market data shows recurring activity for the Pelagos 39. Titanium condition, clasp and bracelet completeness, included rubber strap, full-set status, service evidence, and realistic pricing influence a specific watch's saleability.",
  buyerProfile: "Best suited to buyers prioritizing low weight, compact proportions, modern dive-watch construction, and bracelet adjustment. Buyers who prefer steel heft or polished dress-sport finishing should compare alternatives before committing.",
  sellerProfile: "Sellers should document the exact reference, box and card, bracelet links, clasp condition, supplied rubber strap and extension, service history, and detailed images that show titanium wear honestly.",
  ownershipConsiderations: "Titanium wears and refinishes differently from steel. Inspect the case, bracelet, T-fit clasp, bezel, crown, crystal, and strap contents, and obtain current water-resistance testing before relying on dive specifications.",
  brokerageInsight: "Brokerage can verify the complete factory delivery, distinguish normal titanium wear from damage, assess clasp and bracelet condition, and ground comparisons in the exact 39 mm reference.",
  marketCommentary: "Reviewed July 16, 2026: public structured data shows an active secondary market for the M25407N. A High band describes observable activity; it is not a forecast or promise of immediate execution.",
  perspective: "Pelagos 39 is a focused Tudor proposition with strong daily-wear utility. Its principal diligence point is example-specific titanium and accessory condition rather than the headline specification alone.",
  reviewedAt: "July 16, 2026", evidenceSources: [pelagosSource, pelagosMarketSource],
} satisfies CollectionBrokerageIntelligence);

const referenceIntelligence = Object.freeze({
  "79030N": Object.freeze({
    overview: "The 79030N Black Bay 58 is a 39 mm steel dive watch named for 1958, the year of Tudor's first diver rated to 200 metres.", configurationSummary: "Black dial and aluminum bezel insert, steel case and bracelet, COSC-certified manufacture calibre MT5402, approximately 70-hour power reserve, and 200 m water-resistance specification.",
    liquidityBand: "High", liquidityObservations: "Recurring public activity supports a broad buyer pool, but age, set completeness, bracelet links, condition, service evidence, and price remain decisive.", serviceExposure: "Moderate", serviceConsiderations: "Confirm timekeeping, winding and crown operation, service history, and current pressure testing. A specification is not evidence that a used watch remains water ready.", ownershipComplexity: "Lower", conditionConsiderations: "Inspect case geometry, bracelet and clasp wear, bezel action and alignment, aluminum insert, crystal, lume, crown, and retained links.",
    marketCommentary: "Reviewed July 16, 2026: the 79030N remains visibly represented in structured secondary-market coverage. No future-value conclusion is implied.", brokerageOpportunities: "Source the strongest combination of condition, completeness, service state, and acquisition basis; for sellers, position the compact proportions and exact configuration accurately.", buyerGuidance: "Confirm that 39 mm proportions and the bracelet fit suit the client, then compare examples matched by year, condition, set status, and service history.", sellerGuidance: "Provide the warranty card, box, links, service records, timing or pressure-test evidence, and unfiltered condition photography.", perspective: "The 79030N is a clear, versatile Black Bay choice when selected for fit and condition rather than assumed scarcity.", reviewedAt: "July 16, 2026", evidenceSources: [blackBay58Source, tudorMarketSource],
  } satisfies ReferenceBrokerageIntelligence),
  "M7941A1A0NU": Object.freeze({
    overview: "The M7941A1A0NU is the 41 mm Black Bay commonly described as the Monochrome, pairing a black dial and bezel with a current METAS-certified movement platform.", configurationSummary: "41 mm steel case, black aluminum bezel insert, black dial, manufacture calibre MT5602-U, approximately 70-hour power reserve, 200 m water-resistance specification, and multiple factory bracelet or strap options.",
    liquidityBand: "High", liquidityObservations: "Current structured coverage shows recurring activity. Bracelet variant, condition, completeness, age, and realistic pricing should be matched in any comparison.", serviceExposure: "Moderate", serviceConsiderations: "Confirm movement performance, crown and bezel operation, service history, and current pressure testing. METAS certification does not replace example-specific inspection.", ownershipComplexity: "Lower", conditionConsiderations: "Inspect polished and brushed case surfaces, bracelet and clasp, bezel alignment, insert, crystal, crown, and all delivered links or straps.",
    marketCommentary: "Reviewed July 16, 2026: public data shows an active market for M7941A1A0NU configurations, but launch recency and observed listings do not guarantee retention or timing.", brokerageOpportunities: "Match the client's preferred bracelet to the actual reference configuration and compare like-for-like examples with documented condition and delivery contents.", buyerGuidance: "Validate 41 mm fit and bracelet preference, then inspect the specific watch and avoid paying solely for current-model novelty.", sellerGuidance: "State the precise bracelet or strap configuration and include card, box, links, accessories, service evidence, and clear finish photography.", perspective: "The Monochrome is a capable modern Black Bay whose transaction quality depends more on configuration and acquisition discipline than hype.", reviewedAt: "July 16, 2026", evidenceSources: [monochromeSource, monochromeMarketSource],
  } satisfies ReferenceBrokerageIntelligence),
  "M25407N": Object.freeze({
    overview: "The M25407N Pelagos 39 is a compact grade 2 titanium dive watch built around low weight, legibility, and everyday usability.", configurationSummary: "39 mm grade 2 titanium case and bracelet, black ceramic bezel insert, black dial, COSC-certified manufacture calibre MT5400, approximately 70-hour power reserve, 200 m specification, T-fit clasp, and supplied rubber strap.",
    liquidityBand: "High", liquidityObservations: "Recurring public activity supports an active market. Titanium condition, bracelet links, clasp, rubber-strap contents, full-set status, and price still govern buyer response.", serviceExposure: "Moderate", serviceConsiderations: "Verify timing, winding, crown and bezel operation, service history, and current pressure testing before water use.", ownershipComplexity: "Moderate", conditionConsiderations: "Inspect titanium case and bracelet wear, clasp function, bezel and ceramic insert, crystal, crown, links, rubber strap, and extension piece. Refinishing expectations differ from steel.",
    marketCommentary: "Reviewed July 16, 2026: structured market data shows recurring Pelagos 39 transactions and listings. This is liquidity context, not an investment forecast.", brokerageOpportunities: "Identify complete examples with honest titanium condition and properly functioning clasp, then compare the same reference and accessory set.", buyerGuidance: "Confirm the very light titanium feel suits the buyer and inspect surface wear, clasp, complete accessories, and water-use readiness.", sellerGuidance: "Photograph titanium surfaces accurately and include all links, rubber components, box, card, service history, and any pressure-test result.", perspective: "Pelagos 39 is strongest as a lightweight ownership choice; completeness and condition should lead the transaction analysis.", reviewedAt: "July 16, 2026", evidenceSources: [pelagosSource, pelagosMarketSource],
  } satisfies ReferenceBrokerageIntelligence),
});

const attachIntelligence = (asset: TudorAsset): TudorAsset => ({ ...asset, brokerageIntelligence: referenceIntelligence[asset.reference as keyof typeof referenceIntelligence] });

export const tudorBlackBayLaunchAssets = tudorBlackBayAssets.map(attachIntelligence);
export const tudorPelagosLaunchAssets = tudorPelagosAssets.map(attachIntelligence);
export const tudorLaunchAssets = [...tudorBlackBayLaunchAssets, ...tudorPelagosLaunchAssets];
export const isTudorPriorityReference = (asset: TudorAsset): boolean => Boolean(asset.brokerageIntelligence);
