# Admin-portal shared UI kit (P7.C Phase 0 — Wave 2)

> The reusable CRUD/UI systems every admin surface is built from. Extracted best-of from the
> owner's React references and rebuilt on **our** stack — React 19 + Radix/shadcn-on-tokens
> (`.claude/design/design-spec.md`) + RTK Query + react-hook-form + Zod + i18next (ar default,
> RTL). Logic lives in `use-*` hooks (U5); components are presentation-only; tokens-only (U6);
> full RTL via logical properties (U7); ar/en parity (U8/F13); strict types (U4).
>
> **Wave 1** (modal registry · toast · ConfirmationModal) shipped earlier. **Wave 2** (this doc)
> adds the three big systems. Spec: `.claude/plans/07-shared-ui-systems.md` §4–6.

## Decoupling contract (W5)

ServerSelect and DynamicForm's server-backed fields **never import another module's api**.
The caller passes its own **lazy RTK Query hooks** (a search hook + a resolve-by-id hook) from
a shared `src/data/lookups/<x>-lookup.api.ts`. The kit imports no feature api — it stays
generic and reusable across every entity.

## 1. ServerSelect — `src/components/server-select/`

The W5 server-searched picker. Radix **Popover** + a **cmdk** command list (`shouldFilter=false`
— filtering is server-side). Single or multi (chips + "+N more").

- `useServerSelect(props)` (logic): debounced search (300ms) → caller's `useSearch`; infinite
  scroll via an `IntersectionObserver` sentinel (append + dedupe by value); selected ids
  resolved via `useResolveByIds` and **pinned first**; single `select` closes + fires
  `onItemSelect`, multi toggles + stays open; quick-add via `onCreate`.
- `ServerSelect<T>` (presentation): trigger combobox + chips, the popover command list,
  clear control, RHF-`Controller`-compatible (`value`/`onChange`), `error` slot.
- **Live proof / W5 retrofit:** `src/data/lookups/folder-lookup.api.ts` +
  `src/modules/media/components/folder-filter.tsx` (was a plain `<select>`).
- Primitives added: `src/components/ui/{popover,command}.tsx`.

## 2. DataTable + useListUrlState — `src/components/data-table/` + `src/hooks/`

The list backbone.

- `useListUrlState({ filterKeys })` — **URL is the single source of truth**
  (`?page&pageSize&sort&order&search&<filterKeys>`); debounced search → URL; any
  search/filter/page-size change **resets page → 1**; back/forward + shareable. No Redux.
- `DataTable<TRow>` — composes the toolbar (search + whitelisted filters + column visibility),
  a sortable table, **tri-state select-all** + per-row checkboxes, **RBAC-gated per-row
  actions** (dropdown), the `RenderGate` states (skeleton → error → empty → data, F2), the
  bulk-actions bar, and pagination. Columns carry caller-translated `header` nodes (U8).
- `useBulkSelection(rows, getRowId)` — local (page-scoped, ephemeral) selection; clears on a
  successful bulk action. `BulkActionsBar` runs RBAC-gated actions and **clears on success,
  keeps on failure**.
- `buildPaginationRange(current, totalPages, siblings)` — pure ellipsis-aware page sequence.
- Primitives added: `src/components/ui/{checkbox,dropdown-menu}.tsx`.

## 3. DynamicForm / DynamicFormModal — `src/components/dynamic-form/`

The config-driven CRUD form engine (targets flat/standard entities; deeply-nested forms like
branding stay bespoke).

- `useDynamicForm(props)` (logic): RHF + the caller's Zod schema (U16); reactive `values`
  prefill (a server prefill doesn't mark dirty, F6); **cascading** (a `dependsOn` parent change
  resets the dependent); on submit it calls the injected `submit` and maps a rejected
  **`ApiError.fields` → per-field `setError`** (else root error + `toast.error`); toasts success.
- `buildDefaultValues({ fields, record })` — pure; create defaults by type / prefill from a
  record; **translatable** fields flatten into a per-locale `translations` map.
- `FieldRenderer` — field types: text/email/number/password(+generate via Web-Crypto)/textarea/
  select/multi-select/checkbox/toggle/date/color/image(presigned-R2 via an injected `upload`)/
  **custom**(render-prop — this is how `server-select`/rich-text are wired, keeping strict types)/
  hidden. `colSpan` 1–4 grid.
- `DynamicForm` — grid of fields; **translatable fields grouped under per-locale LocaleTabs (W6)**.
- `DynamicFormModal` — wraps DynamicForm in a Dialog; an entity registers a thin global-registry
  modal mapping `{mode, record}` → props; submit success closes via the registry `onClose` (W7).

## i18n

Kit-generic strings live in the **`uiKit`** namespace (`src/i18n/ui-kit/{ar,en}.json`,
registered in `src/i18n/index.ts`, parity-checked). Domain strings (column headers, field/filter
labels) are passed in by the caller from its own namespace — the kit never hardcodes domain copy.

## Test-env shims (`src/test-setup.ts`, `src/test/intersection-observer.ts`)

jsdom lacks `IntersectionObserver` (ServerSelect infinite-scroll) and `ResizeObserver` (cmdk) —
both shimmed. `triggerIntersection()` fires the sentinel synchronously for deterministic
pagination tests. `useListUrlState` hook tests wrap with `MemoryRouter`.

## Known follow-ups

- `folder-lookup.api` adapts client-side (filter + slice) because `GET /media/folders` doesn't
  yet accept `search`/`page`/`ids` — fine for the small folder list; add server-side paging when
  it grows.
- cmdk + 3 Radix packages add to the (already-flagged) ~648 kB chunk — code-splitting is a tracked
  non-blocking optimization.
