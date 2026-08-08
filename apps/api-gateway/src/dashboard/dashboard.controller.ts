import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CurrentUser,
  JwtAuthGuard,
  PermissionsGuard,
  RequirePermissions,
  type IdentityContext,
} from '@sanad/auth';
import {
  CONTENT_BLOG_POST_LIST,
  CONTENT_LEAD_LIST,
  CONTENT_PERMISSIONS,
  CONTENT_SERVICE_LIST,
  IDENTITY_USERS_LIST,
  NOTIFICATION_LIST,
  type AuthUser,
  type BlogPostItem,
  type DashboardStats,
  type Lead,
  type Notification,
  type Paginated,
  type ServiceItem,
  type Locale,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import { RequestLocale } from '../core/decorators/index.js';
import { forwardHeaders } from '../core/helpers/index.js';
import {
  CONTENT_CLIENT,
  IDENTITY_CLIENT,
  NOTIFICATIONS_CLIENT,
} from '../core/injection-tokens.js';

/** A zero page used when a downstream read fails — keeps the dashboard rendering (never 500). */
function emptyPage<T>(): Paginated<T> {
  return { items: [], meta: { page: 1, pageSize: 1, total: 0, totalPages: 0 } };
}

const RECENT_LIMIT = 5;

/**
 * The admin dashboard aggregation (MS2/MS4). Fans out the existing list patterns across the
 * content / identity / notifications services via `sendRequest` (timeout + catchError built
 * in) and composes one payload (API composition). Counts come from `meta.total` on
 * `pageSize 1` reads; each leg degrades to an empty page on failure so a slow/forbidden
 * downstream yields a 0, not a 500. Guarded by `content.read` (every staff role that sees the
 * dashboard); the admin `manage` wildcard covers all legs.
 */
@Controller('dashboard')
export class DashboardController {
  constructor(
    @Inject(CONTENT_CLIENT) private readonly content: ClientProxy,
    @Inject(IDENTITY_CLIENT) private readonly identity: ClientProxy,
    @Inject(NOTIFICATIONS_CLIENT) private readonly notifications: ClientProxy,
  ) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(CONTENT_PERMISSIONS.read)
  async stats(
    @CurrentUser() identity: IdentityContext,
    @RequestLocale() locale: Locale,
  ): Promise<DashboardStats> {
    const headers = forwardHeaders(identity, locale);
    const read = <T>(
      client: ClientProxy,
      pattern: string,
      payload: object,
    ): Promise<Paginated<T>> =>
      sendRequest<Paginated<T>>(client, pattern, payload, { headers }).catch(
        () => emptyPage<T>(),
      );

    const [
      leadsAll,
      leadsNew,
      recentLeads,
      users,
      services,
      blogPosts,
      unread,
      recentActivity,
    ] = await Promise.all([
      read<Lead>(this.content, CONTENT_LEAD_LIST, { page: 1, pageSize: 1 }),
      read<Lead>(this.content, CONTENT_LEAD_LIST, {
        page: 1,
        pageSize: 1,
        status: 'new',
      }),
      read<Lead>(this.content, CONTENT_LEAD_LIST, {
        page: 1,
        pageSize: RECENT_LIMIT,
        sort: 'createdAt',
        order: 'desc',
      }),
      read<AuthUser>(this.identity, IDENTITY_USERS_LIST, {
        page: 1,
        pageSize: 1,
      }),
      read<ServiceItem>(this.content, CONTENT_SERVICE_LIST, {
        page: 1,
        pageSize: 1,
      }),
      read<BlogPostItem>(this.content, CONTENT_BLOG_POST_LIST, {
        page: 1,
        pageSize: 1,
      }),
      read<Notification>(this.notifications, NOTIFICATION_LIST, {
        page: 1,
        pageSize: 1,
        unread: true,
      }),
      read<Notification>(this.notifications, NOTIFICATION_LIST, {
        page: 1,
        pageSize: RECENT_LIMIT,
      }),
    ]);

    return {
      counts: {
        leadsTotal: leadsAll.meta.total,
        leadsNew: leadsNew.meta.total,
        users: users.meta.total,
        services: services.meta.total,
        blogPosts: blogPosts.meta.total,
        unreadNotifications: unread.meta.total,
      },
      recentLeads: recentLeads.items,
      recentActivity: recentActivity.items,
    };
  }
}
