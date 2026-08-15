# `tools/lint` — the workspace's own ESLint rules

**Purpose.** Encode this repo's law where the built-in rules cannot — or where a built-in rule needs a
selector delicate enough to deserve its own test. Two things live here:

- **`u26-logic-unit-folder`** — the machine half of **U26** (_a logic unit is a FOLDER holding its
  source and its spec; a declaration file is not_).
- **`ms3-bare-emit`** — the `no-restricted-syntax` selector the root config applies to `apps/**`
  (MS3/U27: never publish straight to the broker). It lives here, exported, so the config and the
  spec that probes it read one source (U3).

  **It took three drafts, and the lesson is the shape of the rule, not the contents of a list.**
  Draft 1 matched `callee.object.name`, which is an **Identifier** — so `this.client.emit(...)`, the
  form every NestJS publisher actually uses, walked past it. Draft 2 kept an anchored allow-list
  derived from the services' `<service>Client` convention — but `apps/api-gateway` injects five
  proxies named plainly after their service (`content`, `identity`, `notifications`, `settings`,
  `media`), and the gateway **has no database**, so an `emit` there can never be paired with an
  Outbox row: the one place the rule could only ever be right was the one place it stayed silent.
  Computed (`this['x'].emit`) and aliased (`const c = this.x; c.emit`) forms escaped both.

  Draft 3 **inverts it**: every `.emit(` is a violation unless it is `this.emit(...)` (a store
  notifying its own subscribers) or `<x>Emitter.emit(...)` (an in-process bus, which N6 permits
  _within_ a service). It covers `apps/**` **and `libs/**`** — a shared lib must not grow a direct
publish path either — with one path carve-out for
`libs/shared/messaging/src/lib/nest/outbox/**`, the Outbox relay, which is the single sanctioned
  publisher. That carve-out is **load-bearing, and proven so**: remove it and the relay itself
  errors. A second selector catches `client['emit'](…)`, the mirror of the computed-object form.
  Measured across `apps/**`+`libs/**`: **zero\*\* hits today, so deny-by-default costs nothing now
  and closes the door on every handle a future phase injects.

  One carve-out still fails **open** by construction: a `ClientProxy` named `brokerEmitter` would be
  exempt. Inherent to having any name-based exemption at all, and inverted in risk versus the old
  allow-list — the failure now needs someone to name a broker handle after an in-process emitter.

  **The durable lesson: do not select on names.** An allow-list over a name sample re-opens every
  time someone injects a new handle, and there is no type backstop — `ClientProxy.emit(pattern: any,
data)` accepts anything. Where a deny-by-default selector is impossible, enumerate every handle of
  the type first (`grep -E ': *ClientProxy' apps/*/src` — 26 sites here) rather than sampling. And
  **probe with the shapes that actually appear**: both misses survived review because the spec
  exercised names that appear nowhere in this codebase. Every escape found is now a committed
  regression case.

Built as a plain ESM plugin (`index.mjs`) and registered **once**, in the root `eslint.config.mjs`.
That placement is load-bearing, not stylistic: `lint-staged` runs `eslint --fix` **from the repo
root**, flat config loads exactly **one** config file, and the six backend services have **no**
project-level config at all — a rule registered anywhere else would silently never fire for them.

**Why `tools/lint/` and not `tools/eslint-rules/`.** Nx reserves `tools/eslint-rules/` for its own
TypeScript workspace-rules loader (`@nx/eslint-plugin`'s `resolve-workspace-rules`), which `require`s
a `tsconfig.json` + `index.ts` there and prints a stack trace on **every** eslint invocation when they
are missing. Our plugin is ESM `.mjs` on purpose (the root config is `.mjs` and all ten project
configs hard-import it by that literal filename), so it lives out of Nx's way. The cost is that the
inferred `lint` target's hardcoded `{workspaceRoot}/tools/eslint-rules/**/*` input no longer covers
us — so `nx.json`'s `targetDefaults.lint.inputs` names `{workspaceRoot}/tools/lint/**/*` explicitly.
**Without that, a burndown commit that only edits `baseline.json` would serve stale cached lint
results.**

---

## `u26-logic-unit-folder`

### What it decides, and how

Filename and directory name only — never the AST. That keeps it cheap, TS-parser-agnostic, and
exactly as decidable as the law it enforces.

1. **Specs are skipped.** A spec's home follows its subject, so U26's `<subject>.e2e.spec.ts`
   layer-root carve-out needs no special case.
2. **Declaration-only by role suffix** → exempt: `types` (which covers `*.zod.types.ts`, since only
   the last dot-segment is read), `constants`, `tokens`, `event`, `table`, `schema`, `enum`, `errors`,
   `permission`, `contract`, `definition`, `module`, `config`, `d`; plus the exact basenames `index`,
   `main`, `env`, `setup`, `polyfills`, `test-setup`, `message-pattern`.
3. **Logic by role suffix** → must be in a concept folder. The list is kept verbatim in step with the
   U26 bullet in `.claude/agents/verifier.md`, so the two halves of the enforcement never disagree.
   Plus: any basename starting `use-` (a hook) and any `.tsx` (a component).
4. **Logic by proven unit:** a sibling `<base>.spec.ts(x)` / `.test.ts(x)` exists. A file someone
   wrote a test for is definitionally a unit. Step 2 **wins** over this — U26 names `errors`/`types`
   declaration-only even when one carries a tested helper (`content-errors.ts` + its spec is the live
   precedent).
5. **Otherwise exempt.** A suffix-less file with no spec is a declaration until it earns a role
   suffix or a test.
6. **Compliant iff** `normalize(concept) === normalize(dirname)`, where `normalize` kebab-cases
   PascalCase/camelCase, lowercases, and **strips a leading `use-`**. That last step is what lets both
   `components/media-explorer/use-media-explorer.ts` and `hooks/use-client-list/use-client-list.ts`
   pass.

Config-level `ignores`: `**/db/migrations/**`, `**/drizzle/**`, `**/test/**` (shared harness/fixture
dirs), `**/fixtures/**`, `*.config.ts(mts)`, `main.ts(x)`, `*.d.ts`.

**Not fixable on purpose** — the fix is a file move, and `lint-staged` runs `eslint --fix`.

**Two rejected alternatives**, recorded so they are not re-proposed:

- _An AST heuristic ("exports a function or class ⇒ logic")._ Closer to U26's wording, but it would
  disagree with the verifier bullet already shipped, and it drags in ~15 `libs/contracts` schema
  helpers where a folder each is noise. Step 4 recovers the cases that actually matter.
- _Enforcing an `index.ts` barrel per unit._ U26 explicitly blesses a one-file folder as "TDD1 debt
  made visible"; requiring the barrel adds a second stat per file for a rule nobody could satisfy
  incrementally.

### The baseline is a ratchet, not a debt plan

`baseline.json` grandfathers the pre-rule tree (**569 files** at P8.7: 248 admin-portal, 122 website,
60 content-service, 30 libs/web, 22 libs/shared, 19 media-service, 19 settings-service, 18
api-gateway, 12 identity-service, 10 contracts, 9 notifications-service).

**Owner directive, 2026-08-08:** _"from now let's follow it and fix what's in our way."_ There is no
bulk migration phase. New files comply. A baselined file that a later phase **touches** is moved into
its concept folder and struck from the list **in that same change** — which is enforced, not
remembered, by guard 2 below.

Four guards, and between them the list can only shrink:

| Hole                                       | Guard                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| a new violating file                       | not in the baseline → **lint error** (pre-commit, pre-push, CI)                                                                 |
| a fixed file left listed                   | **lint error** on that file — _"now complies — delete the entry"_                                                               |
| hand-adding a path to widen the ratchet    | `baseline.spec.mjs`: `paths.length <= maxPaths`, and `maxPaths` only ever goes down — raising it is a one-line, reviewable diff |
| a deleted/renamed path rotting in the list | `baseline.spec.mjs`: every path must still exist; also sorted + duplicate-free                                                  |

Regenerate with `nx run lint-rules:baseline` (never by hand). The generator lints the repo with the
**real rule** and an **empty** baseline, so the generator and the enforcer can never disagree about
what counts as a violation.

### Tests

`u26-logic-unit-folder.spec.mjs` drives ESLint's `RuleTester` under vitest (assigning
`RuleTester.describe`/`.it`, which ESLint 9 expects as mocha-style globals). Code samples only have to
parse under the default JS parser — the rule reads filenames, not syntax. `fixtures/` holds two real
on-disk cases the sibling-spec probe needs: a compliant unit, and a flat file with a spec beside it.

Run: `npx vitest run --config tools/lint/vitest.config.mts` (or `nx test lint-rules`).

### Known limits, stated rather than papered over

- The rule only sees files ESLint lints — `.claude/`, `docs/` and `infra/` are outside every project.
- The rule itself is `.mjs`, so it is self-exempt; the layout here is U26-shaped anyway.
- `tools/lint` is a `project.json`-only Nx project. It is deliberately **not** added to
  `pnpm-workspace.yaml`, which is a `sharedGlobals` input — adding it would invalidate every cached
  task in the repo for a package nothing imports by name.
