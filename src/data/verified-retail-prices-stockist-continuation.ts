import type { VerifiedRetailPrice } from "./verified-retail-prices.ts";

// Fresh explicit-RRP evidence: docs/WATCH_MSRP_STOCKIST_CONTINUATION_2026-10-29.json.
export const stockistContinuationRetailPrices = [
  {
    brand: "Omega", reference: "434.10.41.21.03.001", manufacturerReference: "434.10.41.21.03.001",
    configuration: "41 mm steel / PVD light-blue dial with stamped vertical pattern / steel bracelet / calibre 8810 / power-reserve indicator at 6 and small seconds at 9",
    amount: 5700, currency: "GBP", market: "United Kingdom", taxBasis: "unconfirmed", basis: "current-list",
    checkedAt: "2026-10-29", effectiveDate: null,
    sourceUrl: "https://www.bankslyon.co.uk/omega-de-ville-prestige-co-axial-master-chronometer-power-reserve-41mm/",
    sourceName: "Banks Lyon — explicitly published OMEGA RRP", sourceType: "authorized-retailer", priceLabel: "RRP",
    corroboratingUrls: ["https://www.bankslyon.co.uk/omega-watches/"],
  },
  {
    brand: "Omega", reference: "215.30.44.22.01.001", manufacturerReference: "215.30.44.22.01.001",
    configuration: "43.5 mm steel / black ceramic dial / black-and-white bi-ceramic 24-hour bezel / steel bracelet with extendable folding clasp / central GMT hand / 600 m",
    amount: 8200, currency: "GBP", market: "United Kingdom", taxBasis: "unconfirmed", basis: "current-list",
    checkedAt: "2026-10-29", effectiveDate: null,
    sourceUrl: "https://www.bankslyon.co.uk/omega-seamaster-planet-ocean-600m-co-axial-watch-215-30-44-22-01-001/",
    sourceName: "Banks Lyon — explicitly published OMEGA RRP", sourceType: "authorized-retailer", priceLabel: "RRP",
    corroboratingUrls: ["https://www.bankslyon.co.uk/omega-watches/"],
  },
] satisfies readonly VerifiedRetailPrice[];
