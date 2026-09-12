import type { QuestLuxoAsset } from "../types/questLuxo";
import type { ReferenceBrokerageIntelligence } from "../types/brokerageIntelligence";

export const bellRossSources = [
  { label: "Bell & Ross: BR 01-92 Steel", url: "https://bellross.com/en/products/br-01-92-steel" },
  { label: "Bell & Ross: BR 01-92 Technical Notice", url: "https://bellross.info/sftp_shopify-plus/dev/IN/NOTICE/NOTICE-BR01-92.pdf" },
  { label: "Bell & Ross: BR 03-92 Black Matte", url: "https://bellross.com/en/products/br-03-92-black-matte" },
];
const common: ReferenceBrokerageIntelligence = {
  overview: "An instrument-inspired square watch. Identify the complete reference before comparing examples.",
  configurationSummary: "Check the case, dial, strap and buckle against the exact reference and original paperwork.",
  liquidityBand: "Insufficient evidence",
  liquidityObservations: "Quest Luxo has not verified recent completed-sale comparables or a sale-time range for this reference. Asking prices are not completed transactions.",
  serviceExposure: "Unknown",
  serviceConsiderations: "Obtain service history, a function check and a written service estimate. Confirm water resistance through a current pressure test before water use.",
  ownershipComplexity: "Moderate",
  conditionConsiderations: "Inspect case edges, screw heads, crystal, crown, strap attachment and buckle. Document replaced parts and the condition of the rubber strap.",
  marketCommentary: "Current transaction range and dealer bid depth require verification. Do not infer scarcity, appreciation or discontinuation from a sold-out retail page.",
  brokerageOpportunities: "Match a documented example to a buyer whose fit and configuration requirements are explicit; underwrite acquisition, service and transaction expenses before proposing an offer.",
  buyerGuidance: "Request dated photographs, serial and reference verification, service records, included accessories and seller terms before committing.",
  sellerGuidance: "Provide the full reference, original purchase evidence where available, service history and an inventory of straps, buckle, box and papers. Separate target proceeds from evidence of market value.",
  relatedCollections: "Compare BR 01 and BR 03 by exact generation and dimensions; the square case can wear differently from a round watch of similar quoted width.",
  perspective: "Quest Luxo favors configuration accuracy and condition over an apparent discount. A suitable purchase must also fit the client's wrist, service budget and exit expectations.",
  reviewedAt: "September 7, 2026",
  evidenceSources: bellRossSources,
};
export const bellRossBR01Assets: QuestLuxoAsset[] = [{
  brand: "Bell & Ross", collection: "BR 01", reference: "BR0192-BL-ST", model: "BR 01-92 Steel",
  material: "Steel", productionStatus: "Manufacturer product page verified September 7, 2026; production status is not inferred from retail availability",
  configurations: [{ caseSize: "46 mm", dial: "Black; exact dial details require reference-specific visual review", bracelet: "Exact strap configuration requires reference-specific visual review", movement: "BR-CAL.302 automatic; approximately 40-hour power reserve" }],
  marketPosition: "Large square instrument-watch format", liquidity: "Requires verification",
  questLuxoView: "The 46 mm BR 01-92 Steel suits a buyer who actively wants a substantial square case. Confirm wrist fit and the complete configuration before sourcing.",
  brokerageIntelligence: { ...common,
    overview: "Bell & Ross identifies BR0192-BL-ST as the 46 mm BR 01-92 Steel. Its large square footprint is the first ownership decision.",
    configurationSummary: "BR0192-BL-ST: 46 mm steel case with BR-CAL.302 automatic movement and an approximately 40-hour power reserve. The exact dial and strap shown by any acquisition or photograph must still be visually matched to this reference.",
    ownershipExperience: "Try the watch on or compare a measured wrist photograph before committing; a large square case is a deliberate fit choice.",
  },
}];
export const bellRossBR03Assets: QuestLuxoAsset[] = [{
  brand: "Bell & Ross", collection: "BR 03", reference: "BR0392-BL-CE", model: "BR 03-92 Black Matte",
  material: "Matte black ceramic", productionStatus: "Manufacturer product page verified September 7, 2026; production status is not inferred from retail availability",
  configurations: [{ caseSize: "42 mm", dial: "Black", bracelet: "Black rubber", movement: "BR-CAL.302 automatic", waterResistance: "100 m manufacturer specification" }],
  marketPosition: "42 mm ceramic square instrument watch", liquidity: "Requires verification",
  questLuxoView: "Distinguish this 42 mm BR 03-92 from the newer 41 mm BR-03. Ceramic condition and the exact strap configuration matter to ownership and valuation.",
  brokerageIntelligence: { ...common,
    overview: "This BR 03-92 pairs a 42 mm matte ceramic case with a black dial and automatic time-and-date movement.",
    configurationSummary: "BR0392-BL-CE: 42 mm matte black ceramic, black dial, BR-CAL.302 automatic, sapphire crystal and 100 m specified water resistance. The manufacturer lists rubber and synthetic-fabric straps; the photo target is black rubber.",
    conditionConsiderations: "Examine the ceramic case for chips and cracks, including corners and screw surrounds. Obtain specialist assessment of damage; do not assume steel-case refinishing methods apply.",
    buyingConsiderations: "A photograph of the 41 mm BR-03 is not a match for this 42 mm BR 03-92. Verify reference, case dimensions and strap before comparing prices.",
  },
}];
export const bellRossCollections = [
  { name: "BR 01", slug: "br-01", assets: bellRossBR01Assets, description: "The large square instrument-watch format, starting with the 46 mm BR 01-92 Steel. Best approached through fit, originality and documented condition.",
    ownership: "Prioritize wrist fit, case-edge condition, screw integrity and reference-specific parts. Confirm movement and service needs from the actual watch.",
    buyer: "For clients who deliberately prefer a large square case. A smaller wrist or a discreet everyday brief may be better served by another format.",
    configurations: "Launch coverage is BR0192-BL-ST. Other BR 01 materials and complications are distinct markets; do not transfer their pricing or photography to this reference." },
  { name: "BR 03", slug: "br-03", assets: bellRossBR03Assets, description: "A square instrument-watch family with meaningful generation differences. Launch coverage starts with the 42 mm BR 03-92 Black Matte, distinct from the 41 mm BR-03.",
    ownership: "Check ceramic corners and case surfaces for damage; verify strap condition, buckle, service history and wrist fit. Water use requires a current pressure test.",
    buyer: "For buyers who value a legible square tool-watch design and accept ceramic-specific condition risks. Compare the actual 42 mm case against newer 41 mm alternatives.",
    configurations: "Launch coverage is BR0392-BL-CE on black rubber. The manufacturer also lists synthetic fabric. Newer BR-03 references and other case materials require separate matching." },
];
