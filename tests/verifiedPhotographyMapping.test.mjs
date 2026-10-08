import assert from "node:assert/strict";
import test from "node:test";
import { approvedPhotograph } from "../src/lib/media/watchPhotography.ts";
import { watchPhotographs } from "../src/data/watch-photography.ts";

const reviewedAt = new Date("2026-10-08T00:00:00.000Z");

function asset(reference, configuration) {
  return {
    brand: reference === "WSSA0018" ? "Cartier" : reference === "AB0138211B1A1" ? "Breitling" : "Rolex",
    collection: reference === "WSSA0018" ? "Santos de Cartier" : reference === "AB0138211B1A1" ? "Navitimer" : "Submariner",
    reference,
    material: configuration.material,
    configurations: [configuration],
  };
}

test("approved exact-reference WEB derivatives resolve only for their verified catalog configuration", () => {
  const cases = [
    ["124060", { dial: "Black", bracelet: "Oyster", material: "Oystersteel" }],
    ["WSSA0018", { dial: "Silvered Opaline", bracelet: "Steel SmartLink Bracelet and Calfskin Strap", material: "Stainless Steel" }],
    ["AB0138211B1A1", { dial: "Black", bracelet: "Stainless Steel Navitimer Bracelet", material: "Stainless Steel" }],
  ];

  for (const [reference, configuration] of cases) {
    const photograph = approvedPhotograph(asset(reference, configuration), watchPhotographs, reviewedAt);
    assert.ok(photograph, `${reference} must resolve its verified photograph`);
    assert.equal(photograph.reference, reference);
    assert.equal(photograph.exactConfigurationVerified, true);
    assert.equal(photograph.collectionOnly, undefined);
  }
});

test("missing or collection-only photography remains in the placeholder path", () => {
  const rolexDaytona = asset("126500LN", { dial: "White", bracelet: "Oyster", material: "Oystersteel" });
  assert.equal(approvedPhotograph(rolexDaytona, watchPhotographs, reviewedAt), undefined);

  const santos = asset("WSSA0018", { dial: "Silvered Opaline", bracelet: "Steel SmartLink Bracelet and Calfskin Strap", material: "Stainless Steel" });
  const collectionOnlySantos = watchPhotographs.filter((photograph) => photograph.assetId === "cartier-santos-collection-hero-cc-by-sa-4");
  assert.equal(approvedPhotograph(santos, collectionOnlySantos, reviewedAt), undefined);
});
