import { cartierTankBrokerageIntelligence } from "./cartier-intelligence";
import { collectionExpansionGuides } from "./collection-expansion";
import { omegaSeamasterDiver300MIntelligence } from "./omega-intelligence";

export interface CollectionLaunchQualityProfile {
  readonly overview: string;
  readonly historicalBackground: string;
  readonly currentProductionStatus: string;
  readonly marketDemand: string;
  readonly liquidity: string;
  readonly collectorProfile: string;
  readonly investmentConsiderations: string;
  readonly buyingRecommendations: string;
  readonly commonConfigurations: string;
  readonly typicalPriceTiers: string;
  readonly brokerageConsiderations: string;
  readonly perspective: string;
  readonly reviewedAt: string;
}

interface SupplementalProfile {
  history: string;
  production: string;
  investment: string;
  configurations: string;
  priceTiers: string;
}

const supplementalProfiles: Readonly<Record<string, SupplementalProfile>> = Object.freeze({
  "omega/seamaster": {
    history: "The Diver 300M debuted in 1993 and established the modern wave-dial, scalloped-bezel Seamaster identity later associated with multiple James Bond eras.",
    production: "The Diver 300M remains in Omega's current catalog across steel, strap, bracelet, precious-metal, ceramic, chronograph, and special configurations; earlier 1990s and 2000s generations are discontinued.",
    investment: "Treat value retention as reference- and condition-specific. Neo-vintage originality and complete modern examples can support demand, but service cost, polishing, and broad supply limit any blanket investment thesis.",
    configurations: "Common lanes include blue or black wave dials, steel bracelets or rubber straps, quartz and automatic neo-vintage models, modern ceramic-dial automatics, chronographs, and precious-metal variants.",
    priceTiers: "Entry tier: older quartz or condition-compromised examples. Core tier: clean automatic 2531.80, 2220.80, and mainstream modern steel models. Upper tier: precious metals, limited editions, unusual materials, and exceptional full sets.",
  },
  "omega/planet-ocean": {
    history: "Introduced in 2005, Planet Ocean expanded Seamaster into a deeper-rated, more substantial professional-dive platform inspired by Omega's mid-century dive-watch heritage.",
    production: "Planet Ocean remains an active Omega family, while early calibre 2500 and later calibre 8500 generations trade as discontinued references alongside newer Master Chronometer configurations.",
    investment: "The collection offers strong watch-for-money potential but should be bought for use and fit. Size, generation, service history, and material can matter more than broad brand trends.",
    configurations: "Typical choices include 42 mm and larger cases, black or orange accents, steel bracelets or rubber straps, three-hand models, GMTs, chronographs, and steel, titanium, ceramic, or precious-metal cases.",
    priceTiers: "Entry tier: early, incomplete, or service-due examples. Core tier: clean steel three-hand references. Upper tier: current-generation, complicated, ceramic, titanium, precious-metal, or limited configurations.",
  },
  "omega/aqua-terra": {
    history: "Launched in 2002, Aqua Terra developed the Seamaster's everyday, land-and-water role through cleaner cases, restrained bezels, and later teak-pattern dials.",
    production: "Aqua Terra remains a broad current collection across sizes, dial colors, bracelets, straps, metals, and complications, with several discontinued Co-Axial generations active in the secondary market.",
    investment: "Broad production and numerous configurations favor selective buying rather than appreciation assumptions. Desirable size, dial, bracelet completeness, and purchase price drive retention.",
    configurations: "Common configurations include 38 mm and 41 mm steel automatics, blue, black, silver, green, or colored dials, bracelet and rubber-strap models, two-tone versions, annual calendars, GMTs, and Worldtimers.",
    priceTiers: "Entry tier: older or less demanded sizes and strap-only examples. Core tier: current or recent steel three-hand models. Upper tier: Worldtimers, precious metals, complications, and uncommon high-demand dials.",
  },
  "audemars-piguet/royal-oak-jumbo": {
    history: "The Jumbo carries forward the original 1972 Royal Oak's extra-thin 39 mm concept and remains the collection's clearest design-lineage expression.",
    production: "The 16202 generation represents the current Jumbo platform, while the 15202 and earlier references are discontinued collector markets with meaningful variation by era, dial, and metal.",
    investment: "High visibility does not remove downside risk. Entry price, authenticity, originality, case geometry, bracelet condition, and market cycle exposure dominate outcomes.",
    configurations: "Core configurations include 39 mm extra-thin cases in steel or precious metals, integrated bracelets, Petite Tapisserie or special dials, and generation-specific movements and anniversary editions.",
    priceTiers: "Entry tier is relative and usually begins with less sought-after metals, dials, or compromised examples. Core tier centers on strong full-set modern pieces. Upper tier includes steel blue dials, rare vintage examples, anniversary models, and exceptional provenance.",
  },
  "audemars-piguet/royal-oak-chronograph": {
    history: "Royal Oak Chronograph joined the family in the late 1990s, adding a sport complication while preserving the integrated-bracelet case and dial language.",
    production: "Current 26240 references coexist with discontinued 26331 and earlier generations. Case size, dial, metal, movement architecture, and anniversary context separate the markets.",
    investment: "Chronograph complexity increases service exposure, and configuration cycles can be pronounced. Buy on reference quality and price discipline rather than assuming Royal Oak appreciation.",
    configurations: "Common lanes include 39 mm and 41 mm cases, steel and precious metals, integrated bracelets, contrasting or matching subdials, multiple Tapisserie colors, and current flyback versus earlier chronograph movements.",
    priceTiers: "Entry tier: less sought-after dials, metals, or service-due examples. Core tier: clean steel references with complete sets. Upper tier: scarce dials, precious metals, anniversary pieces, and exceptional discontinued examples.",
  },
  "audemars-piguet/royal-oak-offshore": {
    history: "Introduced in 1993, Royal Oak Offshore enlarged and toughened the Royal Oak concept, becoming a defining platform for bold chronographs, limited editions, and mixed materials.",
    production: "Offshore remains active across several sizes, chronographs, three-hand models, ceramics, titanium, precious metals, bracelets, and straps; many earlier limited editions are discontinued.",
    investment: "Wide production variety and changing size preferences create uneven retention. Rare does not automatically mean liquid, and rubber, service, case refinishing, and limited-edition completeness affect value.",
    configurations: "Typical configurations include 42 mm and 43 mm chronographs, 37 mm models, steel, titanium, ceramic or gold cases, rubber or integrated bracelets, and numerous dial-color and limited-edition combinations.",
    priceTiers: "Entry tier: older common references or examples needing service. Core tier: clean steel or titanium modern models. Upper tier: ceramics, precious metals, rare limited editions, and major complications.",
  },
  "audemars-piguet/offshore-diver": {
    history: "The Offshore Diver evolved from AP's sport-focused Royal Oak lineage into a dedicated 300-meter dive-watch format with an internal rotating timing scale.",
    production: "The 15720 generation remains represented in the current Offshore family, while the 15710 and earlier variants are discontinued and configuration dependent.",
    investment: "The Diver should be bought primarily as a specialized AP sport watch. Color, material, size, service, water resistance, and strap completeness can outweigh headline brand momentum.",
    configurations: "Common configurations include 42 mm steel cases, internal dive bezels, bright or neutral Méga Tapisserie dials, rubber straps, and selected forged-carbon, ceramic, or limited editions.",
    priceTiers: "Entry tier: earlier or service-due steel examples. Core tier: clean 15710 and 15720 steel references with complete sets. Upper tier: ceramic, carbon, precious-metal, and scarce limited configurations.",
  },
  "audemars-piguet/code-1159": {
    history: "Code 11.59 launched in 2019 as AP's modern round-watch platform, using a complex multi-part case and a range extending from time-only models to major complications.",
    production: "Code 11.59 remains an active collection with selfwinding, chronograph, steel, ceramic-composite, precious-metal, and high-complication references.",
    investment: "The collection's developing demand and narrower buyer pool require conservative assumptions. Dial generation, metal, complication, condition, and entry price are more useful than Royal Oak comparisons.",
    configurations: "Common lanes include 38 mm and 41 mm selfwinding models, 41 mm chronographs, steel, gold and ceramic-composite cases, gradient or stamped dials, straps, calendars, tourbillons, and chiming watches.",
    priceTiers: "Entry tier: time-only steel or less demanded early configurations. Core tier: current selfwinding and chronograph references. Upper tier: precious metals, ceramics, calendars, tourbillons, repeaters, and exceptional complications.",
  },
  "cartier/tank": {
    history: "Created in 1917, the Tank established Cartier's rectangular wristwatch vocabulary and later expanded through Louis Cartier, Must, Française, Américaine, Cintrée, and other families.",
    production: "Tank remains a major current Cartier collection, while a large vintage and discontinued field spans quartz, manual-wind, automatic, steel, vermeil, and precious-metal references.",
    investment: "Design permanence can support demand, but Tank is not one market. Originality, size, sub-family, metal, movement, condition, and provenance drive collectability and retention.",
    configurations: "Common configurations include Tank Must in steel, Tank Louis Cartier in gold, leather straps or bracelets, quartz or mechanical movements, multiple case sizes, and specialized shaped or complicated families.",
    priceTiers: "Entry tier: mainstream quartz Must references and condition-sensitive vintage pieces. Core tier: clean modern Must, Française, and selected mechanical models. Upper tier: gold Louis Cartier, rare vintage forms, Privé editions, and exceptional provenance.",
  },
  "cartier/ballon-bleu": {
    history: "Introduced in 2007, Ballon Bleu reinterpreted Cartier's round watch through a doubly curved case and an integrated arch protecting the blue cabochon crown.",
    production: "Ballon Bleu remains a current Cartier family across numerous sizes, quartz and automatic movements, steel, two-tone and gold, with diamond-set options.",
    investment: "Broad availability favors careful configuration selection rather than scarcity claims. Size, metal, diamonds, bracelet, completeness, and entry price shape retention.",
    configurations: "Common choices range from small quartz sizes through 33 mm, 36 mm, 40 mm and 42 mm automatics, on bracelets or straps, in steel, two-tone, gold, and gem-set executions.",
    priceTiers: "Entry tier: small steel quartz models. Core tier: steel automatic references in mainstream sizes. Upper tier: two-tone, gold, diamond-set, and complicated or rare configurations.",
  },
  "cartier/pasha": {
    history: "Modern Pasha design emerged in the 1980s from Cartier's round-watch vocabulary and became known for its chained crown cap, bold numerals, and distinctive case identity.",
    production: "Pasha has modern current-collection expressions alongside discontinued 1980s through 2000s references, with catalog availability varying by region and configuration.",
    investment: "Pasha is a design-led specialist market. Discontinued status alone does not ensure demand; generation, size, movement, metal, originality, crown components, and service determine quality.",
    configurations: "Common lanes include time-only and chronograph models, steel or gold, bracelets or straps, modern interchangeable systems, multiple sizes, grid details, GMTs, and older complications.",
    priceTiers: "Entry tier: common quartz or condition-sensitive discontinued examples. Core tier: clean modern automatics and recognizable steel references. Upper tier: gold, chronographs, rare vintage variants, and high complications.",
  },
  "patek-philippe/calatrava": {
    history: "Introduced in 1932, Calatrava became Patek Philippe's principal round dress-watch family, with Bauhaus-influenced restraint and extensive reference variation across generations.",
    production: "Calatrava remains an active Patek Philippe collection, while a deep discontinued and vintage market includes manual-wind, automatic, officer-case, hobnail, sector-dial, and precious-metal references.",
    investment: "Prestige alone does not guarantee liquidity. Size, dial originality, case condition, reference scholarship, service quality, buckle, papers, and shifting dress-watch preferences affect retention.",
    configurations: "Common configurations include 35-39 mm precious-metal cases, manual or automatic movements, small seconds or date, smooth or hobnail bezels, officer backs, sector or traditional dials, and leather straps.",
    priceTiers: "Entry tier: smaller, common, incomplete, or condition-sensitive vintage references. Core tier: strong modern 5196, 6119, and 5227 examples. Upper tier: rare vintage dials, exceptional provenance, scarce metals, and complications.",
  },
  "patek-philippe/cubitus": {
    history: "Launched in 2024, Cubitus introduced a square case with rounded edges and horizontally embossed dials as a new sport-elegant Patek Philippe collection.",
    production: "Cubitus is a current collection with time-and-date, grand-date calendar, multiple metals, bracelet and strap, and newer medium-size configurations.",
    investment: "Its short transaction history makes long-term claims premature. Allocation, early asking prices, exact reference, condition, and changing supply should be treated conservatively.",
    configurations: "Current lanes include steel and two-tone integrated-bracelet time-and-date models, precious-metal medium sizes, and the platinum instantaneous grand-date, day, moon-phase reference on composite strap.",
    priceTiers: "Entry and core tiers remain relative because all references are high-value and the market is young. Time-and-date models form the simpler tier; precious-metal and complicated references occupy the upper tier.",
  },
  "panerai/submersible": {
    history: "Submersible developed from Panerai's modern professional-dive designs and became a distinct collection in 2019, retaining the crown guard while adding rotating dive bezels.",
    production: "Submersible remains active across multiple sizes, steel, titanium, ceramic and composite materials, straps, complications, and limited editions; earlier PAM references are discontinued or region dependent.",
    investment: "Buy for design and use, not assumed scarcity. Case size, material, edition size, service, strap set, water resistance, and Panerai's broad reference history affect retention.",
    configurations: "Common configurations include 42 mm, 44 mm and 47 mm cases, steel or titanium, black or colored dials, rubber straps, three-hand models, chronographs, GMTs, and Carbotech or ceramic executions.",
    priceTiers: "Entry tier: common steel or older service-due examples. Core tier: clean mainstream steel and titanium references. Upper tier: Carbotech, ceramic, precious metal, complications, and scarce limited editions.",
  },
  "tudor/prince": {
    history: "Prince naming reaches back through Tudor's mid-century Oyster-cased watches and later date, day-date, and chronograph families, including the automatic Prince Oysterdate chronographs introduced in 1976.",
    production: "Prince is primarily a vintage, discontinued, and region-specific field rather than a unified current global collection; exact availability must be checked by market and reference.",
    investment: "Originality and identification are decisive. Redials, replacement parts, polished cases, uncertain service, and broad use of the Prince name create substantial selection risk.",
    configurations: "Common lanes include time-and-date and day-date watches, steel or two-tone cases, bracelets or straps, varied sizes and dials, plus Prince Oysterdate and Prince Date chronograph generations.",
    priceTiers: "Entry tier: common small-date models or condition-sensitive examples. Core tier: clean, original Prince Date and day-date watches. Upper tier: collectible chronographs, rare dials, strong provenance, and exceptional vintage condition.",
  },
  "tudor/royal": {
    history: "The contemporary Tudor Royal combines a notched bezel, integrated five-link bracelet, and dress-sport proportions, reviving a long-used Royal name in a modern family.",
    production: "Royal remains represented as a modern collection in multiple sizes, steel and two-tone configurations, date or day-date layouts, and numerous dial treatments, subject to regional catalogs.",
    investment: "Royal is best approached as an accessible ownership proposition. Broad configuration supply, discounts, size preference, bracelet condition, and entry price shape resale more than scarcity.",
    configurations: "Common choices include 28 mm, 34 mm, 38 mm and 41 mm cases, steel or steel-and-gold, Roman or diamond-set dials, integrated bracelets, date displays, and day-date on the 41 mm format.",
    priceTiers: "Entry tier: smaller steel and pre-owned mainstream examples. Core tier: 38 mm and 41 mm steel configurations. Upper tier: two-tone, diamond-set, rare dials, and exceptionally complete unworn examples.",
  },
});

const buildProfile = (
  brandSlug: string,
  collectionSlug: string,
): CollectionLaunchQualityProfile | undefined => {
  const key = `${brandSlug}/${collectionSlug}`;
  const supplemental = supplementalProfiles[key];
  if (!supplemental) return undefined;

  const expansion = collectionExpansionGuides.find(
    (guide) => guide.brandSlug === brandSlug && guide.collectionSlug === collectionSlug,
  );

  const intelligence = expansion?.intelligence
    ?? (key === "omega/seamaster" ? omegaSeamasterDiver300MIntelligence : undefined)
    ?? (key === "cartier/tank" ? cartierTankBrokerageIntelligence : undefined);
  if (!intelligence) return undefined;

  return Object.freeze({
    overview: intelligence.overview,
    historicalBackground: supplemental.history,
    currentProductionStatus: supplemental.production,
    marketDemand: intelligence.marketPosition,
    liquidity: `${intelligence.liquidityBand}: ${intelligence.liquidityGuidance}`,
    collectorProfile: intelligence.buyerProfile,
    investmentConsiderations: supplemental.investment,
    buyingRecommendations: intelligence.ownershipConsiderations,
    commonConfigurations: supplemental.configurations,
    typicalPriceTiers: supplemental.priceTiers,
    brokerageConsiderations: `${intelligence.sellerProfile} ${intelligence.brokerageInsight}`,
    perspective: intelligence.perspective,
    reviewedAt: "July 2026",
  });
};

export function getCollectionLaunchQualityProfile(
  brandSlug: string,
  collectionSlug: string,
): CollectionLaunchQualityProfile {
  const profile = buildProfile(brandSlug, collectionSlug);
  if (!profile) throw new Error(`Launch-quality collection profile missing for ${brandSlug}/${collectionSlug}.`);
  return profile;
}
