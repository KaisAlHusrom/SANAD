import type { DashboardStats } from '@sanad/contracts';
import { useEventBus } from '../../../data/events';
import { useGetDashboardStatsQuery } from '../api/dashboard.api';

interface UseDashboardResult {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Dashboard logic (U5): the aggregated query plus W4 freshness — a lead status change, a
 * read notification, or a user change refetches the numbers so the page never goes stale.
 */
export function useDashboard(): UseDashboardResult {
  const { data, isLoading, isError, refetch } = useGetDashboardStatsQuery();

  useEventBus('lead.updated', () => {
    void refetch();
  });
  useEventBus('notification.read', () => {
    void refetch();
  });
  useEventBus('identity.user.changed', () => {
    void refetch();
  });

  return { stats: data, isLoading, isError };
}
