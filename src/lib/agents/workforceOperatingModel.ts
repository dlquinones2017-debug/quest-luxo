import { loadFactoryRoster } from "./agentFactory.ts";

export const WORKFORCE_MODEL_VERSION = 2;
export const DELIVERY_STAGES = ["SPECIFIED", "IMPLEMENTED", "TESTED", "DEPLOYED", "OPERATIONALLY_VERIFIED"] as const;
export const WORKFORCE_TEAM_IDS = ["executive-command", "technology-luxury", "marketing-growth", "capital-advisory", "property-acquisitions", "enterprise-operations"] as const;
export type WorkforceTeamId = typeof WORKFORCE_TEAM_IDS[number];
export type WorkstreamId = "A" | "B" | "C";
const roleGroups: Record<WorkforceTeamId, readonly string[]> = {
  "executive-command": ["command-orchestrator", "revenue-coordinator", "founder-chief-of-staff-and-approval-agent", "executive-analytics-and-forecasting-agent", "business-workspace-librarian-agent"],
  "technology-luxury": ["watch-revenue", "watch-deal-intelligence", "watch-sourcing", "luxury-client-qualification", "luxury-follow-up", "website-product", "dealer-verification-and-authentication-agent", "watch-transaction-and-logistics-agent", "luxury-retention-and-trade-up-agent", "website-engineering-and-release-agent", "watch-deal-sniping-and-negotiation-agent", "watch-pricing-liquidity-and-bid-ceiling-agent"],
  "marketing-growth": ["prospect-intelligence", "relationship-intelligence", "linkedin-growth", "content-intelligence", "content-production", "newsletter", "brand-governance-and-creative-direction-agent", "campaign-distribution-and-attribution-agent", "seo-and-conversion-optimization-agent"],
  "capital-advisory": ["capital-revenue", "capital-fundability", "capital-lender-intelligence", "capital-deal-packaging", "business-credit-and-soft-pull-readiness-agent", "lender-partnership-acquisition-and-onboarding-agent", "funding-submission-and-compliance-agent", "funding-closing-and-broker-compensation-agent"],
  "property-acquisitions": ["realty-revenue", "realty-market-intelligence", "realty-underwriting", "realty-lead-pipeline", "property-due-diligence-and-title-agent", "buyer-matching-and-disposition-agent", "realty-closing-and-milestones-agent"],
  "enterprise-operations": ["lead-operations", "enterprise-risk", "finance-operations", "sop-operations", "enterprise-crm-and-identity-resolution-agent", "enterprise-communications-and-scheduling-agent", "security-privacy-and-consent-agent", "legal-licensing-and-regulatory-calendar-agent", "reliability-qa-and-incident-response-agent", "bookkeeping-and-reconciliation-agent", "billing-collections-and-compensation-agent", "vendor-contractor-and-people-operations-agent", "unified-communications-dispatch-agent", "corporate-inbox-and-contact-hygiene-agent", "cross-division-client-vetting-and-referral-agent", "omnichannel-sales-and-follow-up-agent"],
};
const names: Record<WorkforceTeamId, string> = {
  "executive-command": "Executive Command & Orchestration", "technology-luxury": "Technology & Luxury Advisory", "marketing-growth": "Marketing & Growth",
  "capital-advisory": "Capital Advisory & Funding", "property-acquisitions": "Property Acquisitions", "enterprise-operations": "Enterprise Operations",
};
export function teamForLegacyRole(roleId: string): WorkforceTeamId {
  const matches = WORKFORCE_TEAM_IDS.filter(team => roleGroups[team].includes(roleId));
  if (matches.length !== 1) throw Error("Capability must have exactly one accountable team.");
  return matches[0]!;
}

/** Retains the historical catalog as capabilities; it is never a worker deployment target. */
export async function loadConsolidatedWorkforce() {
  const legacy = await loadFactoryRoster();
  const assigned = Object.values(roleGroups).flat();
  if (new Set(assigned).size !== assigned.length || assigned.length !== legacy.length || legacy.some(r => !assigned.includes(r.id)))
    throw Error("Consolidation would lose, duplicate or invent a historical capability.");
  return Object.freeze({ schemaVersion: 1, operatingModelVersion: WORKFORCE_MODEL_VERSION,
    deploymentStrategy: "FUNCTIONAL_WORKFLOWS", independentWorkerTarget: null, historicalCapabilityCount: legacy.length,
    teams: Object.freeze(WORKFORCE_TEAM_IDS.map(id => Object.freeze({ id, name: names[id], accountableWorkstream: "C",
      capabilities: Object.freeze(legacy.filter(r => teamForLegacyRole(r.id) === id).map(r => Object.freeze({ ...r,
        catalogAssessment: "SPECIFIED", runtimeDeliveryStage: null, runtimeStatus: "NOT_OBSERVED", independentWorkerRequired: false }))) }))),
    workstreams: Object.freeze([
      Object.freeze({ id: "A", scope: "SEO_ANALYTICS_WEBSITE_CONTENT_AND_CONVERSION", sessionControl: "NOT_ASSUMED" }),
      Object.freeze({ id: "B", scope: "LINKEDIN_SHOWCASE_AND_SOCIAL_PUBLISHING", sessionControl: "NOT_ASSUMED" }),
      Object.freeze({ id: "C", scope: "WORKFORCE_ORCHESTRATION_RELIABILITY_AND_SHARED_INTERFACES", sessionControl: "CURRENT_WORKSTREAM_ONLY" }),
    ]), paidModelExecutionAllowed: false, createsWorkers: false, replacesCanonicalStores: false });
}

export const WORKFORCE_OPERATIONS = ["EXECUTIVE_REPORTING", "SECURITY_RECOVERY", "CRM_RECONCILIATION", "LUXURY_QUALIFICATION", "CAPITAL_QUALIFICATION", "REALTY_SCREENING",
  "ANALYTICS_HANDOFF", "SEO_IMPLEMENTATION", "WEBSITE_CONTENT_DEPLOYMENT", "SOCIAL_PUBLISHING", "LINKEDIN_SHOWCASE", "INTERNAL_FOLLOWUP_PREPARATION", "TRANSACTION_REVIEW"] as const;
export type WorkforceOperation = typeof WORKFORCE_OPERATIONS[number];
export type WorkforceDivision = "WATCH_BROKERAGE" | "CAPITAL_ADVISORY" | "REALTY";
export function resolveWorkforceOwnership(operation: WorkforceOperation, division: WorkforceDivision) {
  if (!WORKFORCE_OPERATIONS.includes(operation) || !["WATCH_BROKERAGE", "CAPITAL_ADVISORY", "REALTY"].includes(division)) throw Error("Unknown operation or division.");
  const divisionTeam: WorkforceTeamId = division === "WATCH_BROKERAGE" ? "technology-luxury" : division === "CAPITAL_ADVISORY" ? "capital-advisory" : "property-acquisitions";
  if ((operation === "LUXURY_QUALIFICATION" && division !== "WATCH_BROKERAGE") || (operation === "CAPITAL_QUALIFICATION" && division !== "CAPITAL_ADVISORY") ||
    (operation === "REALTY_SCREENING" && division !== "REALTY")) throw Error("Cross-division specialist routing rejected.");
  const workstream: WorkstreamId = ["SEO_IMPLEMENTATION", "WEBSITE_CONTENT_DEPLOYMENT"].includes(operation) ? "A" :
    ["SOCIAL_PUBLISHING", "LINKEDIN_SHOWCASE"].includes(operation) ? "B" : "C";
  const team: WorkforceTeamId = operation === "EXECUTIVE_REPORTING" ? "executive-command" : ["SECURITY_RECOVERY", "CRM_RECONCILIATION"].includes(operation) ? "enterprise-operations" :
    ["ANALYTICS_HANDOFF", "SEO_IMPLEMENTATION", "SOCIAL_PUBLISHING", "LINKEDIN_SHOWCASE"].includes(operation) ? "marketing-growth" : operation === "WEBSITE_CONTENT_DEPLOYMENT" ? "technology-luxury" : divisionTeam;
  return Object.freeze({ teamId: team, executionWorkstream: workstream, handoffRequired: workstream !== "C",
    founderApprovalRequired: operation === "TRANSACTION_REVIEW", externalExecutionAllowed: false });
}
