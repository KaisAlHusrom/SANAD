# notifications (admin module)

**Purpose.** The topbar notifications bell — an unread-count overlay plus a popover of recent
in-app notices, with click-to-mark-read. It is the first consumer of the P6 notifications
service from the admin (P7.D, S1).

## Surface

- `NotificationsBell` — mounted once in the shell `Topbar` (W1/F10). **Self-gates** on
  `notification.read` (renders `null` without it, like `MediaPickerField`). Shows the unread
  count (capped at `9+`) and, on open, a `Popover` listing recent notices.
- `NotificationItem` — one dropdown row: a tinted type icon, the localized summary (lead name
  interpolated), the formatted time (F8 `useFormatDateTime`), an unread dot.

## Data (W3)

- **api** `notifications.api.ts` (`reducerPath: notificationsApi`, registered in
  `data/store/register-apis.ts`):
  - `listNotifications(NotificationListQuery) → Paginated<Notification>` — `GET /notifications`.
    Identity-scoped server-side (the query never carries the audience). The hook fires it
    twice: an **unread probe** (`pageSize 1, unread true` → reads `meta.total`) and the
    **recent list** (`pageSize 10`, newest-first — the service always orders `createdAt desc`).
  - `markNotificationRead(id) → Notification` — `PATCH /notifications/:id/read`. Invalidates
    the `Notification` LIST tag (both queries refetch) and publishes `notification.read` (W4).
- **hook** `use-notifications.ts` — composes the two queries + `markRead`; the bell stays
  presentational (U5).

## Contracts (`@sanad/contracts`, U3)

`Notification` (`{id, channel, type, payload, readAt, createdAt}`), `NotificationListQuery`
(`unread` whitelisted filter), `LeadNotificationPayload` (lead summary). No new contract —
consumes the existing P6 surface.

## Events

- **Publishes:** `notification.read` (after a successful mark-read) — the dashboard subscribes
  to refetch its "recent activity".
- **Consumes:** none.

## Gateway routes used

`GET /api/notifications`, `PATCH /api/notifications/:id/read` (both `notification.read`).
Pre-existing (P6) — **no gateway change, no Postman drift (DOC2).**

## i18n

`notifications` namespace (`i18n/{ar,en}.json`, parity-checked). Notification-type labels are
flat keys (`item.leadCreated`/`item.leadAck`) because the dotted `NotificationType` literals
would otherwise be read as i18next nesting.
