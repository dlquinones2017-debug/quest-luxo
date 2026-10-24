import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {registerHooks} from "node:module";
import test from "node:test";
registerHooks({resolve(s,c,n){try{return n(s,c)}catch(e){if(!s.startsWith('.'))throw e;for(const suffix of ['.ts','/index.ts']){try{return n(s+suffix,c)}catch{}}throw e;}}});
const {collectionRegistry}=await import('../src/data/collectionRegistry.ts');
const {photographyExpansionImages,photographyExpansionAssets}=await import('../src/data/photography-expansion.ts');
const {approvedPhotograph}=await import('../src/lib/media/watchPhotography.ts');
test('reviewed cleared photographs resolve only for represented exact configurations',()=>{
  assert.equal(photographyExpansionImages.length,242);
  for(const photo of photographyExpansionImages){
    const asset=collectionRegistry.find(c=>c.brand===photo.brand&&c.name===photo.collection)?.assets.find(a=>a.reference===photo.reference);
    assert.ok(asset,photo.reference+' must have a catalog record');
    assert.equal(approvedPhotograph(asset,[photo])?.assetId,photo.assetId);
    assert.equal(approvedPhotograph({...asset,configurations:[{dial:photo.configuration.dial,bracelet:'Incorrect bracelet'}]},[photo]),undefined);
  }
  const tudor=photographyExpansionImages.find(p=>p.reference==='M7941A1A0RU-0003');
  assert.ok(tudor.configuration.bracelet.toLowerCase().includes('five-link'),'correct newly cleared five-link bracelet must resolve');
  assert.equal(photographyExpansionImages.some(p=>p.reference==='M7941A1A0RU-0003'&&p.configuration.bracelet.toLowerCase().includes('rubber')),false,'mislabeled rubber-strap photograph must stay held');
  assert.ok(tudor.sourceUrl.includes('drive.google.com'),'founder image provenance stays distinct from manufacturer specification source');
  assert.deepEqual(photographyExpansionImages.filter(p=>p.brand==='Franck Muller').map(p=>p.reference),['V 45 SC DT YACHT CR BL (BL)','V45','V 45 T BR (TT)','V 41 SC DT BEACH BU BL GF1','V 41 SC DT BEACH FR2 GFBUBL (BC)','V 41 SC DT BEACH FR2 GFVRVE (BC)','V 41 SC DT BEACH FR2 GFRGFRG (BC)','V 41 SC DT FR2 GFGRNR (NR)','8880CHACLB'],'only founder-cleared exact Franck Muller references may publish');
  const masterControl=collectionRegistry.find(c=>c.brand==='Jaeger-LeCoultre'&&c.name==='Master Control').assets.find(a=>a.reference==='Q4018421');
  assert.ok(masterControl.configurations.some(c=>c.bracelet==='Light-brown calfskin strap'),'retain the original documented strap');
  assert.equal(approvedPhotograph(masterControl,photographyExpansionImages).configuration.bracelet,'Black alligator leather strap');
  for(const asset of photographyExpansionAssets){assert.equal(asset.intelligence,undefined);assert.ok(asset.configurations.every(c=>c.originalMSRP===null&&c.currentMSRP===null));}
});
test('all approved derivatives match their recorded checksums',async()=>{
  for(const photo of photographyExpansionImages){
    const bytes=await readFile(new URL('../public'+photo.src,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256,photo.src);
  }
});
