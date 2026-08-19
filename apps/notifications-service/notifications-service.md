# notifications-service

> Event-driven email + in-app notifications. The first real cross-service consumer of
> content's `lead.created` Outbox event (P6). Own DB (`notifications`, MS5).

## Purpose

On a contact-form lead it sends email **and** creates an in-app notification — **exactly
once even on redelivery** (the P6 acceptance criterion). It consumes `lead.created` over
RabbitMQ (MS6 idempotent consumer), serves the in-app notifications read surface to the
gateway (MS2), and resolves its FULL SMTP config from the settings-service integrations
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

`EmailProvider` (abstract) is ALWAYS bound to `SmtpEmailProvider` (nodemailer): the whole config
now resolves lazily from the integrations vault, so the binding can no longer be decided from env
at boot (the owner may configure email after the service started). When it isn't fully configured
the provider delegates to `ConsoleEmailProvider` internally (dev-safe — logs instead of sending).
The full connection resolves **vault → env → null** via `settings.integration.resolve`
(capability `email`, MS2) — see `smtp-credentials.ts` — cached ~60s so an admin change applies
without a restart. `testConnection(provider, locale)` backs the admin's "Test connection"
(`notification.email.test`, a real transport `verify()`) and returns
`{ ok, message, detail? }`. Visitor acknowledgement templates are ar (default) + en, by the lead's
locale (U8). The body templates live in code (transactional email, not website content).

## Localization (U24)

- **Errors are keys.** `NotificationQueryService` throws
  `rpcError(404, 'notifications.notFound')` and the message-controller
  `rpcError(401, 'auth.noIdentity')` — from [`@sanad/i18n`](../../libs/shared/i18n/i18n.md).
  The text lives only in the ar/en catalogs and is rendered once at the gateway edge.
- **Payload-embedded text is translated here.** The test-connection `message` is inside the
  payload, out of the envelope renderer's reach (U24d), so
  [`email-test.message-controller.ts`](src/notification/presentation/email-test.message-controller.ts)
  reads the forwarded locale with `resolveRequestLocale(readMessageHeaders(ctx))` and passes it
  into `SmtpEmailProvider.testConnection(provider, locale)`; a non-SMTP binding answers the
  localized `settings.test.unsupported`. `detail` carries nodemailer's own untranslated text
  (`ENOTFOUND`, …) so the owner can diagnose the host/credential (U24e).
- Visitor **email bodies** were already per-lead-locale (U8) — the same principle, older
  than the rule.

## Gateway surface (MS4, guarded `notification.read`)

- `GET /api/notifications` — the caller's in-app notices (scoped to their roles ∪ id),
  paginated; `?unread=true` filter.
- `PATCH /api/notifications/:id/read` — mark one read (only if it belongs to the caller).

## Settings / secrets used

- The WHOLE SMTP connection (`host`/`port`/`secure`/`user`/`password`/`from`) resolves from the
  settings **integrations** vault (`settings.integration.resolve` for capability `email`), each
  field falling back to its `SMTP_*` env var (N13/U9). Previously only `SMTP_PASSWORD` came from
  the vault, so email was not actually configurable from the admin. The config is cached for
  `EMAIL_CONFIG_TTL_MS` (~60s) and the transport rebuilt only on a real change — an admin change
  applies **without a restart** (the old resolve-once latch needed a redeploy).
  `NOTIFICATIONS_TEAM_EMAIL`
  are this service's env (U19).

## Testing (TDD)

- unit specs: `smtp-credentials.spec.ts` (full-set vault → env → null, per-field merge),
  `email-providers.spec.ts` (console resolves; SMTP unconfigured logs, never throws).
- `lead-created-db.int.spec.ts` on **`notifications_test`** (TDD2) — the acceptance proof:
  one event → 3 rows + 2 emails + 1 ledger row; the **same** event again → still 3 rows, still
  1 ledger row, **0 new emails** (exactly-once); visitor ack rendered in the lead locale.

### Emails are localized too (U24d)

Email bodies are payload text the gateway's renderer never sees, so they are composed in-service:

- **`visitorAckEmail`** follows the **lead's own** `locale` — the visitor is answered in the
  language of the page they filled in.
- **`teamAlertEmail`** follows **`NOTIFICATIONS_TEAM_LOCALE`** (typed env, U19; `ar` by default),
  with its subject, heading and field labels coming from the `notifications.leadAlert.*` catalog
  keys and `dir` derived from the locale. It was English-only prose until the U24 sweep — staff
  are Arabic-first too. The lead's own values (name, message, source) are **data** and pass
  through untranslated. Since **P8.10.B1** it carries the lead's **phone** row — formatted by the
  shared `formatPhoneInternational` and wrapped in a `tel:` link so the team calls from the alert,
  `dir="ltr"` in both locales, an em-dash when the lead predates the field.

## Event catalog (U27)

Every event this service emits or consumes is declared once in the **`EVENT_CATALOG`**
(`libs/contracts/src/lib/events/`), with its payload schema, its producer and its consumers —
and the publish path is typed against it, so an un-catalogued name is a typecheck failure
(`createOutboxRecord` only accepts a `BrokerEventName`). Adding an event here means adding its
`*.event.ts` to the catalog in the same change.
