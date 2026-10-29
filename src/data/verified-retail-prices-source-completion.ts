import type { VerifiedRetailPrice } from "./verified-retail-prices.ts";

// Exact evidence and rejected alternatives: docs/WATCH_MSRP_SOURCE_PASS_2026-10-29.json.
export const sourceCompletionRetailPrices = [
  {
    "brand": "Audemars Piguet",
    "reference": "15202ST",
    "manufacturerReference": "15202ST.OO.1240ST.01.A",
    "configuration": "39 mm steel / blue Petite Tapisserie dial / steel bracelet with AP folding clasp / calibre 2121; manufacturer's currently displayed indicative price for the legacy .01.A blue configuration, not an original launch or last-production price",
    "amount": 40100,
    "currency": "USD",
    "market": "United States",
    "taxBasis": "excluded",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.audemarspiguet.com/us/en/watch-collection/royal-oak/15202ST.OO.1240ST.01.A",
    "sourceName": "Audemars Piguet United States — indicative recommended public price",
    "sourceType": "manufacturer"
  },
  {
    "brand": "Cartier",
    "reference": "WGPA0017",
    "manufacturerReference": "WGPA0017",
    "configuration": "41 mm yellow gold / silvered flinqué chronograph dial / dark-grey and navy alligator straps / calibre 1904-CH MC",
    "amount": 133000,
    "currency": "SAR",
    "market": "Saudi Arabia",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.cartier.com/en-sa/watches/collections/pasha-de-cartier/pasha-de-cartier-watch--CRWGPA0017.html",
    "sourceName": "Cartier Saudi Arabia",
    "sourceType": "manufacturer"
  },
  {
    "brand": "Cartier",
    "reference": "WSPA0038",
    "manufacturerReference": "WSPA0038",
    "configuration": "41 mm steel / blue sunray dial / SmartLink steel bracelet and blue alligator strap / calibre 1847 MC",
    "amount": 34100,
    "currency": "SAR",
    "market": "Saudi Arabia",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.cartier.com/en-sa/watches/collections/pasha-de-cartier/pasha-de-cartier-watch-CRWSPA0038.html",
    "sourceName": "Cartier Saudi Arabia",
    "sourceType": "manufacturer"
  },
  {
    "brand": "Cartier",
    "reference": "WSBB0061",
    "manufacturerReference": "WSBB0061",
    "configuration": "40 mm steel / blue sunray dial / interchangeable steel bracelet / date at 3 o'clock / calibre 1847 MC",
    "amount": 33600,
    "currency": "SAR",
    "market": "Saudi Arabia",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.cartier.com/en-sa/watches/collections/ballon-de-cartier/ballon-bleu-de-cartier-watch-CRWSBB0061.html",
    "sourceName": "Cartier Saudi Arabia",
    "sourceType": "manufacturer"
  },
  {
    "brand": "Franck Muller",
    "reference": "V 32 SC AT FO SMURFETTE (BL)",
    "manufacturerReference": "V 32 SC AT FO SMURFETTE (BL)",
    "configuration": "32 mm polished steel / blue standard non-diamond Smurfette version / matching alligator strap; manufacturer publication prices standard versions separately from diamond versions",
    "amount": 9800,
    "currency": "CHF",
    "market": "Market not stated (manufacturer CHF publication)",
    "taxBasis": "excluded",
    "basis": "historical-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.franckmuller.com/news/vanguard-smurfette-party",
    "sourceName": "Franck Muller — November 2025 standard Smurfette price publication",
    "sourceType": "manufacturer",
    "effectivePeriod": "2025-11",
    "corroboratingUrls": [
      "https://www.franckmuller.com/it/news/vanguard-smurfette"
    ]
  },
  {
    "brand": "Franck Muller",
    "reference": "V 32 SC AT FO SMURFETTE (RS)",
    "manufacturerReference": "V 32 SC AT FO SMURFETTE (RS)",
    "configuration": "32 mm polished steel / pink standard non-diamond Smurfette version / matching alligator strap; manufacturer publication prices standard versions separately from diamond versions",
    "amount": 9800,
    "currency": "CHF",
    "market": "Market not stated (manufacturer CHF publication)",
    "taxBasis": "excluded",
    "basis": "historical-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.franckmuller.com/news/vanguard-smurfette-party",
    "sourceName": "Franck Muller — November 2025 standard Smurfette price publication",
    "sourceType": "manufacturer",
    "effectivePeriod": "2025-11",
    "corroboratingUrls": [
      "https://www.franckmuller.com/it/news/vanguard-smurfette"
    ]
  },
  {
    "brand": "Franck Muller",
    "reference": "V 41 SC DT BEACH BU BL GF1",
    "manufacturerReference": "V 41 SC DT BEACH GFBUBL",
    "configuration": "41 mm Ocean Blue glass-fibre composite / matte blue Arabic dial / blue fabric Velcro strap / FM 800-DT; same reviewed manufacturer Ocean Blue product photograph, regional naming GFBUBL",
    "amount": 15300,
    "currency": "SGD",
    "market": "Singapore",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://franckmuller-asiapacific.com/timepieces/vanguard-beach/",
    "sourceName": "Franck Muller Asia Pacific — Singapore regional list",
    "sourceType": "manufacturer",
    "corroboratingUrls": [
      "https://www.boutiques.franckmuller.com/singapore-boutique"
    ]
  },
  {
    "brand": "Franck Muller",
    "reference": "V 41 SC DT BEACH FR2 GFBUBL (BC)",
    "manufacturerReference": "V 41 SC DT BEACH FR2 GFBUBL (BC)",
    "configuration": "41 mm Surf Blue glass-fibre composite / matte-white FR2 graphic dial / printed white nylon strap with leather underside and Velcro closure / MVT 2536-SCDT2H",
    "amount": 19400,
    "currency": "SGD",
    "market": "Singapore",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://franckmuller-asiapacific.com/timepieces/fr2nck-muller-vanguard-beach/",
    "sourceName": "Franck Muller Asia Pacific — Singapore regional list",
    "sourceType": "manufacturer",
    "corroboratingUrls": [
      "https://www.boutiques.franckmuller.com/singapore-boutique",
      "https://www.franckmuller.com/de/news/fr2nckmuller-vanguard-beach"
    ]
  },
  {
    "brand": "Franck Muller",
    "reference": "V 41 SC DT BEACH FR2 GFVRVE (BC)",
    "manufacturerReference": "V 41 SC DT BEACH FR2 GFVRVE (BC)",
    "configuration": "41 mm Tropical Green glass-fibre composite / matte-white FR2 graphic dial / printed white nylon strap with leather underside and Velcro closure / MVT 2536-SCDT2H",
    "amount": 19400,
    "currency": "SGD",
    "market": "Singapore",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://franckmuller-asiapacific.com/timepieces/fr2nck-muller-vanguard-beach/",
    "sourceName": "Franck Muller Asia Pacific — Singapore regional list",
    "sourceType": "manufacturer",
    "corroboratingUrls": [
      "https://www.boutiques.franckmuller.com/singapore-boutique",
      "https://www.franckmuller.com/de/news/fr2nckmuller-vanguard-beach"
    ]
  },
  {
    "brand": "Franck Muller",
    "reference": "V 41 SC DT BEACH FR2 GFRGFRG (BC)",
    "manufacturerReference": "V 41 SC DT BEACH FR2 GFRGFRG (BC)",
    "configuration": "41 mm Heatwave Red glass-fibre composite / matte-white FR2 graphic dial / printed white nylon strap with leather underside and Velcro closure / MVT 2536-SCDT2H",
    "amount": 19400,
    "currency": "SGD",
    "market": "Singapore",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://franckmuller-asiapacific.com/timepieces/fr2nck-muller-vanguard-beach/",
    "sourceName": "Franck Muller Asia Pacific — Singapore regional list",
    "sourceType": "manufacturer",
    "corroboratingUrls": [
      "https://www.boutiques.franckmuller.com/singapore-boutique",
      "https://www.franckmuller.com/de/news/fr2nckmuller-vanguard-beach"
    ]
  },
  {
    "brand": "Omega",
    "reference": "131.63.41.21.03.001",
    "manufacturerReference": "131.63.41.21.03.001",
    "configuration": "41 mm 18 ct Sedna gold / blue ceramic Roman-numeral bezel / blue dial / blue leather strap with rubber lining / calibre 8901",
    "amount": 23800,
    "currency": "GBP",
    "market": "United Kingdom",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.bankslyon.co.uk/omega-constellation-co-axial-master-chronometer-41mm-watch-131-63-41-21-03-001/",
    "sourceName": "Banks Lyon — explicitly published OMEGA RRP",
    "sourceType": "authorized-retailer",
    "corroboratingUrls": [
      "https://www.bankslyon.co.uk/omega-watches/"
    ],
    "priceLabel": "RRP"
  },
  {
    "brand": "Omega",
    "reference": "210.32.42.20.01.006",
    "manufacturerReference": "210.32.42.20.01.006",
    "configuration": "42 mm steel / black aluminium dial and bezel / orange accents / integrated orange rubber strap with foldover clasp / calibre 8806",
    "amount": 5800,
    "currency": "GBP",
    "market": "United Kingdom",
    "taxBasis": "unconfirmed",
    "basis": "current-list",
    "checkedAt": "2026-10-29",
    "effectiveDate": null,
    "sourceUrl": "https://www.bankslyon.co.uk/omega-seamaster-diver-300m-42mm-210-32-42-20-01-006/",
    "sourceName": "Banks Lyon — explicitly published OMEGA RRP",
    "sourceType": "authorized-retailer",
    "corroboratingUrls": [
      "https://www.bankslyon.co.uk/omega-watches/"
    ],
    "priceLabel": "RRP"
  }
] satisfies readonly VerifiedRetailPrice[];
