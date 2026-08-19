import { index, pgTable, text } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { leadSourceEnum, leadStatusEnum } from './enums.js';

/**
 * A captured lead from the website contact / request-a-project form (N4). NOT translatable
 * — it's user-submitted data; `locale` records the site language for the reply. Soft-delete
 * lets the admin archive without losing history. The `lead.created` event is emitted via the
 * Outbox in the same tx as the insert (MS3).
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
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('lead_status_idx').on(table.status),
    index('lead_created_idx').on(table.createdAt),
  ],
);

export type LeadRow = typeof leadTable.$inferSelect;
