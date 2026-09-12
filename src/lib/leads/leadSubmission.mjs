import { createLeadRecord, persistLead } from "./leadStorage.mjs";
import { sendLeadNotification } from "./leadNotification.mjs";

export const processLeadSubmission = async (
  payload,
  clientKey,
  config,
  dependencies = {}
) => {
  const record = createLeadRecord(payload, clientKey);
  const persist = dependencies.persist ?? persistLead;
  const notify = dependencies.notify ?? sendLeadNotification;
  const storage = await persist(record, config);

  try {
    const delivery = await notify(record, config);
    return Object.freeze({ success: true, storage, delivery });
  } catch (error) {
    console.error("Quest Luxo lead notification failed after persistence.", {
      leadId: record.id,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return Object.freeze({
      success: true,
      storage,
      delivery: Object.freeze({ delivered: false }),
    });
  }
};
