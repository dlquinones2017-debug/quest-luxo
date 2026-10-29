import { assertProductionReadiness } from "../config/productionReadiness.ts";
import type { LeadCapturePayload } from "./leadCapture.ts";
import {
  sendLeadNotificationEmail,
  type LeadEmailDeliveryResult,
} from "./leadEmail.ts";
import {
  saveLeadSubmission,
  updateLeadSubmissionEmailDelivery,
} from "./leadStorage.ts";
import type { LeadStorageResult, LeadSubmissionRecord } from "./leadStorageTypes.ts";
import { createLeadNotificationContext, type LeadNotificationContext } from "./leadNotificationContext.ts";

export interface LeadSubmissionDependencies {
  readonly ensureReady: () => Promise<void>;
  readonly persist: (payload: LeadCapturePayload) => Promise<LeadStorageResult>;
  readonly notify: (
    payload: LeadCapturePayload,
    context?: LeadNotificationContext
  ) => Promise<LeadEmailDeliveryResult>;
  readonly recordDelivery: (
    id: string,
    delivery: LeadEmailDeliveryResult
  ) => Promise<unknown>;
}

export type LeadSubmissionOutcome =
  | {
      readonly success: false;
      readonly statusCode: 503;
      readonly failureStage: "configuration" | "persistence";
      readonly error: unknown;
    }
  | {
      readonly success: true;
      readonly statusCode: 200;
      readonly storage: LeadStorageResult;
      readonly delivery: LeadEmailDeliveryResult;
      readonly deliveryRecorded: boolean;
      readonly deliveryRecordError?: unknown;
    };

const defaultDependencies: LeadSubmissionDependencies = Object.freeze({
  ensureReady: assertProductionReadiness,
  persist: (payload: LeadCapturePayload) => saveLeadSubmission(payload),
  notify: sendLeadNotificationEmail,
  recordDelivery: updateLeadSubmissionEmailDelivery,
});

const createNotificationFailure = (error: unknown): LeadEmailDeliveryResult =>
  Object.freeze({
    status: "failed",
    configured: false,
    reason:
      error instanceof Error
        ? error.message
        : "Lead notification failed unexpectedly.",
  });

// A retry uses an already saved record. It must never call the intake/persistence path.
export function notifySavedLead(
  record: Pick<LeadSubmissionRecord, "id" | "savedAt" | "payload">,
  notify: LeadSubmissionDependencies["notify"] = sendLeadNotificationEmail
): Promise<LeadEmailDeliveryResult> {
  return notify(record.payload, createLeadNotificationContext(record));
}

export async function processLeadSubmission(
  payload: LeadCapturePayload,
  dependencies: LeadSubmissionDependencies = defaultDependencies
): Promise<LeadSubmissionOutcome> {
  try {
    await dependencies.ensureReady();
  } catch (error) {
    return Object.freeze({
      success: false,
      statusCode: 503,
      failureStage: "configuration",
      error,
    });
  }

  let storage: LeadStorageResult;

  try {
    storage = await dependencies.persist(payload);
  } catch (error) {
    return Object.freeze({
      success: false,
      statusCode: 503,
      failureStage: "persistence",
      error,
    });
  }

  let delivery: LeadEmailDeliveryResult;

  try {
    delivery = await notifySavedLead({ ...storage, payload }, dependencies.notify);
  } catch (error) {
    delivery = createNotificationFailure(error);
  }

  try {
    const updatedRecord = await dependencies.recordDelivery(storage.id, delivery);

    if (updatedRecord === null) {
      throw new Error("Saved lead was not found while recording delivery status.");
    }

    return Object.freeze({
      success: true,
      statusCode: 200,
      storage,
      delivery,
      deliveryRecorded: true,
    });
  } catch (deliveryRecordError) {
    return Object.freeze({
      success: true,
      statusCode: 200,
      storage,
      delivery,
      deliveryRecorded: false,
      deliveryRecordError,
    });
  }
}
