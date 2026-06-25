# notifications-service

> Event-driven email + in-app notifications. The first real cross-service consumer of
> content's `lead.created` Outbox event (P6). Own DB (`notifications`, MS5).

## Purpose

On a contact-form lead it sends email **and** creates an in-app notification — **exactly
once even on redelivery** (the P6 acceptance criterion). It consumes `lead.created` over
RabbitMQ (MS6 idempotent consumer), serves the in-app notifications read surface to the
gateway (MS2), and resolves its SMTP password from the settings-service integration-secrets
vault (N13). It emits no domain events (no Outbox).

## Entities (own DB — `notifications`)

- **`notification`** — one row per notice. `recipientKind` (`role`|`user`|`email`) +
  `recipient` discriminate the target; `channel` (`in_app`|`email`); `type`
  (`lead.created`|`lead.received.ack`); `payload` (typed jsonb — the lead summary);
  `emailStatus` (`pending`|`sent`|`failed`, null for in-app) is the durable record of email
  intent; `sentAt`/`readAt`; timestamps. Indexed by `(recipient_kind, recipient)` + `channel`.
- **`processed_message`** — the idempotency ledger (MS6). PK `(consumer_id, message_id)`;
  `message_id` is the producer's outbox record id (the lead's `id` here).

A new lead fans out to **3 rows** in one transaction: an in-app notice (`role`=`admin`), a
team email (`NOTIFICATIONS_TEAM_EMAIL`), and a localized visitor acknowledgement email.

## Contracts (`@sanad/contracts` `notifications/`, U3)

- `Notification` (in-app DTO), `NotificationPayload`/`LeadNotificationPayload`.
- Enums: `notificationChannelSchema`, `notificationRecipientKindSchema`, `emailStatusSchema`,
  `notificationTypeSchema`.
- `notificationListQuerySchema` (extends the shared list query + strict `unread` boolean, N7),
  `notificationMarkReadSchema`.
- `NOTIFICATION_PERMISSIONS` (`notification.read`, `notification.manage`).
- Message patterns: `NOTIFICATION_LIST`, `NOTIFICATION_MARK_READ`.

## Events consumed / emitted

- **Consumes** `lead.created` (`leadCreatedEventSchema`, U16) on the **`content.events`**
  queue (the relay emits onto the producer's events queue; notifications is the sole
  subscriber). Manual ack; poison/transient → `nack(no-requeue)` (MS6; a DLQ + retry counter
  is a future `@sanad/messaging` enhancement).
- **Emits** nothing (no Outbox in P6).

## Idempotency (the acceptance guarantee)

`LeadNotificationService.handleLeadCreated` runs inside an injected **`TransactionRunner`**
(N14 — the service never holds `DRIZZLE`): in one tx it `claim`s the `processed_message`
row and inserts the 3 notification rows. A redelivered event's claim conflicts → the work
returns null → no rows, no emails. Emails are dispatched **after** commit (you can't hold a
tx across an SMTP call); the rows are the durable record (`email_status`), so a future
sweeper can retry failures.

## Email (the seam, N13)

`EmailProvider` (abstract) is bound to `SmtpEmailProvider` (nodemailer) when `SMTP_HOST` is
set, else `ConsoleEmailProvider` (dev-safe — logs instead of sending). The SMTP **password**
resolves lazily **vault → env → null** via `settings.resolve-secret` (MS2) — see
`smtp-credentials.ts`. Visitor acknowledgement templates are ar (default) + en, by the lead's
locale (U8). The body templates live in code (transactional email, not website content).

## Gateway surface (MS4, guarded `notification.read`)

- `GET /api/notifications` — the caller's in-app notices (scoped to their roles ∪ id),
  paginated; `?unread=true` filter.
- `PATCH /api/notifications/:id/read` — mark one read (only if it belongs to the caller).

## Settings / secrets used

- `SMTP_PASSWORD` resolved from the settings integration-secrets vault (N13), env fallback
  `SMTP_PASSWORD`. Other SMTP config (host/port/secure/user/from) + `NOTIFICATIONS_TEAM_EMAIL`
  are this service's env (U19).

## Testing (TDD)

- `secret-cipher`-style unit specs: `smtp-credentials.spec.ts` (vault → env → null),
  `email-providers.spec.ts` (console resolves; SMTP unconfigured logs, never throws).
- `lead-created-db.int.spec.ts` on **`notifications_test`** (TDD2) — the acceptance proof:
  one event → 3 rows + 2 emails + 1 ledger row; the **same** event again → still 3 rows, still
  1 ledger row, **0 new emails** (exactly-once); visitor ack rendered in the lead locale.
