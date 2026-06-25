# 07 — Shared CRUD/UI systems (the admin-portal reusable kit)

> The reusable systems every admin/dashboard surface reuses, extracted **best-of** from the owner's four React references (`bisholal-admin`, `smart-restaurant`, `TripproDashboard`, `bishola-app-v2`) and **rebuilt on our stack** — React 19 + Radix/shadcn-on-tokens (`.claude/design/design-spec.md`) + RTK Query + react-hook-form + Zod + i18next (ar default, RTL). **Build this BEFORE the P7.C content pages** (they're table/form/CRUD-heavy and reuse all of it). **No feature may be dropped** — each system below lists the full union feature set the references collectively had.

## Hard constraints (apply to every system)
- **Our stack, not theirs.** The references use Antd / next-intl / TanStack-Query in places — we reimplement the **patterns + features** on **Radix primitives + tokens** (W2, no other UI kit), **RTK Query** (W3), **i18next** per-module ar/en parity (U8/F13), full **RTL** (U7).
- **Logic in hooks (U5).** Every component is presentation-only; state/derivation/fetch/handlers live in co-located `use-*` hooks (owner-emphasized).
- **Tokens only (U6), strict types (U4), one concept per file + kind-subfolders (U10/U20), TDD (TDD1), DOC1.** Reuse our existing primitives (RenderGate/Skeleton/EmptyState/ErrorState/Dialog/Tabs/Switch/ColorInput/Button/Input) before adding new.
- **Home:** these are app-shared infra → `apps/admin-portal/src/components/<kind>/` + `src/data/<kind>/` + `src/hooks/`. Extract to `libs/web/ui` only at P10 (MS9).

---

## Build order
**Wave 1 (unblockers):** modal registry → toast → ConfirmationModal.
**Wave 2 (the big three):** ServerSelect → DataTable + URL-list-state (+ Toolbar/Pagination/FilterControl/BulkActions) → DynamicForm/DynamicFormModal.
**Wave 3 (supporting):** ImageUploader (presigned R2) · StatusBadge · Drawer/Sheet · FilterBar · StatsCardsGrid (P7.D) · PermissionGate.
Retrofit the 3 P7.B verticals' dialogs onto the registry + toast as each lands (small — ~4 dialogs).

---

## 1. Global modal registry  *(Wave 1 — implement first)*
**Best-of:** TripproDashboard (Redux `modalSlice` + `modalRegistry` + `GlobalModalManager`) — cleanest; identical in bishola-app-v2.
**Feature set (complete):**
- A `modal` slice: `{ type: string|null, data: Record<string,unknown> }` + actions `openModal({type,data})` / `closeModal()` / `setModalData(patch)` / `resetModalData()`.
- A `modalRegistry` singleton: `register(entry)` / `unregister(types)` / `findModal(type)` / `getModals()` / `clear()`; entry = `{ component, modalTypes: string[] }` (one component can serve `add*`+`edit*`).
- `GlobalModalManager` mounted once in the shell: reads `modal` slice, finds the registered component for `type`, renders it with `{open, onClose, data, type}`.
- **Lazy data load:** open immediately (`openModal`), fetch detail async, `setModalData({loading})` then `setModalData({formData,id})` — modal shows a loading state then hydrates.
- A typed `useModal()` hook (`open(type,data)`, `close()`, `setData()`) so components never touch dispatch directly.
- Per-module `modals.config.tsx` registered at app init (mirrors `register-apis.ts`).
**Our rebuild:** add `modalSlice` to the store (additive), `GlobalModalManager` renders our Radix `Dialog`. Files: `src/data/modal/{modal.slice.ts,modal-registry.ts,use-modal.ts}` + `src/components/modal/global-modal-manager.tsx` + `src/app/modals.config.ts`.

## 2. Toast / notification system  *(Wave 1)*
**Best-of:** bisholal-admin (Radix `@radix-ui/react-toast` + singleton `use-toast` reducer); smart-restaurant (token-driven, logical `end`/`start` positioning).
**Feature set (complete):** variants `success|error|warning|info|loading`; **promise mode** `toast.promise(p,{loading,success,error})`; title + description; configurable auto-dismiss (default 4s, `0`=persist); optional **action button** (undo/retry); a small visible-limit/queue + optional dedupe key; **RTL via logical positioning** (`bottom-0 end-0`, no `right-`); swipe-to-dismiss (Radix); mounted **once** in the shell; a `useToast()` hook (no global singleton import at call sites).
**Our rebuild:** add `@radix-ui/react-toast`; `src/components/feedback/toast/{toaster.tsx,use-toast.ts,toast.tsx}` on tokens. Wire every mutation success/error to a toast (replaces the silent saves in P7.B).

## 3. ConfirmationModal  *(Wave 1)*
**Best-of:** bisholal-admin (generic + delete variant + `isPending`); TripproDashboard (`variant` danger/warning/info, mutation-aware).
**Feature set (complete):** controlled OR via the modal registry; variants `danger|warning|info` (icon+tone); title/message/subMessage; **mutation-aware** (`useMutation`+`entityId` → calls `.unwrap()`, toasts, closes, invalidates) **or** `onConfirm` callback; loading state (disables, spinner); success/error → toast; **imperative `useConfirm().confirm(opts): Promise<boolean>`** for inline call-sites; AlertDialog a11y + focus trap.
**Our rebuild:** `src/components/feedback/confirmation/{confirmation-dialog.tsx,use-confirm.ts}` on our Dialog; also registered as a `confirm` modal type. Replaces the per-vertical delete dialogs.

## 4. ServerSelect  *(Wave 2 — the W5-mandated picker)*
**Best-of:** bisholal-admin (preselect-pinned-first + infinite scroll + multi + badges) · smart-restaurant (quick-add + `renderOption` + clean RTK single-select) · trippro (Antd reference only).
**Feature set (complete — owner-confirmed must-haves in bold):**
- **Infinite pagination via scroll** (IntersectionObserver sentinel; threshold/rootMargin; append + dedupe).
- **Debounced server search** (300ms default, configurable) feeding an RTK Query lazy `search(term,page,pageSize)`.
- **Selected values pinned FIRST** even when on a later page / outside search results — a **separate resolve-by-id query** (cached `staleTime:Infinity`) merged + deduped at the top; resolves labels of already-selected ids on edit.
- **Quick-add / create-new** button → opens an inline create dialog → selects the new item on success.
- **Single + multi** (chips/badges, inline remove, `maxDisplay` "+N more"); clearable; disabled; loading (initial + next-page); empty/no-results; error.
- `valueField`/`labelField` + `labelFn` + `renderOption`; controlled `value`/`onChange` + `onItemSelect(item)`; RHF-compatible via `Controller`; placeholder + searchPlaceholder; `preselectFilters` (loose by-id lookup independent of browse filters); a11y (aria-*, keyboard) + RTL.
**Our rebuild:** Radix Popover + a cmdk-style Command list; RTK Query lazy queries provided by the caller (a `*-lookup.api`, W5 — never another module's api). Files: `src/components/server-select/{server-select.tsx,use-server-select.ts,types.ts}`. This closes our current W5 gap (we used plain `<select>` in media).

## 5. DataTable + URL list state  *(Wave 2 — the list backbone)*
**Best-of:** smart-restaurant typed `data-table/` package (cleanest architecture: `data-table` + `use-data-table-url-state` + `data-table-toolbar` + `data-table-pagination` + `data-table-filter-control`) + bisholal-admin advanced features (column visibility, per-column filters, bulk actions, ellipsis pagination, localStorage page-size).
**Feature set (complete):**
- **`useListUrlState(filterKeys)`** — single source of list state in the **URL** (`?page&pageSize&sort&order&search&<filterKeys>`): seeds defaults, debounces search→URL, **filter/search change resets page→1**, exposes `{state, setPage,setPageSize,setSort,setSearch,setFilter,clearFilters,activeFilterCount}`; back/forward + shareable.
- **Typed columns:** `{id, headerKey(i18n), cell(row)→node, align, width, sortable, sortKey, hidden}`; column-visibility toggle.
- **Sorting:** single-column server-driven, asc↔desc toggle + indicator, persisted to URL.
- **Filtering:** per-column + a filter bar; filter kinds **select / boolean / range / date-range / search**; active-filter badges; clear-all (`DataTableFilterControl`).
- **Pagination:** page numbers + **ellipsis** + first/prev/next/last + **page-size selector** + "showing X–Y of Z" + URL-aware + RTL.
- **Row selection** (checkbox + tri-state select-all) → **BulkActionsBar** (sticky, count, perm-gated actions, clears on success).
- **Row actions** (edit/delete/custom dropdown, **permission-gated** per row) + optional **row click → detail**.
- **States:** skeleton rows (loading), shared EmptyState, ErrorState (incl. friendly 503), RenderGate order (F2); sticky header; horizontal scroll; responsive **card fallback** on mobile; i18n headers; RTL.
**Our rebuild:** `src/components/data-table/{data-table.tsx,data-table-toolbar.tsx,data-table-pagination.tsx,data-table-filter-control.tsx,bulk-actions-bar.tsx,types/*}` + `src/hooks/use-list-url-state.ts`. Caller passes `columns`, a `useList` RTK hook, `buildQuery(state)`, `rowActions`, `filters`. Reuses our Skeleton/EmptyState/ErrorState/RenderGate.

## 6. DynamicForm / DynamicFormModal  *(Wave 2 — CRUD form engine)*
**Best-of:** TripproDashboard (`FieldRenderer` + `types` + create/edit + server-error mapping + colSpan grid + image upload + password-generate) + bisholal-admin (cascading `dependsOn`/`visibleWhen`/`disabledWhen`/`getOptions`/`getFilterParams`, **per-locale translation tabs** `groupByLocale`, Zod **preprocessing** ''→null/coercion, rich-text editor).
**Feature set (complete):** field types **text/email/number/password(+generate)/textarea/select/multi-select/server-select/server-multi-select/checkbox/toggle/date/date-range/rich-text-editor/image/color/custom(render-prop)/hidden**; `colSpan` 1–4 grid; Zod schema + resolver + preprocessing; **create vs edit** (`showInCreate`/`showInEdit`/`visibleWhen`/`disabledWhen`/`dependsOn`+`getOptions`/`getFilterParams`); default values + **prefill on edit** (+ clear dependents on parent change); **server-error → field mapping** (`setError(field,{type:'server'})`); submit via injected `useCreate`/`useUpdate`; FormData building (files); `onSuccess`/`onError` + loading + toast; **per-locale translation tabs (W6)** for translatable entities; i18n labels/errors.
**Our rebuild:** `src/components/dynamic-form/{dynamic-form.tsx,field-renderer.tsx,dynamic-form-modal.tsx,types.zod.types.ts,use-dynamic-form.ts}` on RHF+Zod+our primitives + ServerSelect + LocaleTabs. Covers the repetitive P7.C CRUD (blog/service/portfolio/testimonial/team/FAQ/menu). **Deeply-nested forms (branding) stay bespoke** — DynamicForm targets flat/standard entities.

## 7. Supporting components  *(Wave 3 — as P7.C/D needs them)*
- **ImageUploader** (bisholal-admin best): multi-file, drag-drop + picker, preview grid, **drag-reorder**, **primary/cover select**, type/size validation, progress, library browser, disabled-on-submit. **Our edge:** wire to the **presigned R2** media flow (`use-upload`/`put-to-r2`) — better than the refs' FormData-to-backend. `src/components/image-uploader/`.
- **StatusBadge** (bishola-app-v2 best): pill, variants `success|error|warning|info|neutral`, optional leading icon + sub-status dot, sizes, tokens, RTL. `src/components/ui/status-badge.tsx`.
- **Drawer/Sheet** (Radix): side `start|end`, slide, overlay, header/body/footer, RTL, esc/backdrop close. `src/components/ui/sheet.tsx`.
- **FilterBar** (bisholal-admin best): segment pills (single-select), multi-select + range + bool-pills, active-count badge, collapsible advanced, clear-all, debounced search, URL-sync — composes ServerSelect + the url-state hook.
- **StatsCardsGrid / StatCard** (trippro best): icon + value + trend% + description + skeleton, responsive grid — for the **P7.D dashboard**.
- **PermissionGate** (`<PermissionGate permission=…>` + fallback) wrapping our `hasPermission` — declarative button/section gating.
- **EmptyState variants** — extend ours with `search`/`collection`/`error` variants (bisholal-admin).

---

## Verification
Per system: TDD (failing test first) — hook unit tests + component render/interaction tests mirroring the P7.B specs; i18n parity; typecheck/lint/test/build green; `verifier` PASS; module/spec docs (DOC1). The whole kit is "done" when a representative P7.C list page (e.g. blog posts) is built **entirely** from the kit (DataTable + url-state + DynamicFormModal + ServerSelect + ConfirmationModal + toast + modal registry) with no bespoke list/form/dialog code, in ar+en RTL.

## Reference file map (read these when building each)
- Table + url-state: `Bishola/bisholal-admin/src/components/layouts/admin/admin-table.tsx` + `src/hooks/use-table-url-state.ts`; `smart-restaurant/apps/staff/src/shared/components/data-table/*`.
- ServerSelect: `Bishola/bisholal-admin/src/components/server-selects/server-select.tsx`; `smart-restaurant/.../shared/components/ui/server-select.tsx` + `modules/Orders/components/CustomerSelect.tsx` (quick-add).
- DynamicForm: `TripproDashboard/.../shared/components/DynamicFormModal/{DynamicFormModal,FieldRenderer,types}.tsx`; `Bishola/bisholal-admin/src/components/add-edit-form.tsx` (cascading + locale tabs).
- Modal registry: `TripproDashboard/.../shared/components/Modals/{GlobalModalManager,modalRegistry}.tsx` + `src/shared/store/reducers/modalSlice.ts` + `src/app.config.tsx`.
- Toast/Confirm/Pagination/FilterBar/ImageUploader/EmptyState/Sheet: `Bishola/bisholal-admin/src/{hooks/use-toast.ts,components/ui/toast.tsx,components/layouts/admin/confirm-dialog.tsx,app/[locale]/admin/listings/{listings-pagination,listings-filter-bar,listings-table}.tsx,components/image-uploader/image-uploader-v2.tsx,components/empty-state.tsx,components/ui/sheet.tsx}`.
- StatsCardsGrid + Toolbar: `TripproDashboard/.../shared/components/{StatsCardsGrid,Toolbar}/`.
