import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";

const script = fileURLToPath(new URL("../scripts/audit-expansion-photography.mjs", import.meta.url));
const cwd = fileURLToPath(new URL("../", import.meta.url));
const run = promisify(execFile);

test("all multi-brand expansion reference photo gaps are audited with checksum verification", async () => {
  const source = await readFile(new URL("../src/data/verified-catalog-expansion.ts", import.meta.url), "utf8");
  assert.match(source, /verifiedExpansionRows/);
  const audit = await readFile(new URL("../scripts/audit-expansion-photography.mjs", import.meta.url), "utf8");
  assert.match(audit, /approvedPhotograph\(asset, watchPhotographs\)/);
  assert.match(audit, /createHash\("sha256"\)/);
  assert.match(audit, /CHECKSUM_MISMATCH/);
  assert.match(audit, /APPROVED_FILE_MISSING/);
  assert.match(audit, /ACQUISITION_REQUIRED/);

  const result = await run(process.execPath, ["--experimental-strip-types", script], {cwd});
  const report = JSON.parse(result.stdout);
  assert.equal(report.summary.expansionReferences, 99);
  assert.ok(report.summary.brands >= 12);
  assert.equal(report.summary.expansionReferences,
    report.summary.approvedValidReferences + report.summary.acquisitionRequired +
    report.summary.missingApprovedDerivative + report.summary.checksumFailures);
  assert.equal(report.byBrand.reduce((sum, item) => sum+item.references, 0), 99);
  assert.ok(report.byBrand.some(x=>x.brand==="Omega" && x.references===55));
  assert.equal(report.summary.missingApprovedDerivative, 0, "any approved file missing is an integrity blocker");
  assert.equal(report.summary.checksumFailures, 0, "any checksum mismatch is an integrity blocker");
});

test("Omega-only audit and all-brand audit agree on verified image coverage", async () => {
  const [global, omega] = await Promise.all([
    run(process.execPath, ["--experimental-strip-types", script, "--brand=omega"], {cwd}),
    run(process.execPath, ["--experimental-strip-types", fileURLToPath(new URL("../scripts/audit-omega-photography.mjs", import.meta.url))], {cwd})
  ]);
  const broad = JSON.parse(global.stdout);
  const specific = JSON.parse(omega.stdout);
  assert.equal(broad.summary.expansionReferences, 55);
  assert.equal(broad.summary.approvedValidReferences, specific.approvedWithLocalDerivative);
  assert.equal(broad.summary.acquisitionRequired, specific.outstandingImageAcquisitions);
});

test("strict multi-brand readiness cannot report complete while unphotographed references remain", async () => {
  const result = await run(process.execPath, ["--experimental-strip-types", script], {cwd});
  const report = JSON.parse(result.stdout);
  if (report.summary.notReleaseReady) {
    await assert.rejects(
      () => run(process.execPath, ["--experimental-strip-types", script, "--require-complete"], {cwd}),
      e => e.code === 1,
      "strict audit must exit 1 unless all references are approved with correct checksums"
    );
  } else {
    const cleared = await run(process.execPath, ["--experimental-strip-types", script, "--require-complete"], {cwd});
    assert.match(cleared.stdout, /"notReleaseReady": 0/);
  }
});
