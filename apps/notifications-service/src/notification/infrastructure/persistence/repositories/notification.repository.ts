import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import type { Paginated } from '@sanad/contracts';
import type { DbExecutor } from '../../../../db/executor.js';
import {
  notificationTable,
  type NotificationInsert,
  type NotificationRow,
  type NotificationsDb,
} from '../../../../db/schema/index.js';

/** Recipient-scope + paging args for an identity's in-app notification list. */
export interface NotificationListParams {
  page: number;
  pageSize: number;
  unread?: boolean;
}

/**
 * Data access for notification rows (N1). A plain repository (not the entity-CRUD base) —
 * the recipient-scoped reads (`role` audience ∪ `user` id) + the in-tx batch insert are
 * specialized aggregates. Holds the `DRIZZLE` handle (a repository, allowed by N1/N14);
 * the application service threads a `tx` into `insertMany` for the atomic consumer write.
 */
@Injectable()
export class NotificationRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: NotificationsDb,
    private readonly dateTime: DateTimeService,
  ) {}

  /** Insert N notification rows inside the caller's transaction (MS6). */
  async insertMany(
    exec: DbExecutor,
    rows: NotificationInsert[],
  ): Promise<NotificationRow[]> {
    if (rows.length === 0) {
      return [];
    }
    return exec.insert(notificationTable).values(rows).returning();
  }

  /** The in-app notices visible to an identity (their roles ∪ their id), newest first. */
  async listForIdentity(
    roles: string[],
    userId: string,
    params: NotificationListParams,
  ): Promise<Paginated<NotificationRow>> {
    const where = and(
      eq(notificationTable.channel, 'in_app'),
      or(
        and(
          eq(notificationTable.recipientKind, 'role'),
          inArray(notificationTable.recipient, roles),
        ),
        and(
          eq(notificationTable.recipientKind, 'user'),
          eq(notificationTable.recipient, userId),
        ),
      ),
      params.unread ? isNull(notificationTable.readAt) : undefined,
    );

    const totals = await this.db
      .select({ value: sql<number>`count(*)::int` })
      .from(notificationTable)
      .where(where);
    const total = totals[0]?.value ?? 0;

    const items = await this.db
      .select()
      .from(notificationTable)
      .where(where)
      .orderBy(desc(notificationTable.createdAt))
      .limit(params.pageSize)
      .offset((params.page - 1) * params.pageSize);

    return {
      items,
      meta: {
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      },
    };
  }

  /** Mark one in-app notice read IF it belongs to the identity; returns the row or null. */
  async markReadForIdentity(
    roles: string[],
    userId: string,
    id: string,
  ): Promise<NotificationRow | null> {
    const now = this.dateTime.now().toJSDate();
    const updated = await this.db
      .update(notificationTable)
      .set({ readAt: now, updatedAt: now })
      .where(
        and(
          eq(notificationTable.id, id),
          eq(notificationTable.channel, 'in_app'),
          or(
            and(
              eq(notificationTable.recipientKind, 'role'),
              inArray(notificationTable.recipient, roles),
            ),
            and(
              eq(notificationTable.recipientKind, 'user'),
              eq(notificationTable.recipient, userId),
            ),
          ),
        ),
      )
      .returning();
    return updated[0] ?? null;
  }

  /** Stamp an email-channel row dispatched (after the consumer tx commits). */
  async markEmailSent(id: string): Promise<void> {
    const now = this.dateTime.now().toJSDate();
    await this.db
      .update(notificationTable)
      .set({ emailStatus: 'sent', sentAt: now, updatedAt: now })
      .where(eq(notificationTable.id, id));
  }

  /** Stamp an email-channel row as failed (a future sweeper can retry, MS6/MS7). */
  async markEmailFailed(id: string): Promise<void> {
    await this.db
      .update(notificationTable)
      .set({ emailStatus: 'failed', updatedAt: this.dateTime.now().toJSDate() })
      .where(eq(notificationTable.id, id));
  }
}
