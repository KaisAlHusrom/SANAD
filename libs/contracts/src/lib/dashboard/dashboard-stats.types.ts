import type { Lead } from '../content/lead.types.js';
import type { Notification } from '../notifications/notification.types.js';

/**
 * Headline counts for the admin dashboard. The gateway aggregates these by fanning out the
 * existing list patterns with `pageSize 1` and reading `meta.total` (no dedicated count
 * patterns — MS2). A leg that times out / lacks permission degrades to 0, never a 500.
 */
export interface DashboardCounts {
  leadsTotal: number;
  leadsNew: number;
  users: number;
  services: number;
  blogPosts: number;
  unreadNotifications: number;
}

/**
 * The admin dashboard payload: headline counts + the latest leads + the caller's latest
 * in-app activity. Pure response shape (U16). No timeseries (no analytics source yet) — the
 * dashboard shows only honest, real data (WEB1/U9 spirit).
 */
export interface DashboardStats {
  counts: DashboardCounts;
  recentLeads: Lead[];
  recentActivity: Notification[];
}
