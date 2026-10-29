import type { VerifiedRetailPrice } from "./verified-retail-prices.ts";

// Official entrant record and 2018 brand-submission rules are documented together.
export const gphgHistoricalRetailPrices = [{
  brand: "Ulysse Nardin", reference: "2505-250", referenceAliases: ["Freak"],
  manufacturerReference: "2505-250",
  configuration: "Freak Vision / 45 mm platinum and titanium / blue movement display / blue alligator strap with folding clasp; exact 2018 competition entrant configuration, visually matched to the approved photograph",
  amount: 95000, currency: "CHF", market: "GPHG 2018 CHF entry (sales market not separately stated)",
  taxBasis: "included", basis: "historical-list", checkedAt: "2026-10-29",
  effectiveDate: null, effectivePeriod: "2018",
  sourceUrl: "https://www.gphg.org/en/watches/freak-vision",
  sourceName: "Ulysse Nardin — 2018 manufacturer entry published by GPHG",
  sourceType: "manufacturer-submission",
  corroboratingUrls: [
    "https://www.gphg.org/en/gphg-2018/participant-watches-2018",
    "https://www.gphg.org/en/gphg-2018/rules",
    "https://www.ulysse-nardin.com/watches/discontinued-models/2505-250",
  ],
}] satisfies readonly VerifiedRetailPrice[];
