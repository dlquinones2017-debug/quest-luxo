import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { commitDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";
import { buildManualPipelineReport } from "./manual-pipeline-agent-report.mjs";
import { readDurablePipelines } from "../src/lib/command/enterpriseDurablePipelines.ts";

// Fully synthetic, isolated demo; no production credentials or integration.
const directory = await mkdtemp(join(tmpdir(), "quest-agent-demo-"));
const key = randomBytes(32);
try {
  const timestamp = new Date().toISOString();
  const records = {
    capital: [{ borrowerId:"demo-capital-001", stage:"QUALIFY", status:"BLOCKED",
      reason:"Synthetic test only", updatedAt:timestamp, evidenceIds:["demo-proof-001"], evidenceState:"UNKNOWN" }],
    realty: [{ leadId:"demo-realty-001", stage:"REVIEW", status:"REQUIRES_FOUNDER",
      reason:"Synthetic test only", updatedAt:timestamp, evidenceIds:["demo-proof-002"], evidenceState:"REQUIRES_VERIFICATION" }],
  };
  await commitDurablePipelines(directory,key,"EMPTY",records);
  const recovered = await readDurablePipelines(directory,key);
  if (recovered.revision === "EMPTY" || recovered.sequence !== 1) throw Error("Demo persistence recovery failed.");
  console.log(JSON.stringify({source:"SYNTHETIC_DEMO_ONLY",...buildManualPipelineReport(recovered)},null,2));
} finally {
  await rm(directory,{recursive:true,force:true});
  key.fill(0);
}
