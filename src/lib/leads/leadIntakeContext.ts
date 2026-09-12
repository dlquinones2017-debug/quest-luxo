export const leadIntentValues = [
  "request-this-watch",
  "sell-your-watch",
  "trade-your-watch",
  "market-valuation",
  "talk-to-broker",
] as const;

export type LeadIntent = (typeof leadIntentValues)[number];

export interface LeadIntakeContext {
  readonly intent?: LeadIntent;
  readonly brand?: string;
  readonly collection?: string;
  readonly reference?: string;
}

export interface LeadIntakeContextInput {
  readonly intent?: string | null;
  readonly brand?: string | null;
  readonly collection?: string | null;
  readonly reference?: string | null;
}

export interface LeadIntakeUrlOptions {
  readonly basePath?: string;
}

export const leadIntentAliases: Readonly<Record<string, LeadIntent>> =
  Object.freeze({
    request: "request-this-watch",
    "request-this-watch": "request-this-watch",
    sell: "sell-your-watch",
    "sell-your-watch": "sell-your-watch",
    trade: "trade-your-watch",
    "trade-your-watch": "trade-your-watch",
    valuation: "market-valuation",
    "market-valuation": "market-valuation",
    broker: "talk-to-broker",
    "talk-to-broker": "talk-to-broker",
  });

const cleanValue = (value?: string | null): string | undefined => {
  const cleaned = value?.trim();

  return cleaned ? cleaned : undefined;
};

const articleFor = (value: string): "a" | "an" =>
  /^[aeiou]/i.test(value) ? "an" : "a";

export function normalizeLeadIntent(
  intent?: string | null
): LeadIntent | undefined {
  const lookupKey = cleanValue(intent)?.toLowerCase();

  if (!lookupKey) return undefined;

  return leadIntentAliases[lookupKey];
}

export function createLeadIntakeContext(
  input: LeadIntakeContextInput = {}
): LeadIntakeContext {
  const intent = normalizeLeadIntent(input.intent);
  const brand = cleanValue(input.brand);
  const collection = cleanValue(input.collection);
  const reference = cleanValue(input.reference);

  return Object.freeze({
    ...(intent ? { intent } : {}),
    ...(brand ? { brand } : {}),
    ...(collection ? { collection } : {}),
    ...(reference ? { reference } : {}),
  });
}

export function hasMeaningfulLeadContext(
  input: LeadIntakeContextInput = {}
): boolean {
  const context = createLeadIntakeContext(input);

  return Boolean(
    context.intent || context.brand || context.collection || context.reference
  );
}

export function buildLeadContextLabel(
  input: LeadIntakeContextInput = {}
): string {
  const context = createLeadIntakeContext(input);

  return [
    context.brand,
    context.collection,
    context.reference ? `Ref. ${context.reference}` : undefined,
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildBeginYourQuestUrl(
  input: LeadIntakeContextInput = {},
  options: LeadIntakeUrlOptions = {}
): string {
  const context = createLeadIntakeContext(input);
  const params = new URLSearchParams();

  if (context.intent) params.set("intent", context.intent);
  if (context.brand) params.set("brand", context.brand);
  if (context.collection) params.set("collection", context.collection);
  if (context.reference) params.set("reference", context.reference);

  const query = params.toString();
  const basePath = options.basePath ?? "/begin-your-quest/";

  return query ? `${basePath}?${query}` : basePath;
}

export function createLeadContextSummary(
  input: LeadIntakeContextInput = {}
): string {
  const context = createLeadIntakeContext(input);
  const contextLabel = buildLeadContextLabel(context);
  const contextualWatch = contextLabel
    ? `${articleFor(contextLabel)} ${contextLabel}`
    : undefined;

  switch (context.intent) {
    case "request-this-watch":
      return contextualWatch
        ? `You're here to request ${contextualWatch}.`
        : "You're here to request a watch.";
    case "sell-your-watch":
      return contextualWatch
        ? `You're here to sell ${contextualWatch}.`
        : "You're here to sell a watch.";
    case "trade-your-watch":
      return contextualWatch
        ? `You're here to trade ${contextualWatch}.`
        : "You're here to trade a watch.";
    case "market-valuation":
      return contextualWatch
        ? `You're here to get a market valuation for ${contextualWatch}.`
        : "You're here to get a market valuation.";
    case "talk-to-broker":
      return contextualWatch
        ? `You're here to talk to a Quest Luxo broker about ${contextualWatch}.`
        : "You're here to talk to a Quest Luxo broker.";
    default:
      return contextualWatch
        ? `You're here to discuss ${contextualWatch}.`
        : "Tell Quest Luxo what you want sourced.";
  }
}
