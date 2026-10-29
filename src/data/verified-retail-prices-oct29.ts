import type { VerifiedRetailPrice } from "./verified-retail-prices.ts";

// Manufacturer evidence and limits: docs/WATCH_REFERENCE_CONTINUATION_2026-10-29.json.
export const oct29RetailPrices = [
  {
    "brand": "Rolex",
    "reference": "116500LN",
    "manufacturerReference": "116500LN",
    "configuration": "Oystersteel / black ceramic Cerachrom bezel / Oyster bracelet 78590; base-reference row, pictured black dial suffix not separately priced",
    "amount": 12500,
    "currency": "EUR",
    "market": "Netherlands",
    "taxBasis": "included",
    "basis": "historical-list",
    "configurationScope": "base-reference",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://rolexforum.nl/prijslijst-rolex-NL2020.pdf",
    "sourceName": "Rolex SA - January 2020 manufacturer MSRP list (archived by rolexforum.nl)",
    "sourceType": "manufacturer",
    "effectivePeriod": "2020-01"
  },
  {
    "brand": "Rolex",
    "reference": "228206",
    "manufacturerReference": "228206",
    "configuration": "Platinum / smooth bezel / President bracelet 83416; base-reference row, pictured ice-blue diagonal dial not separately priced",
    "amount": 60100,
    "currency": "EUR",
    "market": "Netherlands",
    "taxBasis": "included",
    "basis": "historical-list",
    "configurationScope": "base-reference",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://rolexforum.nl/prijslijst-rolex-NL2020.pdf",
    "sourceName": "Rolex SA - January 2020 manufacturer MSRP list (archived by rolexforum.nl)",
    "sourceType": "manufacturer",
    "effectivePeriod": "2020-01"
  },
  {
    "brand": "Rolex",
    "reference": "118238",
    "manufacturerReference": "118238",
    "configuration": "18 ct yellow gold / fluted bezel / President bracelet 83208; base-reference row, pictured white Roman dial not separately priced",
    "amount": 31350,
    "currency": "USD",
    "market": "United States",
    "taxBasis": "unconfirmed",
    "basis": "historical-list",
    "configurationScope": "base-reference",
    "checkedAt": "2026-10-29",
    "effectiveDate": "2012-06-01",
    "sourceUrl": "https://www.minus4plus6.com/pdf/Rolex_Price_List_June-1-2012.pdf",
    "sourceName": "Rolex Watch U.S.A., Inc. - June 2012 manufacturer MSRP list (archived by minus4plus6.com)",
    "sourceType": "manufacturer"
  },
  {
    "brand": "Tudor",
    "reference": "M28600-0005",
    "referenceAliases": [
      "Tudor Royal 41 mm"
    ],
    "manufacturerReference": "M28600-0005",
    "configuration": "41 mm steel / blue sunray Roman-numeral day-date dial / five-link integrated steel bracelet / T603 automatic; illustrated 2020 press-kit configuration",
    "amount": 2200,
    "currency": "CHF",
    "market": "Switzerland",
    "taxBasis": "included",
    "basis": "historical-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "effectivePeriod": "2020",
    "sourceUrl": "https://media.tudorwatch.com/image/upload/fl_attachment/v1/tudorwatch/pressroom/products/tudor-royal/pdf/tudor2020-tudorroyal-en.pdf",
    "sourceName": "TUDOR - 2020 Royal manufacturer press kit",
    "sourceType": "manufacturer"
  },
  {
    "brand": "TAG Heuer",
    "reference": "CBL2111.FC6453",
    "manufacturerReference": "CBL2111.FC6453",
    "configuration": "Current TH20-00 automatic chronograph / 39 mm steel / blue sunray dial / blue alligator strap with folding clasp; not historical Heuer 02 launch MSRP",
    "amount": 8300,
    "currency": "USD",
    "market": "United States",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.tagheuer.com/us/en/timepieces/collections/tag-heuer-monaco/39-mm-th20-00/CBL2111.FC6453.html",
    "sourceName": "TAG Heuer United States",
    "sourceType": "manufacturer"
  }
] satisfies readonly VerifiedRetailPrice[];
