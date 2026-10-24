import { readSync } from 'node:fs';
import { exportCRMPreparationBackup, restoreCRMPreparationBackup } from '../src/lib/command/enterprisePipelineBackup.ts';
// Explicit operator command only. No scheduler, connector, key persistence or business activation.
let key;
const input=Buffer.alloc(66);
try {
  const [action,backup,directory]=process.argv.slice(2);
  if(process.argv.length!==5 || !['export','restore'].includes(action))throw Error();
  let length=0;
  while(length<input.length){const n=readSync(0,input,length,input.length-length,null);if(!n)break;length+=n;}
  if(length!==64 && length!==65 || length===65 && input[64]!==10)throw Error();
  const hex=input.subarray(0,64).toString('ascii');if(!/^[a-f0-9]{64}$/.test(hex))throw Error();
  key=Buffer.from(hex,'hex');input.fill(0);
  const result=action==='export'?await exportCRMPreparationBackup(directory,backup,key):await restoreCRMPreparationBackup(backup,directory,key);
  console.log(JSON.stringify({...result,scope:'INTERNAL_PREPARATION_ONLY',writesCRM:false,advancesCRMCheckpoint:false,businessDataExecutionAllowed:false}));
}catch{console.error('Preparation backup held; verify explicit action, private existing paths, key stdin and authenticated archive.');process.exitCode=1;}
finally{input.fill(0);key?.fill(0);}
