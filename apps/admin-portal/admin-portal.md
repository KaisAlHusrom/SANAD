# admin-portal

> The Sanad Tech **admin portal** — a React + Vite SPA (the first frontend in the monorepo). This doc covers **P7.A (Foundation)**: the reused spine all later admin modules build on. The website-management modules (settings/branding, integrations, content, media, leads, notifications bell, users/roles, dashboard/stats) land in P7.B/C/D.

## Purpose

The internal dashboard from which an admin controls every public-website surface and sees stats. Arabic-first (RTL default), dual dark/light theme on the portal tokens, talking only to the API gateway (`/api`, MS4) behind nginx (served under `/admin/`).

## Stack & conventions

- **Vite 8 + React 19 + TypeScript** (strict, `moduleResolution: bundler` for the app; the repo's `nodenext` is overridden so the bundled frontend uses extensionless imports). Nx-fit: targets inferred by `@nx/vite` (`build`/`serve`/`dev`/`preview`), `@nx/vitest` (`test`), `@nx/js/typescript` (`typecheck`). Tags `scope:web`, `type:app` (may depend only on `scope:web` + `scope:shared`).
- **State/data:** Redux Toolkit + RTK Query (W3). **i18n:** i18next + react-i18next, ar default, per-module catalogs, parity-checked (U8/F13). **Forms:** react-hook-form + Zod from `@sanad/contracts` (F6). **UI:** shadcn-style primitives on tailwind-mapped portal tokens (extracted to `libs/web/ui` at P10 — MS9). **Routing:** react-router (`basename: /admin`).
- `@sanad/*` libs resolve to built `dist` at runtime (repo convention; `dependsOn: ^build`) and to `src` for `tsc` typecheck via the `@sanad/source` custom condition.

## Structure (grouped by kind, U20)

```
src/
  config/env/        env.ts — the ONE typed import.meta.env accessor (U19, eslint-guarded)
  data/
    api/             api-registry, base-query (baseQueryWithAuth), transform-error
    auth/            auth.slice, auth.storage, permissions (re-exports @sanad/contracts RBAC), constants
    confirm/         confirm-store (singleton), use-confirm, confirm.types  (P7.C kit)
    events/          event-bus (typed pub/sub), use-event-bus, domain-event.types
    modal/           modal.slice, modal-registry (singleton), use-modal  (global modal registry)
    store/           store (createAppStore), hooks (typed), types (import type only), register-apis
    toast/           toast-store (singleton), use-toast (+ `toast`), toast.types  (P7.C kit)
    types/           api-error.types
  i18n/              i18n (init), register-catalog, locale.storage, common/{ar,en}.json, parity.spec
  providers/
    direction/       seed-direction, use-direction, direction-provider
    theme/            seed-theme, use-theme, theme.storage
  styles/            portal-theme (inject @sanad/config CSS vars), global.css, fonts.css
  components/
    ui/              Button, Input, Avatar, Dialog, Tabs, Switch, ColorInput, …
    feedback/        Skeleton, EmptyState, ErrorState, RenderGate (F2 order),
                     toast/ (Toaster, Toast), confirmation/ (ConfirmationRoot, ConfirmationDialog)
    modal/           GlobalModalManager (renders the active registry modal)
    nav/             SidebarNavButton
  lib/               cn (clsx + tailwind-merge)
  shell/             components/{AppShell, Sidebar, Topbar}, constants/nav
  app/               app (composition root), router, guards/{RequireAuth, RequirePermission}, pages/
  modules/auth/      api/auth.api, hooks/{use-login,use-logout}, components/{LoginPage,LoginForm}, i18n
  test/              render-with-providers (test util)
```

## The data-layer spine (F1/W3)

- **`baseQueryWithAuth`** (`data/api/base-query.ts`) — the F1 heart. Attaches the bearer token; **unwraps the `{success,message,data,path,timestamp}` envelope → `data` in ONE place**; on **401** runs a **single-flight refresh** (`POST /auth/refresh {refresh}`, concurrent 401s share one round-trip) + one retry, logging out on refresh failure (no loop). Public auth endpoints (`/auth/login`, `/auth/refresh`, `/auth/logout`) are excluded from the refresh path; `/auth/me` is not (an expired token there should refresh). Errors normalize to `ApiError {status,message}`.
- **the locale header (U24c)** — `prepareHeaders` is also THE one place the portal tells the backend which language to answer in: `x-sanad-locale` (`LOCALE_HEADER` from `@sanad/contracts`) = `resolveLocale(i18n.language)`, sent on **every** request including `ar` (the in-app language beats the device, F11, and the backend must never have to guess). The gateway renders every `message`/error from that locale, so `ApiError.message` is already translated — the portal never maps a backend string to a local one. See [`libs/shared/i18n/i18n.md`](../../libs/shared/i18n/i18n.md).
- **`apiRegistry`** — feature api modules `registerApi(theApi)` at import; `createAppStore()` reads `getRegisteredApis()` and wires reducers + middleware once. Adding a module never edits the store (a line in `data/store/register-apis.ts`).
- **auth slice** — `access`/`refresh`/`identity`, seeded **synchronously** from localStorage at module load (F12); persisted via a store subscriber (reducers stay pure). Permissions come from `GET /auth/me` → `IdentityContext` (no client-side JWT decode — N12 trap avoided).
- **client event bus** — typed `eventBus.publish/subscribe/subscribeTo` over a `DomainEvent` union; mutations publish in `onQueryStarted` after success (W4), cross-module reads subscribe + invalidate (F5).

## Shared UI kit — feedback & modals (P7.C Phase 0, Wave 1)

The reusable CRUD/UI kit (`.claude/plans/07-shared-ui-systems.md`) that the P7.C content pages build on. Wave 1 = three overlay systems, each mounted **once** in `app/app.tsx` (W1) and driven by a hook so call sites never mount one:

- **Global modal registry** (`data/modal/*` + `components/modal/GlobalModalManager`). A Redux `modal` slice holds `{type, data}` (serializable only); a `modalRegistry` singleton maps a `type` → component; each module's `modals.config.ts` calls `registerModal(...)` at import, aggregated by `app/modals.config.ts` (mirrors `register-apis.ts`). Open with `useModalActions().open(type, data)`. The integrations **provider-configuration** and media **new-folder** form dialogs are registry modals.
- **Toast** (`data/toast/*` + `components/feedback/toast/Toaster`). A module-level singleton store (mirrors `EventBus`) read via `useSyncExternalStore` — **not** Redux (toasts carry non-serializable action callbacks). Variants `success|error|warning|info|loading`; `toast.promise`; store-owned auto-dismiss (deterministic under fake timers); dedupe + visible-limit queue; `@radix-ui/react-toast` for a11y + swipe (RTL-aware `swipeDirection`); raise via the stable `toast` export (usable outside React) or `useToast()`.
- **Confirmation** (`data/confirm/*` + `components/feedback/confirmation/ConfirmationRoot`). Imperative `useConfirm().confirm(opts): Promise<boolean>` — also a singleton (the `resolve`/`onConfirm` are non-serializable). Tones `danger|warning|info`; mutation-aware (`onConfirm` runs with a loading state, stays open + shows an inline error on reject). Built on the existing `Dialog`. The media **delete** flow uses it.

Decisions: stores live in `data/` (state) and presentation in `components/feedback/` (mirrors `data/events` + `components/modal`); toast/confirm are singletons (not Redux); the confirmation is imperative-only (no registry `confirm` type) — see the rules/PROGRESS decision log. Generic labels (`actions.confirm`/`actions.close`) live in the `common` i18n namespace; per-action toast messages live in each module's catalog.

## i18n, direction, theme

- ar default + RTL default; `<html lang/dir>` seeded before mount (F12) and kept in sync by `DirectionProvider` on `languageChanged`. Per-module catalogs register at import (`registerCatalog`); `parity.spec.ts` asserts identical ar/en key trees per namespace (U8).
- Dual theme via `@sanad/config` `renderPortalThemeCss()` injected once on `[data-app][data-theme]`; tailwind utilities map to the portal `var(--*)` custom properties (U6 — no hardcoded colors). Theme default dark, persisted, app-beats-device (F11/F12).

## Shell, routing, RBAC

- One `AppShell` = Sidebar (266px, permission-gated nav, brand logo, user card + logout) + Topbar (title, ع/EN locale switch, theme toggle, notifications-bell placeholder) + scrolling content (W1/F10).
- `RequireAuth` redirects to `/login` (remembering the target) when logged out, else loads identity via `/auth/me`. `RequirePermission` gates a route by a permission key (RBAC via `hasPermission` from `@sanad/contracts`), rendering a forbidden notice otherwise.

## Login (the acceptance vertical)

`useLogin` (react-hook-form + `loginRequestSchema`) → `useLoginMutation` → `baseQueryWithAuth` → `tokensReceived` + `auth.loggedIn` event → redirect → `/auth/me` (permissions) → guarded shell. Proves the whole spine end-to-end. Logout revokes the refresh token + clears the local session.

## Contracts / endpoints consumed

`@sanad/contracts`: `LoginRequest`/`AuthResult`/`TokenPair`/`IdentityContext`/`AuthUser`/`LogoutResult`, `Locale`/`LOCALES`/`directionForLocale`, `hasPermission`/`GLOBAL_MANAGE_PERMISSION`. Gateway: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`. **No gateway routes change in P7.A** → no Postman edit (the auth surface is already documented, DOC2 P1–P3).

## Known gaps (P7.A)

- **Brand fonts (IBM Plex Sans Arabic / Mono) not yet bundled** — `fonts.css` has the `@font-face` blocks commented pending the WOFF2 binaries in `public/fonts/`; falls back to `system-ui`. (Asset task, like the logo.)
- Bundle is one chunk (~550 kB) — code-splitting is a later optimization.
- The shadcn primitives + shell live in-app; extract to `libs/web/ui` when the client portal (P10) proves the boundary (MS9).
