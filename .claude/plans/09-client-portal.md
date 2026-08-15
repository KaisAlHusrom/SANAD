# 09 — `apps/client-portal`: the reference tree, transcribed

> The canon behind `02-mvp.md` **P8.21–P8.22**, and the concrete form of rule **W7**.
>
> **Owner directive, 2026-08-08:** *"don't make it like how you did admin portal please, I need the
> pattern, file organizations, each file contain test file to be in separate folder… review the reference
> project rules and the pattern and how event bus very well."* Read this before writing a single file of
> the client portal.
>
> **Why the portal exists at all:** the owner rejected deferring it — *"I don't want to delay what I need
> in deploy after deploy."* A tech company that asks clients to sign contracts must hand them a
> professional place to do it. Signing also works from a tokenized link (P8.14) for signers with no
> account; both paths are complete, neither is the lite version of the other.

---

## 1. The references, and what is actually in them

| Reference | What it is | Verified state |
|---|---|---|
| `TripproDashboard/TRIPPRO_DASHBOARD` | React + Vite dashboard — the closest structural match | **No rules doc, no `CLAUDE.md`, no `docs/`** (its README links to three files that were never committed — confirmed against all git history). **Zero tests** — no runner, no `@testing-library`, no spec files. **Hooks/services/utils are flat files; only components are folders.** |
| `Bishola/bishola-app-v2` | Bare React Native — the origin of the component-triplet convention | Read-only pattern reference (U14). |
| `Aysar/.claude/rules.md` | The **codified** version of both, written down as law | `W2` states verbatim that its tree is *"transcribed from `bishola-app-v2` and `TRIPPRO_DASHBOARD`"*. `U22` + `U18` are the folder/colocated-spec law. |

**Conclusion, and the reason this file exists:** the law the owner described — *"a component has its file
and its test file, they both should be in a separate folder"* — is **not written anywhere in TRIPPRO**,
and TRIPPRO does not implement it (it has no tests at all, and folders only for components). It **is**
written in Aysar. So: **Aysar is the law, TRIPPRO supplies the concrete file shapes**, and the law is
applied to *every* logic unit (hooks, services, slices, utils), not only components. That generalisation
is deliberate and is now Sanad rule **U26**.

Reference projects are **read-only patterns — never imported** (U14).

---

## 2. The tree (W7, normative)

```
apps/client-portal/src/
├── main.tsx                    # Provider(store) > PersistGate > App
├── App.tsx                     # provider composition, initializeAppConfig()
├── app.config.tsx              # BRIDGE: modal registry + i18n catalogs + event subscribers
├── store.config.ts             # BRIDGE: module reducers + RTK Query apis
├── routes.tsx                  # createBrowserRouter
├── routes/                     # one thin per-module composer
│   ├── Dashboard.tsx  Proposals.tsx  Contracts.tsx  Documents.tsx  Profile.tsx  Login.tsx
├── lib/                        # infrastructure BELOW shared — never domain
│   ├── event-bus/{event-bus.ts, event-bus.spec.ts, events.ts, index.ts}
│   ├── env.config.ts
│   ├── route.config.tsx
│   ├── route.constant.ts
│   └── layout.config.tsx
├── shared/                     # generic, module-agnostic — and NOTHING else at this level
│   ├── components/   constants/   hooks/   i18n/   services/   theme/   types/   utils/
│   └── store/{middleware/, reducers/, registry/, store-factory/, typed-hooks/}
└── modules/<Module>/
    ├── components/  config/  constants/  context/  hooks/  i18n/  services/  types/  utils/
```

**`shared/` is a closed list.** A cross-cutting concern is **not** a new `shared/<concern>/` folder: its
slice goes to `store/reducers/`, its persistence to `utils/`, its hook to `hooks/`, its provider to
`theme/` or `components/`. `shared/auth/`, `shared/preferences/`, `shared/events/`, `shared/config/` are
all **wrong** — that is precisely how the Aysar admin drifted, and the drift is documented there.

**`context/` means the module's Redux slice**, not React Context. (TRIPPRO uses the name this way and has
no `createContext` anywhere in the codebase.) Kept for fidelity with the reference.

---

## 3. The leaf: what a folder actually looks like (U26 + W7)

**Component — PascalCase folder, the triplet, plus the spec:**

```
modules/Contracts/components/ContractList/
├── ContractList.tsx            # pure presentation, no logic
├── ContractList.styles.ts      # or Tailwind-on-tokens; no hardcoded values (U6)
├── useContractListLogic.ts     # ALL logic (U5)
├── useContractListLogic.spec.ts
├── ContractList.types.ts
├── ContractListSkeleton.tsx    # loading state, colocated (U0/U23/F2)
├── ContractListEmptyState.tsx  # three empties: first-use / filtered / no-results
└── index.ts                    # barrel — MANDATORY (the reference is inconsistent; we are not)
```

**Hook — kebab-case concept folder** (this is the generalisation past TRIPPRO, which keeps hooks flat):

```
shared/hooks/use-permissions/
├── use-permissions.ts
├── use-permissions.spec.ts
└── index.ts
```

**Service / slice / util — same law:**

```
modules/Contracts/services/contracts-api/{contracts.api.ts, contracts.api.spec.ts, index.ts}
modules/Contracts/context/contracts-slice/{contracts.slice.ts, contracts.slice.spec.ts, index.ts}
shared/utils/format-money/{format-money.util.ts, format-money.util.spec.ts, index.ts}
```

**Declaration-only files sit loose in their kind folder** — `types/`, `constants/`, `*.zod.types.ts`,
event declarations. Many of one role together is correct; a service beside a mapper is not.

**The folder exists before the spec does.** A one-file folder is TDD1 debt made *visible* rather than
buried, and it means writing the spec later never forces a second move.

**Naming:** PascalCase folders for components only; everything else kebab-case. `*.api.ts`, `*.slice.ts`,
`*.util.ts`, `*.types.ts`, `*.zod.types.ts`, `use-*.ts`.

---

## 4. The event bus (U27 + W4)

`lib/event-bus/` — a singleton class, `Map<EventType, Set<handler>>`, `publish` / `subscribe`, where
`subscribe` returns its own unsubscribe closure and `publish` wraps each handler in try/catch so one
thrower cannot break the others.

**Three deliberate corrections to the reference implementation:**

1. **Payloads are typed per event.** TRIPPRO uses `EventPayload = Record<string, unknown>`, so every
   subscriber casts. We use a payload map, so a wrong payload is a compile error:
   ```ts
   subscribe<K extends keyof EventPayloadMap>(type: K, handler: (p: EventPayloadMap[K]) => void): () => void
   ```
2. **The full envelope is delivered.** TRIPPRO builds `{ type, payload, timestamp }` and then hands the
   subscriber only `payload` — the type and timestamp are constructed and thrown away.
3. **The bus is tested.** TRIPPRO has no test for it. Ours is the **first spec written** in P8.21:
   subscribe/publish/unsubscribe, one handler throwing without affecting the others, and a
   `getSubscriberCount()` leak assertion proving every `useEffect` subscription unsubscribes on unmount.

**Every event name is declared in the shared `EVENT_CATALOG`** in `libs/contracts` (U27) — the portal does
not keep a private event enum that the backend catalog has never heard of.

**The split, stated so it is never re-litigated:** **RTK tag invalidation for data freshness; the event
bus for cross-module UI reactions** (closing a detail pane when its entity is deleted elsewhere, dropping
a stale selection). TRIPPRO's bus has 6 publish sites and 1 subscribe site precisely because tags do the
data work — that is correct, not under-use.

---

## 5. Data layer

`shared/store/middleware/base-query-with-auth/` — one `baseQueryWithAuth` factory doing: bearer header,
the `x-sanad-locale` header (U24), network retry with backoff, **envelope unwrap once** (N9), 401 → refresh
behind a **mutex** so parallel 401s trigger one refresh, 403 → localized toast, and one shared
`applyServerErrors(setError, error)` helper.

That last point is a correction, not a copy: TRIPPRO unwraps `response?.data` at every call site and
hand-rolls the same `err?.data?.errors → setError` block verbatim in three different modals. Unwrapping
once and mapping server errors once is U3.

`shared/store/registry/api-registry/` — `registerApi()` + `getApiReducers()` + `getApiMiddlewares()`, with
`store.config.ts` as the **only** file allowed to import modules into store land.

`shared/store/store-factory/` — **wired for real.** TRIPPRO has this file and never uses it (the store is
built inline in `store.config.ts`), which is exactly the seam a test helper needs. Ours is used by both
the app and `renderWithProviders`, so tests get a fresh store per test.

---

## 6. Routing, shell, guards

Routes are declared centrally in `lib/route.config.tsx` against constants in `lib/route.constant.ts`;
`src/routes/<Module>.tsx` is a pure composer of module components and nothing else.

**Three corrections to the reference:**

- **Permission guards on routes, not just the menu.** TRIPPRO filters sidebar entries with
  `hasPermission()` but leaves routes open — a user can deep-link to a page they cannot use and gets a
  reactive 403 toast. We ship `<RequirePermission>` as a route element, and the denied state is a real
  designed screen (U0/U23), not a redirect.
- **Every route is `lazy()`.** TRIPPRO has zero `React.lazy`, zero `Suspense`, and no manual chunks —
  everything is one bundle.
- **Real error boundaries.** TRIPPRO has none (only `errorElement: <div>Page Not Found</div>`).

The shell stays generic — it takes its nav items as props and knows nothing about modules;
`lib/layout.config.tsx` is the bridge that holds the module knowledge.

---

## 7. Design, i18n, theme

- **Tokens only** (U6) from `@sanad/config`; no hardcoded colour, spacing, radius, type or z-index.
- **Dark + light**, both real (U0 requires both to be looked at before a phase closes).
- **RTL is the default, not the special case** (U7). Logical properties only. TRIPPRO threads `isRTL`
  booleans into styled-components by hand and has no stylis RTL plugin — that is the weak spot we do not
  copy.
- **i18n per module** — `modules/<M>/i18n/{ar,en}.json` merged at `app.config.tsx`, **ar default**, with
  verifier-enforced key parity (U8). TRIPPRO mounts `IntlProvider` with **no messages and no catalogs at
  all** and hardcodes English inline, so there is nothing to copy here — this is designed from scratch
  against Sanad's existing per-module convention.

---

## 8. Testing (authored — the reference has none)

- **Vitest + jsdom + `@testing-library/react` + `user-event` + `jest-dom`**, matching the rest of the repo.
- **Spec lives in the unit's own folder** (U26), named after the file it tests.
- `src/test/render-with-providers/` composing the exact provider stack from `App.tsx`: a **fresh store per
  test** from `store-factory`, `MemoryRouter`, i18n provider, theme provider.
- Hook tests via `renderHook` with the same wrapper.
- API mocking with **MSW**.
- **Event-bus tests** clear the bus in `afterEach` and assert `getSubscriberCount() === 0` after unmount.
- **U25 applies:** any component that can open inside a modal/portal is tested **with no Router in the
  tree at all** — a `MemoryRouter` wrapper hides exactly the crash class that blanked the admin portal.

---

## 9. Enforcement, probed both ways

- ESLint `no-restricted-imports` on `@/modules/*` from `shared/` and `lib/`, and on any module importing
  another module — written **generically per module**, not as a hardcoded pair list. (TRIPPRO's rule names
  only `Admin` and `Agency`; its other six modules are unguarded.)
- Path alias `@/` configured in both `vite.config.ts` and `tsconfig` — TRIPPRO has neither and reaches
  `'../../../../shared/...'`.
- The workspace file-layout check for U26.
- **Every one of these is proven by adding a deliberate violation, watching it fail, and removing it.** A
  boundary rule nobody probes is a boundary rule nobody keeps.

---

## 10. Module scope (P8.22)

`Auth` (invitation → verify → set password → login → reset) · `Dashboard` · `Proposals` (review, accept,
decline) · `Contracts` (review, **sign**, download the sealed PDF, read the audit trail) · `Documents` ·
`Project` (read-only phase status from what exists today) · `Messages` (announcements + inquiries) ·
`Profile` (details + notification preferences).

Every one ships **all** its states (U0/U23): loading, empty ×3 kinds, error with a named cause and a fix,
read-only, permission-denied, long-content, in-flight, ar-RTL **and** en-LTR, dark **and** light, at
phone / tablet / desktop.

**P8.22 is done when** a real client — invited by email — sets a password, reviews a proposal, accepts it,
signs the resulting contract, and downloads the sealed PDF, **verified by driving the running app**, not
by a green suite (U0, U29).
