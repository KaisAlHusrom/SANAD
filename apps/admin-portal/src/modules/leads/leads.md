# leads (admin module)

**Purpose.** The leads inbox — the requests captured from the website contact / request-a-
project forms. Admins triage each lead through its lifecycle (`new → contacted → archived`)
inline (P7.D, S2). Read + status update are `content.manage`-guarded.

## Surface

- `LeadsPage` (`/leads`) — a kit `DataTable` with **status** + **source** filters, columns
  client (name + email), company, source (Badge), status (inline control), received date
  (sortable, defaults newest-first). No create (leads come from the public site), no delete
  (they archive).
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

`Lead`, `LeadListQuery` (`status`/`source` whitelisted filters), `LeadStatus`
(`new|contacted|archived`), `LeadSource` (`contact|request-project`). No new contract.

## Events

- **Publishes:** `lead.updated` (after a status change).
- **Consumes:** none.

## Gateway routes used

`GET /api/leads`, `PATCH /api/leads/:id` (both `content.manage`). Pre-existing (P5) — **no
gateway change, no Postman drift (DOC2).**

## i18n

`leads` namespace (`i18n/{ar,en}.json`, parity-checked).
