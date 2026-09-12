import {
  createLeadIntakeContext,
  type LeadIntakeContext,
  type LeadIntent,
} from "./leadIntakeContext.ts";

export interface LeadCapturePayload {
  readonly name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly intent: LeadIntent | null;
  readonly brand: string | null;
  readonly collection: string | null;
  readonly reference: string | null;
  readonly desiredWatch: string | null;
  readonly budget: string | null;
  readonly timeline: string | null;
  readonly message: string | null;
  readonly source: string;
  readonly createdAt: string;
}

export interface LeadCapturePayloadInput {
  readonly name?: string | null;
  readonly email?: string | null;
  readonly phone?: string | null;
  readonly intent?: LeadIntent | string | null;
  readonly brand?: string | null;
  readonly collection?: string | null;
  readonly reference?: string | null;
  readonly desiredWatch?: string | null;
  readonly budget?: string | null;
  readonly timeline?: string | null;
  readonly message?: string | null;
  readonly source?: string | null;
  readonly createdAt?: string | null;
}

const normalizeText = (value?: string | null): string | null => {
  const normalized = value?.trim();

  return normalized ? normalized : null;
};

export function createLeadCapturePayload(
  input: LeadCapturePayloadInput = {}
): LeadCapturePayload {
  const leadContext: LeadIntakeContext = createLeadIntakeContext({
    intent: input.intent,
    brand: input.brand,
    collection: input.collection,
    reference: input.reference,
  });

  return Object.freeze({
    name: normalizeText(input.name),
    email: normalizeText(input.email),
    phone: normalizeText(input.phone),
    intent: leadContext.intent ?? null,
    brand: leadContext.brand ?? null,
    collection: leadContext.collection ?? null,
    reference: leadContext.reference ?? null,
    desiredWatch: normalizeText(input.desiredWatch),
    budget: normalizeText(input.budget),
    timeline: normalizeText(input.timeline),
    message: normalizeText(input.message),
    source: normalizeText(input.source) ?? "begin-your-quest",
    createdAt: normalizeText(input.createdAt) ?? new Date().toISOString(),
  });
}

export function hasRequiredLeadContactFields(
  input: LeadCapturePayloadInput | LeadCapturePayload
): boolean {
  const payload = createLeadCapturePayload(input);

  return Boolean(
    payload.name &&
      payload.email &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
  );
}
