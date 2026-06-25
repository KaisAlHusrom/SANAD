import { describe, expect, it } from 'vitest';
import { notificationChannelSchema } from './notification-channel.zod.types.js';
import { notificationRecipientKindSchema } from './notification-recipient-kind.zod.types.js';
import { emailStatusSchema } from './email-status.zod.types.js';
import { notificationTypeSchema } from './notification-type.zod.types.js';
import { notificationListQuerySchema } from './notification-list-query.zod.types.js';
import { notificationMarkReadSchema } from './notification-mark-read.zod.types.js';
import { NOTIFICATION_PERMISSIONS } from './permission.js';
import {
  NOTIFICATION_LIST,
  NOTIFICATION_MARK_READ,
} from './message-pattern.js';

describe('notifications contracts', () => {
  it('enumerates the channel, recipient-kind, email-status, and type vocab', () => {
    expect(notificationChannelSchema.options).toEqual(['in_app', 'email']);
    expect(notificationRecipientKindSchema.options).toEqual([
      'role',
      'user',
      'email',
    ]);
    expect(emailStatusSchema.options).toEqual(['pending', 'sent', 'failed']);
    expect(notificationTypeSchema.safeParse('lead.created').success).toBe(true);
    expect(notificationTypeSchema.safeParse('bogus').success).toBe(false);
  });

  it('list query: strict, unread is a strict boolean param (N7)', () => {
    const parsed = notificationListQuerySchema.parse({ unread: 'true' });
    expect(parsed.unread).toBe(true);
    expect(parsed.page).toBe(1);
    // never z.coerce.boolean — only the string literals
    expect(
      notificationListQuerySchema.safeParse({ unread: 'yes' }).success,
    ).toBe(false);
    expect(notificationListQuerySchema.safeParse({ nope: 1 }).success).toBe(
      false,
    );
  });

  it('mark-read requires a uuid id (strict)', () => {
    expect(
      notificationMarkReadSchema.safeParse({
        id: '11111111-1111-1111-1111-111111111111',
      }).success,
    ).toBe(true);
    expect(notificationMarkReadSchema.safeParse({ id: 'nope' }).success).toBe(
      false,
    );
  });

  it('exposes the permission catalog + stable patterns', () => {
    expect(NOTIFICATION_PERMISSIONS.read).toBe('notification.read');
    expect(NOTIFICATION_PERMISSIONS.manage).toBe('notification.manage');
    expect(NOTIFICATION_LIST).toBe('notification.list');
    expect(NOTIFICATION_MARK_READ).toBe('notification.mark-read');
  });
});
