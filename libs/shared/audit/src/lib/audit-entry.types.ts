import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RequestContext } from '@sanad/contracts';

/** Who acted. A system job and an anonymous public write are real actors, not missing ones. */
export interface AuditActor {
  userId: string | null;
  role: string | null;
  type: 'user' | 'system' | 'anonymous';
}

/** Whether the audited action completed. A refused write is exactly what security review reads. */
export type AuditOutcome = 'succeeded' | 'failed';

/**
 * What a service records. Everything about *who* and *from where* is stamped by the recorder
 * from the ambient scope — a caller never plumbs an actor by hand, which is what keeps the
 * trail honest when a new write path is added.
 */
export interface AuditEntryInput {
  /** Namespaced `<entity>.<verb>`, e.g. `settings.updated` (validated by `assertAuditAction`). */
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  outcome?: AuditOutcome;
  failureKey?: string | null;
}

/** A complete row, ready to persist. */
export interface AuditRecord {
  actorUserId: string | null;
  actorRole: string | null;
  actorType: AuditActor['type'];
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  outcome: AuditOutcome;
  failureKey: string | null;
  occurredAt: string;
}

/** Everything the recorder knows about the call in flight. */
export interface AuditScope {
  actor: AuditActor;
  context: RequestContext;
}

/**
 * A Drizzle handle OR an open transaction. `insert` only — the store has no update and no
 * delete **by construction**, so append-only is a property of the type, not a habit.
 */
export type AuditDb = Pick<NodePgDatabase<Record<string, never>>, 'insert'>;

/**
 * The append seam. An abstract class rather than an interface so it doubles as the DI token
 * (the N11 pattern used by `TransactionRunner`), which lets a service swap the implementation
 * in a test without decorator metadata.
 */
export abstract class AuditStore {
  abstract append(
    exec: AuditDb,
    records: readonly AuditRecord[],
  ): Promise<void>;
}
