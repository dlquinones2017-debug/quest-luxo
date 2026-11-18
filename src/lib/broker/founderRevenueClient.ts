import type { FounderRevenueReadModel } from "../command/founderRevenueReadModel.ts";

const divisions = ["WATCH_BROKERAGE", "CAPITAL_ADVISORY", "REALTY"] as const;
const labels = { WATCH_BROKERAGE: "Luxury Advisory", CAPITAL_ADVISORY: "Capital Advisory", REALTY: "Realty / Property Acquisitions" };
const count = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;

export async function loadFounderRevenueModel(pageUrl: string, request: typeof fetch = fetch): Promise<FounderRevenueReadModel> {
  try {
    const key = new URL(pageUrl).searchParams.get("key")?.trim();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (key) headers["x-broker-console-key"] = key;
    // Keep the existing console key in memory, send it only to this same-origin
    // endpoint, and prevent redirect/referrer/cache propagation.
    const response = await request("/api/broker/revenue", {
      method: "GET", headers, redirect: "error", referrerPolicy: "no-referrer", cache: "no-store", credentials: "same-origin",
    });
    if (!response.ok) throw new Error();
    const model = await response.json();
    const statuses = ["COMPLETE", "PARTIAL", "MISSING"];
    if (!model || !statuses.includes(model.sourceRead?.status) || !count(model.sourceRead?.unreadableRows) ||
        ![model.totalRecords, model.unknownRecords, model.verifiedEstimatedRevenue, model.verifiedExpectedRevenue].every(count) ||
        !Array.isArray(model.founderActions) || !Array.isArray(model.intakeReliability) || model.intakeReliability.length !== 3 ||
        !Array.isArray(model.intakeReconciliation) || model.intakeReconciliation.length !== 2 ||
        new Set(model.intakeReconciliation.map((row: { division: string }) => row?.division)).size !== 2 ||
        !model.intakeReconciliation.every((row: Record<string, unknown>) => row &&
          ["CAPITAL_ADVISORY", "REALTY"].includes(String(row.division)) &&
          ["retainedReceipts", "sourceReviewRequired", "missingCanonicalLinks", "missingCanonicalRecords", "missingEvidence", "matchedInMemoryOnly"].every(k => Number.isSafeInteger(row[k]) && Number(row[k]) >= 0) &&
          row.durableReconciliationVerified === false) ||
        new Set(model.intakeReliability.map((row: { division: string }) => row?.division)).size !== 3 ||
        !model.intakeReliability.every((row: Record<string, unknown>) => row && divisions.includes(row.division as typeof divisions[number]) &&
          ["receipts", "notificationFailed", "notificationUnknown", "providerAccepted", "timestampUnknown", "staleReceipts", "sourceUnverified"].every(k => count(row[k])) &&
          ["UNKNOWN", "READ_ERROR", "PARTIAL", "SOURCE_MISSING", "STALE", "OBSERVED"].includes(String(row.coverage)) &&
          ["DISABLED", "COMPLETE", "PARTIAL", "READ_ERROR", "SOURCE_MISSING", "UNVERIFIED"].includes(String(row.collectionStatus)))) throw new Error();
    return model as FounderRevenueReadModel;
  } catch { throw new Error("Unable to load enterprise revenue state."); }
}

export function founderIntakeRows(model: FounderRevenueReadModel) {
  return divisions.map(division => {
    const row = model.intakeReliability.find(r => r.division === division)!;
    const coverage = row.collectionStatus === "DISABLED" ? "Not connected" : {
      UNKNOWN: "Not verified", READ_ERROR: "Unable to read", PARTIAL: "Partial view", SOURCE_MISSING: "Saved source not found", STALE: "Observation needs refresh", OBSERVED: "Read at this refresh",
    }[row.coverage];
    const known = row.coverage === "OBSERVED" || row.coverage === "STALE" || row.coverage === "PARTIAL";
    return Object.freeze({
      division: labels[division], coverage,
      receipts: known ? `${row.receipts}${row.coverage === "PARTIAL" ? "+ observed" : " observed"}` : "Unknown",
      accepted: known ? String(row.providerAccepted) : "Unknown",
      failed: known ? String(row.notificationFailed) : "Unknown",
      unknown: known ? String(row.notificationUnknown) : "Unknown",
      review: !known ? "Verify collection access before assessing delivery." : row.timestampUnknown > 0 ? `${row.timestampUnknown} receipt time(s) need verification.` :
        row.notificationFailed > 0 ? "Review failed notification evidence." : row.sourceUnverified > 0 ? "Review source evidence." :
        row.staleReceipts > 0 ? `${row.staleReceipts} older receipt(s); age alone does not establish overdue work.` : "Inbox delivery, qualification and recovery require separate evidence.",
    });
  });
}


/**
 * Read-only, aggregate display. A zero in an unconnected source means
 * no observations, NOT that every inquiry is linked or safe.
 */
export function founderReconciliationRows(model: FounderRevenueReadModel) {
  return (["CAPITAL_ADVISORY", "REALTY"] as const).map(division => {
    const row = model.intakeReconciliation.find(r => r.division === division)!;
    const reliability = model.intakeReliability.find(r => r.division === division)!;
    const observed = reliability.coverage === "PARTIAL" ||
      reliability.coverage === "OBSERVED" || reliability.coverage === "STALE";
    const issueCount = row.sourceReviewRequired + row.missingCanonicalLinks +
      row.missingCanonicalRecords + row.missingEvidence;
    return Object.freeze({
      division: labels[division],
      collection: reliability.collectionStatus === "DISABLED" ? "Not connected" :
        reliability.coverage === "SOURCE_MISSING" ? "Source missing" :
        reliability.coverage === "READ_ERROR" ? "Read failed" :
        observed ? "Partial evidence" : "Not verified",
      receipts: observed ? String(row.retainedReceipts) + " observed" : "Unknown",
      sourceReview: observed ? String(row.sourceReviewRequired) : "Unknown",
      missingLinks: observed ? String(row.missingCanonicalLinks) : "Unknown",
      missingRecords: observed ? String(row.missingCanonicalRecords) : "Unknown",
      evidenceMissing: observed ? String(row.missingEvidence) : "Unknown",
      inMemoryOnly: observed ? String(row.matchedInMemoryOnly) : "Unknown",
      review: !observed ? "Verify source and saved records; zero is not proof of completeness." :
        issueCount > 0 ? "Founder review required before any CRM assignment." :
        "No observed link issues; durable CRM recovery is not verified.",
    });
  });
}
