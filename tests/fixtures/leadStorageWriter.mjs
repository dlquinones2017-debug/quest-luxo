import { createJsonlLeadStorageAdapter } from "../../src/lib/leads/leadStorage.ts";

process.send("ready");
process.once("message", async ({ directory, id, worker }) => {
  try {
    const adapter = createJsonlLeadStorageAdapter(directory);
    await Promise.all(Array.from({ length: 4 }, (_, i) => adapter.saveLeadSubmission({ name: `Fixture ${worker}-${i}`, email: "fixture@example.test" })));
    if (worker === 0) await adapter.updateLeadSubmissionNotes(id, "reviewed fixture");
    if (worker === 1) await adapter.updateLeadSubmissionTags(id, ["review"]);
    if (worker === 2) await adapter.updateLeadSubmissionEmailDelivery(id, { status: "sent", configured: true });
    if (worker === 3) await adapter.updateLeadSubmissionStatus(id, "contacted");
    process.send("done");
    process.disconnect();
  } catch {
    process.exitCode = 1;
    process.disconnect();
  }
});
