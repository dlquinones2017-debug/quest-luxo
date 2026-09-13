import type { QuestLuxoAsset } from "../../types/questLuxo";
export interface WatchPhotograph {
  assetId: string;
  brand: string;
  collection: string;
  reference: string;
  configuration: { dial: string; bracelet: string; material: string; caseSize?: string };
  src: string;
  alt: string;
  background: "white" | "mirrored-acrylic" | "black-studio";
  authenticPhotography: boolean;
  exactConfigurationVerified: boolean;
  sourceUrl: string;
  photographer: string;
  licenseRecord: string;
  licenseUrl?: string;
  licenseLabel?: string;
  websiteApproved: boolean;
  commercialUse: "allowed" | "allowed-with-conditions" | "unknown" | "not-allowed";
  usageConditionsSatisfied: boolean;
  rightsExpiresAt: string | null;
  reviewedAt: string;
  reviewer: string;
  sha256: string;
  attribution: string;
  hero: boolean;
  collectionOnly?: boolean;
}
const known=(s: unknown): s is string => typeof s === "string" && !!s.trim() && !/unknown|tbd|pending|requires verification/i.test(s);
export function approvedPhotograph(asset: QuestLuxoAsset, photos: readonly WatchPhotograph[], now=new Date()): WatchPhotograph | undefined {
  return photos.find(p => {
    const datesValid=Number.isFinite(Date.parse(p.reviewedAt)) && Date.parse(p.reviewedAt)<=now.getTime() && (p.rightsExpiresAt===null || (Number.isFinite(Date.parse(p.rightsExpiresAt)) && Date.parse(p.rightsExpiresAt)>now.getTime()));
    return p.hero && p.brand===asset.brand && p.collection===asset.collection && p.reference===asset.reference &&
      p.authenticPhotography===true && p.exactConfigurationVerified===true && p.websiteApproved===true &&
      (p.commercialUse==="allowed" || p.commercialUse==="allowed-with-conditions") && p.usageConditionsSatisfied===true &&
      [p.assetId,p.sourceUrl,p.photographer,p.licenseRecord,p.reviewer,p.alt,p.configuration.dial,p.configuration.bracelet,p.configuration.material].every(known) &&
      p.sourceUrl.startsWith("https://") && /^\/images\/watches\/[a-zA-Z0-9/_-]+\.(webp|png|jpe?g)$/.test(p.src) &&
      /^[a-f0-9]{64}$/i.test(p.sha256) && ["white","mirrored-acrylic","black-studio"].includes(p.background) && datesValid &&
      asset.material===p.configuration.material && asset.configurations?.some(c=>c.dial===p.configuration.dial && c.bracelet===p.configuration.bracelet && (!p.configuration.caseSize || c.caseSize===p.configuration.caseSize));
  });
}
