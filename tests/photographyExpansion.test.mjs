import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFile} from "node:fs/promises";
import {registerHooks} from "node:module";
import test from "node:test";
registerHooks({resolve(s,c,n){try{return n(s,c)}catch(e){if(!s.startsWith('.'))throw e;for(const suffix of ['.ts','/index.ts']){try{return n(s+suffix,c)}catch{}}throw e;}}});
const {collectionRegistry}=await import('../src/data/collectionRegistry.ts');
const {photographyExpansionImages,photographyExpansionAssets}=await import('../src/data/photography-expansion.ts');
const {approvedPhotograph}=await import('../src/lib/media/watchPhotography.ts');
test('reviewed manufacturer photographs resolve only for represented exact configurations',()=>{
  assert.equal(photographyExpansionImages.length,30);
  for(const photo of photographyExpansionImages){
    const asset=collectionRegistry.find(c=>c.brand===photo.brand&&c.name===photo.collection)?.assets.find(a=>a.reference===photo.reference);
    assert.ok(asset,photo.reference+' must have a catalog record');
    assert.equal(approvedPhotograph(asset,[photo])?.assetId,photo.assetId);
    assert.equal(approvedPhotograph({...asset,configurations:[{dial:photo.configuration.dial,bracelet:'Incorrect bracelet'}]},[photo]),undefined);
  }
  assert.equal(photographyExpansionImages.some(p=>p.reference==='M7941A1A0RU-0003'),false,'mislabeled rubber-strap photograph must stay held');
  assert.equal(photographyExpansionImages.some(p=>p.brand==='Franck Muller'),false,'generic variant photographs must stay held');
  for(const asset of photographyExpansionAssets){assert.equal(asset.intelligence,undefined);assert.ok(asset.configurations.every(c=>c.originalMSRP===null&&c.currentMSRP===null));}
});
test('all approved derivatives match their recorded checksums',async()=>{
  for(const photo of photographyExpansionImages){
    const bytes=await readFile(new URL('../public'+photo.src,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256,photo.src);
  }
});
