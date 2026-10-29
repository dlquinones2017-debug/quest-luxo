import type { QuestLuxoAsset } from "../../types/questLuxo";

export const omegaDirectoryFilters = [
  { label: "All", value: "all" },
  { label: "Green", value: "green" },
  { label: "Blue", value: "blue" },
  { label: "White", value: "white" },
  { label: "Gray", value: "gray" },
  { label: "Black", value: "black" },
  { label: "Other Colors", value: "other-colors" },
  { label: "Sedna Gold", value: "sedna-gold" },
  { label: "All Gold", value: "precious-metal" },
  { label: "Rubber Straps", value: "rubber-strap" },
  { label: "Wave Dials", value: "wave-dial" },
  { label: "Non-Wave", value: "non-wave-dial" },
  { label: "GMT / Worldtimer", value: "gmt" },
] as const;

export function getCollectionDirectoryFilters(assets: readonly QuestLuxoAsset[]) {
  const available = new Set(assets.flatMap(getReferenceFilterTags));
  return [
    { label: "All", value: "all" },
    { label: "Current", value: "current" },
    { label: "Discontinued", value: "discontinued" },
    { label: "Oystersteel", value: "oystersteel" },
    { label: "Two-tone", value: "two-tone" },
    ...omegaDirectoryFilters.filter(filter => filter.value !== "all"),
  ].filter(filter => available.has(filter.value));
}

// Derive filter tags only from documented case, dial, strap and complication fields.
// Unknown features remain untagged; do not infer a watch's dial from its collection.
export function getReferenceFilterTags(asset: QuestLuxoAsset): string[] {
  const material = (asset.material ?? "").toLowerCase();
  const model = (asset.model ?? "").toLowerCase();
  const configs = asset.configurations ?? [];
  const dials = configs.map(c => (c.dial ?? "").toLowerCase());
  const straps = configs.map(c => (c.bracelet ?? "").toLowerCase());
  const movements = configs.map(c => (c.movement ?? "").toLowerCase());

  const tags = new Set<string>(["all"]);
  const status = asset.productionStatus?.toLowerCase();
  if (status?.startsWith("current")) tags.add("current");
  if (status?.startsWith("discontinued")) tags.add("discontinued");
  if (material.includes("oystersteel")) tags.add("oystersteel");
  if (/gold|platinum/i.test(material) && !/steel|rolesor|two[- ]tone/i.test(material)) tags.add("precious-metal");
  if (material.includes("rolesor") || material.includes("two-tone") ||
      (material.includes("steel") && material.includes("gold"))) tags.add("two-tone");
  if ((asset.intelligence?.collectorDemand ?? 0) >= 5) tags.add("peak-demand");

  for (const dial of dials) {
    // Color classification may be multicolor where the exact dial explicitly specifies it.
    if (/\bgreen\b|\bpine green\b/.test(dial)) tags.add("green");
    if (/\bblue\b/.test(dial)) tags.add("blue");
    if (/\bwhite\b/.test(dial)) tags.add("white");
    if (/\bgr[ae]y\b|\bsilver\b/.test(dial)) tags.add("gray");
    if (/\bblack\b/.test(dial)) tags.add("black");
    if (/\borange\b|\bturquoise\b|\bterracotta\b|\bsandstone\b|\bpink\b|\bred\b|\byellow\b|\bpurple\b|\bburgundy\b/.test(dial)) tags.add("other-colors");
    // Non-wave must be explicit. This must not match the 'wave' in 'non-wave'.
    if (/\bnon[- ]wave\b/.test(dial)) tags.add("non-wave-dial");
    else if (/\bwave\b|\bwave-pattern\b/.test(dial)) tags.add("wave-dial");
  }
  if (material.includes("sedna")) tags.add("sedna-gold");
  if (straps.some(strap => strap.includes("rubber"))) tags.add("rubber-strap");
  if (/\bgmt\b|\bworldtimer\b|\bworld time\b/.test(model) ||
      movements.some(movement => /\bgmt\b|\bworldtimer\b|\bworld time\b/.test(movement))) {
    tags.add("gmt");
  }
  return [...tags];
}
