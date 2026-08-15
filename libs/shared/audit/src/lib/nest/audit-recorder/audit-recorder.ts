import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import { EMPTY_REQUEST_CONTEXT } from '@sanad/contracts';
import { DateTimeService } from '@sanad/database';
import {
  AuditStore,
  type AuditDb,
  type AuditEntryInput,
  type AuditOutcome,
  type AuditRecord,
  type AuditScope,
} from '../../audit-entry.types.js';
import { diffFields } from '../../diff-fields/diff-fields.js';
import { ACTION_PATTERN, SYSTEM_ACTOR } from '../../audit.constants.js';

/** Per-call state: who is acting, and what they have recorded but not yet persisted. */
interface RecorderState {
  scope: AuditScope;
  pending: AuditRecord[];
}

/** How a flush should mark the entries it writes. */
export interface FlushOptions {
  outcome?: AuditOutcome;
  failureKey?: string | null;
}

/**
 * The one seam a service records through.
 *
 * It holds the actor and the caller's circumstances in an `AsyncLocalStorage` scope that the
 * interceptor opens, so **no application code ever passes an actor around** — which is what
 * stops the trail rotting the first time someone adds a write path and forgets. Two ways in:
 *
 * - `record()` buffers, and the interceptor flushes after the handler returns. Right for a write
 *   whose row may safely land a moment later.
 * - `recordWithin(tx, …)` writes inside the caller's transaction, so the business row, its
 *   Outbox event and its audit row commit or roll back as ONE. Right for anything that has to
 *   be evidence (P8.14), and the reason a rolled-back write leaves no trail entry claiming it
 *   happened.
 */
@Injectable()
export class AuditRecorder {
  private readonly storage = new AsyncLocalStorage<RecorderState>();

  constructor(
    private readonly store: AuditStore,
    private readonly clock: DateTimeService,
  ) {}

  /** Run `work` with a known actor + context; every record inside is stamped from it. */
  runInScope<T>(scope: AuditScope, work: () => Promise<T>): Promise<T> {
    return this.storage.run({ scope, pending: [] }, work);
  }

  /** Buffer an entry for the interceptor to flush after the handler. */
  record(entry: AuditEntryInput): void {
    const record = this.toRecord(entry);
    const state = this.storage.getStore();
    if (!state) {
      // Outside a scope (a seeder, a scheduled job) the entry is still worth keeping — it is
      // simply attributed to the system. Held on the instance so a later flush picks it up.
      this.orphaned.push(record);
      return;
    }
    state.pending.push(record);
  }

  /** Write an entry NOW, inside the caller's transaction. Not buffered, never double-written. */
  async recordWithin(exec: AuditDb, entry: AuditEntryInput): Promise<void> {
    await this.store.append(exec, [this.toRecord(entry)]);
  }

  /** Persist everything buffered in this scope and empty it. */
  async flush(exec: AuditDb, options: FlushOptions = {}): Promise<void> {
    const state = this.storage.getStore();
    const buffered = state ? state.pending : this.orphaned;
    if (buffered.length === 0) {
      return;
    }
    const records = buffered.map((record) => ({
      ...record,
      outcome: options.outcome ?? record.outcome,
      failureKey: options.failureKey ?? record.failureKey,
    }));
    // Empty BEFORE the await: a retry or a second flush must not write the same row twice.
    buffered.length = 0;
    await this.store.append(exec, records);
  }

  /** Entries recorded with no ambient scope (boot-time work); flushed on the next flush. */
  private readonly orphaned: AuditRecord[] = [];

  private toRecord(entry: AuditEntryInput): AuditRecord {
    if (!ACTION_PATTERN.test(entry.action)) {
      throw new Error(
        `audit: action must be namespaced lower-case '<entity>.<verb>', got '${entry.action}'`,
      );
    }
    const state = this.storage.getStore();
    const actor = state?.scope.actor ?? SYSTEM_ACTOR;
    const context = state?.scope.context ?? EMPTY_REQUEST_CONTEXT;
    const changed = diffFields(entry.before ?? null, entry.after ?? null);
    return {
      actorUserId: actor.userId,
      actorRole: actor.role,
      actorType: actor.type,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: changed.before,
      after: changed.after,
      ip: context.ip,
      userAgent: context.userAgent,
      requestId: context.requestId,
      outcome: entry.outcome ?? 'succeeded',
      failureKey: entry.failureKey ?? null,
      occurredAt: this.clock.nowIso(),
    };
  }
}
