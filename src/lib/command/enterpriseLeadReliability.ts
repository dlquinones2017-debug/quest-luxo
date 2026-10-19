import type { EnterpriseLeadFinding, LeadDivision } from "./enterpriseLeadIntelligence.ts";

export interface IntakeObservation {
  readonly status: "DISABLED" | "COMPLETE" | "PARTIAL" | "READ_ERROR" | "SOURCE_MISSING";
  readonly observedAt?: string | null;
}
const divisions: readonly LeadDivision[] = ["WATCH_BROKERAGE", "CAPITAL_ADVISORY", "REALTY"];
export function enterpriseLeadReliability(findings: readonly EnterpriseLeadFinding[], observations: Partial<Record<LeadDivision, IntakeObservation>>, now = new Date(), staleAfterMs = 86_400_000) {
  if (!Number.isFinite(now.getTime()) || !Number.isFinite(staleAfterMs) || staleAfterMs <= 0) throw new Error("Valid reliability observation policy required.");
  return Object.freeze(divisions.map(division => {
    const items = findings.filter(f => f.division === division);
    const observation = observations[division];
    const observed = observation?.observedAt ? Date.parse(observation.observedAt) : NaN;
    const observationTimeValid = Number.isFinite(observed) && observed <= now.getTime();
    const coverage = !observation || observation.status === "DISABLED" ? "UNKNOWN" :
      observation.status === "READ_ERROR" ? "READ_ERROR" : observation.status === "SOURCE_MISSING" ? "SOURCE_MISSING" : observation.status === "PARTIAL" ? "PARTIAL" :
      !observationTimeValid ? "UNKNOWN" : now.getTime() - observed > staleAfterMs ? "STALE" : "OBSERVED";
    return Object.freeze({
      division, coverage, collectionStatus: observation?.status ?? "UNVERIFIED",
      submissions: items.length ? "OBSERVED_RECEIPTS" : "NO_OBSERVED_SUBMISSIONS",
      receipts: items.length,
      notificationFailed: items.filter(f => f.notification === "FAILED").length,
      notificationUnknown: items.filter(f => f.notification === "UNKNOWN").length,
      providerAccepted: items.filter(f => f.notification === "ACCEPTED_BY_PROVIDER").length,
      timestampUnknown: items.filter(f => !f.timestampVerified).length,
      staleReceipts: items.filter(f => f.timestampVerified && f.receivedAt !== null && now.getTime() - Date.parse(f.receivedAt) > staleAfterMs).length,
      sourceUnverified: items.filter(f => f.state === "VERIFY_SOURCE" || f.state === "EVIDENCE_CONFLICT").length,
      // A receipt in Gmail, provider acceptance, retention and qualification are
      // separate evidence. No-submission observations do not prove form failure.
      inboxDelivery: "REQUIRES_SEPARATE_EVIDENCE", retention: "REQUIRES_VERIFICATION",
      founderApprovalRequired: true,
    });
  }));
}
