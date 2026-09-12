import type { BrokerageEconomicsInput } from "../brokerage/brokerageEconomics.ts";
import type { BrokerageEconomicsSnapshot } from "../brokerage/brokerageEconomicsSnapshot.ts";
import type { LeadCapturePayload } from "./leadCapture.ts";
import type { LeadEmailDeliveryResult } from "./leadEmail.ts";

export const leadStorageProviderValues = ["jsonl"] as const;

export type LeadStorageProvider = (typeof leadStorageProviderValues)[number];

export const leadStatusValues = [
  "new",
  "contacted",
  "sourcing",
  "offer-sent",
  "closed",
  "lost",
] as const;

export type LeadStatus = (typeof leadStatusValues)[number];

export interface LeadSubmissionRecord {
  readonly id: string;
  readonly status: LeadStatus;
  readonly notes: string;
  readonly notesUpdatedAt: string | null;
  readonly tags: readonly string[];
  readonly tagsUpdatedAt: string | null;
  readonly economicsSnapshots: readonly BrokerageEconomicsSnapshot[];
  readonly payload: LeadCapturePayload;
  readonly savedAt: string;
  readonly emailDelivery?: LeadEmailDeliveryResult;
}

export interface LeadStorageResult {
  readonly saved: true;
  readonly id: string;
  readonly path: string;
  readonly savedAt: string;
}

export interface LeadStorageAdapter {
  readonly provider: LeadStorageProvider;
  saveLeadSubmission(
    payload: LeadCapturePayload,
    emailDelivery?: LeadEmailDeliveryResult
  ): Promise<LeadStorageResult>;
  readLeadSubmissions(): Promise<readonly LeadSubmissionRecord[]>;
  updateLeadSubmissionStatus(
    id: string,
    status: LeadStatus
  ): Promise<LeadSubmissionRecord | null>;
  updateLeadSubmissionNotes(
    id: string,
    notes: string
  ): Promise<LeadSubmissionRecord | null>;
  updateLeadSubmissionTags(
    id: string,
    tags: readonly string[]
  ): Promise<LeadSubmissionRecord | null>;
  updateLeadSubmissionEmailDelivery(
    id: string,
    emailDelivery: LeadEmailDeliveryResult
  ): Promise<LeadSubmissionRecord | null>;
  addLeadSubmissionEconomicsSnapshot(
    id: string,
    economicsInput: BrokerageEconomicsInput,
    brokerNote?: string | null
  ): Promise<LeadSubmissionRecord | null>;
}
