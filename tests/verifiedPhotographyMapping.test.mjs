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

test("catalog photography excludes rejected wrist shots and nonwhite presentation", () => {
  const rejected = watchPhotographs.find(photo => photo.reference === "15202ST" && photo.websiteApproved === false);
  assert.ok(rejected, "the rejected wrist-shot fixture must remain available");
  const ap = { brand: rejected.brand, collection: rejected.collection, reference: rejected.reference,
    material: rejected.configuration.material, configurations: [rejected.configuration] };
  assert.equal(approvedPhotograph(ap, [rejected]), undefined);
  assert.equal(rejected.websiteApproved, false);
  const approved = watchPhotographs.find(photo => photo.reference === "124060");
  const submariner = asset("124060", approved.configuration);
  for (const background of ["source-context", "black-studio", "mirrored-acrylic"]) {
    assert.equal(approvedPhotograph(submariner, [{ ...approved, background }]), undefined);
  }
  assert.ok(approvedPhotograph(submariner, [approved]));
});

test("Nautilus family page maps only the disclosed blue steel 5711/1A-010 photograph", () => {
  const nautilus = { brand: "Patek Philippe", collection: "Nautilus", reference: "5711/1A",
    material: "Stainless Steel", configurations: [{ dial: "Blue", bracelet: "Integrated Bracelet" }] };
  const photograph = approvedPhotograph(nautilus, watchPhotographs);
  assert.ok(photograph);
  assert.match(photograph.alt, /5711\/1A-010/);
  assert.match(photograph.licenseRecord, /CC BY-SA 4.0/);
  assert.equal(approvedPhotograph({ ...nautilus, configurations: [{ dial: "White", bracelet: "Integrated Bracelet" }] }, watchPhotographs), undefined);
  assert.equal(approvedPhotograph({ ...nautilus, material: "White Gold" }, watchPhotographs), undefined);
});

// Opaque provider identifiers are not unresolved-placeholder words.
test("placeholder detection accepts provider IDs and still rejects unresolved metadata", () => {
  const photo = watchPhotographs.find(p => p.assetId === "cleared-sprint-1qp2YT0t03NpSuHc4ygU0nW54TBdy6tA1");
  assert.ok(photo);
  const candidate = {brand:photo.brand,collection:photo.collection,reference:photo.reference,material:photo.configuration.material,configurations:[photo.configuration]};
  assert.ok(approvedPhotograph(candidate,[photo]));
  for (const photographer of ["Unknown", "TBD", "Pending", "Requires verification"]) {
    assert.equal(approvedPhotograph(candidate,[{...photo,photographer}]),undefined);
  }
  assert.equal(approvedPhotograph({...candidate,material:"Incorrect metal"},[photo]),undefined);
});
