import { readFile } from "node:fs/promises";
import { runFactoryAgent } from "./factory-agent-runtime.mjs";

const specs = ["operations-pilot", "reliability-pilot", "founder-brief-pilot"];
const expectedActions = '["KEY_RECOVERY","RETENTION_POLICY","SOURCE_SCOPE"]';

/** Bounded synthetic evaluation inside the existing worker. No external adapters or dispatch. */
export async function validateSyntheticAgentTeam() {
  const results = [];
  for (const name of specs) {
    const spec = JSON.parse(await readFile(new URL(`../config/agents/${name}.spec.json`, import.meta.url), "utf8"));
    const { source, report } = await runFactoryAgent(spec);
    if (source !== "SYNTHETIC_FIXTURE_ONLY" || report.sendsMessages !== false || report.writesCRM !== false || report.activatesGmail !== false)
      throw Error("Agent-team permission boundary failed.");
    if (spec.version === 2 && (report.status !== "HOLD" || report.businessDataExecutionAllowed !== false ||
        JSON.stringify(report.requiredActions) !== expectedActions)) throw Error("Agent-team readiness fixture failed.");
    if (spec.version === 1 || spec.template === "founder-brief") {
      if (JSON.stringify(report.divisions.map(r => [r.total, r.blocked, r.founderReview])) !== "[[1,1,0],[1,0,1]]")
        throw Error("Agent-team aggregate fixture failed.");
    }
    if (spec.template === "founder-brief" && report.dispatchesWork !== false) throw Error("Founder brief cannot dispatch work.");
    results.push({ roleId: spec.roleId, template: spec.template ?? "operations", status: report.status ?? "SYNTHETIC_REPORT_PASSED" });
  }
  return { source: "SYNTHETIC_FIXTURE_ONLY", validatedTemplates: results.length, agents: results,
    businessDataReady: false, dispatchesWork: false };
}
