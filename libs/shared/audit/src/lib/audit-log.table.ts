import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * The append-only audit trail (P8.8). Each service owns its own copy (DB-per-service, MS5) —
 * include it in the service's Drizzle schema so a migration creates it, exactly like the shared
 * `outbox` table, and apply `AUDIT_IMMUTABILITY_SQL` in a custom migration beside it.
 *
 * This is the **legal evidence layer** the e-signature phase (P8.14) rests on, which is why it
 * is built before the thing it protects: retrofitting a trail onto signed documents means the
 * earliest contracts have the weakest record.
 *
 * `actor_user_id` carries **no foreign key** — users live in the identity service's database
 * (MS5) — and it is nullable because a system job or an anonymous public write is a real actor
 * too. Timestamps are ISO strings (`mode: 'string'`) so nothing reaches for `new Date()` (N3).
 */
export const auditLogTable = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    actorUserId: uuid('actor_user_id'),
    actorRole: text('actor_role'),
    actorType: text('actor_type').notNull(),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    before: jsonb('before'),
    after: jsonb('after'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    requestId: text('request_id'),
    outcome: text('outcome').notNull(),
    /** A localized message KEY when the action failed — never prose (U24). */
    failureKey: text('failure_key'),
    occurredAt: timestamp('occurred_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
  },
  (table) => [
    index('audit_log_entity_idx').on(table.entityType, table.entityId),
    index('audit_log_occurred_at_idx').on(table.occurredAt),
    index('audit_log_actor_idx').on(table.actorUserId),
  ],
);
