export type AgentStatus = "DEPLOYED" | "PARTIAL" | "SPECIFIED" | "NOT_STARTED";
export type AgentDivision =
  | "COMMAND_CENTER"
  | "LUXURY_ADVISORY"
  | "REALTY"
  | "CAPITAL_ADVISORY"
  | "GROWTH_ENGINE"
  | "MARKETING"
  | "WEBSITE_PRODUCT"
  | "ENTERPRISE_OPERATIONS";

export interface AgentDefinition {
  id: string;
  division: AgentDivision;
  name: string;
  mission: string;
  status: AgentStatus;
  founderGate: boolean;
  canWriteExternally: boolean;
  dependencies: readonly string[];
}

export const QLUX_AGENTIC_TEAM: readonly AgentDefinition[] = Object.freeze([
  { id:"command-orchestrator", division:"COMMAND_CENTER", name:"Command Orchestrator", mission:"Coordinate enterprise priorities and route verified work to specialized agents.", status:"PARTIAL", founderGate:true, canWriteExternally:false, dependencies:[] },
  { id:"revenue-coordinator", division:"COMMAND_CENTER", name:"Revenue Agent Coordinator", mission:"Route verified revenue actions to Luxury Advisory, Capital Advisory, and Realty agents.", status:"DEPLOYED", founderGate:true, canWriteExternally:false, dependencies:["command-orchestrator"] },

  { id:"watch-revenue", division:"LUXURY_ADVISORY", name:"Watch Brokerage Revenue Agent", mission:"Prioritize verified watch brokerage opportunities without autonomous client or dealer commitments.", status:"DEPLOYED", founderGate:true, canWriteExternally:false, dependencies:["revenue-coordinator"] },
  { id:"watch-deal-intelligence", division:"LUXURY_ADVISORY", name:"Watch Deal Intelligence Agent", mission:"Evaluate sourcing economics, risk, liquidity, service exposure, and deal readiness.", status:"PARTIAL", founderGate:true, canWriteExternally:false, dependencies:["watch-revenue"] },
  { id:"watch-sourcing", division:"LUXURY_ADVISORY", name:"Watch Sourcing Agent", mission:"Find and qualify inventory against verified client mandates.", status:"PARTIAL", founderGate:true, canWriteExternally:false, dependencies:["watch-revenue"] },
  { id:"luxury-client-qualification", division:"LUXURY_ADVISORY", name:"Luxury Client Qualification Agent", mission:"Qualify buyer intent, mandate quality, budget, timeline, and fit.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["watch-revenue"] },
  { id:"luxury-follow-up", division:"LUXURY_ADVISORY", name:"Luxury Follow-Up Agent", mission:"Surface overdue follow-ups and prepare founder-approved outreach.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["luxury-client-qualification"] },

  { id:"realty-revenue", division:"REALTY", name:"Realty Revenue Agent", mission:"Prioritize verified real-estate opportunities and required founder decisions.", status:"DEPLOYED", founderGate:true, canWriteExternally:false, dependencies:["revenue-coordinator"] },
  { id:"realty-market-intelligence", division:"REALTY", name:"Realty Market Intelligence Agent", mission:"Identify markets, properties, sellers, and acquisition signals.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["realty-revenue"] },
  { id:"realty-underwriting", division:"REALTY", name:"Realty Underwriting Agent", mission:"Screen acquisitions using verified property, financing, rehab, rent, and exit evidence.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["realty-revenue"] },
  { id:"realty-lead-pipeline", division:"REALTY", name:"Realty Lead Pipeline Agent", mission:"Rank sellers, buyers, wholesalers, and referral opportunities.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["realty-market-intelligence"] },

  { id:"capital-revenue", division:"CAPITAL_ADVISORY", name:"Capital Advisory Revenue Agent", mission:"Prioritize verified funding opportunities while preserving founder approval gates.", status:"DEPLOYED", founderGate:true, canWriteExternally:false, dependencies:["revenue-coordinator"] },
  { id:"capital-fundability", division:"CAPITAL_ADVISORY", name:"Fundability Agent", mission:"Assess documented borrower/business readiness and identify missing evidence.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["capital-revenue"] },
  { id:"capital-lender-intelligence", division:"CAPITAL_ADVISORY", name:"Lender Intelligence Agent", mission:"Match verified funding profiles to appropriate lender criteria.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["capital-fundability"] },
  { id:"capital-deal-packaging", division:"CAPITAL_ADVISORY", name:"Capital Packaging Agent", mission:"Prepare evidence-backed funding packages for founder review.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["capital-fundability"] },

  { id:"prospect-intelligence", division:"GROWTH_ENGINE", name:"Prospect Intelligence Agent", mission:"Discover, verify, score, classify, and prioritize people and organizations across QLux pipelines.", status:"PARTIAL", founderGate:true, canWriteExternally:false, dependencies:["revenue-coordinator"] },
  { id:"relationship-intelligence", division:"GROWTH_ENGINE", name:"Relationship Intelligence Agent", mission:"Maintain enterprise relationship context and identify cross-division referral paths.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["prospect-intelligence"] },
  { id:"linkedin-growth", division:"GROWTH_ENGINE", name:"LinkedIn Growth Agent", mission:"Research targets, prepare founder-approved connection strategies, and learn from outcomes.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["prospect-intelligence"] },

  { id:"content-intelligence", division:"MARKETING", name:"Content Intelligence Agent", mission:"Convert market, client, and brand intelligence into approved content opportunities.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["prospect-intelligence"] },
  { id:"content-production", division:"MARKETING", name:"Content Production Agent", mission:"Draft launch-quality LinkedIn, newsletter, and marketing content for approval.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["content-intelligence"] },
  { id:"newsletter", division:"MARKETING", name:"Newsletter Agent", mission:"Assemble informative recurring market intelligence for the Quest Luxo audience.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["content-intelligence"] },

  { id:"website-product", division:"WEBSITE_PRODUCT", name:"Website Product Agent", mission:"Maintain the Quest Luxo product roadmap, defects, content surfaces, and launch readiness.", status:"PARTIAL", founderGate:true, canWriteExternally:false, dependencies:["command-orchestrator"] },
  { id:"lead-operations", division:"WEBSITE_PRODUCT", name:"Lead Operations Agent", mission:"Monitor lead capture, storage, notification, and operational readiness signals.", status:"PARTIAL", founderGate:true, canWriteExternally:false, dependencies:["website-product"] },

  { id:"enterprise-risk", division:"ENTERPRISE_OPERATIONS", name:"Enterprise Risk Agent", mission:"Identify evidence, compliance, security, and execution risks before external action.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["command-orchestrator"] },
  { id:"finance-operations", division:"ENTERPRISE_OPERATIONS", name:"Finance Operations Agent", mission:"Coordinate enterprise cash, obligations, capital allocation, and financial operating signals.", status:"SPECIFIED", founderGate:true, canWriteExternally:false, dependencies:["command-orchestrator"] },
  { id:"sop-operations", division:"ENTERPRISE_OPERATIONS", name:"SOP Operations Agent", mission:"Turn proven workflows into documented, repeatable agent procedures.", status:"SPECIFIED", founderGate:false, canWriteExternally:false, dependencies:["command-orchestrator"] },
]);

export function getAgent(id: string): AgentDefinition | undefined {
  return QLUX_AGENTIC_TEAM.find((agent) => agent.id === id);
}

export function getAgentsByDivision(division: AgentDivision): readonly AgentDefinition[] {
  return Object.freeze(QLUX_AGENTIC_TEAM.filter((agent) => agent.division === division));
}

export function getAgenticTeamStatus() {
  const counts = QLUX_AGENTIC_TEAM.reduce<Record<AgentStatus, number>>(
    (acc, agent) => { acc[agent.status] += 1; return acc; },
    { DEPLOYED:0, PARTIAL:0, SPECIFIED:0, NOT_STARTED:0 },
  );
  return Object.freeze({ total: QLUX_AGENTIC_TEAM.length, ...counts });
}
