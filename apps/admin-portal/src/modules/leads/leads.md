# leads (admin module)

**Purpose.** The leads inbox — the requests captured from the website contact / request-a-
project forms. Admins triage each lead through its lifecycle (`new → contacted → archived`)
inline (P7.D, S2). Read + status update are `content.manage`-guarded.

## Surface

- `LeadsPage` (`/leads`) — a kit `DataTable` with **status** + **source** filters, columns
  client (name + email), **phone**, company, source (Badge), status (inline control), received
  date (sortable, defaults newest-first). No create (leads come from the public site), no delete
  (they archive). The DataTable's free-text search covers the phone too (the backend's
  `LEAD_FILTERS.search` whitelist, N7), so a number pasted from a missed call finds its lead.
- `PhoneLink` (`src/components/phone-link/`, shared — the dashboard's recent-lead row uses it
  too, F9) — renders the stored E.164 number through the shared `formatPhoneInternational`
  (F8/U3: the same helper the team alert email uses) inside a `tel:` link, `dir="ltr"` in both
  locales, falling back to `—` for a lead captured before P8.10.B1.
- `LeadStatusCell` — the inline status control (W6): managers get a styled `Select` wired to
  the update mutation; read-only users see a tinted `Badge` (new = accent, contacted = good,
  archived = neutral).

## Data (W3)

- **api** `leads.api.ts` (`reducerPath: leadsApi`, registered in `register-apis.ts`):
  - `listLeads(LeadListQuery) → Paginated<Lead>` — `GET /leads`.
  - `updateLeadStatus({id, status}) → Lead` — `PATCH /leads/:id`. Invalidates the `Lead` LIST
    tag and publishes `lead.updated` (W4) so the dashboard refetches.
- **hooks** `use-leads-list.ts` (URL state → whitelisted query, N7 — `status`/`source` parsed
  with the contract schemas, newest-first default) and `use-update-lead-status.ts` (mutation
  - success/error toast).

## Contracts (`@sanad/contracts`, U3)

`Lead` (now carrying `phone: string | null`), `LeadListQuery` (`status`/`source` whitelisted
filters), `LeadStatus` (`new|contacted|archived`), `LeadSource` (`contact|request-project`),
and `formatPhoneInternational` from `common/phone`. No new contract file here — P8.10.B1 added
the phone unit to `@sanad/contracts`, this module only consumes it.

## Events

- **Publishes:** `lead.updated` (after a status change).
- **Consumes:** none.

## Gateway routes used

`GET /api/leads`, `PATCH /api/leads/:id` (both `content.manage`). Pre-existing (P5) — **no
gateway change, no Postman drift (DOC2).**

## i18n

`leads` namespace (`i18n/{ar,en}.json`, parity-checked).
