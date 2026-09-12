import type {
  BrokerageLiquidityBand,
  CollectionBrokerageIntelligence,
} from "../types/brokerageIntelligence";

export interface CollectionExpansionGuide {
  readonly brand: string;
  readonly brandSlug: string;
  readonly collection: string;
  readonly collectionSlug: string;
  readonly description: string;
  readonly intro: string;
  readonly intelligence: CollectionBrokerageIntelligence;
}

interface GuideSeed {
  brand: string;
  brandSlug: string;
  collection: string;
  collectionSlug: string;
  description: string;
  overview: string;
  marketPosition: string;
  liquidityBand: BrokerageLiquidityBand;
  liquidityGuidance: string;
  buyerProfile: string;
  sellerProfile: string;
  ownershipConsiderations: string;
  brokerageInsight: string;
  marketCommentary: string;
  perspective: string;
}

const createGuide = (seed: GuideSeed): CollectionExpansionGuide => Object.freeze({
  brand: seed.brand,
  brandSlug: seed.brandSlug,
  collection: seed.collection,
  collectionSlug: seed.collectionSlug,
  description: seed.description,
  intro: "Collection identity establishes the starting point; configuration, condition, completeness, service history, and fit determine the watch-level decision.",
  intelligence: Object.freeze({
    overview: seed.overview,
    marketPosition: seed.marketPosition,
    liquidityBand: seed.liquidityBand,
    liquidityGuidance: seed.liquidityGuidance,
    buyerProfile: seed.buyerProfile,
    sellerProfile: seed.sellerProfile,
    ownershipConsiderations: seed.ownershipConsiderations,
    brokerageInsight: seed.brokerageInsight,
    marketCommentary: seed.marketCommentary,
    perspective: seed.perspective,
    reviewedAt: "July 2026",
  }),
});

export const collectionExpansionGuides = Object.freeze([
  createGuide({
    brand: "Omega", brandSlug: "omega", collection: "Seamaster Planet Ocean", collectionSlug: "planet-ocean",
    description: "Launch-quality guidance for Omega's modern, deeper-rated Seamaster dive-watch family.",
    overview: "Planet Ocean is the more substantial modern dive-watch lane within Seamaster, spanning multiple sizes, materials, complications, and movement generations.",
    marketPosition: "It serves buyers who want stronger professional-dive presence than the Diver 300M and accept greater case thickness and weight.",
    liquidityBand: "Moderate", liquidityGuidance: "Recognizable steel three-hand configurations generally have the broadest audience. Larger, precious-metal, ceramic, and complicated variants require more configuration-specific pricing.",
    buyerProfile: "Best suited to buyers who prioritize water resistance, wrist presence, modern Omega movement technology, and a robust bracelet or strap platform.",
    sellerProfile: "Sellers benefit from documenting the exact case size, generation, movement, service history, accessories, and any wear to polished or ceramic surfaces.",
    ownershipConsiderations: "Thickness, weight, clasp condition, bezel alignment, water-resistance testing, and service cost should be evaluated before purchase.",
    brokerageInsight: "Reference and generation matching matter more than the Planet Ocean name alone; superficially similar examples can differ materially in proportions and ownership experience.",
    marketCommentary: "Demand is established but more selective than for the most familiar Seamaster and Speedmaster configurations, so broad collection averages can mislead.",
    perspective: "Quest Luxo treats Planet Ocean as a fit- and configuration-led purchase: choose the watch that works on the wrist before optimizing the transaction.",
  }),
  createGuide({
    brand: "Omega", brandSlug: "omega", collection: "Aqua Terra", collectionSlug: "aqua-terra",
    description: "Launch-quality guidance for Omega's versatile everyday sport-watch collection.",
    overview: "Aqua Terra combines water-ready construction with a cleaner dial and bezel profile, making it one of Omega's broadest everyday-wear collections.",
    marketPosition: "It sits between dedicated tool watches and formal dress watches, with size, dial, bracelet, strap, and movement generation shaping demand.",
    liquidityBand: "Moderate", liquidityGuidance: "Mainstream steel sizes and legible dial colors usually attract the widest audience; unusual colors, complications, or precious metals can take longer to place.",
    buyerProfile: "A strong fit for buyers seeking one refined daily watch with automatic movement credibility and less visual bulk than a dive watch.",
    sellerProfile: "Sellers should present the precise reference, case size, dial, bracelet completeness, service state, and cosmetic condition rather than relying on the Aqua Terra name.",
    ownershipConsiderations: "Confirm wrist fit, bracelet links, clasp function, movement generation, water-resistance status, and the visibility of polished-surface wear.",
    brokerageInsight: "Aqua Terra transactions are configuration sensitive; small changes in size and dial can materially change the buyer pool.",
    marketCommentary: "The collection has durable everyday appeal, but liquidity is distributed across many configurations rather than concentrated in one universal reference.",
    perspective: "Quest Luxo views Aqua Terra as a practical long-term ownership choice when fit and configuration are selected deliberately, not as a single uniform market.",
  }),
  createGuide({
    brand: "Audemars Piguet", brandSlug: "audemars-piguet", collection: "Royal Oak Jumbo", collectionSlug: "royal-oak-jumbo",
    description: "Launch-quality guidance for the extra-thin, collector-led Royal Oak format.",
    overview: "Royal Oak Jumbo identifies the extra-thin, historically proportioned lane of the collection, where generation, dial, movement, and originality require careful separation.",
    marketPosition: "It occupies a collector-focused tier distinct from larger selfwinding Royal Oak models and is valued for proportion and lineage rather than feature count.",
    liquidityBand: "Specialized", liquidityGuidance: "Demand can be strong for correctly represented examples, but high values and reference-specific preferences make the qualified buyer pool narrower than headline attention suggests.",
    buyerProfile: "Appropriate for experienced buyers who value thinness, integrated-bracelet finishing, design lineage, and reference-level scholarship.",
    sellerProfile: "Sellers should assemble extracts, service records, full bracelet details, accessories, and clear disclosure of refinishing or replaced parts.",
    ownershipConsiderations: "Case geometry, bracelet stretch, dial originality, water exposure, movement service, and prior polishing deserve specialist inspection.",
    brokerageInsight: "The best transaction is not simply the lowest-priced Jumbo; originality, proportions, and documentation can dominate long-term desirability.",
    marketCommentary: "Public asking prices do not establish executable value in this specialized segment. Comparable generation, dial, condition, and completeness are essential.",
    perspective: "Quest Luxo approaches the Jumbo as a collector object first and a recognizable luxury-sport watch second.",
  }),
  createGuide({
    brand: "Audemars Piguet", brandSlug: "audemars-piguet", collection: "Royal Oak Chronograph", collectionSlug: "royal-oak-chronograph",
    description: "Launch-quality guidance for Royal Oak chronograph generations and configurations.",
    overview: "Royal Oak Chronograph extends the integrated-bracelet design into a sport complication offered across multiple sizes, metals, dial layouts, and generations.",
    marketPosition: "It attracts buyers wanting more visual and mechanical complexity than a time-only Royal Oak, with added service and condition exposure.",
    liquidityBand: "Moderate", liquidityGuidance: "Familiar steel configurations tend to travel best, while precious metals, uncommon dials, and older generations require narrower comparable sets.",
    buyerProfile: "Best for clients who actively want chronograph presence and accept a thicker case, busier dial, and higher maintenance burden.",
    sellerProfile: "Sellers should disclose chronograph operation, service documentation, bracelet sizing, case finishing, dial condition, and exact reference suffixes.",
    ownershipConsiderations: "Test reset alignment and pusher feel, inspect case and bracelet geometry, and budget for complication-level servicing.",
    brokerageInsight: "Generation, case size, metal, and dial can matter as much as the collection name, so broad Royal Oak comparisons are insufficient.",
    marketCommentary: "Buyer demand is real but selective; transaction quality depends on matching a configuration to the right client rather than assuming universal Royal Oak liquidity.",
    perspective: "Quest Luxo recommends the Chronograph when the complication is central to the client's taste, not merely as an alternative route into Royal Oak ownership.",
  }),
  createGuide({
    brand: "Audemars Piguet", brandSlug: "audemars-piguet", collection: "Royal Oak Offshore", collectionSlug: "royal-oak-offshore",
    description: "Launch-quality guidance for the bold, high-presence Royal Oak Offshore family.",
    overview: "Royal Oak Offshore is the larger, more assertive sport-watch branch of AP, spanning chronographs, varied materials, limited editions, and changing case formats.",
    marketPosition: "It offers unmistakable AP design with a more muscular ownership experience and a more fragmented secondary market than core Royal Oak models.",
    liquidityBand: "Specialized", liquidityGuidance: "Liquidity varies sharply by size, era, material, dial, and limited-edition identity. A precise comparable set is necessary before setting expectations.",
    buyerProfile: "Suited to clients who genuinely enjoy scale, bold design, rubber or integrated components, and the collection's era-specific character.",
    sellerProfile: "Sellers should document case dimensions, material, limited-edition details, service history, strap condition, accessories, and refinishing.",
    ownershipConsiderations: "Fit, case-edge wear, rubber aging, chronograph service, water resistance, and replacement-component availability should be reviewed.",
    brokerageInsight: "Offshore is not one market; early examples, modern references, ceramics, and limited editions each need their own buyer and valuation logic.",
    marketCommentary: "Selective demand and wide configuration variety can produce a large gap between advertised and executable pricing.",
    perspective: "Quest Luxo favors Offshore examples with clear identity, honest condition, and a client whose wrist and style support the watch.",
  }),
  createGuide({
    brand: "Audemars Piguet", brandSlug: "audemars-piguet", collection: "Offshore Diver", collectionSlug: "offshore-diver",
    description: "Launch-quality guidance for the dive-focused Royal Oak Offshore line.",
    overview: "Offshore Diver applies the Offshore case language to a dive-watch format, with internal timing bezels and varied materials across generations.",
    marketPosition: "It is a specialized alternative for buyers who want AP design in a functional, high-presence dive-watch package rather than a chronograph.",
    liquidityBand: "Specialized", liquidityGuidance: "Steel and recognizable colorways may have broader demand, but case material, size, generation, and condition materially affect placement time.",
    buyerProfile: "Best for clients comfortable with substantial dimensions who value the unusual combination of high horology branding and dive-watch utility.",
    sellerProfile: "Sellers should provide water-resistance and service information, strap and buckle condition, full accessories, and clear images of case edges and bezels.",
    ownershipConsiderations: "Confirm internal-bezel operation, crown integrity, water resistance, rubber condition, case wear, and realistic service planning.",
    brokerageInsight: "Dive capability should be verified on the individual watch; collection reputation is not a substitute for current pressure testing and seal condition.",
    marketCommentary: "This is an enthusiast-led segment where color and material preferences can outweigh generic brand demand.",
    perspective: "Quest Luxo positions the Offshore Diver as a deliberate design and fit choice, not as a proxy for core Royal Oak liquidity.",
  }),
  createGuide({
    brand: "Audemars Piguet", brandSlug: "audemars-piguet", collection: "Code 11.59", collectionSlug: "code-1159",
    description: "Launch-quality guidance for Audemars Piguet's contemporary round-watch collection.",
    overview: "Code 11.59 combines a round presentation with complex case architecture and spans time-only watches through major complications.",
    marketPosition: "It gives buyers access to modern AP watchmaking outside the Royal Oak family, with configuration and complication driving demand.",
    liquidityBand: "Specialized", liquidityGuidance: "The buyer pool is more selective than for AP's integrated-bracelet icons. Dial, metal, complication, and price discipline are central to execution.",
    buyerProfile: "Suited to clients who value case construction, dial work, movement finishing, and lower-recognition AP ownership.",
    sellerProfile: "Sellers should present the exact complication, dial, metal, service history, condition, and complete set to reach informed buyers.",
    ownershipConsiderations: "Complication servicing, polished-case wear, crystal condition, strap replacement, and long-term fit should be assessed.",
    brokerageInsight: "Code 11.59 requires product-specific storytelling and evidence; Royal Oak pricing logic should not be transferred to it.",
    marketCommentary: "Reception and demand vary by generation and dial execution, making recent, like-for-like transaction evidence especially important.",
    perspective: "Quest Luxo sees Code 11.59 as a watchmaking-led AP choice for clients willing to prioritize the object over immediate recognition.",
  }),
  createGuide({
    brand: "Cartier", brandSlug: "cartier", collection: "Ballon Bleu", collectionSlug: "ballon-bleu",
    description: "Launch-quality guidance for Cartier's rounded modern dress-watch collection.",
    overview: "Ballon Bleu is defined by its rounded case, integrated crown architecture, and broad range of sizes, movements, metals, and gem-set configurations.",
    marketPosition: "It is a recognizable modern Cartier choice with strong gifting and daily-wear relevance, but demand is highly configuration dependent.",
    liquidityBand: "Moderate", liquidityGuidance: "Mainstream steel sizes generally have the widest audience. Precious metal, diamonds, smaller sizes, and less common configurations need targeted pricing.",
    buyerProfile: "Well suited to buyers seeking softer case geometry, clear Cartier identity, and a dress-oriented watch that can still work daily.",
    sellerProfile: "Sellers should identify size, movement, metal, gem setting, bracelet links, service state, and full-set status precisely.",
    ownershipConsiderations: "Polished-surface wear, bracelet sizing, crown operation, battery or mechanical service, and gem-setting originality should be checked.",
    brokerageInsight: "Size and configuration define the audience, so comparable watches must match more than the Ballon Bleu collection name.",
    marketCommentary: "Broad model variety supports steady interest but disperses liquidity across many distinct buyer profiles.",
    perspective: "Quest Luxo treats Ballon Bleu as a proportion-led Cartier purchase whose success begins with the correct wrist fit.",
  }),
  createGuide({
    brand: "Cartier", brandSlug: "cartier", collection: "Pasha", collectionSlug: "pasha",
    description: "Launch-quality guidance for Cartier's distinctive round sport and dress collection.",
    overview: "Pasha pairs a round case with recognizable crown and dial details across vintage, neo-vintage, and modern interpretations.",
    marketPosition: "It serves design-led Cartier buyers seeking a bolder and less conventional alternative to Santos or Tank.",
    liquidityBand: "Specialized", liquidityGuidance: "Demand depends on era, size, metal, movement, complication, and design details. Patient placement is often more realistic than broad-market assumptions.",
    buyerProfile: "Best for clients attracted to distinctive Cartier design and willing to research generation-specific proportions and mechanics.",
    sellerProfile: "Sellers should document reference, dimensions, movement, service, crown components, bracelet or strap, and originality.",
    ownershipConsiderations: "Inspect crown-cap hardware, case refinishing, dial and hand originality, movement health, water resistance, and strap fit.",
    brokerageInsight: "Pasha rewards precise identification; superficially similar watches can belong to meaningfully different eras and value bands.",
    marketCommentary: "The collection has recognizable design equity but a narrower buyer pool than Cartier's flagship shaped watches.",
    perspective: "Quest Luxo recommends Pasha to clients who respond to its design on its own terms, supported by disciplined condition and reference review.",
  }),
  createGuide({
    brand: "Patek Philippe", brandSlug: "patek-philippe", collection: "Calatrava", collectionSlug: "calatrava",
    description: "Launch-quality guidance for Patek Philippe's classic round dress-watch family.",
    overview: "Calatrava covers decades of round dress-watch design across many sizes, metals, movements, dial styles, and production eras.",
    marketPosition: "It represents understated Patek ownership, where craftsmanship and proportion matter more than sport-watch recognition.",
    liquidityBand: "Specialized", liquidityGuidance: "Demand is reference specific. Strong condition and attractive proportions help, while small sizes, altered dials, or incomplete provenance can narrow the audience.",
    buyerProfile: "Best for buyers who appreciate discreet precious-metal dress watches and are prepared to evaluate vintage or modern details carefully.",
    sellerProfile: "Sellers should establish reference, movement and case numbers where appropriate, dial originality, service history, dimensions, and documentation.",
    ownershipConsiderations: "Moisture history, dial work, case polishing, movement parts, service quality, and strap or buckle originality require scrutiny.",
    brokerageInsight: "Calatrava is not a single price category; era, reference, condition, and originality create distinct submarkets.",
    marketCommentary: "Interest in classic dress watches does not make every example liquid. Executable value depends on finding the right collector for the exact watch.",
    perspective: "Quest Luxo views Calatrava as a connoisseur purchase where restraint, condition, and scholarship should lead the decision.",
  }),
  createGuide({
    brand: "Patek Philippe", brandSlug: "patek-philippe", collection: "Cubitus", collectionSlug: "cubitus",
    description: "Launch-quality guidance for Patek Philippe's contemporary square-format collection.",
    overview: "Cubitus is a contemporary Patek Philippe collection whose square-rounded case and integrated design require configuration-specific evaluation.",
    marketPosition: "It occupies a newer sport-luxury lane, so established brand strength should be separated from the still-developing behavior of individual references.",
    liquidityBand: "Insufficient evidence", liquidityGuidance: "The collection lacks the long secondary-market history needed for durable generalizations. Use recent, verified like-for-like transactions and conservative timing assumptions.",
    buyerProfile: "Suited to clients who genuinely prefer the design and are comfortable owning a newer collection without relying on long historical market patterns.",
    sellerProfile: "Sellers should supply exact reference and configuration, condition, complete accessories, purchase documentation, and current service status.",
    ownershipConsiderations: "Assess fit, integrated bracelet sizing, polished-surface wear, movement service planning, and the limited evidence available for longer-term demand.",
    brokerageInsight: "Newness increases the importance of current evidence and disciplined disclosure; comparisons to Nautilus should remain limited and explicit.",
    marketCommentary: "Early asking prices and attention can be volatile signals. They should not be treated as stable value or liquidity evidence.",
    perspective: "Quest Luxo approaches Cubitus as a design-led purchase with conservative market assumptions until a deeper transaction history develops.",
  }),
  createGuide({
    brand: "Panerai", brandSlug: "panerai", collection: "Submersible", collectionSlug: "submersible",
    description: "Launch-quality guidance for Panerai's purpose-built modern dive-watch family.",
    overview: "Submersible separates Panerai's dive-focused models into a distinct collection spanning multiple case sizes, metals, carbotech-style materials, and complications.",
    marketPosition: "It appeals to buyers who want unmistakable Panerai case language with a rotating bezel and overt professional-sport identity.",
    liquidityBand: "Specialized", liquidityGuidance: "Steel, wearable sizes, and clearly identified references may attract broader interest; larger or exotic-material configurations require a targeted buyer and conservative timeline.",
    buyerProfile: "Best suited to clients comfortable with bold dimensions who value dive-watch utility, strap versatility, and Panerai design identity.",
    sellerProfile: "Sellers should disclose exact reference, case material and size, service and water-resistance status, strap and buckle inventory, and complete accessories.",
    ownershipConsiderations: "Fit, bezel and crown-guard operation, water resistance, case material wear, strap condition, and movement service should be evaluated.",
    brokerageInsight: "Reference-level differences in size and material shape both ownership and resale; the Submersible name alone is not a sufficient comparable.",
    marketCommentary: "The collection has an identifiable enthusiast base, but transaction depth varies considerably across configurations.",
    perspective: "Quest Luxo treats Submersible as a personality- and fit-led choice backed by careful reference identification and realistic exit expectations.",
  }),
  createGuide({
    brand: "Tudor", brandSlug: "tudor", collection: "Prince", collectionSlug: "prince",
    description: "Launch-quality guidance for Tudor's broad vintage and neo-vintage classic-watch family.",
    overview: "Prince spans a wide historical field of everyday Tudor watches, including varied case sizes, dials, movements, bracelets, and regional references.",
    marketPosition: "It offers accessible vintage and neo-vintage Tudor collecting beyond the brand's modern dive-watch focus.",
    liquidityBand: "Specialized", liquidityGuidance: "Demand is fragmented by era, size, dial, case, and originality. Clean, correctly identified examples are easier to position than generic or heavily altered pieces.",
    buyerProfile: "Appropriate for buyers who value vintage proportions and are willing to prioritize condition and originality over modern specifications.",
    sellerProfile: "Sellers should provide clear case, dial, movement, reference, bracelet, and hallmark photography plus known service and provenance information.",
    ownershipConsiderations: "Redials, replacement parts, polishing, moisture damage, bracelet wear, and uncertain service history are central risks.",
    brokerageInsight: "Prince requires watch-by-watch authentication and valuation; broad model labels conceal substantial variation.",
    marketCommentary: "Selective collector interest exists, but reliable pricing depends on close comparables and evidence of originality.",
    perspective: "Quest Luxo sees Prince as an informed vintage purchase where honesty and condition matter more than forcing a modern liquidity narrative.",
  }),
  createGuide({
    brand: "Tudor", brandSlug: "tudor", collection: "Royal", collectionSlug: "royal",
    description: "Launch-quality guidance for Tudor's integrated-bracelet dress-sport collection.",
    overview: "Tudor Royal blends an integrated bracelet, notched bezel, and day-date or date configurations across a broad size range.",
    marketPosition: "It is an accessible, design-forward alternative within Tudor for buyers who prefer dress-sport styling to a conventional tool watch.",
    liquidityBand: "Moderate", liquidityGuidance: "Steel, wearable sizes, and broadly appealing dials should be easier to place; two-tone, diamond, and less common size combinations require configuration-specific expectations.",
    buyerProfile: "Well suited to buyers seeking a polished daily watch with integrated styling, clear brand recognition, and multiple sizing choices.",
    sellerProfile: "Sellers should identify size, dial, metal, movement configuration, bracelet links, cosmetic wear, service status, and complete set.",
    ownershipConsiderations: "Bracelet fit, link completeness, polished-surface scratches, day-date operation, and realistic refinishing expectations should be reviewed.",
    brokerageInsight: "Size and dial selection determine the buyer pool, making exact-configuration comparisons more useful than collection-wide averages.",
    marketCommentary: "Royal offers practical accessibility, but its many configurations distribute demand rather than concentrating it in one reference.",
    perspective: "Quest Luxo positions Tudor Royal as a wearable value choice when the client selects the correct proportion and buys with disciplined resale expectations.",
  }),
] satisfies readonly CollectionExpansionGuide[]);

export function getCollectionExpansionGuides(brandSlug: string): readonly CollectionExpansionGuide[] {
  return collectionExpansionGuides.filter((guide) => guide.brandSlug === brandSlug);
}
