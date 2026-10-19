import { createHash } from "node:crypto";
import type { EnterpriseLeadReceipt, LeadDivision } from "./enterpriseLeadIntelligence.ts";
import type { LeadSubmissionRecord } from "../leads/leadStorageTypes.ts";

export const GMAIL_METADATA_SCOPE = "https://www.googleapis.com/auth/gmail.metadata";
const mailbox = "denzel@questluxo.com";
const digest = (s: string) => createHash("sha256").update(s).digest("hex");
const opaque = /^[A-Za-z0-9._:-]{1,160}$/;
export const gmailReceiptKey = (id: string) => `gmail:${digest(`${mailbox}:${id}`)}`;

export interface GmailMetadata {
  readonly id: string;
  readonly internalDate: string;
  readonly labelIds?: readonly string[];
  readonly payload: { readonly headers: readonly { readonly name: string; readonly value: string }[] };
}
export interface GmailMetadataReader {
  profile(): Promise<{ emailAddress: string }>;
  list(pageToken?: string): Promise<{ messages?: readonly { id: string }[]; nextPageToken?: string }>;
  get(id: string): Promise<GmailMetadata>;
}
// Authenticated provider receipt != authenticated form attribution. Mappings are
// internal reviewed attestations, never values parsed from email/form content.
export interface ApprovedFormMapping {
  readonly receiptKey: string;
  readonly messageIdSha256: string;
  readonly division: Exclude<LeadDivision, "WATCH_BROKERAGE">;
  readonly approvalEvidenceId: string;
  readonly kind: "SUBMISSION";
  readonly canonicalRecordId?: string;
}
export interface IntakePolicy {
  readonly founderApproved: boolean;
  readonly scopes: readonly string[];
  readonly mappings: readonly ApprovedFormMapping[];
}
export interface IntakeCheckpoint {
  readonly pageToken?: string;
  readonly seen: Readonly<Record<string, string>>;
}
export interface IntakeBatch {
  readonly status: "DISABLED" | "COMPLETE" | "PARTIAL" | "READ_ERROR";
  readonly receipts: readonly EnterpriseLeadReceipt[];
  readonly checkpoint: IntakeCheckpoint;
  readonly counts: Readonly<{ examined: number; rejected: number; unmapped: number; replayed: number; conflicts: number; retentionWarnings: number }>;
}

// Only GET, metadata format, fixed Google origin, no bodies/attachments/search.
// Token provisioning and activation are separate founder-approved operations.
export function createGmailMetadataReader(token: () => Promise<string>, request: typeof fetch = fetch): GmailMetadataReader {
  async function get<T>(path: string): Promise<T> {
    try {
      const response = await request(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
        method: "GET", redirect: "error", signal: AbortSignal.timeout(10_000),
        headers: { Authorization: `Bearer ${await token()}` },
      });
      if (!response.ok) throw new Error();
      return await response.json() as T;
    } catch { throw new Error("Gmail metadata read failed."); }
  }
  return Object.freeze({
    profile: () => get<{ emailAddress: string }>("profile"),
    list: (pageToken?: string) => {
      const query = new URLSearchParams({ maxResults: "100", includeSpamTrash: "true" });
      if (pageToken) query.set("pageToken", pageToken);
      return get<{ messages?: { id: string }[]; nextPageToken?: string }>(`messages?${query}`);
    },
    get: (id: string) => {
      if (!/^[a-f0-9]{1,40}$/.test(id)) throw new Error("Invalid Gmail identifier.");
      const query = new URLSearchParams({ format: "metadata" });
      for (const h of ["From", "To", "Delivered-To", "Message-ID", "Authentication-Results", "Received"]) query.append("metadataHeaders", h);
      return get<GmailMetadata>(`messages/${id}?${query}`);
    },
  });
}

function provenance(message: GmailMetadata): { messageId: string; receivedAt: string } | null {
  const headers = message.payload?.headers ?? [];
  const one = (name: string) => {
    const values = headers.filter(h => h.name.toLowerCase() === name.toLowerCase());
    return values.length === 1 ? values[0].value.trim() : "";
  };
  // Fail closed on duplicate auth headers, forwarding, absent receiver trace,
  // ambiguous identities and attacker-added lookalike authentication results.
  const auth = one("Authentication-Results").replace(/\s+/g, " ");
  const clauses = auth.split(";").map(s => s.trim());
  const has = (r: RegExp) => clauses.some(s => r.test(s));
  const uniqueResults = ["dkim", "spf", "dmarc"].every(method => clauses.filter(s => s.startsWith(`${method}=`)).length === 1);
  const received = headers.filter(h => h.name.toLowerCase() === "received");
  const receiver = received.some(h => /\bby mx\.google\.com with ESMTPS\b/.test(h.value) && h.value.includes(`<${mailbox}>`));
  const from = one("From");
  const messageId = one("Message-ID");
  const timestamp = Number(message.internalDate);
  if (!/^(?:FormSubmit\s*)?<submissions@formsubmit\.co>$|^submissions@formsubmit\.co$/.test(from) ||
      one("To") !== mailbox || one("Delivered-To") !== mailbox || !receiver ||
      clauses[0] !== "mx.google.com" || !uniqueResults ||
      !has(/^dkim=pass\s+.*\bheader\.(?:i=@|d=)formsubmit\.co(?:\s|$)/) ||
      !has(/^spf=pass\s+.*\bsmtp\.mailfrom=submissions@formsubmit\.co(?:\s|$)/) ||
      !has(/^dmarc=pass\s+.*\bheader\.from=formsubmit\.co(?:\s|$)/) ||
      !/^<[A-Za-z0-9._-]{1,160}@formsubmit\.co>$/.test(messageId) ||
      !/^\d{10,16}$/.test(message.internalDate) || !Number.isFinite(timestamp) ||
      !Number.isFinite(new Date(timestamp).getTime())) return null;
  return { messageId, receivedAt: new Date(timestamp).toISOString() };
}

export async function readFormSubmitIntake(
  reader: GmailMetadataReader, policy: IntakePolicy,
  checkpoint: IntakeCheckpoint = { seen: {} }, now = new Date(),
): Promise<IntakeBatch> {
  if (!Number.isFinite(now.getTime())) throw new Error("Valid observation time required.");
  const counts = { examined: 0, rejected: 0, unmapped: 0, replayed: 0, conflicts: 0, retentionWarnings: 0 };
  const result = (status: IntakeBatch["status"], receipts: EnterpriseLeadReceipt[], next: IntakeCheckpoint): IntakeBatch => Object.freeze({
    status, receipts: Object.freeze(receipts), checkpoint: Object.freeze({ ...next, seen: Object.freeze({ ...next.seen }) }), counts: Object.freeze({ ...counts }),
  });
  if (!policy.founderApproved || policy.scopes.length !== 1 || policy.scopes[0] !== GMAIL_METADATA_SCOPE) return result("DISABLED", [], checkpoint);
  const seen = { ...checkpoint.seen };
  const receipts: EnterpriseLeadReceipt[] = [];
  try {
    if ((await reader.profile()).emailAddress !== mailbox) return result("READ_ERROR", [], checkpoint);
    const page = await reader.list(checkpoint.pageToken);
    if ((page.messages?.length ?? 0) > 100) return result("READ_ERROR", [], checkpoint);
    // Gather the entire page before committing a checkpoint; errors are atomic.
    const messages: GmailMetadata[] = [];
    for (const ref of page.messages ?? []) {
      const message = await reader.get(ref.id);
      if (message.id !== ref.id) return result("READ_ERROR", [], checkpoint);
      messages.push(message);
    }
    for (const message of messages) {
      counts.examined++;
      const proof = provenance(message);
      if (!proof || Date.parse(proof.receivedAt) > now.getTime()) { counts.rejected++; continue; }
      const key = gmailReceiptKey(message.id);
      const mappings = policy.mappings.filter(m => m.receiptKey === key);
      if (!mappings.length) { counts.unmapped++; continue; }
      const mapping = mappings[0];
      if (mappings.length !== 1 || mapping.kind !== "SUBMISSION" || !["REALTY", "CAPITAL_ADVISORY"].includes(mapping.division) ||
          mapping.messageIdSha256 !== digest(proof.messageId) || !opaque.test(mapping.approvalEvidenceId) ||
          (mapping.canonicalRecordId !== undefined && !opaque.test(mapping.canonicalRecordId))) {
        counts.conflicts++; continue;
      }
      const fingerprint = digest(JSON.stringify([mapping.division, proof.receivedAt, mapping.messageIdSha256, mapping.canonicalRecordId ?? null]));
      if (message.labelIds?.some(l => l === "TRASH" || l === "SPAM")) counts.retentionWarnings++;
      // Both Gmail resource and RFC Message-ID dedupe across pages and replays.
      const rfcKey = `rfc:${mapping.messageIdSha256}`;
      const prior = [seen[key], seen[rfcKey]].filter(Boolean);
      if (prior.some(p => p !== fingerprint)) { counts.conflicts++; continue; }
      if (prior.length) { counts.replayed++; continue; }
      seen[key] = fingerprint; seen[rfcKey] = fingerprint;
      receipts.push(Object.freeze({
        division: mapping.division, provider: "FORMSUBMIT", sourceRecordId: key,
        ...(mapping.canonicalRecordId ? { canonicalRecordId: mapping.canonicalRecordId } : {}),
        receivedAt: proof.receivedAt, evidenceIds: Object.freeze([key, mapping.approvalEvidenceId]),
        receiptVerification: "VERIFIED", qualificationVerification: "UNKNOWN", notification: "UNKNOWN",
      }));
    }
    if (counts.conflicts) return result("READ_ERROR", [], checkpoint);
    return result(page.nextPageToken ? "PARTIAL" : "COMPLETE", receipts, { seen, ...(page.nextPageToken ? { pageToken: page.nextPageToken } : {}) });
  } catch { return result("READ_ERROR", [], checkpoint); }
}

// Reads existing canonical Luxury records only; never retains payload or provider
// response/error text, and never equates an email API success with inbox delivery.
export function luxuryLeadReceipts(records: readonly LeadSubmissionRecord[]): readonly EnterpriseLeadReceipt[] {
  return Object.freeze(records.map(record => Object.freeze({
    division: "WATCH_BROKERAGE" as const, provider: "BEGIN_YOUR_QUEST" as const,
    sourceRecordId: `luxury:${digest(record.id)}`, canonicalRecordId: record.id,
    receivedAt: record.savedAt, evidenceIds: Object.freeze([`stored:${digest(record.id)}`]),
    receiptVerification: "VERIFIED" as const, qualificationVerification: "UNKNOWN" as const,
    notification: record.emailDelivery?.status === "failed" ? "FAILED" as const :
      record.emailDelivery?.status === "sent" ? "ACCEPTED_BY_PROVIDER" as const : "UNKNOWN" as const,
  })));
}
