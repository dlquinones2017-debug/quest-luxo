import { readLeadSubmissions, readLeadSubmissionSnapshot } from "../leads/leadStorage.ts";
import type { LeadSubmissionRecord, LeadSubmissionSnapshot } from "../leads/leadStorageTypes.ts";
import { capitalSnapshot, type CapitalPipelineRecord } from "../capital/capitalPipelineStore.ts";
import { realtySnapshot, type RealtyPipelineRecord } from "../realty/realtyPipelineStore.ts";
import { enterpriseLiveRevenueBrief } from "./enterpriseLiveRevenueBrief.ts";
import type { EnterpriseRevenueBrief } from "./enterpriseRevenueBrief.ts";
import { enterpriseLeadIntelligence, type EnterpriseLeadReceipt, type LeadDivision } from "./enterpriseLeadIntelligence.ts";
import { luxuryLeadReceipts } from "./enterpriseLeadIntakeAdapter.ts";
import { enterpriseLeadReliability, type IntakeObservation } from "./enterpriseLeadReliability.ts";
import { enterpriseIntakeReconciliation } from "./enterpriseIntakeReconciliation.ts";

export interface EnterpriseIntakeSnapshot {
  readonly receipts: readonly EnterpriseLeadReceipt[];
  readonly observations: Partial<Record<LeadDivision, IntakeObservation>>;
}

export interface StoredEnterpriseRevenueBrief extends EnterpriseRevenueBrief {
  readonly intakeReliability: ReturnType<typeof enterpriseLeadReliability>;
  readonly intakeReconciliation: ReturnType<typeof enterpriseIntakeReconciliation>;
  readonly sourceRead: { readonly status: LeadSubmissionSnapshot["status"]; readonly unreadableRows: number };
}

export interface EnterpriseRevenueStoreReaders {
  readBrokerage():Promise<readonly LeadSubmissionRecord[]>;
  readCapital():readonly CapitalPipelineRecord[];
  readRealty():readonly RealtyPipelineRecord[];
  readIntake?():Promise<readonly EnterpriseLeadReceipt[]>;
  readBrokerageSnapshot?():Promise<LeadSubmissionSnapshot>;
  readIntakeSnapshot?():Promise<EnterpriseIntakeSnapshot>;
}
const defaultReaders:EnterpriseRevenueStoreReaders=Object.freeze({
  readBrokerage:readLeadSubmissions,
  readBrokerageSnapshot:readLeadSubmissionSnapshot,
  readCapital:capitalSnapshot,
  readRealty:realtySnapshot,
});
export async function storedEnterpriseRevenueBrief(now=new Date(),readers:EnterpriseRevenueStoreReaders=defaultReaders):Promise<StoredEnterpriseRevenueBrief>{
  const snapshot: LeadSubmissionSnapshot = readers.readBrokerageSnapshot ? await readers.readBrokerageSnapshot() :
    { records: await readers.readBrokerage(), status: "COMPLETE", malformedRows: 0 };
  const intake: EnterpriseIntakeSnapshot = readers.readIntakeSnapshot ? await readers.readIntakeSnapshot() :
    { receipts: readers.readIntake ? await readers.readIntake() : [], observations: {} };
  const capitalRecords = readers.readCapital();
  const realtyRecords = readers.readRealty();
  const brief = enterpriseLiveRevenueBrief({
    brokerage:snapshot.records,
    capital:capitalRecords,
    realty:realtyRecords,
    intake:intake.receipts,
  },now);
  // Aggregate reliability needs no canonical IDs. Preserve legacy identifiers in
  // the commercial projection without passing them through a stricter ID gate.
  const luxuryReceipts = luxuryLeadReceipts(snapshot.records).map(receipt => ({ ...receipt, canonicalRecordId: undefined }));
  const findings = enterpriseLeadIntelligence([...luxuryReceipts, ...intake.receipts], now);
  const observations: Partial<Record<LeadDivision, IntakeObservation>> = {
    CAPITAL_ADVISORY: { status: readers.readIntake || readers.readIntakeSnapshot ? "PARTIAL" : "DISABLED" },
    REALTY: { status: readers.readIntake || readers.readIntakeSnapshot ? "PARTIAL" : "DISABLED" },
    ...intake.observations,
    WATCH_BROKERAGE: { status: snapshot.status === "MISSING" ? "SOURCE_MISSING" : snapshot.status, observedAt: now.toISOString() },
  };
  return Object.freeze({
    ...brief,
    sourceRead: Object.freeze({ status: snapshot.status, unreadableRows: snapshot.malformedRows }),
    intakeReliability: enterpriseLeadReliability(findings, observations, now),
    intakeReconciliation: enterpriseIntakeReconciliation(findings, capitalRecords, realtyRecords),
  });
}
