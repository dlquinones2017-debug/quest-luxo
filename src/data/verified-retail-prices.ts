export interface VerifiedRetailPrice {
  readonly brand: string;
  readonly reference: string;
  readonly manufacturerReference: string;
  readonly configuration: string;
  readonly amount: number;
  readonly currency: "USD" | "CHF" | "EUR" | "GBP";
  readonly market: string;
  readonly taxBasis: "excluded" | "included";
  readonly basis: "current-list" | "historical-list";
  /** Date the source was read; never presented as a manufacturer's effective date. */
  readonly checkedAt: string;
  readonly effectiveDate: string | null;
  readonly sourceUrl: string;
  readonly sourceName: string;
  readonly sourceType: "manufacturer" | "authorized-retailer";
  readonly corroboratingUrls?: readonly string[];
}

// Exact configurations read on manufacturer pages. Missing references stay unknown.
const rolex = (reference: string, manufacturerReference: string, configuration: string, amount: number, collection: string): VerifiedRetailPrice => ({
  brand: "Rolex", reference, manufacturerReference, configuration, amount,
  currency: "USD", market: "United States", taxBasis: "excluded", basis: "current-list",
  checkedAt: "2026-10-24", effectiveDate: null,
  sourceUrl: `https://www.rolex.com/en-us/watches/${collection}/${manufacturerReference.toLowerCase()}`,
  sourceName: "Rolex United States", sourceType: "manufacturer",
});

export const verifiedRetailPrices: readonly VerifiedRetailPrice[] = Object.freeze(([
  rolex("124060", "m124060-0001", "Black dial / Oyster bracelet / black bezel", 10050, "submariner"),
  rolex("126610LN", "m126610ln-0001", "Black dial / Oyster bracelet / black bezel", 11350, "submariner"),
  rolex("126610LV", "m126610lv-0002", "Black dial / Oyster bracelet / green bezel", 11900, "submariner"),
  rolex("224270", "m224270-0001", "40 mm / black dial / Oyster bracelet", 8350, "explorer"),
  rolex("124270", "m124270-0001", "36 mm / black dial / Oyster bracelet", 7900, "explorer"),
  rolex("126900", "m126900-0001", "Black dial / Oyster bracelet", 8150, "air-king"),
  rolex("226570", "m226570-0001", "White dial / Oyster bracelet", 10600, "explorer-ii"),
  rolex("226570", "m226570-0002", "Black dial / Oyster bracelet", 10600, "explorer-ii"),
  rolex("126500LN", "m126500ln-0001", "White dial / Oyster bracelet / black ceramic bezel", 16900, "cosmograph-daytona"),
  rolex("126710BLNR", "m126710blnr-0003", "Black dial / Oyster bracelet / black-blue bezel", 11800, "gmt-master-ii"),
  rolex("126710BLNR", "m126710blnr-0002", "Black dial / Jubilee bracelet / black-blue bezel", 12000, "gmt-master-ii"),
  rolex("126600", "m126600-0002", "Black dial / Oyster bracelet", 14550, "sea-dweller"),
  {
    brand: "Tudor", reference: "M79000N-0001", manufacturerReference: "M79000N-0001",
    configuration: "Black dial / 37 mm / three-link steel bracelet", amount: 4725,
    currency: "USD", market: "United States", taxBasis: "excluded", basis: "current-list",
    checkedAt: "2026-10-24", effectiveDate: null,
    sourceUrl: "https://www.tudorwatch.com/en/watches/black-bay-54/m79000n-0001",
    sourceName: "Tudor", sourceType: "manufacturer",
    corroboratingUrls: ["https://www.loringjewelers.com/catalog/tudor/m79000n-0001/"],
  },
] satisfies VerifiedRetailPrice[]).map((price) => Object.freeze(price)));
