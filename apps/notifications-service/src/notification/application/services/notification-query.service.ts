import { HttpStatus, Injectable } from '@nestjs/common';
import type { IdentityContext } from '@sanad/auth';
import type {
  Notification,
  NotificationListQuery,
  Paginated,
} from '@sanad/contracts';
import { rpcError } from '@sanad/i18n';
import type { NotificationRow } from '../../../db/schema/index.js';
import { NotificationRepository } from '../../infrastructure/persistence/repositories/index.js';

/**
 * Reads the in-app notifications surface (P7). Scopes every read to the caller's identity
 * (their roles ∪ their id) — a client can never see another audience's notices. Thin
 * application layer (N14): depends only on the repository, maps rows → the `Notification`
 * response DTO (email-channel rows + recipient targeting stay server-side).
 */
@Injectable()
export class NotificationQueryService {
  constructor(private readonly notifications: NotificationRepository) {}

  async list(
    identity: IdentityContext,
    query: NotificationListQuery,
  ): Promise<Paginated<Notification>> {
    const page = await this.notifications.listForIdentity(
      identity.roles,
      identity.userId,
      { page: query.page, pageSize: query.pageSize, unread: query.unread },
    );
    return { items: page.items.map(toNotification), meta: page.meta };
  }

  async markRead(identity: IdentityContext, id: string): Promise<Notification> {
    const row = await this.notifications.markReadForIdentity(
      identity.roles,
      identity.userId,
      id,
    );
    if (!row) {
      throw rpcError(HttpStatus.NOT_FOUND, 'notifications.notFound');
    }
    return toNotification(row);
  }
}

/** Map a row to the in-app `Notification` DTO (timestamps → ISO; no recipient leak). */
function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    channel: row.channel,
    type: row.type,
    payload: row.payload,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}
