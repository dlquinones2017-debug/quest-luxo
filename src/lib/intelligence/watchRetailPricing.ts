import type { QuestLuxoAsset } from "../../types/questLuxo";
import { verifiedRetailPrices, type VerifiedRetailPrice } from "../../data/verified-retail-prices.ts";

const key = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function getVerifiedRetailPrices(
  asset: Pick<QuestLuxoAsset, "brand" | "reference" | "displayReference">,
  brand = asset.brand ?? "",
  prices: readonly VerifiedRetailPrice[] = verifiedRetailPrices,
): readonly VerifiedRetailPrice[] {
  const reference = key(asset.displayReference ?? asset.reference);
  return prices.filter((price) => key(price.brand) === key(brand) && key(price.reference) === reference);
}

export function getVerifiedUsdRetailBenchmark(asset: QuestLuxoAsset): number | null {
  const values = getVerifiedRetailPrices(asset)
    .filter((price) => price.basis === "current-list" && price.currency === "USD" && price.market === "United States")
    .map((price) => price.amount)
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  return values.length ? Math.min(...values) : null;
}

export function formatRetailPrice(price: VerifiedRetailPrice): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency, maximumFractionDigits: 0 }).format(price.amount);
}

export function formatRetailTaxBasis(price: Pick<VerifiedRetailPrice, "taxBasis">): string {
  return price.taxBasis === "unconfirmed" ? "Tax basis unconfirmed"
    : price.taxBasis === "excluded" ? "Taxes excluded" : "Taxes included";
}
