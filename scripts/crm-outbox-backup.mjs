import { readSync } from 'node:fs';
import { exportCRMDeliveryOutboxBackup,restoreCRMDeliveryOutboxBackup } from '../src/lib/command/crmDeliveryOutboxBackup.ts';
let key;const input=Buffer.alloc(66);
try {
 const [action,archive,directory]=process.argv.slice(2);
 if(process.argv.length!==5 || !['export','restore'].includes(action))throw Error();
 let count=0;while(count<input.length){const n=readSync(0,input,count,input.length-count,null);if(!n)break;count+=n;}
 if(!(count===64 || count===65&&input[64]===10) || ![...input.subarray(0,64)].every(c=>c>=48&&c<=57||c>=97&&c<=102))throw Error();
 key=Buffer.from(input.subarray(0,64).toString('ascii'),'hex');input.fill(0);
 const result=action==='export'?await exportCRMDeliveryOutboxBackup(directory,archive,key):await restoreCRMDeliveryOutboxBackup(archive,directory,key);
 console.log(JSON.stringify({...result,scope:'INTERNAL_DELIVERY_METADATA_ONLY',writesCRM:false,businessDataExecutionAllowed:false,providerAcknowledgementIndependentlyVerified:false,independentRetentionVerified:false}));
}catch{console.error('Outbox backup held; verify explicit action, private existing paths, complete recovery pair and authenticated archive.');process.exitCode=1;}
finally{input.fill(0);key?.fill(0);}
