import { readFile, mkdir, writeFile, rm, rename, mkdtemp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, resolve } from "node:path";
import { QLUX_AGENTIC_TEAM } from "./qluxAgenticTeam.ts";
import { createHash } from "node:crypto";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const blueprint = "docs/ENTERPRISE_AGENTIC_OPERATING_BLUEPRINT_2026-10-19.md";
const slug = (name: string) => name.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export type FactoryRole = { readonly id: string; readonly name: string; readonly status: "EXISTING_CAPABILITY" | "PROPOSED" };

/** Reuse the existing 26-role registry and the 31 proposed titles in PR #68, without activating them. */
export async function loadFactoryRoster(): Promise<readonly FactoryRole[]> {
  const doc = await readFile(join(root, blueprint), "utf8");
  if (createHash("sha256").update(doc).digest("hex") !== "fba35586c6ac58008ba9e52ad73c12e35cb6226cb8001125026a113baa31fefe")
    throw Error("Pinned PR #68 blueprint integrity failure; review architecture changes explicitly.");
  const proposed = doc.split("## Proposed additional named agents and responsibilities")[1]?.split("## Enterprise cohesion")[0];
  if (!proposed) throw Error("Source blueprint unavailable.");
  const titles: string[] = [];
  for (const line of proposed.split("\n")) {
    const cells = line.split("|").map(c => c.trim());
    if (/^\| (SHARED_OPERATIONS|SHARED_FINANCE|MARKETING|LUXURY_ADVISORY|REALTY|CAPITAL_ADVISORY) \|/.test(line)) titles.push(cells[2]!);
    else if (/^\| \*\*/.test(line)) titles.push(cells[1]!.replaceAll("**", ""));
  }
  const roles: FactoryRole[] = [
    ...QLUX_AGENTIC_TEAM.map(role => ({ id: role.id, name: role.name, status: "EXISTING_CAPABILITY" as const })),
    ...titles.map(name => ({ id: slug(name), name, status: "PROPOSED" as const })),
  ];
  if (roles.length !== 57 || new Set(roles.map(r => r.id)).size !== 57) throw Error("57-role source roster integrity failure.");
  return Object.freeze(roles.map(r => Object.freeze(r)));
}

export interface FactorySpec {
  version: 1;
  id: string;
  roleId: string;
  owner: string;
  outcomes: readonly string[];
  inputs: readonly ["synthetic-pipeline-fixture"];
  authorizedTools: readonly ["pipeline.aggregate-report"];
  permissions: { mode: "SYNTHETIC_READ_ONLY"; externalWrites: false; gmail: false; crm: false; production: false };
  evidence: { approvalRef: string; architectureRef: "PR68@a13f374b085b29127f86f29a43b79ee9b71bfbae" };
  outputSchema: "manual-pipeline-report-v1";
  errorPolicy: "HOLD";
  evaluation: { capitalTotal: number; capitalBlocked: number; realtyTotal: number; realtyFounderReview: number };
}
const text = (s: unknown) => typeof s === "string" && s.trim().length > 0 && s.length <= 300 && !/[\x00-\x1f]/.test(s);
function exact(value: object, fields: readonly string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(k => !fields.includes(k)) || fields.some(k => !(k in value)))
    throw Error("Unexpected or missing specification field.");
}
export async function validateFactorySpec(input: unknown): Promise<FactorySpec> {
  if (!input || typeof input !== "object") throw Error("Agent specification required.");
  const spec = input as FactorySpec;
  exact(spec, ["version", "id", "roleId", "owner", "outcomes", "inputs", "authorizedTools", "permissions", "evidence", "outputSchema", "errorPolicy", "evaluation"]);
  if (spec.version !== 1 || typeof spec.id !== "string" || !/^[a-z][a-z0-9-]{2,63}$/.test(spec.id) || !text(spec.owner) ||
      !Array.isArray(spec.outcomes) || spec.outcomes.length < 1 || spec.outcomes.length > 10 || !spec.outcomes.every(text) ||
      JSON.stringify(spec.inputs) !== '["synthetic-pipeline-fixture"]' || JSON.stringify(spec.authorizedTools) !== '["pipeline.aggregate-report"]' ||
      spec.outputSchema !== "manual-pipeline-report-v1" || spec.errorPolicy !== "HOLD") throw Error("Unsupported agent specification.");
  const roles = await loadFactoryRoster();
  if (!roles.some(r => r.id === spec.roleId)) throw Error("Unregistered role; hold for architecture review.");
  const supported = ["lead-operations", "reliability-qa-and-incident-response-agent", "founder-chief-of-staff-and-approval-agent"];
  if (!supported.includes(spec.roleId)) throw Error("No validated template for this role; hold for implementation review.");
  exact(spec.permissions, ["mode", "externalWrites", "gmail", "crm", "production"]);
  if (spec.permissions.mode !== "SYNTHETIC_READ_ONLY" || [spec.permissions.externalWrites, spec.permissions.gmail, spec.permissions.crm, spec.permissions.production].some(v => v !== false))
    throw Error("Factory cannot grant runtime permissions.");
  exact(spec.evidence, ["approvalRef", "architectureRef"]);
  if (!text(spec.evidence.approvalRef) || spec.evidence.architectureRef !== "PR68@a13f374b085b29127f86f29a43b79ee9b71bfbae") throw Error("Approval and architecture provenance required.");
  exact(spec.evaluation, ["capitalTotal", "capitalBlocked", "realtyTotal", "realtyFounderReview"]);
  // Fixed reviewed fixture: meaningful expectations cannot be generated from an agent's own result.
  if (JSON.stringify(spec.evaluation) !== JSON.stringify({ capitalTotal: 1, capitalBlocked: 1, realtyTotal: 1, realtyFounderReview: 1 }))
    throw Error("Reviewed evaluation fixture required.");
  return structuredClone(spec);
}

/** Creates reviewable source only. No subprocess, network, credentials, PR merge, or deploy capability. */
export async function generateAgentPackage(input: unknown) {
  const started = performance.now();
  const spec = await validateFactorySpec(input);
  const parent = join(root, "agent-packages");
  await mkdir(parent, { recursive: true });
  const target = join(parent, spec.id);
  // The parent is a repository-controlled source directory, never caller-selected.
  const { lstat, realpath } = await import("node:fs/promises");
  if ((await lstat(parent)).isSymbolicLink() || await realpath(parent) !== resolve(parent)) throw Error("Unsafe package directory.");
  const staging = await mkdtemp(join(parent, ".factory-"));
  const config = JSON.stringify(spec, null, 2) + "\n";
  const runner = `import { readFile } from "node:fs/promises";\nimport { runFactoryAgent } from "../../scripts/factory-agent-runtime.mjs";\nconst spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));\nconsole.log(JSON.stringify(await runFactoryAgent(spec), null, 2));\n`;
  const tests = `import test from "node:test";\nimport assert from "node:assert/strict";\nimport { readFile } from "node:fs/promises";\nimport { runFactoryAgent } from "../../scripts/factory-agent-runtime.mjs";\nconst spec = JSON.parse(await readFile(new URL("./agent.json", import.meta.url), "utf8"));\ntest("generated operational agent retains read-only boundaries and reviewed fixture counts", async () => {\n  const result = await runFactoryAgent(spec);\n  assert.equal(result.source, "SYNTHETIC_FIXTURE_ONLY");\n  assert.deepEqual(result.report.divisions.map(r => [r.total, r.blocked, r.founderReview]), [[1,1,0],[1,0,1]]);\n  assert.equal(result.report.sendsMessages, false);\n  assert.equal(result.report.writesCRM, false);\n  assert.equal(result.report.activatesGmail, false);\n});\n`;
  const runbook = `# Generated operations report\n\nStatus: SYNTHETIC PACKAGE ONLY. Not deployed or authorized for business data.\n\nRole: ${spec.roleId}. Owner and approval provenance: see agent.json.\n\nRun from repository root: node agent-packages/${spec.id}/run.mjs\n\nValidate: node --test agent-packages/${spec.id}/agent.test.mjs\n\nThe runner reuses the existing encrypted pipeline and report implementation with fixed synthetic fixtures. No credentials, live source adapters, Gmail, CRM, network, scheduler or production writes. Unknown permissions or unsupported roles fail closed.\n\nRelease requires reviewed data authorization, independent encrypted retention and recovery, observability and separate deployment approval. Creating a spec cannot grant access.\n`;
  try {
    for (const [name, content] of [["agent.json", config], ["run.mjs", runner], ["agent.test.mjs", tests], ["RUNBOOK.md", runbook]])
      await writeFile(join(staging, name!), content!, { flag: "wx" });
    // mkdir is an exclusive reservation; concurrent generators cannot replace an existing package.
    await mkdir(target);
    try { for (const name of ["agent.json", "run.mjs", "agent.test.mjs", "RUNBOOK.md"]) await rename(join(staging, name), join(target, name)); }
    catch (error) { await rm(target, { recursive: true, force: true }); throw error; }
  } finally { await rm(staging, { recursive: true, force: true }); }
  return { packagePath: `agent-packages/${spec.id}`, filesGenerated: 4, elapsedMs: Math.round(performance.now() - started),
    status: "SYNTHETIC_PACKAGE_ONLY", deployed: false, externalWrites: false } as const;
}
