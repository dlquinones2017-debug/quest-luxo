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
  rolex("126613LB", "m126613lb-0002", "Royal blue dial / yellow Rolesor / Oyster bracelet", 19450, "submariner"),
  rolex("126618LB", "m126618lb-0002", "Royal blue dial / yellow gold / Oyster bracelet", 50900, "submariner"),
  rolex("126622", "m126622-0001", "Slate dial / steel and platinum / Oyster bracelet", 13200, "yacht-master"),
  rolex("126621", "m126621-0001", "Chocolate dial / steel and Everose gold / Oyster bracelet", 19750, "yacht-master"),
  rolex("226659", "m226659-0002", "Black dial / white gold / Oysterflex bracelet", 40000, "yacht-master"),
  rolex("226658", "m226658-0001", "Black dial / yellow gold / Oysterflex bracelet", 38100, "yacht-master"),
  rolex("126720VTNR", "m126720vtnr-0002", "Black dial / green-black bezel / Jubilee bracelet", 12500, "gmt-master-ii"),
  rolex("126713GRNR", "m126713grnr-0001", "Black dial / yellow Rolesor / Jubilee bracelet", 20450, "gmt-master-ii"),
  rolex("126718GRNR", "m126718grnr-0001", "Black dial / yellow gold / Jubilee bracelet", 50800, "gmt-master-ii"),
  rolex("126655", "m126655-0002", "Black dial / Everose gold / Oysterflex bracelet", 37700, "yacht-master"),
  rolex("268622", "m268622-0002", "Slate dial / 37 mm / steel and platinum / Oyster bracelet", 12500, "yacht-master"),
  rolex("52508", "m52508-0005", "Intense white dial / yellow gold / black alligator strap", 28850, "1908"),
  rolex("126508", "m126508-0006", "Golden and black dial / yellow gold / Oyster bracelet", 55200, "cosmograph-daytona"),
  rolex("126515LN", "m126515ln-0006", "Sundust and black dial / Everose gold / Oysterflex bracelet", 44800, "cosmograph-daytona"),
  rolex("126519LN", "m126519ln-0004", "Black and steel diamond-set dial / white gold / Oysterflex bracelet", 46900, "cosmograph-daytona"),
  rolex("126506", "m126506-0001", "Ice blue dial / platinum / Oyster bracelet", 84600, "cosmograph-daytona"),
  rolex("126334", "m126334-0001", "Bright blue dial / 41 mm / steel and white gold / Oyster bracelet", 11650, "datejust"),
  rolex("126300", "m126300-0001", "Bright blue dial / 41 mm / steel / Oyster bracelet", 8950, "datejust"),
  rolex("126333", "m126333-0001", "Silver dial / 41 mm / yellow Rolesor / Oyster bracelet", 16900, "datejust"),
  rolex("126234", "m126234-0059", "Green ombre dial / 36 mm / steel and white gold / Jubilee bracelet", 10100, "datejust"),
  rolex("126200", "m126200-0001", "Silver dial / 36 mm / steel / Jubilee bracelet", 8350, "datejust"),
  rolex("126303", "m126303-0001", "Silver dial / 41 mm / yellow Rolesor / Oyster bracelet", 16800, "datejust"),
  rolex("228238", "m228238-0061", "Green dial / 40 mm / yellow gold / President bracelet", 50400, "day-date"),
  rolex("228239", "m228239-0055", "Meteorite diamond-set dial / 40 mm / white gold / President bracelet", 63900, "day-date"),
  rolex("228235", "m228235-0003", "Chocolate diamond-set dial / 40 mm / Everose gold / President bracelet", 58950, "day-date"),
  rolex("128238", "m128238-0132", "Champagne diamond-set dial / 36 mm / yellow gold / President bracelet", 50650, "day-date"),
  rolex("228236", "m228236-0011", "Meteorite diamond-set dial / 40 mm / platinum / President bracelet", 78500, "day-date"),
  rolex("336934", "m336934-0001", "Mint green dial / steel and white gold / Oyster bracelet", 17750, "sky-dweller"),
  rolex("336933", "m336933-0003", "Black dial / yellow Rolesor / Oyster bracelet", 24050, "sky-dweller"),
  rolex("336238", "m336238-0001", "Champagne dial / yellow gold / Oysterflex bracelet", 51400, "sky-dweller"),
  rolex("336235", "m336235-0004", "Slate dial / Everose gold / Oysterflex bracelet", 53450, "sky-dweller"),
  rolex("336938", "m336938-0003", "Intense white dial / yellow gold / Oyster bracelet", 60100, "sky-dweller"),
  rolex("336935", "m336935-0007", "Intense white dial / Everose gold / Jubilee bracelet", 64900, "sky-dweller"),
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
