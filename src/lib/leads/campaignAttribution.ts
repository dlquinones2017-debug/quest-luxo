/** Only campaign codes already used by Quest Luxo links may leave the URL.
 * This records a URL-declared source, not a verified ad click or qualification.
 * Never expand this to accept arbitrary query strings, terms or click IDs.
 */
export const luxuryCampaignRules = Object.freeze([
  Object.freeze({ source: "chatgpt", medium: "paid", name: "quest_luxo_collector_sourcing_pilot", contents: Object.freeze([] as string[]) }),
  Object.freeze({ source: "linkedin", medium: "organic_social", name: "rolling30_l13", contents: Object.freeze(["founder", "luxury_showcase"]) }),
  Object.freeze({ source: "linkedin", medium: "organic_social", name: "rolling30_l14", contents: Object.freeze(["founder", "luxury_showcase"]) }),
]);

export interface LuxuryCampaignAttribution {
  readonly source: string;
  readonly medium: string;
  readonly name: string;
  readonly content?: string;
}

export function readLuxuryCampaignAttribution(search: string): LuxuryCampaignAttribution | null {
  const params = new URLSearchParams(search);
  const fields = ["utm_source", "utm_medium", "utm_campaign"];
  if (fields.some(field => params.getAll(field).length !== 1) || params.getAll("utm_content").length > 1) return null;
  const rule = luxuryCampaignRules.find(candidate =>
    params.get("utm_source") === candidate.source &&
    params.get("utm_medium") === candidate.medium &&
    params.get("utm_campaign") === candidate.name
  );
  const content = params.get("utm_content");
  if (!rule || (content !== null && !rule.contents.includes(content))) return null;
  return Object.freeze({ source: rule.source, medium: rule.medium, name: rule.name, ...(content ? { content } : {}) });
}

/** Preserve the existing canonical payload shape and route source for old links. */
export function createCampaignLeadSource(route: "begin-your-quest" | "contact", search: string): string {
  const campaign = readLuxuryCampaignAttribution(search);
  if (!campaign) return route;
  const params = new URLSearchParams({ utm_source: campaign.source, utm_medium: campaign.medium, utm_campaign: campaign.name });
  if (campaign.content) params.set("utm_content", campaign.content);
  return `${route};${params.toString()}`;
}
