import { randomBytes, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import type { LuxuryWorkforceEvent } from "./luxuryWorkforceEvent.ts";
import { WORKFORCE_OWNER, APPROVED_VALIDATION_FIXTURE } from "./luxuryWorkforceEvent.ts";
import type { WorkforceJournalEntry, WorkforceOperation } from "./workforcePhaseJournal.ts";
import { WorkforcePhaseJournal } from "./workforcePhaseJournal.ts";

export interface WorkforceContact { id: string; email: string; archived?: boolean }
export interface WorkforceTask { id: string; body: string; ownerId: string; contactIds: readonly string[]; archived?: boolean; dueAt: string; status: string; type: string }
export interface WorkforceCRMAdapter {
  findContact(email: string): Promise<WorkforceContact | null>;
  getContact(id: string): Promise<WorkforceContact | null>;
  createContact(event: LuxuryWorkforceEvent): Promise<WorkforceContact>;
  findTask(event: LuxuryWorkforceEvent): Promise<WorkforceTask | null>;
  getTask(id: string): Promise<WorkforceTask | null>;
  createTask(event: LuxuryWorkforceEvent, contactId: string): Promise<WorkforceTask>;
  notifyOwner(event: LuxuryWorkforceEvent, contactId: string, taskId: string): Promise<{ accepted: boolean; providerId: string }>;
  getNotification?(providerId: string, event: LuxuryWorkforceEvent): Promise<boolean>;
}
export const workforceTaskMetadata = (event: LuxuryWorkforceEvent) => [
  "Quest Luxo internal validation event", `Event-Key: ${event.eventKey}`, `Fingerprint-v1: ${event.fingerprint}`, "End-Quest-Task-Metadata",
].join("\n");
const validId = (id: string) => /^[1-9]\d{0,30}$/.test(id);
const matchContact = (c: WorkforceContact | null, event: LuxuryWorkforceEvent) => !!c && validId(c.id) && !c.archived && c.email.trim().toLowerCase() === event.payload.email!.trim().toLowerCase();
const matchTask = (t: WorkforceTask | null, event: LuxuryWorkforceEvent, contactId: string) => !!t && validId(t.id) && !t.archived && t.ownerId === WORKFORCE_OWNER && t.contactIds.includes(contactId) &&
  t.type === "TODO" && ["NOT_STARTED", "COMPLETED"].includes(t.status) && Date.parse(t.dueAt) === Date.parse(event.savedAt) + 86_400_000 &&
  (t.body === workforceTaskMetadata(event) || t.body.startsWith(workforceTaskMetadata(event) + "\n"));
const LEASE_MS = 120_000;

export class WorkforceContactTaskDelivery {
  private readonly journal: WorkforcePhaseJournal;
  private readonly adapter: WorkforceCRMAdapter;
  private readonly clock: () => number;
  constructor(journal: WorkforcePhaseJournal, adapter: WorkforceCRMAdapter, clock: () => number = Date.now) { this.journal = journal; this.adapter = adapter; this.clock = clock; }
  enqueue(event: LuxuryWorkforceEvent): string {
    return WorkforceContactTaskDelivery.enqueueSavedEvent(this.journal, event, this.clock);
  }
  static enqueueSavedEvent(journal: WorkforcePhaseJournal, event: LuxuryWorkforceEvent, clock: () => number = Date.now): string {
    return journal.mutate(s => {
      const old = s.entries.find(e => e.eventKey === event.eventKey);
      if (old) {
        if (old.fingerprint !== event.fingerprint || old.emailKey !== event.emailKey) { old.state = "HOLD"; old.reason = "MUTATED_CANONICAL_EVENT"; }
        return old.state;
      }
      s.entries.push({ eventKey: event.eventKey, fingerprint: event.fingerprint, emailKey: event.emailKey, sourceRecordId: event.leadId, savedAt: event.savedAt,
        state: "PENDING", phase: "CONTACT", contactId: null, taskId: null, ownerId: WORKFORCE_OWNER, associationVerified: false, contactOrigin: null, taskOrigin: null,
        operation: null, attempt: null, leaseUntil: 0, runId: null, notification: "NOT_ATTEMPTED", notificationId: null, inboxReceipt: "UNKNOWN", humanAction: "UNKNOWN", reason: null, updatedAt: new Date(clock()).toISOString() });
      if (!s.contacts.some(c => c.emailKey === event.emailKey)) s.contacts.push({ emailKey: event.emailKey, contactId: null, state: "UNCLAIMED", eventKey: null, attempt: null, leaseUntil: 0 });
      return "PENDING";
    }).result;
  }
  private report(eventKey: string, status?: string) {
    const snapshot = this.journal.read(), e = snapshot.state.entries.find(e => e.eventKey === eventKey)!;
    return { status: snapshot.state.recoveryHold ? "RESTORE_RECONCILIATION_REQUIRED" : status ?? e.state, phase: e.phase, eventKey, contactId: e.contactId, taskId: e.taskId, associationVerified: e.associationVerified,
      notification: e.notification, inboxReceipt: e.inboxReceipt, humanAction: e.humanAction, runId: e.runId, revision: snapshot.revision, sequence: snapshot.state.sequence,
      recoveryHold: snapshot.state.recoveryHold, contactOrigin: e.contactOrigin, taskOrigin: e.taskOrigin };
  }
  async deliver(event: LuxuryWorkforceEvent) {
    this.enqueue(event);
    const baseline = event.leadId === APPROVED_VALIDATION_FIXTURE.leadId;
    const token = randomBytes(32).toString("hex"), now = this.clock();
    const claimed = this.journal.mutate(s => {
      const e = s.entries.find(e => e.eventKey === event.eventKey)!;
      if (["COMPLETE", "HOLD"].includes(e.state)) return false;
      if (e.state === "ACTIVE" && e.leaseUntil > now) return false;
      if (e.operation !== null) e.state = "UNCERTAIN";
      else if (e.state !== "UNCERTAIN") e.state = "ACTIVE";
      e.attempt = token; e.runId = randomUUID(); e.leaseUntil = now + LEASE_MS; e.updatedAt = new Date(now).toISOString();
      return true;
    }).result;
    if (!claimed) {
      for (let i = 0; i < 80 && this.journal.read().state.entries.find(e => e.eventKey === event.eventKey)?.state === "ACTIVE"; i++) await delay(50);
      return this.report(event.eventKey, this.journal.read().state.entries.find(e => e.eventKey === event.eventKey)?.state === "ACTIVE" ? "BUSY" : undefined);
    }
    const current = () => this.journal.read().state.entries.find(e => e.eventKey === event.eventKey)!;
    const update = (change: (e: WorkforceJournalEntry) => void) => this.journal.mutate(s => {
      const e = s.entries.find(e => e.eventKey === event.eventKey)!;
      if (e.attempt !== token || e.leaseUntil <= this.clock() || e.state === "HOLD") throw Error("Stale workforce claim.");
      change(e); e.updatedAt = new Date(this.clock()).toISOString();
    });
    const uncertain = (reason: string) => {
      this.journal.mutate(s => {
        const e = s.entries.find(e => e.eventKey === event.eventKey)!;
        if (e.attempt !== token || e.state === "HOLD") return;
        e.state = "UNCERTAIN"; e.reason = reason; e.updatedAt = new Date(this.clock()).toISOString();
        const c = s.contacts.find(c => c.emailKey === e.emailKey)!;
        if (e.operation === "CONTACT_CREATE" && c.eventKey === e.eventKey) c.state = "UNCERTAIN";
        if (e.operation === "NOTIFY") e.notification = "UNCERTAIN";
      });
      return this.report(event.eventKey);
    };
    const begin = (operation: WorkforceOperation): boolean => this.journal.mutate(s => {
      const e = s.entries.find(e => e.eventKey === event.eventKey)!;
      if (baseline || e.attempt !== token || e.leaseUntil <= this.clock() || e.state !== "ACTIVE" || s.recoveryHold) return false;
      if (operation === "CONTACT_CREATE") {
        const c = s.contacts.find(c => c.emailKey === e.emailKey)!;
        if (c.state !== "UNCLAIMED") return false;
        c.state = "CREATING"; c.eventKey = e.eventKey; c.attempt = token; c.leaseUntil = e.leaseUntil;
      }
      e.operation = operation; return true;
    }).result;
    try {
      let e = current();
      if (e.notification === "UNCERTAIN" || e.operation === "NOTIFY") return uncertain("NOTIFICATION_REQUIRES_POSITIVE_RECEIPT");
      const taskWriteUncertain = e.operation === "TASK_CREATE";
      let binding = this.journal.read().state.contacts.find(c => c.emailKey === event.emailKey)!;
      for (let i = 0; i < 80 && binding.state === "CREATING" && binding.eventKey !== event.eventKey && binding.leaseUntil > this.clock(); i++) {
        await delay(50); binding = this.journal.read().state.contacts.find(c => c.emailKey === event.emailKey)!;
      }
      let contactOrigin = e.contactOrigin;
      let contact = baseline ? await this.adapter.getContact(APPROVED_VALIDATION_FIXTURE.contactId) : e.contactId || binding.contactId ? await this.adapter.getContact((e.contactId ?? binding.contactId)!) : await this.adapter.findContact(event.payload.email!);
      contactOrigin ??= baseline ? "OPERATOR_BASELINE" : e.operation === "CONTACT_CREATE" ? "RECONCILED_AFTER_UNCERTAIN" : binding.contactId ? "REUSED_BOUND_CONTACT" : "RECONCILED_EXISTING";
      if (!contact) {
        binding = this.journal.read().state.contacts.find(c => c.emailKey === event.emailKey)!;
        for (let i = 0; i < 80 && binding.state === "CREATING" && binding.eventKey !== event.eventKey && binding.leaseUntil > this.clock(); i++) {
          await delay(50); binding = this.journal.read().state.contacts.find(c => c.emailKey === event.emailKey)!;
        }
        if (binding.contactId) contact = await this.adapter.getContact(binding.contactId);
      }
      if (!contact) {
        if (baseline || e.contactId || binding.contactId || binding.state === "UNCERTAIN" || e.state === "UNCERTAIN" || this.journal.read().state.recoveryHold || binding.state === "CREATING") return uncertain("CONTACT_RESULT_NOT_ESTABLISHED");
        if (!begin("CONTACT_CREATE")) return uncertain("CONTACT_CREATION_CLAIM_UNAVAILABLE");
        contact = await this.adapter.createContact(event);
        contactOrigin = "CREATED_BY_RUNTIME";
      }
      if (!matchContact(contact, event)) return uncertain("CONTACT_IDENTITY_MISMATCH");
      // Merge known provider IDs into the latest transaction, even if another event advanced global revision.
      this.journal.mutate(s => {
        const entry = s.entries.find(x => x.eventKey === event.eventKey)!, c = s.contacts.find(x => x.emailKey === event.emailKey)!;
        if (entry.attempt !== token || entry.leaseUntil <= this.clock() || entry.state === "HOLD" || c.contactId && c.contactId !== contact!.id) throw Error("Stale contact receipt.");
        entry.contactId = contact!.id; entry.phase = "TASK"; entry.operation = taskWriteUncertain ? "TASK_CREATE" : null; entry.state = taskWriteUncertain ? "UNCERTAIN" : "ACTIVE"; entry.reason = null;
        entry.contactOrigin = contactOrigin;
        Object.assign(c, { contactId: contact!.id, state: "KNOWN", eventKey: null, attempt: null, leaseUntil: 0 });
      });
      if (!matchContact(await this.adapter.getContact(contact.id), event)) return uncertain("CONTACT_NATIVE_READBACK_UNVERIFIED");
      e = current();
      const pendingTaskWrite = taskWriteUncertain || e.operation === "TASK_CREATE";
      let taskOrigin = e.taskOrigin ?? (baseline ? "OPERATOR_BASELINE" : taskWriteUncertain ? "RECONCILED_AFTER_UNCERTAIN" : "RECONCILED_EXISTING");
      let task = baseline ? await this.adapter.getTask(APPROVED_VALIDATION_FIXTURE.taskId) : e.taskId ? await this.adapter.getTask(e.taskId) : await this.adapter.findTask(event);
      if (!task) {
        if (baseline || e.taskId || pendingTaskWrite || this.journal.read().state.recoveryHold) return uncertain("TASK_RESULT_NOT_ESTABLISHED");
        if (!begin("TASK_CREATE")) return uncertain("TASK_CREATION_CLAIM_UNAVAILABLE");
        task = await this.adapter.createTask(event, contact.id);
        taskOrigin = "CREATED_BY_RUNTIME";
      }
      if (!validId(task.id)) return uncertain("TASK_NATIVE_ID_INVALID");
      update(entry => { entry.taskId = task!.id; entry.taskOrigin = taskOrigin; entry.phase = "VERIFY"; });
      const verifiedTask = await this.adapter.getTask(task.id);
      if (!matchTask(verifiedTask, event, contact.id)) return uncertain("TASK_ASSOCIATION_OR_OWNER_UNVERIFIED");
      if (baseline) {
        update(entry => { entry.state = "HOLD"; entry.associationVerified = true; entry.operation = null; entry.reason = "OPERATOR_BASELINE_NOT_AUTOMATED_CREATION"; });
        return this.report(event.eventKey, "BASELINE_RECONCILED");
      }
      update(entry => { entry.associationVerified = true; entry.phase = "NOTIFY"; entry.operation = null; entry.state = "ACTIVE"; entry.reason = null; });
      if (this.journal.read().state.recoveryHold) return uncertain("RESTORED_JOURNAL_DISPATCH_HELD");
      if (!begin("NOTIFY")) return uncertain("NOTIFICATION_CLAIM_UNAVAILABLE");
      const notification = await this.adapter.notifyOwner(event, contact.id, task.id);
      if (!notification.accepted || !notification.providerId) return uncertain("NOTIFICATION_ACCEPTANCE_UNKNOWN");
      update(entry => { entry.notification = "ACCEPTED_BY_PROVIDER"; entry.notificationId = notification.providerId; entry.phase = "DONE"; entry.state = "COMPLETE"; entry.operation = null; entry.reason = null; });
      return this.report(event.eventKey);
    } catch {
      const latest = current();
      // A failed read before any durable write intent is retryable. An attempted write is never inferred absent.
      if (latest.attempt === token && latest.operation === null && latest.state === "ACTIVE") {
        this.journal.mutate(s => {
          const e = s.entries.find(e => e.eventKey === event.eventKey)!;
          if (e.attempt !== token || e.operation !== null || e.state !== "ACTIVE") return;
          e.state = "PENDING"; e.reason = "READ_RETRY_REQUIRED"; e.attempt = null; e.leaseUntil = 0;
        });
        return this.report(event.eventKey);
      }
      return uncertain("PROVIDER_OR_RECEIPT_OUTCOME_UNCERTAIN");
    }
  }
  /** Explicit provider-ID reconciliation. No replay POST and no inbox/human inference. */
  async reconcileNotification(event: LuxuryWorkforceEvent, providerId: string) {
    const entry = this.journal.read().state.entries.find(e => e.eventKey === event.eventKey);
    if (!entry || entry.fingerprint !== event.fingerprint || !entry.taskId || !entry.contactId || !entry.associationVerified ||
        entry.state !== "UNCERTAIN" || entry.operation !== "NOTIFY" || !this.adapter.getNotification || !/^[a-zA-Z0-9_-]{1,128}$/.test(providerId)) throw Error("Notification reconciliation evidence required.");
    if (!(await this.adapter.getNotification(providerId, event))) return this.report(event.eventKey, "UNCERTAIN");
    this.journal.mutate(s => {
      const e = s.entries.find(e => e.eventKey === event.eventKey)!;
      if (e.fingerprint !== event.fingerprint || e.state !== "UNCERTAIN" || e.operation !== "NOTIFY" || e.attempt !== entry.attempt) throw Error("Stale notification reconciliation.");
      e.notification = "ACCEPTED_BY_PROVIDER"; e.notificationId = providerId; e.state = "COMPLETE"; e.phase = "DONE"; e.operation = null; e.reason = null; e.attempt = null; e.leaseUntil = 0;
    });
    return this.report(event.eventKey);
  }
}
