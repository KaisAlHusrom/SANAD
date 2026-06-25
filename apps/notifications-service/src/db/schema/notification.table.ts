import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { pk, timestamps } from '@sanad/database';
import type { NotificationPayload, NotificationType } from '@sanad/contracts';

/** Channel / recipient-kind / email-status enums (mirror the @sanad/contracts vocab, U3). */
export const notificationChannelEnum = pgEnum('notification_channel', [
  'in_app',
  'email',
]);
export const notificationRecipientKindEnum = pgEnum(
  'notification_recipient_kind',
  ['role', 'user', 'email'],
);
export const notificationEmailStatusEnum = pgEnum('notification_email_status', [
  'pending',
  'sent',
  'failed',
]);

/**
 * A single notification (P6). One inbound event can fan out to several rows — an `in_app`
 * notice for a role audience plus `email` rows (team alert + visitor ack). `recipient` is
 * discriminated by `recipient_kind` (a role key, a user id, or an email address). `payload`
 * is the typed structured summary (jsonb). Email rows carry an `email_status` (the durable
 * record of intent, dispatched after the consumer tx commits); in-app rows leave it null.
 * `read_at` tracks the bell. Not translatable — email bodies render from templates by locale.
 */
export const notificationTable = pgTable(
  'notification',
  {
    id: pk(),
    recipientKind: notificationRecipientKindEnum('recipient_kind').notNull(),
    recipient: text('recipient').notNull(),
    channel: notificationChannelEnum('channel').notNull(),
    type: text('type').$type<NotificationType>().notNull(),
    payload: jsonb('payload').$type<NotificationPayload>().notNull(),
    emailStatus: notificationEmailStatusEnum('email_status'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    readAt: timestamp('read_at', { withTimezone: true }),
    ...timestamps(),
  },
  (table) => [
    index('notification_recipient_idx').on(
      table.recipientKind,
      table.recipient,
    ),
    index('notification_channel_idx').on(table.channel),
  ],
);

export type NotificationRow = typeof notificationTable.$inferSelect;
export type NotificationInsert = typeof notificationTable.$inferInsert;
