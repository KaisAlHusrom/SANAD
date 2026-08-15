import type { AuditDb, AuditRecord, AuditStore } from '../audit-entry.types.js';
import { auditLogTable } from '../audit-log.table.js';
import { redact } from '../redact/redact.js';

/**
 * Drizzle-backed {@link AuditStore}. Pass a transaction to commit the row WITH the business
 * write (the path e-signature will use), or the pooled handle to append after the fact.
 *
 * There is deliberately no `update` and no `delete`: append-only is a property of this class's
 * surface as well as of the database trigger, so a caller cannot even express the mutation the
 * trigger would refuse. Redaction happens here, at the last moment before persistence, so no
 * write path can forget it (N13).
 */
export class DrizzleAuditStore implements AuditStore {
  async append(exec: AuditDb, records: readonly AuditRecord[]): Promise<void> {
    if (records.length === 0) {
      return;
    }
    await exec.insert(auditLogTable).values(
      records.map((record) => ({
        actorUserId: record.actorUserId,
        actorRole: record.actorRole,
        actorType: record.actorType,
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        before: redact(record.before) ?? null,
        after: redact(record.after) ?? null,
        ip: record.ip,
        userAgent: record.userAgent,
        requestId: record.requestId,
        outcome: record.outcome,
        failureKey: record.failureKey,
        occurredAt: record.occurredAt,
      })),
    );
  }
}
