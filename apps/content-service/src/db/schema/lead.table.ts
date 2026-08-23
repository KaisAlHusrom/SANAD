import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { leadSourceEnum, leadStatusEnum } from './enums.js';

/**
 * A captured lead from the website contact / request-a-project form (N4). NOT translatable
 * — it's user-submitted data; `locale` records the site language for the reply. Soft-delete
 * lets the admin archive without losing history. The `lead.created` event is emitted via the
 * Outbox in the same tx as the insert (MS3).
 *
 * Since P8.10.B2 a repeat submission from the same person inside the configured window is
 * ABSORBED here — `submission_count` / `last_submitted_at` move and an `audit_log` row records
 * it — rather than creating a second row.
 */
export const leadTable = pgTable(
  'lead',
  {
    id: pk(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    // E.164, required by the contract since P8.10.B1 — nullable in the DB only because leads
    // captured before it have none.
    phone: text('phone'),
    company: text('company'),
    budget: text('budget'),
    projectType: text('project_type'),
    message: text('message').notNull(),
    source: leadSourceEnum('source').notNull().default('contact'),
    locale: text('locale').notNull().default('ar'),
    status: leadStatusEnum('status').notNull().default('new'),
    /** How many times this person has submitted — 1 on creation, bumped on each fold. */
    submissionCount: integer('submission_count').notNull().default(1),
    /** When they last submitted. The duplicate window is measured from HERE, not `created_at`. */
    lastSubmittedAt: timestamp('last_submitted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('lead_status_idx').on(table.status),
    index('lead_created_idx').on(table.createdAt),
    // The duplicate lookup matches on EITHER identifier, case-insensitively for email —
    // `lower(email)` so the index is actually usable by that predicate.
    index('lead_email_lower_idx').on(sql`lower(${table.email})`),
    index('lead_phone_idx').on(table.phone),
  ],
);

export type LeadRow = typeof leadTable.$inferSelect;
