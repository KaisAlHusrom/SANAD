import type { Notification, Paginated } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { eventBus } from '../../../data/events/event-bus';
import { createAppStore } from '../../../data/store/store';
import {
  notificationsApi,
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
} from './notifications.api';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const page: Paginated<Notification> = {
  items: [],
  meta: { page: 1, pageSize: 1, total: 3, totalPages: 3 },
};

let lastUrl = '';

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof Request) return input.url;
  return input.toString();
}

beforeEach(() => {
  lastUrl = '';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: RequestInfo | URL) => {
      lastUrl = urlOf(input);
      return Promise.resolve(
        jsonResponse({ success: true, message: 'ok', data: page }),
      );
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('notificationsApi', () => {
  it('lists from /notifications with the unread probe params', async () => {
    const store = createAppStore();
    store.dispatch(
      identityLoaded({
        userId: 'u',
        roles: ['admin'],
        permissions: ['manage'],
      }),
    );
    await store
      .dispatch(
        notificationsApi.endpoints.listNotifications.initiate({
          page: 1,
          pageSize: 1,
          order: 'desc',
          unread: true,
        }),
      )
      .unwrap();
    expect(lastUrl).toContain('/notifications');
    expect(lastUrl).toContain('unread=true');
    expect(lastUrl).toContain('pageSize=1');
  });

  it('marks a notification read and publishes notification.read', async () => {
    const store = createAppStore();
    store.dispatch(
      identityLoaded({
        userId: 'u',
        roles: ['admin'],
        permissions: ['manage'],
      }),
    );
    const spy = vi.fn();
    const off = eventBus.subscribe(spy);

    await store
      .dispatch(notificationsApi.endpoints.markNotificationRead.initiate('n1'))
      .unwrap();

    expect(lastUrl).toContain('/notifications/n1/read');
    expect(spy).toHaveBeenCalledWith({ type: 'notification.read' });
    off();
  });

  it('exposes the generated hooks', () => {
    expect(useListNotificationsQuery).toBeTypeOf('function');
    expect(useMarkNotificationReadMutation).toBeTypeOf('function');
  });
});
