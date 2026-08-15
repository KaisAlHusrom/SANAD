# dashboard (admin module)

**Purpose.** The admin home (`/`) — headline counts plus the latest leads and the caller's
latest in-app activity, aggregated from across the services in one read (P7.D, S4). No
timeseries charts: there is no analytics source yet, so the dashboard shows only honest, real
data (WEB1/U9 spirit).

## Surface

- `DashboardPage` (`/`) — a grid of `StatCard`s (new leads, total leads, team members,
  services, blog posts, unread notifications) + two panels: recent leads + recent activity.
  Render-gated skeleton → error → data (F2).
- `StatCard` — a bordered metric card (label, tinted icon, value).
- `RecentLeadRow` — a display-only lead row (name, status Badge, date).
- Recent activity reuses `NotificationItem` from the notifications module (display-only, no
  `onMarkRead`).

## Data (W3)

- **api** `dashboard.api.ts` (`reducerPath: dashboardApi`, registered in `register-apis.ts`):
  `getDashboardStats() → DashboardStats` — `GET /dashboard/stats`.
- **hook** `use-dashboard.ts` — the query plus W4 freshness: subscribes to `lead.updated`,
  `notification.read`, `identity.user.changed` and refetches.

## Contracts (`@sanad/contracts`, U3)

New: `DashboardStats` (`{counts, recentLeads, recentActivity}`) + `DashboardCounts`
(`dashboard-stats.types.ts`). Pure response shapes (U16).

## Events

- **Publishes:** none.
- **Consumes:** `lead.updated`, `notification.read`, `identity.user.changed`,
  **`content.service.changed`**, **`content.blog.changed`** (all refetch).

The last two were added in P8.7 as a U27 half-wired finding, not housekeeping: `DashboardCounts`
carries `services` and `blogPosts`, which are derived from exactly those collections — so before this
the tiles went stale on every service/blog edit while the events were published to nobody.

## Gateway route used

`GET /api/dashboard/stats` (`content.read`) — **new** in S3. The gateway aggregates the
existing list patterns (counts via `pageSize 1` `meta.total`, recents via `pageSize 5`) across
content / identity / notifications; each leg degrades to 0 on failure (never 500). Added to
`docs/postman` (DOC2).

## i18n

`dashboard` namespace (`i18n/{ar,en}.json`, parity-checked). Recent-lead status labels come
from the `leads` namespace (reused).
