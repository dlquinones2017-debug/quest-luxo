import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { registerHooks } from 'node:module';
const root=path.resolve(fileURLToPath(new URL('..',import.meta.url)));
registerHooks({resolve(specifier,ctx,next){try{return next(specifier,ctx);}catch(e){if(!specifier.startsWith('.'))throw e;for(const suffix of ['.ts','/index.ts']){try{return next(specifier+suffix,ctx);}catch{}}throw e;}}});
const {normalizeReferenceSlug}=await import('../src/lib/factory/referenceGenerator.ts');
const {brands}=await import('../src/data/brands.ts');
const {watchPhotographs}=await import('../src/data/watch-photography.ts');
const {approvedPhotograph}=await import('../src/lib/media/watchPhotography.ts');
const {factoryRegistry}=await import('../src/lib/factory/factoryRegistry.ts');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const records=new Map();
function visit(value,source,seen=new Set()){
 if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);
 if(typeof value.reference==='string'&&typeof value.model==='string'){
  const key=JSON.stringify([value.brand??'Unknown',value.collection??'Unknown',value.reference,value.configurations??[],value.material??'Unknown']);
  const row=records.get(key)??{asset:value,sources:[]};if(!row.sources.includes(source))row.sources.push(source);records.set(key,row);
 }
 for(const v of Object.values(value))visit(v,source,seen);
}
for(const file of walk(path.join(root,'src/data')).filter(f=>f.endsWith('.ts'))){const module=await import(pathToFileURL(file));visit(module,path.relative(root,file).replaceAll('\\','/'));}
const builtRoot=path.join(root,'dist/client/collections');
if(!fs.existsSync(builtRoot))throw Error('Run npm run build first: built collection pages are required for route coverage.');
const routes=walk(builtRoot).filter(f=>f.endsWith('.html')).map(f=>'/collections/'+path.relative(builtRoot,f).replaceAll('\\','/').replace(/\/index\.html$/,'').replace(/\.html$/,''));
const references=[...records.values()].map(({asset:a,sources})=>{
 const brand=brands.find(b=>b.name===a.brand);const slug=normalizeReferenceSlug(a.reference);
 const matchingRoutes=routes.filter(r=>r.split('/').length===5 && r.endsWith('/'+slug) && (!brand||r.startsWith('/collections/'+brand.slug+'/')));
 const photo=approvedPhotograph(a,watchPhotographs);
 return {brand:a.brand??'Unknown',collection:a.collection??'Unknown',reference:a.reference,configurations:a.configurations??[],material:a.material??'Unknown',sources,routes:matchingRoutes,scope:matchingRoutes.length?'built-reference':'source-only-requires-review',existingImage:a.image??null,existingImageFilePresent:a.image?.startsWith('/')?fs.existsSync(path.join(root,'public',a.image)):false,photoAssetId:photo?.assetId??null,status:photo?'approved':'Requires Verification',sourceUrl:photo?.sourceUrl??a.brokerageIntelligence?.evidenceSources?.[0]?.url??null,licenseRecord:photo?.licenseRecord??null,websiteApproved:!!photo,nextAction:'Match full reference, dial, material, strap/bracelet and generation; obtain authentic white-background or mirrored-acrylic hero with commercial website rights in the Digital Asset Library.'};
});
const collections=routes.filter(r=>r.split('/').length===4).map(route=>({route,heroAssetId:null,status:'Requires Verification',referenceRoutes:routes.filter(r=>r.startsWith(route+'/')),nextAction:'Select one exact-reference hero from approved reference photography; label the depicted configuration.'}));
const represented=new Set(references.flatMap(r=>r.routes));
const unmatchedReferenceRoutes=routes.filter(r=>r.split('/').length===5&&!represented.has(r));
const report={reviewedAt:new Date().toISOString(),note:'Generated from all exported source datasets and built routes. Source-only and duplicate configuration records are retained for review; this register is not proof of image rights. Source URLs identify research leads, not licenses.',summary:{sourceConfigurations:references.length,builtReferenceRoutes:represented.size,collectionRoutes:collections.length,approvedReferenceConfigurations:references.filter(r=>r.websiteApproved).length,unmatchedReferenceRoutes:unmatchedReferenceRoutes.length},collections,references,unmatchedReferenceRoutes,factoryCoverage:factoryRegistry.map(e=>({brand:e.name,collections:e.collectionCount,references:e.referenceCount}))};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'docs/WATCH_IMAGE_COVERAGE.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary,null,2));
if(process.argv.includes('--require-complete')&&(references.some(r=>r.routes.length&&!r.websiteApproved)||collections.some(c=>!c.heroAssetId)||unmatchedReferenceRoutes.length))process.exitCode=1;
