import { iwcPilotsWatchAssets, iwcPortugieserAssets, type IwcAsset } from "./iwc";
import type { BrandBrokerageIntelligence, CollectionBrokerageIntelligence, ReferenceBrokerageIntelligence } from "../types/brokerageIntelligence";

const iwcHistorySource = Object.freeze({ label: "IWC - Our Story", url: "https://www.iwc.com/ae/en/company/our-story.html" });
const pilotsHistorySource = Object.freeze({ label: "IWC - 85-year legacy of Pilot's Watches", url: "https://www.iwc.com/gb-en/journal/85-year-legacy-pilot-watches" });
const portugieserHistorySource = Object.freeze({ label: "IWC - Introduction to Portugieser watches", url: "https://www.iwc.com/gb-en/watches/portugieser/introduction-to-portugieser-watches" });
const markXxSource = Object.freeze({ label: "IWC - Pilot's Watch Mark XX IW328201", url: "https://www.iwc.com/fi/en/watch-collections/pilot-watches/iw328201-pilot_s-watch-mark-xx.html" });
const bigPilot43Source = Object.freeze({ label: "IWC - Big Pilot's Watch 43 IW329301", url: "https://www.iwc.com/us-en/watches/pilot-watches/iw329301-big-pilots-watch-43" });
const portugieser40Source = Object.freeze({ label: "IWC - Portugieser Automatic 40 IW358303", url: "https://www.iwc.com/de/en/watch-collections/portugieser/iw358303-portugieser-automatic-40.html" });
const iwcMarketSource = Object.freeze({ label: "WatchCharts - IWC market overview, July 2026", url: "https://watchcharts.com/watches/brand/iwc" });
const markXxMarketSource = Object.freeze({ label: "WatchCharts - IW328201 market overview, June 2026", url: "https://watchcharts.com/watch_model/41837-iwc-pilot-s-watch-mark-xx-stainless-steel-328201/overview" });
const bigPilot43MarketSource = Object.freeze({ label: "WatchCharts - IW329301 market overview, June 2026", url: "https://watchcharts.com/watch_model/33603-iwc-big-pilot-s-watch-43-329301/overview" });
const portugieser40MarketSource = Object.freeze({ label: "WatchCharts - IW358303 market overview, June 2026", url: "https://watchcharts.com/watch_model/17383-iwc-portugieser-automatic-40-358303/overview" });

export const iwcBrandIntelligence = Object.freeze({
  brokeragePositioning: "IWC brokerage combines recognizable collection identities with broad variation in diameter, movement, dial, strap or bracelet, and generation. Exact reference, fit, condition, completeness, service history, and acquisition basis therefore matter more than brand-level generalization.",
  overview: "Founded in Schaffhausen in 1868, IWC developed an engineering-led identity spanning professional Pilot's Watches and the classically proportioned Portugieser. Launch coverage focuses on those two families and three current references rather than extending conclusions across the wider catalog.",
  perspective: "Quest Luxo treats IWC as an example-led market. Official specifications and history establish context; a brokerage recommendation follows only after the exact reference, wrist fit, condition, accessories, service state, and like-for-like public evidence have been assessed.",
  evidenceSources: [iwcHistorySource, pilotsHistorySource, portugieserHistorySource],
} satisfies BrandBrokerageIntelligence);

export const iwcCollectionSummaries = Object.freeze({
  "pilots-watch": "Functional aviation-watch coverage for the 40 mm Mark XX IW328201 and the streamlined 43 mm Big Pilot IW329301.",
  portugieser: "Classical, instrument-inspired coverage centered on the time-only Portugieser Automatic 40 IW358303.",
});

export const iwcPilotsWatchIntelligence = Object.freeze({
  overview: "IWC's Pilot's Watch lineage dates to the 1930s and now spans compact Mark watches, chronographs, and larger Big Pilot expressions. Launch coverage deliberately separates the practical Mark XX from the more architectural Big Pilot's Watch 43.",
  marketPosition: "Pilot's Watch is one of IWC's clearest design families, but recognition does not make every model interchangeable. Diameter, movement, complications, dial, bracelet or strap, and Big Pilot versus Mark positioning create distinct comparison groups.",
  liquidityBand: "Moderate", liquidityGuidance: "Reviewed public brand and reference coverage shows observable secondary-market activity for both launch references, but demand is price-sensitive and affected by proportions, exact configuration, condition, complete delivery contents, and service evidence. No fixed sale timeline should be assumed.",
  buyerProfile: "Best suited to buyers who value legibility, functional design, and IWC's aviation lineage. Buyers should compare the Mark XX's restrained 40 mm format with the Big Pilot 43's larger case, crown, and display-back presentation on the wrist.",
  sellerProfile: "Sellers should identify the complete reference, year, dial and strap or bracelet configuration, buckle, warranty card, box, tools or spare straps, and service records, supported by clear case, crystal, dial, crown, caseback, and strap photography.",
  ownershipConsiderations: "Inspect crown and winding operation, timekeeping, date function where present, crystal and anti-reflective coating, case finish, strap and buckle, quick-change hardware, service history, and current pressure-test evidence before water use.",
  brokerageInsight: "Quest Luxo can isolate the correct Mark XX or Big Pilot 43 comparison set, evaluate fit and condition, validate delivery contents, and prevent broader IWC or Pilot's Watch listings from distorting the decision.",
  marketCommentary: "Reviewed July 16, 2026: structured public coverage supports a Moderate liquidity assessment for these current steel references. It does not support appreciation forecasts, guaranteed value retention, or treating all Pilot's Watches as equally saleable.",
  perspective: "The collection is strongest when the client chooses the correct format first. Mark XX and Big Pilot 43 express related design language but serve different ergonomic and ownership preferences.",
  reviewedAt: "July 16, 2026", evidenceSources: [pilotsHistorySource, markXxSource, bigPilot43Source, iwcMarketSource, markXxMarketSource, bigPilot43MarketSource],
} satisfies CollectionBrokerageIntelligence);

export const iwcPortugieserIntelligence = Object.freeze({
  overview: "The Portugieser originated from a late-1930s request for wristwatches with marine-chronometer precision and pocket-watch movements. Its Arabic numerals, railway-track scale, slender hands, and open dial remain central to the family.",
  marketPosition: "Portugieser occupies IWC's classical watch category and spans simple automatics through chronographs and high complications. The Automatic 40 is a focused, time-only proposition and should not inherit assumptions from larger or more complicated references.",
  liquidityBand: "Moderate", liquidityGuidance: "Public reference coverage indicates an observable resale market, but dress-watch demand, dial and metal, polished-case condition, strap quality, completeness, service history, and price discipline can materially change execution.",
  buyerProfile: "Best suited to clients seeking a clean, classically proportioned automatic watch with visible movement finishing. Buyers should assess the 40 mm format, long lugs, leather-strap use, and modest water-resistance specification in person.",
  sellerProfile: "Sellers should provide the full reference, dial and strap configuration, buckle, box, warranty card, service documentation, timing evidence, and detailed images of the dial, polished case, crystal, lugs, caseback, strap, and buckle.",
  ownershipConsiderations: "Polished surfaces and leather straps show wear readily. Inspect dial and hands, crystal and coating, case and lugs, crown, strap and buckle, movement performance, service history, and moisture testing; do not infer current water readiness from the original rating.",
  brokerageInsight: "Quest Luxo can distinguish the Automatic 40 from larger Portugieser automatics and chronographs, match the exact dial and metal, and compare complete examples with equivalent condition and service context.",
  marketCommentary: "Reviewed July 16, 2026: public model-level evidence supports a Moderate, not universal, liquidity view. The evidence does not justify investment language, a guaranteed exit, or extrapolation across the full Portugieser family.",
  perspective: "The Automatic 40 succeeds through proportion and clarity. The right acquisition prioritizes fit, dial and case quality, mechanical condition, completeness, and a rational basis over complication count.",
  reviewedAt: "July 16, 2026", evidenceSources: [portugieserHistorySource, portugieser40Source, iwcMarketSource, portugieser40MarketSource],
} satisfies CollectionBrokerageIntelligence);

const referenceIntelligence = Object.freeze({
  IW328201: Object.freeze({
    overview: "The IW328201 is a current steel Pilot's Watch Mark XX that updates IWC's practical Mark-series formula in a wearable 40 mm case.",
    configurationSummary: "Black dial, steel case, black calfskin strap with EasX-CHANGE, calibre 32111 automatic movement, 120-hour power reserve, date display, screw-in crown, and 100 m specification.",
    liquidityBand: "Moderate", liquidityObservations: "Reference-level public coverage shows an active market, but availability alone does not guarantee a quick sale. Ask, condition, strap and buckle, full-set status, age, and service evidence influence buyer response.",
    serviceExposure: "Moderate", serviceConsiderations: "Confirm timekeeping, amplitude where available, winding and date operation, crown and seals, service history, and current pressure testing. A long stated power reserve does not replace inspection of the specific movement.",
    ownershipComplexity: "Lower", conditionConsiderations: "Inspect the dial and hands, crystal and anti-reflective coating, brushed and polished case surfaces, crown, caseback, calfskin strap, buckle, and EasX-CHANGE attachment points.",
    marketCommentary: "Reviewed July 16, 2026: current model-level evidence supports Moderate liquidity and price-sensitive execution, not a retention guarantee or appreciation forecast.",
    brokerageOpportunities: "Source complete, lightly worn examples with documented performance and compare only the same reference, dial, and strap or bracelet configuration. Sellers benefit from clear condition and service disclosure.",
    buyerGuidance: "Try the 40 mm case and lug profile, confirm the included strap and buckle, inspect coating and case condition, and obtain current mechanical and pressure-test evidence for regular use.",
    sellerGuidance: "Provide the warranty card, box, manuals, strap or bracelet contents, service and timing records, plus detailed photographs of the dial, case, crystal, crown, caseback, strap, and buckle.",
    perspective: "The Mark XX is the most straightforward launch reference here: a strong outcome comes from wearability and example quality, not from treating its lineage as a financial thesis.",
    reviewedAt: "July 16, 2026", evidenceSources: [markXxSource, markXxMarketSource, iwcMarketSource],
  } satisfies ReferenceBrokerageIntelligence),
  IW329301: Object.freeze({
    overview: "The IW329301 translates the Big Pilot's Watch design into a simplified 43 mm steel case with central time display and a visible manufacture movement.",
    configurationSummary: "Black dial, steel case, brown calfskin strap with EasX-CHANGE, oversized conical crown, calibre 82100 automatic movement, 60-hour power reserve, display caseback, and 100 m specification.",
    liquidityBand: "Moderate", liquidityObservations: "Public model-level activity supports a buyer market, while the 43 mm scale, strap configuration, condition, completeness, service state, and discount to comparable examples affect the depth and speed of that market.",
    serviceExposure: "Moderate", serviceConsiderations: "Confirm winding efficiency, timekeeping, crown operation, power-reserve behavior, service history, and pressure testing. The visible manufacture movement warrants documented mechanical assessment rather than cosmetic review alone.",
    ownershipComplexity: "Moderate", conditionConsiderations: "Inspect the large crown, crystal and coatings, brushed and polished case, display back, strap and buckle, quick-change fittings, dial and hands, and evidence of impact or moisture.",
    marketCommentary: "Reviewed July 16, 2026: model-level public evidence supports Moderate liquidity, with no basis for guaranteed sale timing, future-value claims, or comparison with every Big Pilot generation.",
    brokerageOpportunities: "Match the reference to buyers who actively want Big Pilot proportions, and prioritize complete examples with strong case and strap condition, documented performance, and like-for-like pricing.",
    buyerGuidance: "Evaluate the 43 mm case and crown on the wrist, confirm the exact delivery set, and review mechanical and pressure-test evidence before treating it as a daily-use watch.",
    sellerGuidance: "Document the warranty card, box, buckle, strap and any alternatives, service and timing records, plus the dial, crystal, crown, case, display back, and strap condition.",
    perspective: "The Big Pilot 43 is a design and fit decision first. Its brokerage case is strongest when the client wants its scale and the example supports the ask through condition, completeness, and mechanical evidence.",
    reviewedAt: "July 16, 2026", evidenceSources: [bigPilot43Source, bigPilot43MarketSource, iwcMarketSource],
  } satisfies ReferenceBrokerageIntelligence),
  IW358303: Object.freeze({
    overview: "The IW358303 is a current 40 mm-class steel Portugieser that reduces the collection to hours, minutes, and small seconds in its characteristic open-dial format.",
    configurationSummary: "Silver-plated dial with blue hands, steel case, black alligator leather strap, calibre 82200 automatic movement, 60-hour power reserve, small seconds, display caseback, and 3 bar specification.",
    liquidityBand: "Moderate", liquidityObservations: "Public reference-level evidence indicates a functioning secondary market, but dress-watch demand, exact dial, polished condition, original strap and buckle, completeness, service state, and ask materially affect execution.",
    serviceExposure: "Moderate", serviceConsiderations: "Confirm timekeeping, winding and power-reserve behavior, service history, crown and seals, and moisture testing. Plan ownership around leather-strap use and the modest original water-resistance specification.",
    ownershipComplexity: "Lower", conditionConsiderations: "Inspect the silver-plated dial and blue hands, crystal and coating, polished case and long lugs, crown, display back, alligator strap, buckle, and any signs of moisture or over-polishing.",
    marketCommentary: "Reviewed July 16, 2026: model-level evidence supports a conservative Moderate assessment. It does not support universal Portugieser liquidity, price-retention claims, or appreciation predictions.",
    brokerageOpportunities: "Find complete examples with crisp polished geometry, clean dial and crystal, a serviceable original buckle and strap, and documented movement performance; compare only like dial and metal configurations.",
    buyerGuidance: "Try the lug-to-lug profile, examine polished surfaces and strap condition, verify the delivery set, and treat water exposure conservatively until current testing is documented.",
    sellerGuidance: "Provide the card, box, original buckle and strap details, service and timing evidence, and close photographs of the dial, case, lugs, crystal, crown, caseback, strap, and buckle.",
    perspective: "The Automatic 40 is compelling when its spare design and wrist proportions are the objective. Condition and acquisition basis should carry more weight than broad collection prestige.",
    reviewedAt: "July 16, 2026", evidenceSources: [portugieser40Source, portugieser40MarketSource, iwcMarketSource],
  } satisfies ReferenceBrokerageIntelligence),
});

const attachIntelligence = (asset: IwcAsset): IwcAsset => ({ ...asset, brokerageIntelligence: referenceIntelligence[asset.reference as keyof typeof referenceIntelligence] });

export const iwcPilotsWatchLaunchAssets = iwcPilotsWatchAssets.map(attachIntelligence);
export const iwcPortugieserLaunchAssets = iwcPortugieserAssets.map(attachIntelligence);
export const iwcLaunchAssets = [...iwcPilotsWatchLaunchAssets, ...iwcPortugieserLaunchAssets];
export const isIwcPriorityReference = (asset: IwcAsset): boolean => Boolean(asset.brokerageIntelligence);
