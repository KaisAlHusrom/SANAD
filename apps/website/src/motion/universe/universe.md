# universe — the one-universe navigation layer (P8.D)

> **Purpose.** The whole website lives in ONE universe (owner directive 2026-07-09, WEB12):
> the landing is the solar system, every route family is its OWN star system, and navigating
> between pages is a **comet flight** through deep space — directional per route-pair
> (landing→services is an outbound survey; services→landing an overshoot return;
> services→detail an intra-system hop with no warp tunnel). One persistent WebGL canvas +
> one flight director live at the locale layout and survive route changes; DOM, WebGL and
> the CSS fallback all read the same director state.

## Anatomy (kind folders, U20)

- **`types/`** — `SystemId` (= `UniverseSystemKey` from `@sanad/config`, U3), `ResolvedSystem`,
  `FlightPhase`/`FlightPlan`/`FlightState`, content exit/enter unions.
- **`constants/`** — route segments, `FLIGHT` timing invariants (`MAX_ROUTE_HOLD` failsafe,
  `SKIP_SPEED`, reduced-motion durations, palette shares), `FLIGHT_PATH`/`COMET` geometry.
- **`math/`** — ALL pure, unit-tested, no THREE imports (mirrors `cosmos/math`):
  `resolve-system` (pathname→system, unknown→`ambient`) · `resolve-flight-plan`
  (`'from>to'` → `'from>*'` → `'*>to'` → `'*>*'`; same-place→null) · `flight-phases`
  (the state machine: `idle→departure→cruise→arrival→idle`; cruise gate =
  `(min elapsed OR skipping) AND routeReady`, `maxHold` force-arrives) · `reduce-plan`
  (WEB4 calm form) · `comet-path` (each phase interpolates from the pose the camera was
  ACTUALLY at — continuous by construction; banks flip with `dir`, WEB6) ·
  `system-rest-pose` (arrival must end exactly where the system idles) · `travel-warp` /
  `palette-crossfade` (+`voidDip`) / `travel-content` (envelopes) · `system-colors`
  (token-derived fog/accent triplets) · `active-system` (which scene mounts per phase) ·
  `constellation-layout` / `detail-orbit` (slug-seeded) / `beacon-pulse` (system scenes) ·
  `accent-css` (the SSR `:has([data-system])` accent rules).
- **`director/`** — `createFlightDirector()`: ref-backed store (cosmos-scroll-store pattern),
  own rAF clock alive only between depart and idle (injectable `schedule` for tests),
  `depart/skip/markRouteReady/subscribe/onPhase`. Retarget mid-flight = `from ← old to`,
  cruise restarts, the swapped `pendingHref` still gets its push. `markRouteReady` adopts
  the ACTUAL landed system (a flight into a 404 arrives into `ambient`, never hangs).
- **`plans/flight-plans.ts`** — the directional choreography registry (all tuned numbers, U18).
- **`hooks/`** — `use-flight-director`, `use-travel` (click→depart; deliberately router-free).
- **`components/`** — `UniverseProvider` (creates the director; syncs reduced-motion),
  `UniverseMount` (SSR glow fallback → WebGL gate; `webglcontextlost` → fallback for good),
  `universe-canvas` (THE `<Canvas legacy flat linear>` — WEB11 pipeline verbatim; loaded ONLY
  via dynamic import, never from the barrel), `SystemStage` (server marker: `data-system`
  feeds the `AccentStyle` `:has()` accent rules + carries `SystemReady`), `PageStage`
  (content exit/enter via `--travel-out/in` + `data-travel-phase`; cruise hard-hides so the
  streamed page/loading.tsx never flashes), `TravelLink` (flight-starting `next/link`;
  modified/external/same-place clicks fall through), `TravelVeil` (the CSS flight — the
  WHOLE effect on mobile/reduced-motion), `UniverseNavigator` (router.push at cruise entry;
  **hard `scrollTo(0,0)` at arrival entry** while the content is still at opacity 0 — the
  push happens with the stage hidden, so Next's own scroll-to-top can be skipped/raced and
  a destination would open mid-page (owner report 2026-07-09); recovery flights are exempt
  so back/forward keeps the browser's scroll restoration; popstate recovery flights;
  Escape/click skip).
- **`scenes/`** — three-heavy, dynamic-chunk only: `UniverseScene` (owns the shared pieces —
  scroll tick at priority −1, Starfield, WarpStreaks, FlightRig, FlightComet, ONE bloom) ·
  `FlightRig` (priority **0.9**: camera/fog/FOV/bloom-surge during flights — after every
  scene write, before the bloom composite at 1; reduced motion = fog tint only) ·
  `FlightComet` (the traveler: accent-tinted core+tail) · landing = the UNTOUCHED
  `CosmosScene` (WEB11) · `ServicesSystem` "Constellation" · `ServiceDetailSystem`
  "Close Orbit" (slug-seeded) · `ContactSystem` "Beacon" · `WorksSystem` "Galaxy" ·
  `AboutSystem` "Hearth" · `ProcessSystem` "Waypoints" · `BlogSystem` "Logbook" ·
  `RequestSystem` "Launchpad" (8.E-5 — the flagship `/request-a-project` conversion system:
  a rocky launch-world + ignition core + staged liftoff rings + a rising ember column;
  named flights `landing>request` + `*>request`) · `DeepSpaceIdle` (shared idle base +
  the `ambient` scene).

## Contracts / integration

- Tokens: `universeSystems` + `pageAccents.contact/ambient` in `@sanad/config` (single
  source; `AccentStyle` + scenes derive everything from it).
- The scroll store gained `travelWarp` (`setTravelWarp`): `warp = max(scrollWarp, travelWarp)`
  — streaks, the coin tail and FOV respond to a flight with **zero cosmos edits**.
- `cosmos` changes: `CosmosScene` no longer ticks the store or mounts
  Starfield/WarpStreaks/Bloom (hosted by `UniverseScene`; `bloomRef` arrives as a prop);
  `WarpStreaks` follows the actual camera. Everything else byte-identical (WEB11).
- Events emitted/consumed: none (frontend-only module). Settings used: none (tokens only).

## Adding a new route/system (WEB12)

1. Add its accent to `pageAccents` + its entry to `universeSystems` (`@sanad/config`).
2. Map its path in `math/resolve-system.ts` (unknown paths already fall to `ambient`).
3. Wrap the page in `<SystemStage system="...">` — accent + route-ready signal come free.
4. Optional: a bespoke scene in `scenes/` + named `FLIGHT_PLANS` entries; wildcards cover
   its flights until then.
