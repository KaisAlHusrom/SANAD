# Integrations (admin module)

Configure third-party providers per **capability**, then choose which one the platform uses.
Replaces the retired `integration-secrets` module, which rendered **one row per credential key**
(so R2 appeared as six unrelated rows and there was no "R2" thing to configure).

## The model (N13, 2026-07-19)

> **capability** (storage, email) → **many provider configs** (r2, smtp, …) → **one active**

The industry-standard driver/disk pattern (Laravel `filesystems.php` `default` + `disks`; Strapi's
per-plugin provider + `providerOptions`). Everything is derived from `INTEGRATION_CATALOG` in
`@sanad/contracts` — adding a provider there gives it a card row, a working configuration form,
RBAC and Postman coverage with **no UI code**.

## Files

- `api/integrations.api.ts` — `listIntegrations` (`GET /integrations`, masked),
  `configureProvider` (`PUT /integrations/:capability/:provider`),
  `activateProvider` (`PUT /integrations/:capability/active`),
  `testProvider` (`POST /integrations/:capability/:provider/test`). Configure/activate return the
  refreshed catalog, so one round-trip updates the cache.
- `hooks/use-integrations-list.ts` — the page view model: catalog × server state × per-capability
  manage permission (read once from the auth slice, never a hook per capability).
- `hooks/use-provider-config.ts` — **derives the form from the descriptor** (F9, reusing the
  DynamicForm kit): field list, zod schema and prefill. `toSubmitValues` is the important bit —
  a blank **secret** is OMITTED (keep the stored value), a blank **non-secret** is sent as `''`
  (clear it), and numbers/booleans are stringified for the API.
- `hooks/use-provider-test.ts` — the probe; a bad credential is a `{ ok, message, detail? }` RESULT
  rendered inline, not a thrown error.
- `components/` — `integrations-page.tsx` (RenderGate → cards), `capability-card.tsx` (header +
  active badge + provider rows), `provider-row.tsx` (state badges + Configure/Test/Set active),
  `provider-config-modal.tsx` (global-registry modal, W7, reading its provider's masked state from
  the list cache).
- `i18n/{ar,en}.json` — the `integrations` catalog (parity, U8), incl. `field.<provider>.<key>`
  labels.

## Behaviour worth knowing

- **Secrets** render as `••••last4` and start blank — leaving them blank keeps the stored value, so
  editing the bucket never wipes the secret. Non-secret values (bucket, endpoint, host) are shown
  in full and are editable, because the owner needs to see what is configured.
- **Test connection lives on the provider ROW, not in the form.** The probe resolves the **saved**
  config server-side, so testing unsaved edits would report on stale values. Save, then test.
- **The test result is localized by the OWNING service, not here (U24d).** Its `message` lives
  inside the payload, where the gateway's envelope renderer can't reach it, so media-service /
  notifications-service translate it from the locale the portal sent (`x-sanad-locale`, forwarded
  over RMQ) — this module has no `integrations.test.*` strings for it. `provider-row.tsx` renders
  the optional `detail` — the vendor's own untranslated text (`SignatureDoesNotMatch`, `ENOTFOUND`)
  — as a muted `dir="ltr"` monospace second line under the localized message (U24e): the owner
  needs to know _which_ key is wrong, and only the vendor can say it.
- **Set active** is disabled until the provider is configured; a capability shows "None selected"
  until one is chosen.
- Each capability is gated by `settings.integrations.<capability>.manage`, so a card can be
  read-only while another is editable; the page itself needs `settings.integrations.read`.
- The status reflects the **vault only** — a deploy configured purely by service env reads
  "Not configured" here while still working. Test connection is what proves the effective config.
