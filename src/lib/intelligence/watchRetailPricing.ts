import type { QuestLuxoAsset } from "../../types/questLuxo";
import { verifiedRetailPrices, type VerifiedRetailPrice } from "../../data/verified-retail-prices.ts";

const key = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function getVerifiedRetailPrices(
  asset: Pick<QuestLuxoAsset, "brand" | "reference" | "displayReference">,
  brand = asset.brand ?? "",
  prices: readonly VerifiedRetailPrice[] = verifiedRetailPrices,
): readonly VerifiedRetailPrice[] {
  const reference = key(asset.displayReference ?? asset.reference);
  return prices.filter((price) => key(price.brand) === key(brand) &&
    [price.reference, ...(price.referenceAliases ?? [])].some(candidate => key(candidate) === reference));
}

export function getVerifiedUsdRetailBenchmark(asset: QuestLuxoAsset): number | null {
  const values = getVerifiedRetailPrices(asset)
    .filter((price) => price.basis === "current-list" && price.configurationScope !== "base-reference" && price.currency === "USD" && price.market === "United States")
    .map((price) => price.amount)
    .filter((amount) => Number.isFinite(amount) && amount > 0);
  return values.length ? Math.min(...values) : null;
}

// A card never compares amounts across currencies, markets or historical periods.
export function getRetailPriceSummary(prices: readonly VerifiedRetailPrice[]): { price: VerifiedRetailPrice; hasRange: boolean } | null {
  if (!prices.length) return null;
  const current = prices.filter(price => price.basis === "current-list");
  const pool = current.length ? current : prices;
  const us = pool.filter(price => price.currency === "USD" && price.market === "United States");
  const anchor = (us.length ? us : pool)[0];
  let comparable = pool.filter(price => price.currency === anchor.currency && price.market === anchor.market && (price.configurationScope ?? "exact") === (anchor.configurationScope ?? "exact"));
  if (anchor.basis === "historical-list") {
    const latestPeriod = comparable.map(price => price.effectiveDate ?? price.effectivePeriod ?? "").sort().at(-1);
    comparable = latestPeriod
      ? comparable.filter(price => (price.effectiveDate ?? price.effectivePeriod ?? "") === latestPeriod)
      : [anchor]; // Undated historical observations cannot establish a shared period/range.
  }
  const sorted = [...comparable].sort((a,b) => a.amount - b.amount);
  return { price: sorted[0], hasRange: new Set(sorted.map(price => price.amount)).size > 1 };
}

export function formatRetailPrice(price: VerifiedRetailPrice): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: price.currency, maximumFractionDigits: 0 }).format(price.amount);
}

export function formatRetailTaxBasis(price: Pick<VerifiedRetailPrice, "taxBasis">): string {
  return price.taxBasis === "unconfirmed" ? "Tax basis unconfirmed"
    : price.taxBasis === "excluded" ? "Taxes excluded" : "Taxes included";
}
