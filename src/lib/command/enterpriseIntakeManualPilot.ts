import type { GmailMetadataReader, IntakePolicy } from "./enterpriseLeadIntakeAdapter.ts";
import { GMAIL_METADATA_SCOPE, readFormSubmitIntake } from "./enterpriseLeadIntakeAdapter.ts";
import { commitTrustedIntakeBatch, readEncryptedIntakeJournal } from "./enterpriseIntakeJournal.ts";

/**
 * Explicitly invoked, bounded *manual* collection pilot. No token creation,
 * scheduling, web route or default enablement. Caller must provide a reader
 * created from a separately authorized gmail.metadata credential.
 *
 * Only pre-approved FormSubmit submission mappings may be retained. If any
 * message is unmapped, rejected or conflicts with source evidence, hold its
 * entire page for human review rather than advancing a cursor that could
 * subsequently hide a genuine opportunity.
 */
export interface ApprovedIntakePilot {
  readonly manualPilotApproved: boolean;
  readonly reader: GmailMetadataReader;
  readonly policy: IntakePolicy;
  readonly journalDirectory: string;
  readonly encryptionKey: Buffer;
  readonly maxPages: number;
  readonly now?: Date;
}
export type PilotState =
  | "DISABLED" | "READ_ERROR" | "SOURCE_REVIEW_REQUIRED"
  | "PARTIAL" | "COMPLETE";
export interface IntakePilotResult {
  readonly state: PilotState;
  readonly processedPages: number;
  readonly receivedOnPages: number;
  readonly newlyRetained: number;
  readonly retainedTotal: number | null;
  readonly sourceMessagesHeld: number;
  readonly morePages: boolean;
  readonly founderApprovalRequired: true;
  readonly externalActionsTaken: false;
}
const report = (
  state: PilotState, processedPages: number, receivedOnPages: number,
  newlyRetained: number, retainedTotal: number | null, sourceMessagesHeld: number,
  morePages: boolean,
): IntakePilotResult => Object.freeze({
  state,processedPages,receivedOnPages,newlyRetained,retainedTotal,
  sourceMessagesHeld,morePages,
  founderApprovalRequired:true as const,
  externalActionsTaken:false as const,
});

export async function runApprovedFormSubmitPilot(input: ApprovedIntakePilot): Promise<IntakePilotResult> {
  if (!input.manualPilotApproved || !input.policy?.founderApproved ||
      input.policy.scopes?.length!==1 ||
      input.policy.scopes[0]!==GMAIL_METADATA_SCOPE ||
      !Array.isArray(input.policy.mappings) || !input.policy.mappings.length) {
    return report("DISABLED",0,0,0,null,0,false);
  }
  if (!Number.isSafeInteger(input.maxPages) || input.maxPages<1 || input.maxPages>5)
    throw new Error("Manual intake pilot may inspect only 1 to 5 approved metadata pages.");
  const now=input.now??new Date();
  if (!Number.isFinite(now.getTime()))
    throw new Error("Manual intake pilot requires a valid observation time.");

  let retained=await readEncryptedIntakeJournal(input.journalDirectory,input.encryptionKey,now);
  let pages=0;
  let examined=0;
  let newRetained=0;
  for(let i=0;i<input.maxPages;i++) {
    // The existing protected transport reads metadata only and fails closed
    // on incorrect mailbox identity, receiver authentication or bad mappings.
    const batch=await readFormSubmitIntake(input.reader,input.policy,retained.checkpoint,now);
    if(batch.status==="DISABLED")
      return report("DISABLED",pages,examined,newRetained,retained.retainedReceiptCount,0,false);
    if(batch.status==="READ_ERROR" || batch.counts.conflicts>0)
      return report("READ_ERROR",pages,examined,newRetained,retained.retainedReceiptCount,batch.counts.conflicts,true);

    const reviewCount=batch.counts.unmapped+batch.counts.rejected+batch.counts.retentionWarnings;
    // Deliberately conservative during a controlled pilot: do not throw away
    // unmapped/inauthentic/Trash history by moving past its page.
    if(reviewCount>0)
      return report("SOURCE_REVIEW_REQUIRED",pages,examined,newRetained,
        retained.retainedReceiptCount,reviewCount,true);
    // Commit the cursor with its verified opaque receipts in one encrypted
    // journal transaction. Failed journal writes must throw and NEVER
    // acknowledge or advance source progress.
    const prior=retained.retainedReceiptCount;
    retained=await commitTrustedIntakeBatch({
      directory:input.journalDirectory,key:input.encryptionKey,
      expectedRevision:retained.revision,batch,observedAt:now.toISOString(),
    },now);
    newRetained+=retained.retainedReceiptCount-prior;
    examined+=batch.counts.examined;
    pages++;
    if(batch.status==="COMPLETE")
      return report("COMPLETE",pages,examined,newRetained,retained.retainedReceiptCount,0,false);
  }
  return report("PARTIAL",pages,examined,newRetained,retained.retainedReceiptCount,0,true);
}
