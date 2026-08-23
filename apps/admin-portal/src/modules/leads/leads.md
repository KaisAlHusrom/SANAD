# leads (admin module)

**Purpose.** The leads inbox — the requests captured from the website contact / request-a-
project forms. Admins triage each lead through its lifecycle (`new → contacted → archived`)
inline (P7.D, S2). Read + status update are `content.manage`-guarded.

## Surface

- `LeadsPage` (`/leads`) — a kit `DataTable` with **status** + **source** + **spam** filters,
  columns client (name + email), **phone**, company, source (Badge), status (inline control),
  **spam** (sortable on `spamScore`), received date (sortable, defaults newest-first). No create
  (leads come from the public site), no delete (they archive). The DataTable's free-text search
  covers the phone too (the backend's `LEAD_FILTERS.search` whitelist, N7), so a number pasted
  from a missed call finds its lead.
  A lead that has written more than once wears a **`×N` badge** beside the client name and shows its
  latest submission under the received date (P8.10.B2). Both appear **only** when the count is > 1 —
  a badge on every row is noise, not a signal.
  Two distinct **empty states** (U23): a first-use inbox explains where leads come from; a
  filtered-to-nothing one offers _Show all leads_ (`list.clearFilters`) — the likeliest empty this
  module produces is filtering to _Likely spam_ and finding none.
- `LeadSpamBadge` (`components/lead-spam-badge/`) — the P8.10.B3 signal. Renders **nothing** for a
  `clean` verdict; otherwise a score pill (`warn` for _possibly spam_, `bad` for _likely spam_,
  `data-verdict` carrying the band) that opens a `Popover` breakdown: one line per fired signal with
  its localized label, its count where it has one, and its `+weight` pinned `dir="ltr"` so a signed
  number stays readable in Arabic (U7). The footer states outright that a score **never blocks,
  archives or hides a lead** — a number the team does not trust is worse than no number. The verdict
  comes from `spamVerdictOf` in `@sanad/contracts`, never from a local threshold (U3).
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
- **hooks** `use-leads-list.ts` (URL state → whitelisted query, N7 — `status`/`source`/`spam` each
  parsed with the contract schemas, newest-first default) and `use-update-lead-status.ts` (mutation
  - success/error toast). A filter key must appear in **both** `filterKeys` and `buildLeadsQuery`:
    the first is also what "clear all" clears, so a key missing there sticks in the URL forever.

## Contracts (`@sanad/contracts`, U3)

`Lead` (carrying `phone: string | null`, `submissionCount` / `lastSubmittedAt`, and
`spamScore` / `spamSignals`), `LeadListQuery` (`status`/`source`/`spam` whitelisted
filters), `LeadStatus` (`new|contacted|archived`), `LeadSource` (`contact|request-project`),
`LeadSpamVerdict` + `spamVerdictOf` + `LEAD_SPAM_BANDS` (P8.10.B3 — the score→verdict table both
this module and content-service read), and `formatPhoneInternational` from `common/phone`. No new
contract file is authored here — this module only consumes them.

## Events

- **Publishes:** `lead.updated` (after a status change).
- **Consumes:** none.

## Gateway routes used

`GET /api/leads`, `PATCH /api/leads/:id` (both `content.manage`). Pre-existing (P5) — **no
gateway change, no Postman drift (DOC2).**

## i18n

`leads` namespace (`i18n/{ar,en}.json`, parity-checked).
