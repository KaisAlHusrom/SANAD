import type { Notification } from '@sanad/contracts';
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
} from '../api/notifications.api';
import {
  BELL_PAGE_SIZE,
  UNREAD_PROBE_PAGE_SIZE,
} from '../notifications.constants';

interface UseNotificationsResult {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  markRead: (id: string) => Promise<void>;
}

/**
 * Bell logic (U5): a cheap unread-count probe (reads only `meta.total`) plus the recent
 * dropdown list (newest-first, server-ordered). The view stays presentational. `markRead`
 * invalidates the LIST tag so both queries refetch.
 */
export function useNotifications(): UseNotificationsResult {
  const unread = useListNotificationsQuery({
    page: 1,
    pageSize: UNREAD_PROBE_PAGE_SIZE,
    order: 'desc',
    unread: true,
  });
  const recent = useListNotificationsQuery({
    page: 1,
    pageSize: BELL_PAGE_SIZE,
    order: 'desc',
  });
  const [markNotificationRead] = useMarkNotificationReadMutation();

  const markRead = async (id: string): Promise<void> => {
    await markNotificationRead(id).unwrap();
  };

  return {
    items: recent.data?.items ?? [],
    unreadCount: unread.data?.meta.total ?? 0,
    isLoading: recent.isLoading,
    isError: recent.isError,
    markRead,
  };
}
