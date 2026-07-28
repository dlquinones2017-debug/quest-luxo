import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  consumeLeadAttempt,
  hashClientAddress,
  MAX_LEAD_BODY_BYTES,
  resetLeadAttemptsForTests,
  verifyLeadRequestOrigin,
} from "../src/lib/leads/leadAbuseProtection.mjs";
import {
  createLeadPayload,
  validateLeadPayload,
} from "../src/lib/leads/leadCapture.mjs";
import {
  createLeadConfig,
  validateProductionLeadConfig,
} from "../src/lib/leads/leadConfig.mjs";
import {
  backupLeadFile,
  restoreLeadFile,
  verifyLeadFile,
} from "../src/lib/leads/leadStorageOperations.mjs";
import { processLeadSubmission } from "../src/lib/leads/leadSubmission.mjs";
import { verifyProductionReadiness } from "../src/lib/leads/productionReadiness.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("lead payloads are bounded, sanitized, and require contact plus intent", () => {
  const payload = createLeadPayload({
    name: "  Ada\u0000 Lovelace ",
    email: "ada@example.com",
    message: "Private sourcing request",
    source: "x".repeat(200),
  });

  assert.equal(payload.name, "Ada Lovelace");
  assert.equal(payload.source.length, 80);
  assert.deepEqual(validateLeadPayload(payload), {
    valid: true,
    issues: [],
  });

  assert.equal(
    validateLeadPayload(
      createLeadPayload({ name: "A", email: "invalid", message: "" })
    ).valid,
    false
  );
});

test("lead request controls enforce origin, keyed identifiers, and bounded rate", () => {
  resetLeadAttemptsForTests();
  const request = new Request("https://www.questluxo.com/api/leads/submit", {
    headers: {
      Origin: "https://www.questluxo.com",
      "Sec-Fetch-Site": "same-origin",
    },
  });
  assert.equal(
    verifyLeadRequestOrigin(request, "https://www.questluxo.com", true),
    true
  );
  assert.equal(
    verifyLeadRequestOrigin(
      new Request("https://www.questluxo.com/api/leads/submit", {
        headers: {
          Origin: "https://attacker.example",
          "Sec-Fetch-Site": "cross-site",
        },
      }),
      "https://www.questluxo.com",
      true
    ),
    false
  );
  assert.equal(MAX_LEAD_BODY_BYTES, 16 * 1024);

  const key = hashClientAddress("203.0.113.10", "a".repeat(32));
  assert.notEqual(key, "203.0.113.10");
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    assert.equal(consumeLeadAttempt(key, 1_000).allowed, true);
  }
  assert.equal(consumeLeadAttempt(key, 1_000).allowed, false);
});

test("lead processing persists before notification and survives delivery failure", async () => {
  const order = [];
  const originalError = console.error;
  console.error = () => undefined;
  try {
    const result = await processLeadSubmission(
      createLeadPayload({
        name: "Client Example",
        email: "client@example.com",
        message: "Seeking a Daytona",
      }),
      "hashed-client",
      {},
      {
        persist: async (record) => {
          order.push("persist");
          return { id: record.id };
        },
        notify: async () => {
          order.push("notify");
          throw new Error("provider unavailable");
        },
      }
    );

    assert.deepEqual(order, ["persist", "notify"]);
    assert.equal(result.success, true);
    assert.equal(result.delivery.delivered, false);
  } finally {
    console.error = originalError;
  }
});

test("production readiness fails closed and passes only with writable complete config", async () => {
  const incomplete = await verifyProductionReadiness(
    {},
    { verifyWritable: async () => false }
  );
  assert.equal(incomplete.healthy, false);
  assert.ok(incomplete.issues.includes("LEAD_STORAGE_WRITABLE"));

  const env = {
    NODE_ENV: "production",
    SITE_URL: "https://www.questluxo.com",
    LEAD_STORAGE_DIRECTORY: join(tmpdir(), "quest-luxo-leads"),
    EMAIL_PROVIDER_API_KEY: "secret",
    LEAD_EMAIL_FROM: "Quest Luxo <inquiries@questluxo.com>",
    LEAD_EMAIL_TO: "contact@questluxo.com",
    LEAD_ABUSE_HASH_SECRET: "a".repeat(32),
  };
  const config = createLeadConfig(env);
  assert.deepEqual(validateProductionLeadConfig(config), {
    healthy: true,
    issues: [],
  });
  const ready = await verifyProductionReadiness(env, {
    verifyWritable: async () => true,
  });
  assert.equal(ready.healthy, true);
});

test("lead backup and restore validate durable records", async (t) => {
  const directory = await mkdtemp(join(tmpdir(), "quest-luxo-leads-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = join(directory, "leads.jsonl");
  const backupDirectory = join(directory, "backups");
  const record = {
    id: "lead_test",
    createdAt: "2026-07-28T12:00:00.000Z",
    email: "client@example.com",
  };
  await writeFile(source, `${JSON.stringify(record)}\n`, "utf8");

  assert.deepEqual(await verifyLeadFile(source), {
    records: 1,
    bytes: (await readFile(source, "utf8")).length,
  });
  const backup = await backupLeadFile(source, backupDirectory);
  await writeFile(
    source,
    `${JSON.stringify({ ...record, id: "lead_new" })}\n`,
    "utf8"
  );
  const restored = await restoreLeadFile(backup.target, source);
  assert.equal(restored.verification.records, 1);
  assert.match(await readFile(source, "utf8"), /lead_test/);
});

test("launch surfaces, legal notice, assets, deployment, and dev exclusion are governed", async () => {
  const [
    baseLayout,
    contact,
    privacy,
    terms,
    transactionStandards,
    registry,
    referenceCard,
    renderBlueprint,
    placeholder,
  ] = await Promise.all([
    readFile(join(root, "src/layouts/BaseLayout.astro"), "utf8"),
    readFile(join(root, "src/pages/contact.astro"), "utf8"),
    readFile(join(root, "src/pages/privacy.astro"), "utf8"),
    readFile(join(root, "src/pages/terms.astro"), "utf8"),
    readFile(join(root, "src/pages/transaction-standards.astro"), "utf8"),
    readFile(join(root, "src/data/collectionRegistry.ts"), "utf8"),
    readFile(join(root, "src/components/ReferenceCard.astro"), "utf8"),
    readFile(join(root, "render.yaml"), "utf8"),
    readFile(
      join(root, "public/images/watch-reference-placeholder.svg"),
      "utf8"
    ),
  ]);

  assert.match(baseLayout, /<Footer \/>/);
  assert.match(contact, /href="\/privacy"/);
  assert.match(contact, /href="\/terms"/);
  assert.match(contact, /data-lead-form/);
  assert.match(privacy, /up to 24 months/);
  assert.match(terms, /A website inquiry does not create/);
  assert.match(transactionStandards, /Client decision authority/);
  assert.match(registry, /watch-reference-placeholder\.svg/);
  assert.match(referenceCard, /width="960"/);
  assert.match(referenceCard, /height="960"/);
  assert.match(placeholder, /width="960" height="960"/);
  assert.match(renderBlueprint, /healthCheckPath: \/api\/health/);
  assert.match(renderBlueprint, /mountPath: \/var\/data\/quest-luxo/);
  assert.match(renderBlueprint, /LEAD_ABUSE_HASH_SECRET/);

  await assert.rejects(
    readFile(join(root, "src/pages/dev/ask-quest-luxo.astro"), "utf8"),
    { code: "ENOENT" }
  );

  const assetFiles = [
    "rolex-datejust.ts",
    "rolex-day-date.ts",
    "rolex-daytona.ts",
    "rolex-gmt-master-ii.ts",
    "rolex-sky-dweller.ts",
    "rolex-submariner.ts",
    "rolex-yacht-master.ts",
  ];
  for (const file of assetFiles) {
    const source = await readFile(join(root, "src/data/assets", file), "utf8");
    assert.doesNotMatch(source, /\/images\/rolex\//, file);
  }
});
