import type { DashboardStats } from '@sanad/contracts';
import { useEventBus } from '../../../../data/events';
import { useGetDashboardStatsQuery } from '../../api/dashboard.api';

interface UseDashboardResult {
  stats: DashboardStats | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Dashboard logic (U5): the aggregated query plus W4 freshness — every event that can move a
 * rendered number refetches, so the page never goes stale. `DashboardCounts` counts services
 * and blog posts too, so those two content events belong here as much as the leads one (U27).
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
  useEventBus('content.service.changed', () => {
    void refetch();
  });
  useEventBus('content.blog.changed', () => {
    void refetch();
  });

  return { stats: data, isLoading, isError };
}
