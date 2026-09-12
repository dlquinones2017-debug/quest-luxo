import { cartierSantosVsRolexDatejust36Guide } from "../../data/comparisons/cartier-santos-medium-vs-rolex-datejust-36";
import { rolexSubmarinerVsOmegaSeamasterGuide } from "../../data/comparisons/rolex-submariner-vs-omega-seamaster-diver-300m";
import type { ComparisonGuide } from "../../types/comparisonGuide";

export const comparisonGuidesLive = false;

export const comparisonGuideRegistry: readonly ComparisonGuide[] = Object.freeze([
  rolexSubmarinerVsOmegaSeamasterGuide,
  cartierSantosVsRolexDatejust36Guide,
]);

export function getComparisonGuideBySlug(
  slug: string
): ComparisonGuide | undefined {
  const lookup = slug.trim().toLowerCase();
  return comparisonGuideRegistry.find((guide) => guide.slug === lookup);
}

export function getLiveComparisonGuides(): readonly ComparisonGuide[] {
  return comparisonGuidesLive
    ? comparisonGuideRegistry.filter((guide) => guide.status === "active")
    : [];
}
