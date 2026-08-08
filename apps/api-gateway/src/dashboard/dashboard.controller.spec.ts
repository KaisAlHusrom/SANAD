import 'reflect-metadata';
import type { ClientProxy } from '@nestjs/microservices';
import {
  CONTENT_BLOG_POST_LIST,
  CONTENT_LEAD_LIST,
  CONTENT_SERVICE_LIST,
  IDENTITY_USERS_LIST,
  NOTIFICATION_LIST,
  type IdentityContext,
} from '@sanad/contracts';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { DashboardController } from './dashboard.controller.js';

interface SentCall {
  pattern: string;
  payload: Record<string, unknown>;
}

function page(total: number, items: unknown[] = []) {
  return {
    items,
    meta: { page: 1, pageSize: 1, total, totalPages: 1 },
  };
}

/** A fake ClientProxy whose responder maps (pattern, payload) → result or Error (→ throw). */
function fakeClient(
  calls: SentCall[],
  responder: (pattern: string, payload: Record<string, unknown>) => unknown,
): ClientProxy {
  return {
    send: vi.fn(
      (pattern: string, record: { data: Record<string, unknown> }) => {
        const payload = record.data;
        calls.push({ pattern, payload });
        const result = responder(pattern, payload);
        return result instanceof Error ? throwError(() => result) : of(result);
      },
    ),
  } as unknown as ClientProxy;
}

const identity: IdentityContext = {
  userId: 'admin-1',
  roles: ['admin'],
  permissions: ['manage'],
};

describe('DashboardController', () => {
  it('aggregates counts from meta.total and the recent lists', async () => {
    const calls: SentCall[] = [];
    const content = fakeClient(calls, (pattern, payload) => {
      if (pattern === CONTENT_LEAD_LIST) {
        if (payload.status === 'new') return page(4);
        if (payload.pageSize === 5)
          return page(0, [{ id: 'l1' }, { id: 'l2' }]);
        return page(10);
      }
      if (pattern === CONTENT_SERVICE_LIST) return page(7);
      if (pattern === CONTENT_BLOG_POST_LIST) return page(3);
      return page(0);
    });
    const identityClient = fakeClient(calls, (pattern) =>
      pattern === IDENTITY_USERS_LIST ? page(5) : page(0),
    );
    const notifications = fakeClient(calls, (_pattern, payload) =>
      payload.unread === true ? page(2) : page(0, [{ id: 'n1' }]),
    );

    const controller = new DashboardController(
      content,
      identityClient,
      notifications,
    );
    const result = await controller.stats(identity, 'ar');

    expect(result.counts).toEqual({
      leadsTotal: 10,
      leadsNew: 4,
      users: 5,
      services: 7,
      blogPosts: 3,
      unreadNotifications: 2,
    });
    expect(result.recentLeads).toHaveLength(2);
    expect(result.recentActivity).toHaveLength(1);
  });

  it('requests recent leads newest-first (pageSize 5, createdAt desc)', async () => {
    const calls: SentCall[] = [];
    const content = fakeClient(calls, () => page(0));
    const identityClient = fakeClient(calls, () => page(0));
    const notifications = fakeClient(calls, () => page(0));

    await new DashboardController(content, identityClient, notifications).stats(
      identity,
      'ar',
    );

    const recentLeads = calls.find(
      (c) => c.pattern === CONTENT_LEAD_LIST && c.payload.pageSize === 5,
    );
    expect(recentLeads?.payload).toMatchObject({
      pageSize: 5,
      sort: 'createdAt',
      order: 'desc',
    });
    const unread = calls.find(
      (c) => c.pattern === NOTIFICATION_LIST && c.payload.unread === true,
    );
    expect(unread).toBeDefined();
  });

  it('degrades a failing leg to 0 instead of throwing', async () => {
    const calls: SentCall[] = [];
    const content = fakeClient(calls, (pattern, payload) => {
      if (pattern === CONTENT_LEAD_LIST && payload.status !== 'new')
        return page(8);
      return page(0);
    });
    // identity service is down → users leg rejects
    const identityClient = fakeClient(calls, () => new Error('identity down'));
    const notifications = fakeClient(calls, () => page(0));

    const result = await new DashboardController(
      content,
      identityClient,
      notifications,
    ).stats(identity, 'ar');

    expect(result.counts.users).toBe(0);
    expect(result.counts.leadsTotal).toBe(8);
  });
});
