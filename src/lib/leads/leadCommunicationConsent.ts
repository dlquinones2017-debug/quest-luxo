import type { LeadCapturePayload } from "./leadCapture.ts";

export const COMMUNICATION_DISCLOSURE_VERSION = "luxury-communications-2026-10-24";
export const COMMUNICATION_BRAND = "Quest Luxo Luxury Advisory";
export const COMMUNICATION_LEGAL_ENTITY = "Quelux Enterprises LLC";
export const communicationDisclosures = Object.freeze({
  emailNewsletter: "Email me Quest Luxo Luxury Advisory watch newsletters and sourcing updates. I can unsubscribe at any time.",
  smsMarketing: "I agree to receive promotional texts from Quest Luxo Luxury Advisory about watches, sourcing and website updates at the number provided. Frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for assistance. Consent is optional and is not a condition of purchase or submitting an inquiry.",
  smsInquiry: "I agree to receive non-marketing texts from Quest Luxo Luxury Advisory about my inquiry, appointments and requested sourcing updates at the number provided. Frequency varies. Message and data rates may apply. Reply STOP to opt out or HELP for assistance. Consent is optional and is not a condition of purchase or submitting an inquiry.",
});

export interface CommunicationPreferences {
  readonly disclosureVersion: string;
  readonly emailNewsletter: boolean;
  readonly smsMarketing: boolean;
  readonly smsInquiry: boolean;
}

export interface CommunicationConsentEvidence {
  readonly disclosureVersion: string;
  readonly brand: string;
  readonly legalEntity: string;
  readonly method: "website-checkboxes";
  readonly sourceUrl: string;
  readonly sourceBasis: "submitted-form-source";
  readonly recordedAt: string;
  readonly affirmativeAt: string | null;
  readonly selections: CommunicationPreferences;
  readonly disclosures: typeof communicationDisclosures;
  readonly privacyUrl: string;
  readonly termsUrl: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const channelNames = ["emailNewsletter", "smsMarketing", "smsInquiry"] as const;

export const normalizeCommunicationPreferences = (value: unknown): CommunicationPreferences | undefined => {
  if (!isRecord(value) || value.disclosureVersion !== COMMUNICATION_DISCLOSURE_VERSION ||
      channelNames.some(channel => typeof value[channel] !== "boolean")) return undefined;
  return Object.freeze({
    disclosureVersion: COMMUNICATION_DISCLOSURE_VERSION,
    emailNewsletter: value.emailNewsletter === true,
    smsMarketing: value.smsMarketing === true,
    smsInquiry: value.smsInquiry === true,
  });
};

export const readCommunicationPreferences = (data: FormData): CommunicationPreferences => Object.freeze({
  disclosureVersion: String(data.get("communicationDisclosureVersion") ?? ""),
  emailNewsletter: data.get("newsletterConsent") === "yes",
  smsMarketing: data.get("smsMarketingConsent") === "yes",
  smsInquiry: data.get("smsInquiryConsent") === "yes",
});

export const communicationPreferenceError = (value: unknown, phone: string | null | undefined): string | null => {
  if (value === undefined || value === null) return null;
  const preferences = normalizeCommunicationPreferences(value);
  if (!preferences) return "Please refresh the form and review your communication choices before submitting.";
  if (preferences.smsMarketing || preferences.smsInquiry) {
    const digits = (phone ?? "").replace(/\D/g, "");
    if (!/^[+\d\s().-]+$/.test(phone ?? "") || digits.length < 7 || digits.length > 15)
      return "Enter a valid phone number for text messages, or leave both text-message choices unchecked.";
  }
  return null;
};

export const createCommunicationConsentEvidence = (
  value: unknown, recordedAt: string, source: string
): CommunicationConsentEvidence | undefined => {
  const selections = normalizeCommunicationPreferences(value);
  if (!selections || !["begin-your-quest", "contact"].includes(source)) return undefined;
  return Object.freeze({
    disclosureVersion: COMMUNICATION_DISCLOSURE_VERSION,
    brand: COMMUNICATION_BRAND,
    legalEntity: COMMUNICATION_LEGAL_ENTITY,
    method: "website-checkboxes",
    sourceBasis: "submitted-form-source",
    sourceUrl: source === "contact" ? "https://questluxo.com/contact" : "https://questluxo.com/begin-your-quest",
    recordedAt,
    affirmativeAt: channelNames.some(channel => selections[channel]) ? recordedAt : null,
    selections,
    disclosures: communicationDisclosures,
    privacyUrl: "https://questluxo.com/privacy",
    termsUrl: "https://questluxo.com/terms#text-messaging",
  });
};

// Record the submitted choices, not campaign eligibility or verified phone ownership.
// Only the storage layer supplies the receipt timestamp and evidence snapshot.
export const withServerCommunicationConsent = (
  payload: LeadCapturePayload, receivedAt: string
): LeadCapturePayload => {
  const { communicationPreferences, communicationConsentEvidence: _untrusted, ...fields } = payload;
  const selections = normalizeCommunicationPreferences(communicationPreferences);
  const evidence = createCommunicationConsentEvidence(selections, receivedAt, payload.source);
  return Object.freeze({
    ...fields,
    ...(selections ? { communicationPreferences: selections } : {}),
    ...(evidence ? { communicationConsentEvidence: evidence } : {}),
  });
};
