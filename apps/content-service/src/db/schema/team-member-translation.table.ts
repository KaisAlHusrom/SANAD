import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { teamMemberTable } from './team-member.table.js';

/**
 * Per-locale team-member copy (N5). Composite PK `(team_member_id, locale)`, cascade FK.
 * `name`/`role` are conceptually required (enforced at the contract edge); kept nullable at the
 * DB so partial per-locale upserts never fail. Reads coalesce to '' (F7).
 */
export const teamMemberTranslationTable = pgTable(
  'team_member_translation',
  {
    teamMemberId: uuid('team_member_id')
      .notNull()
      .references(() => teamMemberTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name'),
    role: text('role'),
    bio: text('bio'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.teamMemberId, table.locale] })],
);

export type TeamMemberTranslationRow =
  typeof teamMemberTranslationTable.$inferSelect;
