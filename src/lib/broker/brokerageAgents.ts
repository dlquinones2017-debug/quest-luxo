import { runWatchDealAgent, type WatchDealAgentResult, type WatchDealIntake } from "./dealCalculator.ts";

export type VerificationState = "VERIFIED" | "UNKNOWN" | "REQUIRES_VERIFICATION";
export type BrokerageStage = "QUALIFICATION" | "SOURCING" | "DILIGENCE" | "ECONOMICS" | "FOUNDER_APPROVAL" | "FULFILLMENT" | "AFTERCARE" | "BLOCKED";

export interface BuyerMandate {
  readonly mandateId: string;
  readonly clientId: string;
  readonly reference: string;
  readonly configuration: string;
  readonly budgetMax: number;
  readonly timing: string;
  readonly conditionRequirement: string;
  readonly paymentReadiness: VerificationState;
}

export interface SourcingCandidate {
  readonly candidateId: string;
  readonly dealerId: string;
  readonly reference: string;
  readonly configuration: string;
  readonly ask: number;
  readonly availability: VerificationState;
  readonly sourceEvidenceId?: string;
}

export interface DealerRecord {
  readonly dealerId: string;
  readonly name: string;
  readonly relationshipStatus: VerificationState;
  readonly transactionHistoryVerified: boolean;
}

export interface ConditionPacket {
  readonly candidateId: string;
  readonly authenticity: VerificationState;
  readonly condition: VerificationState;
  readonly serviceHistory: VerificationState;
  readonly provenance: VerificationState;
  readonly evidenceIds: readonly string[];
}

export interface TradeIn {
  readonly reference: string;
  readonly configuration: string;
  readonly clientExpectation: number;
  readonly verifiedBid?: number;
}

export interface CommandEvent {
  readonly mandateId: string;
  readonly stage: BrokerageStage;
  readonly status: "READY" | "BLOCKED" | "REQUIRES_FOUNDER";
  readonly reason: string;
  readonly evidenceIds: readonly string[];
}

export function qualifyClient(mandate: BuyerMandate): CommandEvent {
  if (!mandate.mandateId || !mandate.clientId || !mandate.reference || !mandate.configuration || mandate.budgetMax <= 0) {
    return event(mandate.mandateId, "QUALIFICATION", "BLOCKED", "Mandate identity, exact watch target, and positive budget are required.");
  }
  if (mandate.paymentReadiness !== "VERIFIED") {
    return event(mandate.mandateId, "QUALIFICATION", "BLOCKED", "Payment readiness requires verification.");
  }
  return event(mandate.mandateId, "SOURCING", "READY", "Qualified mandate may enter sourcing.");
}

export function sourceCandidates(mandate: BuyerMandate, candidates: readonly SourcingCandidate[]): readonly SourcingCandidate[] {
  return Object.freeze(candidates.filter(c =>
    token(c.reference) === token(mandate.reference) &&
    comparable(c.configuration) === comparable(mandate.configuration) &&
    c.ask > 0 &&
    c.availability === "VERIFIED" &&
    Boolean(c.sourceEvidenceId)
  ));
}

export function validateDealer(dealer: DealerRecord): VerificationState {
  return dealer.relationshipStatus === "VERIFIED" && dealer.transactionHistoryVerified ? "VERIFIED" : "REQUIRES_VERIFICATION";
}

export function evaluateCondition(packet: ConditionPacket): CommandEvent {
  const verified = packet.authenticity === "VERIFIED" && packet.condition === "VERIFIED";
  if (!verified || packet.evidenceIds.length === 0) {
    return event(packet.candidateId, "DILIGENCE", "BLOCKED", "Authenticity, condition, and evidence must be verified.", packet.evidenceIds);
  }
  const unknownHistory = packet.serviceHistory !== "VERIFIED" || packet.provenance !== "VERIFIED";
  return event(packet.candidateId, "ECONOMICS", "READY", unknownHistory ? "Core diligence passed; service/provenance uncertainty must remain disclosed." : "Diligence passed.", packet.evidenceIds);
}

export function evaluateTradeIn(trade: TradeIn): { status: VerificationState; equity: number | null } {
  if (!trade.verifiedBid || trade.verifiedBid <= 0) return Object.freeze({ status: "REQUIRES_VERIFICATION", equity: null });
  return Object.freeze({ status: "VERIFIED", equity: Math.round(trade.verifiedBid - trade.clientExpectation) });
}

export function runBrokerageDeal(mandate: BuyerMandate, intake: WatchDealIntake): { deal: WatchDealAgentResult; command: CommandEvent } {
  const qualification = qualifyClient(mandate);
  if (qualification.status === "BLOCKED") {
    throw new Error(qualification.reason);
  }
  const deal = runWatchDealAgent(intake);
  const command = deal.approval.canCommit
    ? event(mandate.mandateId, "FULFILLMENT", "READY", deal.reason)
    : event(mandate.mandateId, "FOUNDER_APPROVAL", "REQUIRES_FOUNDER", deal.reason);
  return Object.freeze({ deal, command });
}

export function createAftercareEvent(mandateId: string, transactionEvidenceId?: string): CommandEvent {
  if (!transactionEvidenceId) return event(mandateId, "AFTERCARE", "BLOCKED", "Verified transaction evidence is required before aftercare.");
  return event(mandateId, "AFTERCARE", "READY", "Transaction verified; aftercare workflow may begin.", [transactionEvidenceId]);
}

function event(mandateId: string, stage: BrokerageStage, status: CommandEvent["status"], reason: string, evidenceIds: readonly string[] = []): CommandEvent {
  return Object.freeze({ mandateId, stage, status, reason, evidenceIds: Object.freeze([...evidenceIds]) });
}
function token(v: string): string { return v.toLowerCase().replace(/[^a-z0-9]+/g, ""); }
function comparable(v: string): string { return v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
