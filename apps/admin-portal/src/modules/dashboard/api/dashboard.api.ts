import { createApi } from '@reduxjs/toolkit/query/react';
import type { DashboardStats } from '@sanad/contracts';
import { registerApi } from '../../../data/api/api-registry';
import { baseQueryWithAuth } from '../../../data/api/base-query';

/**
 * Dashboard api (W3) — one aggregated read of headline counts + recent leads + recent
 * activity. The `useDashboard` hook subscribes to `lead.updated` / `notification.read` /
 * `identity.user.changed` and refetches (W4), so the numbers stay live as the admin works.
 */
export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Dashboard'],
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, void>({
      query: () => ({ url: '/dashboard/stats' }),
      providesTags: ['Dashboard'],
    }),
  }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;

registerApi(dashboardApi);
