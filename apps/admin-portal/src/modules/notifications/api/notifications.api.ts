import { createApi } from '@reduxjs/toolkit/query/react';
import type {
  Notification,
  NotificationListQuery,
  Paginated,
} from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';
import { eventBus } from '../../../data/events/event-bus';

/**
 * In-app notifications api for the topbar bell (W3). The list is identity-scoped server-side
 * (the query never carries the audience). `markNotificationRead` invalidates the LIST tag so
 * both the dropdown and the unread-count probe refetch, and publishes `notification.read`
 * (W4) so the dashboard refetches its "recent activity".
 */
export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Notification'],
  endpoints: (builder) => ({
    listNotifications: builder.query<
      Paginated<Notification>,
      NotificationListQuery
    >({
      query: (params) => ({ url: '/notifications', params }),
      providesTags: (result) => [
        { type: 'Notification', id: 'LIST' },
        ...(result?.items ?? []).map((notification) => ({
          type: 'Notification' as const,
          id: notification.id,
        })),
      ],
    }),
    markNotificationRead: builder.mutation<Notification, string>({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notification', id: 'LIST' }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          await queryFulfilled;
          eventBus.publish({ type: 'notification.read' });
        } catch {
          // surfaced to the caller via `.unwrap()`
        }
      },
    }),
  }),
});

export const { useListNotificationsQuery, useMarkNotificationReadMutation } =
  notificationsApi;

registerApi(notificationsApi);
