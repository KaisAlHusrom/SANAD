# Admin-portal shared UI kit (P7.C Phase 0 — Wave 2)

> The reusable CRUD/UI systems every admin surface is built from. Extracted best-of from the
> owner's React references and rebuilt on **our** stack — React 19 + Radix/shadcn-on-tokens
> (`docs/design/design-spec.md`) + RTK Query + react-hook-form + Zod + i18next (ar default,
> RTL). Logic lives in `use-*` hooks (U5); components are presentation-only; tokens-only (U6);
> full RTL via logical properties (U7); ar/en parity (U8/F13); strict types (U4).
>
> **Wave 1** (modal registry · toast · ConfirmationModal) shipped earlier. **Wave 2** (this doc)
> adds the three big systems. Spec: `docs/plans/07-shared-ui-systems.md` §4–6.

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
- **Live proof / W5 retrofit:** `src/data/lookups/folder-lookup.api.ts` — the folder bridge the
  media surfaces read through (its `getFolderTree` now backs the media explorer's sidebar; the
  original `folder-filter.tsx` combobox was retired with the flat folder picker, 2026-07-20).
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
  keeps on failure**. It also carries **file-manager click semantics** (added for the media
  explorer, 2026-07-20): `selectOnly(id)` for a plain click and `selectRange(id)` for shift-click,
  measured from an anchor the hook keeps itself (moved by every `toggle`/`selectOnly`) — so a
  mouse-selected grid and a checkbox table share one selection model instead of forking it.
- `buildPaginationRange(current, totalPages, siblings)` — pure ellipsis-aware page sequence.
- **`reorder` prop + `useReorder`** — opt-in drag-and-drop row ordering (dnd-kit:
  `@dnd-kit/core`+`sortable`). When set, each row gets a drag handle; on drop, `useReorder`
  computes the new id order and calls the caller's reorder mutation
  (`PATCH /content/<resource>/reorder` → `{ ids }`), with optimistic local reordering. Replaces a
  manual `sortOrder` number field on orderable collections. RTL-aware; tokens-only.
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
- `FieldRenderer` — field types: text/email/number/password(+generate via Web-Crypto)/textarea
  (styled `Textarea`)/select (styled `Select` via a `Controller`)/multi-select/checkbox/toggle/
  date/color/image(presigned-R2 via an injected `upload`)/**custom**(render-prop — this is how
  `server-select`/rich-text are wired, keeping strict types)/hidden. `colSpan` 1–4 grid.
  - **`slug` field type (`SlugField`)** — a slug input that auto-generates from a sibling title
    field via `lib/slugify` (Arabic→latin transliteration + kebab-case), staying in sync with the
    title until the user edits it manually. Editable; tokens-only.
- `DynamicForm` — grid of fields; **translatable fields grouped under per-locale LocaleTabs (W6)**.
  Its fields render in a scrollable `DialogBody`; **Save/Cancel live in a fixed `DialogFooter`** so
  a tall form never pushes its actions off-screen (U21c).
- `DynamicFormModal` — wraps DynamicForm in a `DialogContent size="lg"` with a fixed `DialogHeader`;
  an entity registers a thin global-registry modal mapping `{mode, record}` → props; submit success
  closes via the registry `onClose` (W7).

## 4. Form/overlay primitives (U21 remediation — `src/components/ui/`)

Built in the 2026-06-27 design-remediation pass so no surface ships a bare HTML control or a
cramped modal (U21). All tokens-only, RTL-correct, exported from the `ui/` barrel.

- **`Select` / `SelectField`** (`select.tsx`, on `@radix-ui/react-select`) — the styled select that
  replaced **every** raw `<select>` (filters, pagination, media type, form enums). `combobox`/
  `listbox`/`option` a11y + keyboard + typeahead for free (W5: plain Select for fixed coded enums).
  `SelectField` is the controlled convenience (`value`/`onValueChange`); model "no selection" as
  `value=undefined` + `placeholder`; a re-selectable "All/Any" is a real **sentinel option** mapped
  back to `undefined` (Radix forbids an empty-string item). `cva` sizes md/sm/xs. Test helper
  `src/test/select-option.ts` (`selectOption(user, trigger, option)`) — the canon replacement for
  the native `user.selectOptions`.
- **`Textarea`** (`textarea.tsx`) — the multiline counterpart of `Input`; spreads props so it stays
  RHF-`register`-compatible.
- **`Badge`** (`badge.tsx`, `cva`) — the tokenized status pill (tones `good|warn|bad|accent|neutral`;
  tinted `color-mix` bg per design-spec §4; optional leading `dot`). Adopted by the secrets table
  ("not wired" + status) and available for any status cell.
- **`Dialog` sub-parts** (`dialog.tsx`) — `DialogContent` now caps height (`max-h` + internal
  scroll) and takes a `size` (sm/md/lg). Compose `DialogHeader` + `DialogBody` (the only scroll
  region) + `DialogFooter` for a fixed header/footer around a scrollable body; flat children stay
  backward-compatible (the simple set-secret/new-folder/confirmation modals are unchanged).
- **`PhoneLink`** (`phone-link/`, P8.10.B1) — a stored **E.164** number rendered readable and one tap
  from a call: `formatPhoneInternational` from `@sanad/contracts` (the SAME helper the team-alert
  email uses, so the inbox and the email can never disagree — F8/U3) inside a `tel:` anchor,
  `dir="ltr"` in both locales, a caller-supplied fallback (`—`) when the value is null, and an
  unparseable stored value rendered as itself rather than vanishing (U23). Used by the leads inbox
  column and the dashboard's recent-lead row.
- **Token-styled scrollbars** — `global.css` styles scrollbars (WebKit + Firefox) from the surface
  tokens (track/thumb), so every scroll region (DialogBody, the editor page, long tables) reads as
  part of the design language instead of the raw OS chrome. Tokens-only; dark+light.
- **DataTable canon** — the table is now a bordered `bg-surface` card with a `surface-2` header,
  `faint` 12px labels, top-bordered rows, and **hover on every row** (design `Sanad Admin.dc.html`
  leads/users table). Class-only — the DataTable API is unchanged.

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

## Dialog stacking (nested modals) — 2026-07-20

A picker opened from inside a form modal used to render at the SAME width on the SAME z-layer,
so the two read as one confusing surface ("it appears above that modal with the same width and
makes the view confuse the user" — owner). Radix portals every dialog to `document.body`, so
nesting is invisible in the DOM: two open dialogs are siblings, distinguishable only by DOM order.

`dialog-stack.tsx` restores the missing information and `DialogContent` acts on it:

- **`DialogStackProvider`** — mounted once in `app.tsx` around everything that can open a dialog;
  counts how many are open.
- **`useDialogDepth()`** — each open dialog claims a depth at mount and holds it, so a sibling
  opening or closing never renumbers a live layer (which would visibly jump its z-index).
  **It is called INSIDE the Radix Portal**, because a mounted-but-CLOSED dialog (every picker
  waiting beside its field) would otherwise inflate the count and push its own parent into the
  receded state with nothing above it. A test pins this.
- **Depth → z-index**: overlay `40 + depth*10`, content `50 + depth*10`, so a child always paints
  over its parent by stacking order, not by luck of DOM order.
- **`data-behind`**: a dialog with a layer above it scales to 0.96, dims, and goes
  `pointer-events-none` — it reads as underneath, and clicks land on the top layer. Honors
  reduced motion.
- **`DialogStackHeader`** — the nested layer's header: a back arrow (mirrored under RTL via
  `rtl:rotate-180`, never a left/right class) plus the breadcrumb `«parent» ▸ «this»`. `onBack`
  closes only that layer. The parent title arrives through **`DialogTitleProvider`** (set by
  `DynamicFormModal`) — the nested picker is a React DESCENDANT of the form even though the DOM
  says sibling, so context reaches it with no prop threading.
- **Sizes** gained `xl` (64rem — the nested layer, visibly wider than a `lg` form) and `full`
  (near-viewport, for a workspace).

Verified by `dialog-stack.spec.tsx`: depth, relative z-index, the receded/inert parent, the
differing widths, the breadcrumb + back, and the no-breadcrumb case outside a dialog.

## 8. MediaExplorer + the media picker — `src/components/media-explorer/` + `src/components/media-picker/`

The library's whole UI, as an app-shared component (2026-07-20). `<MediaExplorer mode="page">` is
the Media route's body; `<MediaExplorer mode="picker">` is the body of **`MediaLibraryModal`**,
which any form opens through `useMediaLibraryPicker` (via `MediaIdPickerField` for id-valued
fields and `MediaPickerField` for url-valued ones) at the `full` dialog size with a
`DialogStackHeader` breadcrumb. Two-pane file manager: folder tree, breadcrumbs, grid⇄list,
multi-select, drag-and-drop organizing (`@dnd-kit/core` in-app, native handlers for OS file
drops), and an upload tray with real per-file progress. Full detail — including every state it
ships (U23) — in `src/components/media-explorer/media-explorer.md`.
