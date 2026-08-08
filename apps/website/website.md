# website — public Sanad Tech site (Next.js, App Router)

> The public, Arabic-first, content-driven website (P8). Server components fetch from the
> gateway's public endpoints (WEB2); the shared `@sanad/web-ui` renderer draws CMS pages;
> the fixed-dark signature theme (WEB7) is sourced from `@sanad/config` tokens + runtime
> branding. **Stage 8.A = foundation + spine.** **Stage 8.B-1 (this build) = the bespoke animated
> landing** — 9 DB-driven sections + scroll choreography (Lenis + GSAP + Framer Motion) + the
> WEB10 orbiting-works spine (lighter DOM build) + reduced-motion + RTL. The **R3F WebGL cosmos**
> central object + the **sound layer (WEB8)** land in **8.B-2**; per-page marketing pages
> (about/services/portfolio/blog/process/FAQ) in **8.C**.

## Landing (`app/[locale]/page.tsx` + `src/components/landing/` + `src/motion/`)

The home route is the **bespoke landing**, 100% DB-driven (WEB1) via a **hybrid fetch** (all in the
server component, in parallel, each `.catch` → coded default / empty so it never blanks, F7/F3):

- **Editorial copy** from the seeded `landing` **page-tree** (`getPage('landing')`) — the `hero`
  (+ its proof-strip `feature` blocks), `trust`, `services` (intro + per-service capability
  `feature` / tech `text` blocks joined by `data.service`), `process` (`step` blocks with a
  translatable `data.duration` + per-phase deliverable `feature` blocks joined by `data.step`),
  `stats` (`stat` blocks with a mono context line in `body`) and `cta` (+ its next-steps `feature`
  blocks) sections, read null-safely via `section-content.ts` helpers (`blocksFor`/`firstBlockFor`/
  `blockLocalized`/`splitMetric`); coded-default copy backs anything missing (`landing-copy.ts`, U9).
- **Collection sections** from typed list reads: `getServices` (mission-system panels) ·
  `getPortfolio` (the **WEB10 works orbit** + the trust **domain constellation**, both derived from
  the published projects) · `getTestimonials` (transmission panels, gradient-initial avatar) ·
  `getBlogTeaser` (ship's-log rows, with an explicit empty state until posts publish, F3).

**Section order** (`design-spec §2`): hero → trust → services → process → **works** → stats →
testimonials → blog → cta → **impact / footer-finale**. Each is a server component for SEO (WEB2);
motion is layered by the client primitives below. Sections render nothing when their data is absent
(no blank shells).

### Content-Studio live-swap (P8.5 — preview===live)

The `hero` + `stats` sections are the first to be **live-swapped**: the landing renders the SHARED
`@sanad/web-ui` `HeroSection`/`StatsSection` (the same components the admin CMS preview/edit render),
so the live site and the studio preview are literally the same component (owner directive: "the
preview must be the SAME component as the site"). The bespoke `hero-section.tsx`/`stats-section.tsx`
are retired. The site keeps the cosmos by INJECTING, per `mode='live'`, its motion + navigation +
chrome as slots (`src/components/landing/live-section-slots.tsx`): `Reveal` (emits the `.lp-flow`
marker the `ChapterStage` GSAP driver arcs), `WordReveal` (`Headline`), `CountUpNumber` (`Counter`),
the warp `Actions` (`TravelLink` → `/request-a-project` + the `#works` anchor), the legibility veil
(`Backdrop`) and the scroll `Cue`. The hero passes **`anchorId="hero"`** so the planet-dock
(`use-section-metrics`), the wayfinder and the anchor glide keep resolving; stats keeps its
`ChapterStage id="stats"` wrapper (which owns the `data-chapter` dock). `FALLBACK_HERO_SECTION` /
`FALLBACK_STATS_SECTION` (`fallback-sections.ts`) feed coded defaults when `getPage('landing')` fails
(F3/F7). The `.web-hero*`/`.web-stats*` styling (in `web-ui.css`) is now the single flagship hero/
stats look; `landing.css` carries only the live-only `.lp-content .web-hero` full-viewport override.

**Container ownership — the website MUST box the shared sections (2026-07-19 regression fix).** The
shared `@sanad/web-ui` `.web-*` sections are deliberately **width-agnostic**: they set no `max-width`
and no `padding-inline`, because each consumer owns layout (in the admin, the Studio canvas boxes
them). When the live-swap replaced the bespoke `.lp-*` sections, the website's old container
(`.lp-shell` `max-inline-size: var(--lp-maxw)` = 1180px + `.lp-section` inline padding) was **not**
re-applied — so `services` / `testimonials` (`.web-quotes`) / `blog` (`.web-log-section`) rendered
**full-bleed** and floated inside the tall pinned `.lp-chapter` (the owner's "no container, full width
and full height" report). `landing.css` now restores it, website-side only:

```css
.lp-content .web-services,
.lp-content .web-quotes,
.lp-content .web-log-section,
.lp-content .web-stats,
.lp-content .web-cta-band {
  inline-size: 100%;
  max-inline-size: var(--lp-maxw);
  margin-inline: auto;
  padding-inline: clamp(20px, 5vw, 72px);
}
```

Deliberately **NOT** boxed: `.web-process` (the moons need full width — it has its own `min-block-size:
100vh` override), `.web-hero` (self-constrains), and the `.web-works` orbit **ring** (full-width by
design) — only its `.web-works-head` + `.web-orbit-counter` are boxed to the same column. The shared
components and the admin preview are untouched, so single-source-of-truth holds. **Rule:** adopting a
shared width-agnostic section obliges the consumer to supply the width container.

**Works orbit — the pin must capture the full-viewport stage (2026-07-19 clip fix).** `WorksOrbit`
flipped `orbiting` state and created the GSAP `pin: stage` ScrollTrigger in the **same effect pass**,
so GSAP read+locked the stage height **before** the `is-orbit` class (which grows it to `100vh`)
landed — pinning the pre-orbit `72vh` clamp plus its `overflow: hidden`, which sliced every card
mid-card. `works-orbit.tsx` now sets `stage.style.blockSize = '100vh'` **before** `ScrollTrigger.create`
(reset to `''` on cleanup). The ring anchor `.web-orbit--live { inset-block-start }` also moved
`64% → 15%`: the orbit anchor renders with a constant **~+473px** downward offset vs its computed
position (the works cosmos perspective layer; the pinned heading does not carry it), so 64% dropped the
ring below the stage. Live values: head `8vh`, ring `15%`. Verified by looking on `/ar` + `/en`.

**Live-swap #2 — `cta` + `process`** (the pure-page-tree types; `services`/`trust` are hybrids that
wait for Phase 3's collection hydration). `CtaSection` reuses the seam directly — `ctaLiveSlots`
injects `Reveal`, the warp `Actions` (`TravelLink` → `/request-a-project` + `#works` ghost) and the
`Backdrop` cosmos chrome (the owner-tuned `.lp-cta-veil`/`-glow`/`-rings`, each `data-chapter-veil` so
`ChapterStage` fades them). `ProcessSection` takes the live "phases as moons" via its dedicated
**`System`** prop (`ProcessMoons`, re-pointed onto the shared `.web-process-*` classes so the live
moons' cards are byte-identical to the admin's static cards); the admin preview draws the phase cards
statically. Both keep their `ChapterStage id="cta"/"process"` wrappers (the `data-chapter` dock) and
emit `.lp-flow` via the injected `Reveal`. `FALLBACK_CTA_SECTION`/`FALLBACK_PROCESS_SECTION` feed
coded defaults (F3/F7); the bespoke `cta-section.tsx`/`process-section.tsx` are retired. The
`.web-cta-band*`/`.web-process*` styling lives in `web-ui.css`; `landing.css` carries only the
live-only `.lp-content .web-process` viewport + reduced-motion overrides. (The now-dead
`.lp-cta-band*`/`.proc-*` component rules are left dormant, per the swap-#1 precedent.)
The remaining page-tree types (`trust`/`services`/`process`/`cta`) stay bespoke until Phase 2-rest.

### The mission-panel section language (owner directive 2026-07-07)

The sections were elevated past the reference prototype (the cosmos canon WEB11 is untouched) into
one **instrument language** so they read as part of the voyage, not cards over a video:

- **World-linked chrome.** Each chapter re-points the `--lp-world` CSS custom property at its docked
  planet's glow (stamped off `data-chapter` in `landing.css`, mirroring `landingWorlds` in
  `@sanad/config`); eyebrows, brackets, micro-labels, hairlines and hovers all read it.
- **Shared primitives** (`landing.css`): `.lp-panel` (corner-bracket instrument frame — 8 hairline
  tick gradients, hover extends them), `.lp-micro` (mono micro-label with the brand diamond),
  draw-in hairlines. Editorial eyebrows are numbered per chapter (Arabic-Indic in ar: `٠١ · المجالات`
  … `٠٧ · سجل الرحلة`); **instrument readouts** (SYS·01, TRX·01, dates, counters, × 05 counts) stay
  mono LTR Western digits in both locales.
- **Hero** — mono designation eyebrow + a bracket-framed proof strip (weekly meeting · phased
  delivery · post-launch support). **(Now the shared `@sanad/web-ui` `HeroSection` — see the
  live-swap note above.)**
- **Trust** — the **domain constellation** (`trust/constellation-field.tsx` + pure
  `motion/constellation.ts`): distinct portfolio categories as named stars with live project counts,
  joined by hairline links that **trace in scroll-linked to the dock** (`constellationDraw`/
  `starReveal`, own ScrollTrigger like ProcessMoons); SSR/reduced-motion render it fully drawn; the
  SVG geometry mirrors under RTL via `scaleX(-1)` while the HTML labels re-flip with logical insets
  (WEB6); star positions are authored constants (1-decimal — SSR-hydration-stable). Small screens
  fall back to the labeled chips.
- **Services** — mission-system panels: `SYS·NN / SLUG` mono header, geometric mark, outcome-led
  summary, 3 capability bullets + a mono tech signature (CMS blocks, coded fallback in
  `LANDING_COPY.services.systems`), on an asymmetric 2×2 with a faint orbital path.
- **Process** — the phase cards became **briefings**: counter + mono duration (both LTR-isolated —
  RTL bidi reorders "03 / 04" otherwise, WEB6), body, "ماذا تستلم" deliverable bullets, plus a
  4-stop flight track under the counter (fill scales with the active float; `transform-origin`
  flipped under `[dir='rtl']`). The phase sweep starts only **after the dock completes**
  (`procActiveFloat` window 0.5→0.84) so the FIRST briefing is readable once the section is fully
  visible (owner fix 2026-07-07 #4).
- **Works** — **instrument cards**: mono client header + category tag, title, the challenge line
  under its mono label, and a **metric-led result bar** (`splitMetric` separates the number for mono
  LTR from the words); a mono `NN / NN` counter (`worksFrontIndex`, unit-tested) names the front
  card and fades with the ring. The ring is **held static while the cards arrive** (card 01 at the
  front; `worksTurnProgress` starts the full rotation only at local 0.45 — owner fix 2026-07-07 #4)
  and the cards + pinned heading fade out **with** the leaving planet (0.84→0.97, #5); the ring
  centre sits at 64% with the heading at 8vh so the front card never covers the title (#2).
- **Stats** — the seeded head now renders; each cell is a telemetry cell (corner ticks, value,
  label, mono context note from the block `body`). **(Now the shared `@sanad/web-ui` `StatsSection`
  inside its `ChapterStage` — see the live-swap note above.)**
- **Testimonials** — **received transmissions**: `TRX·NN` designation, a static signal-trace
  ornament, the quote, and the stored `rating` as diamond marks (never ★).
- **Blog** — **the ship's log**: hairline log rows (mono `YYYY.MM.DD` stamp — a pure ISO slice,
  never `new Date()` — category, title + excerpt, hover trace). The dead gradient-cover cards are
  gone (media resolver still 8.C).
- **CTA** — **the launch pad**: three breathing concentric hairline rings (static under
  reduced-motion) + the "ماذا يحدث بعد رسالتك" 3-step sequence (CMS `feature` blocks).

### Motion stack (`src/motion/`, WEB3/WEB4)

- `MotionProvider` (mounted once in the layout) drives a **speed-capped smooth scroll** (WS4 —
  "constant-speed catch-up", ported from the reference `updateSmoothScroll`) off the **GSAP** ticker
  and wraps the tree in `<MotionConfig reducedMotion="user">`. Wheel/keyboard/anchor input feeds a
  target; the real `window.scrollY` advances toward it at a hard **px/second ceiling**
  (`MAX_SCROLL_SPEED = 1000`), so a violent flick can never skip a planet — the scene glides through
  every world. Because the **real** scroll stays the single time base for ScrollTrigger, the works
  orbit, the finale and the `CosmosScrollStore`, DOM + WebGL never desync. The pure pieces live in
  `src/motion/scroll/capped-scroll.ts` (`stepCappedScroll`/`clampScrollTarget`/`scrollLead`/
  `normalizeWheelDelta`/`keyScrollDelta`, unit-tested); a native `scroll` listener re-syncs on any
  external move (scrollbar drag / hash restore). **Desktop only** and **gated on
  `prefers-reduced-motion`** — touch + reduce-motion keep native scroll (scroll-LINKED, never jacked,
  WEB10). (Replaced Lenis, which could bank momentum and outrun the reading pace.)
- `Reveal` (Framer in-view fade-up ≤24px, spring 200/22), `WordReveal` (hero headline split by
  **word**, never letter — WEB5; full text via `aria-label`), `CountUpNumber` (stats count-up,
  static under reduced-motion), `InkCursor` (velocity accent-thread cursor, off on reduced-motion +
  touch, WEB9).
- `WorksOrbit` (client) pins the works section with **GSAP ScrollTrigger** and **scrubs** the orbit
  by scroll, feeding the pure `worksOrbitTransform` geometry so the case-study cards circle the
  **cosmos coin spine** (front card sharp/clickable, back cards recede/blur). **RTL reverses** the
  spin via a `dir` scalar (WEB6). Reduced-motion / SSR render a clean static grid (WEB4).
- Pure cores (`split-words`, `orbit`, `count-up`) are unit-tested; the React parts assert content +
  reduced-motion gating, not pixel motion. Styles live in `src/styles/landing.css` (scoped
  `.sanad-web`, `--web-*` + `--lp-*` tokens, logical properties; scroll-driven transforms are
  inline runtime values — U6 carve-out).

### The R3F cosmos (`src/motion/cosmos/` + `src/motion/scroll/`, 8.B-2 — WEB10)

The persistent central element is a **full-screen WebGL cosmos** the whole scroll travels through — a
~2000-unit vertical flight through **9 planet-worlds** (one per section, docking in turn) around a
central **"Sanad coin"** (halo · two tori · wireframe+solid octahedron gem), ported from the locked
`Sanad Landing.dc.html` (`cosmos.js`) so behaviour matches exactly, but hosted in **React-Three-Fiber**
(the WEB3 stack; three + @react-three/fiber v9 + drei + @react-three/postprocessing).

- **One scroll engine** (`src/motion/scroll/`): a ref-backed `CosmosScrollStore` (NOT React state →
  no re-render), created once in `MotionProvider` and fed from the Lenis scroll event + cursor;
  provided via `CosmosScrollContext`. The R3F `useFrame` reads a live snapshot each frame and calls
  `tick()` (velocity→`warp` smoothing); DOM overlays subscribe. Under reduced-motion progress still
  updates (for the static fallback) but velocity/warp/cursor stay 0.
- **Scene** (`cosmos/scene/`, lazy `next/dynamic` `ssr:false`): a single imperative `useFrame` drives
  the camera flight; `SanadCoin`, `WorldPlanets` (per-section arrive→dock→exit), `Starfield` (3 soft
  parallax layers), `WarpStreaks` (velocity-gated hyperspace), `SceneLighting` (fog + sun **lerp per
  world**) and `CosmosBloom` each own a `useFrame` reading the store. `CosmosMount` renders a **static
  token-coloured glow** on SSR / mobile / reduced-motion instead of the canvas (WEB4/WEB10).
- **Bloom = the VENDORED three r128 `UnrealBloomPass`** (`cosmos/vendor/postprocessing/`, WEB11): the
  design renders on three **r128**; our app ships **r171**, whose `UnrealBloomPass` switched its
  internal render targets to `HalfFloatType` (HDR) and blooms far **wider**, washing space grey. We
  vendor r128's exact pass (8-bit `RGBAFormat`, clamped) so the reference constructor numbers
  (`strength 0.85 / radius 0.7 / threshold 0.2`) reproduce the design's tight glowing-orb bloom, and
  the glow inputs (planet halo `rad·4.4` / `0.05+0.5·pres`, world-veil `0.22+0.55·peak`) stay at the
  design values instead of being dialled down to fight r171's haze. Two more r128-parity details in
  `scene/bloom.tsx`: the `EffectComposer` is built with an explicit **8-bit `UnsignedByteType` render
  target** (r171 defaults to `HalfFloatType` HDR, which lets the scene feed the bloom >1.0 and haze
  wide → grey space), and `world-veil.tsx` **squares** its `presencePeak` so the per-world wash is
  tight to the dock (deep space stays near-black between worlds). See `constants/scene.constants.ts`
  `BLOOM`, `scene/bloom.tsx`, `world-veil.tsx`.
- **Pure math** (`cosmos/math/`, all unit-tested — TDD1): `smoothstep`/`lerp`, `cameraY`/parallax,
  `planetPresence`, `coinTransform`, `worldColorAt`, `warpStreak`, `moonPosition`, `content-flow`,
  `worksOrbitTransform`, `footerReveal`, `ember`, `foot-item-stagger`. Colours are `THREE.Color` from
  the config `landingWorlds` glows/palettes (`worlds/world-defs.ts`); 3D placement is runtime (U6
  carve-out). No `new Date()` — time is the rAF clock (N3).
- **Sticky chapters** (`components/landing/chapter/`): each section (except hero) is wrapped in a tall
  **180–320vh `ChapterStage`** whose sticky stage pins while the content **arrives from depth →
  settles → recedes** (`flowTransform` on an inner wrapper via one GSAP ScrollTrigger, so the sticky
  element itself is never transformed). Normal one-screen flow under reduced-motion/SSR.
- **Overlays**: `cosmos/world-veil.tsx` (fixed screen-blend wash tinted per world), `landing/process/
process-moons.tsx` (4 phase-moons orbiting the process planet), and the `landing/finale/` **impact
  re-entry** (300vh) + **fixed footer finale** (crater glow, rising embers `emberRise`, staggered
  content `footItemReveal`). RTL flips orbit/moon direction via `dir`; all settle to static states
  under reduced-motion.
- **Source-fidelity retune (2026-07-02, WEB11; completed 2026-07-07).** The cosmos is matched to
  the reference's raw-Three r128 pipeline — **all three r171 renderer defaults reverted on the
  `<Canvas>`: `legacy` (ColorManagement off) + `flat` (NoToneMapping) + `linear`
  (`outputColorSpace = LinearSRGBColorSpace`)**. The third flag was the last-found root of the
  recurring full-frame "grey layer": the r128 `UnrealBloomPass` blits the scene to screen through a
  `MeshBasicMaterial` quad, and r171's default sRGB output gamma-lifted that blit — the near-black
  clear became `rgb(42,53,75)` everywhere (`(42,53,75)` ≡ `linearToSRGB(#060912)`; owner fix
  2026-07-07, found by empty-scene bisection). Stars use a dedicated **crisp** sprite
  (`builders/make-star-texture.ts`, not the soft coin halo); `scene-lighting.tsx` tags the
  per-world fog/clear colour **`SRGBColorSpace`** so authored sRGB tints stay true. `SanadCoin`
  leads the descent (`coin.ts leadY`) with a **comet-tail streak** that scales with warp. All
  verified by looking (U21e) against `Sanad Landing.dc.html` + corner pixel-sampling
  (`(6,9,18)` with every effect on).
- **Section reveal = ONE scroll-linked system (fidelity pass #3).** The reference drives chapter
  content with a single `chapterReveal`, NOT an in-view fade. Ported to `chapter-item-reveal.ts`
  (`chapterItemReveal`): content is **hidden until the world docks** (cp-gate `local 0.30→0.84`), then
  each item **arcs out of the planet** staggered by index and stays (an `exit` chapter — only trust —
  draws items back on scroll-past). `Reveal` is now a plain **`.lp-flow` marker**; `ChapterStage`
  drives its `.lp-flow` items (no whole-block transform, no in-view Framer fade → no flash-in/vanish/
  reappear flicker). **Process** (`ProcessMoons` + `process-orbit.ts`): moons orbit the docked planet
  on an ellipse and a **stacked card deck cross-fades one card per active moon**. **Works**
  (`WorksOrbit`): the heading rides inside the pinned orbit stage and reveals with the planet
  (`chapterItemReveal`), cards orbit a true ring (`worksOrbitTransform` + `−22·depth` arc). Transform-
  centered overlays centre via the WEB6 **`--dir`** scalar so they stay on the planet under RTL.
- **Fidelity pass #4 (2026-07-04, owner's 7 gaps).** (1) **Works spacing** — the pinned title and the
  orbit centre were spaced so cards no longer crowd the heading. _(Superseded 2026-07-19 — the live
  values are now `.web-works-head` `8vh` + `.web-orbit--live` `inset-block-start: 15%`; see the P8
  container/clip fixes below.)_ (2) **Stats**
  — the seed now ships the **4 canon stats** (120+/60+/8/98%, `content-service` `seed-data.ts`), no
  empty 4th cell / no "+0". (3+7) **Planet shine + hero** — `world-planets.tsx` ports the reference
  glow (corona `0.14+0.82·pres` @5.4×, halo `0.05+0.5·pres` @4.4×, atmosphere const 0.17, opaque
  cores, ring 0.5/0.85 @2.55× tilt π·0.47) + the reference glow-sprite stops; bloom stepped up
  (`0.85/0.7/threshold 0.45`); the hero is a **space-between** column (`lp-hero-top`/`lp-hero-bottom`)
  so the star corona blazes through the middle, `world-veil` restored to the reference wash
  (`0.22+0.55·peak`, alpha 0.16), lead gains the scrim shadow. (5) **Finale** — `math/finale.ts` gains
  `finaleDim` (post-0.62 dissolve), `earthHaloOpacity` (blast-boosted halo), `blastShake` (camera
  shake), `earthApproachArc` (lateral swing-in) + `debrisWave` (a second warm shock ring); the
  travelling **coin becomes the comet** (flies into the store-published impact point, no detached
  sprite); Earth gains a **night-lights `emissiveMap`**; a real bloom-base bug fixed (finale now reads
  the shared `BLOOM.intensity`, not a stale local `0.85`). (6) **Footer finale** — ported to the
  reference: diamond brand mark, gradient-accented headline (final word only), a **4-column site map**
  (brand+blurb / product / company / contact) + bottom bar, a pulsing **heat** layer over the static
  crater, and `emberSpec`-driven varied embers (4 colours, rounded to a stable precision so SSR ==
  client — full-precision floats in inline styles hydration-mismatch). Verified by looking (U21e) at
  `/ar` + `/en`, `scrollWidth == clientWidth` at every stop, no hydration error.

### The landing greatness pass (8.B-4 — beyond-parity, owner-approved plan 2026-07-07)

Five owner-approved enhancement stages on top of the locked reference parity (all pure math is
spec-first, TDD1; every new brightness input stays inside the WEB11 bloom budget — the r128 pass,
its constructor numbers and the reference glow values are untouched):

- **Stage 1 — planets alive.** `builders/make-planet-texture.ts` now paints **1024×512** (was the
  reference 256×128, soft at the works dock) with per-archetype detail (gas: turbulent two-frequency
  bands + eddies + polar hoods + a concentric storm; ice: floes + fracture network + noisy polar
  caps; rocky: 1400 craters + rim-lit ejecta craters + maria). Gas surfaces **flow**:
  `scene/gas-flow.ts` patches `meshStandardMaterial` via `onBeforeCompile` (keeps lighting/fog) with
  a `uFlowTime` domain warp driven by `math/planet-life.ts gasFlowTime` (frozen under reduced
  motion). The flat BackSide atmosphere shell is replaced by a **fresnel limb**
  (`scene/atmosphere-material.ts`, sun-biased rim, `atmosphereIntensity(presence)`), and the
  hero/cta stars carry a **plasma surface** (`scene/star-material.ts`, seam-free 3D fbm from object
  position, mean luminance = the palette core so the bloom result is unchanged), two counter-rotating
  **corona-ray sprites** (`builders/make-ray-texture.ts`, `starRayRotation`) and a golden-angle
  **prominence cycle** (`prominenceState`, period 16s).
- **Stage 2 — worlds dressed.** Ringed worlds gain a **planet shadow** across the ring (a
  non-scrubbed overlay annulus, `builders/make-ring-shadow-texture.ts`) and an **instanced rock
  belt** (`math/ring-rocks.ts`, 80 golden-angle rocks parented to the scrubbed ring group — zero
  per-frame cost). Trust/testimonials/works get **moons** (`math/moon-orbit.ts`, inclined clock
  orbits, parked at phase under reduced motion), and a rare **shooting star**
  (`math/shooting-star.ts` + `scene/shooting-star-streak.tsx`, one deterministic streak per ~31s,
  an event not a field — WEB9; dark in calm mode). A per-world "nebula backdrop" was tried and
  **REMOVED** (owner, 2026-07-07): additive sprites ADD light even below the bloom threshold, and
  dozens of them mottled deep space grey-green — no ambient additive set dressing behind the star
  field; space stays reference-black.
- **Stage 3 — flight feel.** `math/camera.ts` gains `cameraBank` (the camera leans toward the
  docking world's side and **rolls ≤1.2°** through transitions, level at every dock) and `warpFov`
  (60°→69° with scroll velocity); `cosmos-scene.tsx` applies both, stilled under reduced motion.
- **Stage 4 — interaction life.** The works **front card is a real link** (`WorkCard.href` →
  `/portfolio/<slug>`, the 8.C route) and **leans toward the pointer** (`motion/card-tilt.ts`, ≤6°,
  on an inner `.lp-orbit-tilt` so it composes with the orbit transform). One **instrument-hover
  language** extends the panel tick-grow pattern to stats cells, constellation labels, process moons
  and hero proof items; the testimonial **signal trace redraws on hover** (`pathLength` +
  `lpSignalDraw`). The ink cursor **tightens + brightens over interactive targets**
  (`motion/ink-trail.ts` — an acknowledgement, not a magnetic/morph cursor, WEB9). The world-veil
  centre **drifts ±3% with the cursor** and the CTA scrim **breathes** (`lpVeilBreath`, scale-only).
- **Stage 5 — wayfinding + arrival.** `landing/wayfinder-rail.tsx` — the **constellation rail**:
  nine hairline-linked dots fixed at the inline-end (RTL-correct), active dot glowing in its world's
  `landingWorlds` hex with a short business label (`LANDING_COPY.wayfinder`), anchors riding the
  capped-scroll glide, tracking **measured** section tops (`math/wayfinder.ts activeSectionIndex`);
  hidden <1024px. `landing/ignition-gate.tsx` — the **ignition**: on the first full-motion desktop
  visit per session (`math/ignition.ts shouldPlayIgnition`, `sessionStorage['sanad-ignited']`) the
  page opens on black with the brand diamond and dissolves (~1.1s) once fonts + the cosmos canvas
  are **genuinely ready** — no fake loader (WEB9); skippable by any gesture; skipped entirely in
  calm mode / on mobile (WEB4).
- **Deferred by the owner (2026-07-07):** a designed mobile sky (the static glow fallback stays),
  re-enabling the sound layer, and page transitions (8.C shared-shell overlap).

### The sound layer (`src/motion/audio/` + `src/components/sound-toggle.tsx`, 8.B-3 — WEB8)

> **DISABLED (owner decision 2026-07-07):** the `AudioProvider` is **unmounted** from the layout and
> the `SoundToggle` removed from the nav — the site ships silent and sound is not user-enableable.
> The layer below stays in the tree (tested, asset-free) for a future re-enable.

Sanad's ownable **audible** signature (WEB8/WEB9) — **procedural Web Audio** (synthesized oscillators
with gain envelopes; **no asset files, no npm deps**). Never autoplays; muteable; calm-mode-aware. The
same pure-core + imperative-shell split as the cosmos:

- **Pure cores** (`audio-graph.ts` + `cue-defs.ts`, unit-tested — TDD1): `sectionIndexAt` (nearest of
  the 9 worlds — the "section arrival" event), `chimeFrequency` (one **minor-pentatonic** note per
  world, so an arrival chime is always consonant), `ctaFrequency` (fifth above the root), `ambientGain`
  (quiet bed rising a little with scroll velocity, hard-capped low), `envelopeGain` (cue attack/decay).
  All musical/mix numbers live once in `cue-defs.ts` (the audio analog of `landingWorlds`); world count
  comes from `@sanad/config` `landingWorldOrder`.
- **Engine** (`audio-engine.ts`): a thin wrapper over one `AudioContext`, created **lazily on
  `unlock()`** (a real user gesture — no autoplay). A quiet master bus (`MASTER_CEILING`), a two-
  oscillator ambient bed, and one-shot chime/CTA tones. **All scheduling uses `ctx.currentTime`**, the
  audio clock — never `Date.now()` (N3). `ctxFactory` is injectable so a mock context drives the spec
  (jsdom has no real `AudioContext`); the spec asserts no context exists before `unlock()` and cues are
  silent while disabled.
- **Preference** (`use-sound-preference.ts`): persisted on/off, **default OFF**, SSR-safe (first render
  false → an effect hydrates `localStorage['sanad-sound']`, no hydration mismatch).
- **Provider** (`audio-provider.tsx`, mounted inside `MotionProvider`): reads the same
  `CosmosScrollStore`; per-frame it maps `warp` → bed loudness and fires a chime when the nearest
  section changes; a delegated `click` on `.lp-cta--primary` plays the CTA tone (so the **server-
  rendered** CTA links stay untouched, WEB2); a persisted-ON preference still waits for the first
  gesture. Under `prefers-reduced-motion` (`available=false`) the engine never starts — **calm mode =
  motion + sound off** (WEB4).
- **Toggle** (`sound-toggle.tsx`): the persistent, always-visible control in the top-nav actions beside
  the locale switch (`aria-pressed`, `dict.audio` labels, tokens-only `.sound-toggle`). Toggling ON is
  itself the unlocking gesture. Under calm mode it renders visible-but-disabled.

## Purpose

Render every text/image/number/identity value from the DB (WEB1) in **ar (default, RTL)** and
**en (LTR)**, with coded defaults so nothing renders blank (U9/F7). Be SEO-first: content is
fetched in server components and unwrapped through one typed client (F1/WEB2).

## Routing & locale

- **Both locales are prefixed** (`/ar`, `/en`); `/` 308-redirects to `/ar` (`middleware.ts` +
  `src/i18n/locale-route.ts`). `app/[locale]/layout.tsx` is the root layout — it sets
  `<html lang dir>` (RTL for ar), loads self-hosted IBM Plex fonts (next/font), injects the
  branding theme vars, and composes the shell.
- Pages: `[locale]/page.tsx` (the bespoke landing), `[locale]/[...slug]/page.tsx` (generic CMS
  page via `SectionRenderer`), `[locale]/contact/page.tsx` (lead form), and the **8.C marketing
  routes `[locale]/services/page.tsx` + `[locale]/services/[slug]/page.tsx`** (below). `loading`/`error`/
  `not-found` give the F2/F3 states.

## Marketing pages (`src/components/marketing/`, 8.C-1 · 8.E)

Standalone (non-landing) marketing pages, server-rendered for SEO (WEB2), 100% DB-driven (WEB1)
with coded-default chrome (U9). They REUSE the landing `.lp-*` primitives (F9) inside the shell;
each idles in its own star system (WEB12 — every page is a system now, not landing-only). Page-
specific layout lives in `src/styles/marketing.css` (`.mk-*`, tokens-only U6, logical props +
full RTL U7); one restrained `:has([data-system='…'])` DOM signature per system (WEB9).

**Phase-5 CMS conversion.** `about`/`faq`/`careers` are FULL CMS pages (the whole tree is shared
`@sanad/web-ui` sections via `getPage(slug)`, rendered in a plain `.mk-cms` wrapper). `process`/
`portfolio`/`services`/`blog` are **HYBRID** CMS pages: the route reads `getPage('<slug>')` and renders
the editable hero band (`sections.slice(0,1)`) + the closing-CTA band (`sections.slice(1)`) through the
shared `SectionRenderer` (`mode='live'`, `marketingLiveSlots`) inside `.mk-cms--hero`/`.mk-cms--tail`
wrappers, with the page's **body** component (`*-index.tsx`, its own hero+CTA now stripped) rendered
BETWEEN them. `contact`/`request-a-project` are **CMS-chrome** pages: a single editable `richtext` hero
band (`.mk-cms--hero`) above the KEPT bespoke lead form (`LeadForm` / `RequestForm`) — the form is the
conversion, so the hero has no CTA block and there is no closing band; the form → `submitLeadAction` →
`POST /leads` path is untouched. So the hero/CTA copy + SEO metadata are studio-editable while the
filtered gallery / phases / services grid / lead forms stay in their existing components; a body listing
is managed via its collection module (not the page tree). Each degrades to `FALLBACK_<PAGE>_SECTIONS`
(`marketing-fallback-sections.ts`, from the page's `*-copy.ts`) when the gateway is down (F3/F7).
**WEB13:** every over-cosmos content wrapper (`.mk-page`, `.mk-cms`, `.mk-cms--hero`/`--tail`) claims
`position:relative; z-index:1` — the bright per-system focal object otherwise occludes the band.

- **Services index** (`services/services-index.tsx`, `/services`, hybrid — body only, hero/CTA are
  CMS bands): core services 2×2 (CMS `service`s where `category='core'`, each links to its detail) →
  supporting capabilities 4-up (coded default — no `support` services are seeded) → the phased
  **method** row → LTR-mono **tech strip** (WEB6, never mirrored). Derived from design-spec §2.
- **Service detail** (`services/service-detail.tsx`, `/services/[slug]`): breadcrumb split-hero
  (title/summary + cover/placeholder + 2 CTAs) → the admin `detailBody` when present → capabilities
  3×2 → sticky **build journey** → guarantees → tech pills → related core services → CTA. Per-service
  capabilities/tech are REUSED from `LANDING_COPY.services.systems` (F9); the `service` model has no
  per-service capability/outcome fields, so those blocks are branded coded-default chrome — a
  content-model extension is a future enhancement.
- **Portfolio index** (`portfolio/portfolio-index.tsx`, `/portfolio`, hybrid — body only, hero/CTA
  are CMS bands): a domain **filter** (client-side, no-reload — `use-portfolio-filter.ts`, U5; chips
  only for categories with published projects) → the case-study grid (`.mk-work` cards: mono client ·
  title · summary · the `result` metric · link to detail). Idles in the **works "Galaxy"** system.
- **Case study** (`portfolio/case-study.tsx`, `/portfolio/[slug]`, 8.E): breadcrumb split-hero
  (domain eyebrow · title/summary + cover/none + optional project-url) → a **meta strip** (client ·
  domain · outcome) → the three-act **Challenge → Solution → Result** narrative → related work → CTA.
  Designed against exactly the CMS fields (`challenge`/`solution`/`result` + one `coverMediaId` —
  no gallery/metrics[]). The index + detail share the works system, so browsing between them is an
  intra-system hop (no warp tunnel).
- **About** (`about/about-index.tsx`, `/about`, 8.E-2): hero → story (2 paragraphs) → **values**
  3-up (trust/mastery/craft) → **team grid** (CMS `team_member` entities — name/role, avatar via
  the media resolver with a gradient-initial fallback when unset, optional linkedin/github links)
  → CTA. All chrome copy is transcribed verbatim from content-defaults §about (`about-copy.ts`);
  the team is the only DB-driven part (WEB1). Idles in the **about "Hearth"** star system (teal) —
  deliberately the CALMEST system (trust/stability, not a journey): one steady unringed core with a
  still ring of small "team" sparks.
- **Process** (`process/process-index.tsx`, `/process`, hybrid — body only, hero/CTA are CMS bands):
  the 4-phase **timeline** (number, title, description, duration, "what you receive" deliverables —
  richer than the landing's compact version) → weekly-meeting section → post-launch-support section.
  There is no CMS entity for the phased-delivery method, so the body is coded chrome
  (`process-copy.ts`) — only the hero/CTA bands are DB-editable — reusing
  the phase titles/short descriptions from `services/services-copy.ts`'s `METHOD_PHASES` (F9)
  rather than re-authoring a third variant. Idles in the **process "Waypoints"** star system
  (indigo) — the landing process world's planet with 4 moons orbiting continuously, one per phase.
- **Blog index** (`blog/blog-index.tsx`, `/blog`, hybrid — body only, hero/CTA are CMS bands): a
  category **filter** (client-side, no-reload — `use-blog-filter.ts`, U5; chips only for categories
  with published posts) → the article grid (`.mk-log-card` cards: mono `YYYY.MM.DD` date · category ·
  title · excerpt · read-time — the ship's-log language of the landing teaser lifted into a panel).
  Idles in the **blog "Logbook"** star system (amber).
- **Post detail** (`blog/post.tsx`, `/blog/[slug]`, 8.E-3): breadcrumb split-hero (category eyebrow ·
  title/excerpt + optional cover + a byline: author · date · read-time) → the **prose body** (the
  CMS `body` is a single `LocalizedText` string, split into paragraphs on blank lines) → a tags row
  → related posts → CTA. Designed against exactly the CMS fields (no rich blocks). The index + detail
  share the blog system, so browsing between them is an intra-system hop (no warp tunnel). The mono
  date is a pure ISO slice (`blog-format.ts logStamp`) — never `new Date()` (N3).
- **FAQ** (`faq/faq-index.tsx` + `faq/faq-accordion.tsx`, `/faq`, 8.E-4): hero → the **accordion**
  (published CMS `faq` entities) → CTA. The accordion is a bespoke token-styled disclosure (F9 — no
  reusable one existed): each row is a `<button aria-expanded aria-controls>` toggling its answer
  panel; multiple open independently; the answer expands via the CSS `grid-template-rows: 0fr→1fr`
  technique (transition dropped under reduced-motion, WEB4; content always in the DOM for SEO). Each
  answer carries a muted `faq_category`-enum tag (`FAQ_CATEGORY_LABEL`). `FaqItem` has no slug —
  FAQs are listed, not addressed. Idles in the **contact "Beacon"** star system (see below).
- **Careers** (`/careers`, Phase-5 FULL CMS): `getPage('careers')` → four editable `richtext` bands
  (hero → culture → openings → closing CTA → `/contact`) via the shared `SectionRenderer` in `.mk-cms`.
  The bespoke `CareersIndex` card grid was **retired** for full studio editability (mirrors how `/about`
  retired `AboutIndex`); culture/openings now render as editable `richtext` prose (`<h3>`/`<p>`) — the
  accepted trade for a no-new-section-type conversion (a future editable "feature-card" section type
  could restore the card grid). Still no jobs entity (deferred to the HR service, P12). Degrades to
  `FALLBACK_CAREERS_SECTIONS` (from `careers-copy.ts`, kept as the F7 source). Idles in the
  **contact "Beacon"** star system.
- **Contact** (`/contact`, Phase-5 CMS-chrome): `getPage('contact')` → a single editable `richtext`
  hero band (`.mk-cms--hero`, `CONTACT_COPY`) above the KEPT bespoke `LeadForm` (single-form, low-intent
  enquiries, `source: 'contact'`). No CTA block / no closing band — the form is the conversion. Degrades
  to `FALLBACK_CONTACT_SECTIONS`. `CONTACT_COPY` (in `contact/contact-copy.ts`) is the single hero-copy
  source for both the seed + the fallback; the form's field labels stay in `dict.contact.*`. Idles in
  the **contact "Beacon"** star system.
- **Request-a-project** (`request/request-form.tsx`, `/request-a-project`, 8.E-5): the **flagship
  conversion surface** — a **3-step form** (Project: project-type + budget as styled **choice cards**,
  U21(b) — never a `<select>`; → Brief: the message; → You: name/email/company + a **review summary**)
  that creates a `lead` with **`source: 'request-project'`** through the EXISTING pipeline
  (`submitLeadAction` → `POST /api/leads`, F9 — **no backend/contract change**; `leadSourceSchema`
  already had `'request-project'`). Reuses `leadCreateRequestSchema` + `zodResolver` + the `.lead-*`
  field styles + the `useState<Status>` states from `LeadForm`; per-step validation via RHF `trigger`
  (step 1 gates on a project-type selection — the schema field stays optional so `/contact` is
  unaffected). Choice cards write a **canonical English `value`** onto the lead (admin-readable) while
  showing a localized label (`request.constants.ts`). **Phase-5 CMS-chrome:** the page's coded hero was
  replaced by a `getPage('request-a-project')` editable `richtext` hero band (`.mk-cms--hero`, degrades
  to `FALLBACK_REQUEST_SECTIONS` from `REQUEST_COPY.hero`) rendered above the KEPT `RequestForm` wrapper;
  the hero carries no CTA block (the wizard is the conversion). Field labels/validation/status reuse
  `dict.contact.*`. A success view replaces the form on submit. Idles
  in its OWN **request "Launchpad"** star system (rose/coral, 8.E-5 — see below). **Discoverability:**
  every high-intent "ابدأ مشروعك / Start a project" CTA (hero, top-nav, landing finale, and every
  marketing page's CTA panel — ~13 sites) now flies here; genuine "Contact / Get in touch / reach out"
  links (footer, careers, faq, the About/Services hero "Get in touch") stay on `/contact`. The plain
  `/contact` form remains for low-intent enquiries (`source: 'contact'`).
- **Legal** (`/privacy`, `/terms`, 8.E-4): **NOT** bespoke routes — seeded CMS `page` trees
  (`SEED_PAGES` in content-service) rendered by the existing `[...slug]` catch-all in the `ambient`
  system. Each topic is a `richtext` section whose block `body` holds sanitized bilingual HTML
  prose (rendered by `@sanad/web-ui`'s `.web-section`/`.web-richtext-body` styling — bordered cards
  with accent-linked prose, already finished). Linked from the finale bottom bar (privacy/terms) AND
  the site footer's **Legal** column (8.E-4). A clear baseline; the owner should have counsel review
  before relying on it.
- **Copy** (`services/services-copy.ts`, `portfolio/portfolio-copy.ts`, `about/about-copy.ts`,
  `process/process-copy.ts`, `blog/blog-copy.ts`, `faq/faq-copy.ts`, `careers/careers-copy.ts`,
  `request/request-copy.ts`):
  ar/en coded defaults (content-defaults §services/§detail/§work/§about/§blog; FAQ + Careers copy
  authored in-file — no §faq/§careers exists in content-defaults). The generic `copy(value, locale)`
  locale-resolver (defined once in `services-copy.ts`) is reused across every page (F9). **Motion**
  (`marketing/reveal-on-scroll.tsx`): a Framer fade-up ≤24px; `trigger="inview"` (below the fold) vs
  `trigger="mount"` (hero — so above-the-fold content never waits on an in-view signal); reduced-
  motion is skipped via the layout's `MotionConfig` (WEB4).
- **Nav:** `TopNav`'s coded-default `خدماتنا/Services`, `من نحن/About`, `أعمالنا/Work`,
  `آلية العمل/Process`, `المدوّنة/Blog` and `الأسئلة الشائعة/FAQ` (8.E-4) all route to their real
  pages now (order from content-defaults §brand/global `nav.*`), each a `TravelLink` flight. The
  seeded **`primary`** menu is a flat link list (mirrors these + Contact); the seeded **`footer`**
  menu is **nested columns** (8.E-4): each top-level item is a column TITLE and its `children` are
  the links (`SiteFooter` renders that one nesting level, W6) — **Company** (About · Work · Blog ·
  Careers), **Services** (Services · Process · FAQ · Contact), **Legal** (Privacy · Terms). So every
  public page (incl. Careers + the legal pages) is reachable from the footer. (`SeedMenuItem` gained
  an optional `children`; the content-service seed loop creates each child with `parentId`.)

## Data layer (`src/data/`)

- `http/fetch-envelope.ts` — the SINGLE place the N9 envelope is unwrapped (F1), with timeout +
  Next `revalidate`/`tags`. Reads the gateway base from `src/config/env/env.ts` (U19;
  server-only in-cluster `http://api-gateway:3000/api`). It is also the SINGLE place the request
  locale is sent (U24c): every call sets `x-sanad-locale` (`LOCALE_HEADER` from
  `@sanad/contracts`) from a `locale` option that **defaults to `ar`** (U8 — the site's default,
  sent explicitly rather than implied). Cached content reads keep the default; the paths whose
  message a **visitor** actually sees pass the page's own locale — today `leads.ts`
  `createLead(body)`, which forwards `body.locale`. See
  [`libs/shared/i18n/i18n.md`](../../libs/shared/i18n/i18n.md).
- `content.ts` `getPage(slug)` · `branding.ts` `getBranding()` · `menus.ts` `getMenu(key)` ·
  `services.ts` `getServices()`/**`getService(slug)`** · `portfolio.ts` `getPortfolio(limit)`/
  **`getPortfolioProject(slug)`**/**`getPortfolioCategories()`** (8.E) ·
  **`team.ts` `getTeamMembers(limit)`** (8.E-2, mirrors `getTestimonials`) ·
  `blog.ts` `getBlogTeaser()` (landing 3-item) / **`getBlogPosts(limit)`** (index list) /
  **`getBlogPost(slug)`** (article) / **`getBlogCategories()`** (filter chips) (8.E-3) ·
  **`faq.ts` `getFaqs(limit)`** (the FAQ accordion, 8.E-4) — cached + tagged public reads.
  `leads.ts` `createLead(body)` — `no-store` POST.
- `lead-action.ts` — the `'use server'` action the client `LeadForm` calls (re-validates with
  `leadCreateRequestSchema`, N7).
- **Media resolver (`src/data/media.ts` + `src/media/`, 8.C).** `resolveMediaUrls(ids)` batch-calls
  the unguarded `GET /api/media/public` once per page and returns a `id → PublicMediaRef` map;
  `makeImageResolver(map)` builds the sync `(id)=>url` closure the shared `SectionRenderer`/
  `BlockRenderer` expect; `collectImageIds(sections)` gathers a page's image-block ids up front (no
  N+1). Unresolved ids (unknown/pending, or unconfigured R2 in dev) → `''` → the renderer's
  placeholder / the bespoke gradient fallback (F3). Media urls come from media-service (R2 base +
  key) — the website never builds them.

## Endpoints consumed (all public)

`GET /api/content/pages/:slug` · `GET /api/content/menus/:key` (`primary`/`footer`) ·
`GET /api/content/services` · **`GET /api/content/services/:slug` (service detail, 8.C)** ·
`GET /api/content/portfolio` · **`GET /api/content/portfolio/:slug` (case study, 8.E)** ·
**`GET /api/content/portfolio-categories` (filter chips, 8.E)** ·
`GET /api/content/testimonials` · `GET /api/content/blog` ·
**`GET /api/content/blog/:slug` (post detail, 8.E-3)** ·
**`GET /api/content/blog-categories` (blog filter chips, 8.E-3)** — both pre-existing public routes,
no gateway change ·
**`GET /api/content/faqs` (the FAQ accordion, 8.E-4 — pre-existing public route, no gateway change)** ·
**`GET /api/content/team` (team grid, 8.E-2 — pre-existing public route, no gateway change)** ·
`GET /api/branding` · `POST /api/leads` · **`GET /api/media/public?ids=…` (media resolver, 8.C —
the ONE new gateway route added for that stage; in the Postman collection, DOC2)**. (The landing's
case studies are seeded PUBLISHED in the content-service so the works orbit is never empty — see
`content-service`.)

## Theme & components

- `WebsiteShell` (from `@sanad/web-ui`) attaches the `.sanad-web` fixed-dark scope; the layout
  passes the runtime branding `--web-*` surface/text vars + the next/font families via the new
  optional `style` prop (they win over `web-ui.css` defaults by cascade).
- `branding/branding-to-css-vars.ts` maps `BrandingRecord → --web-*`, null-safe to every leaf
  with `@sanad/config` defaults (F7). Website-only feedback vars (`--web-danger`/`--web-success`)
  live in `src/styles/site-chrome.css` for now (promote to `@sanad/config` later — see PROGRESS).
- Shell components (`src/components/`): `TopNav` + `SiteFooter` (server, from menus + branding),
  `LocaleSwitch` (client, swaps the locale path), `ScrollProgress` (client, the 2px accent bar),
  `LeadForm` (client, schema-validated, F6 + F2 states).
- `TopNav` is the reference's **fully transparent** floating nav (`.site-nav` — no fill/blur/border):
  a coded-default **rotated-diamond logo mark** (F7, when the CMS carries no logo), the brand's second
  word muted, and **coded-default in-page links** (خدماتنا/آلية العمل/أعمالنا/المدوّنة →
  Services/Process/Work/Blog) shown when the CMS menu is empty — targeting the section-anchor ids
  (`ChapterStage id={id}`, `WorksSection id="works"`). Sound toggle + locale switch sit quiet beside
  the accent CTA pill.

## i18n (`src/i18n/`)

Per-locale UI-chrome dictionaries (`dictionaries/{ar,en}.ts`), `getDictionary(locale)`, parity
spec (U8/F13). Translatable _content_ (nav labels, brand name, marketing copy) comes from the
API, never these catalogs.

## Settings used

The resolved `branding` record (colors → website theme vars, brand name/tagline/shortDesc →
chrome + placeholder hero, logo → nav mark). All null-safe to the leaf (F7).

### Company info + SEO from settings (2026-07-19)

`src/branding/company-info.ts` is the ONE place the chrome derives company info from the branding
record — `socialLinks`, `copyrightLine`, `contactEmail/Phone/Address`, `twitterHandle`, `siteUrl`,
`shareImageUrl`. **Both footers read it**, which is the point: the landing finale used to hardcode
its own brand name, blurb, email, city and copyright (even spelling the company differently), so it
silently contradicted the settings-driven chrome footer. Note the chrome footer is suppressed on the
landing route (`site-chrome.css` `:has(.lp-finale)`) — the finale IS the landing footer, so it must
read the same sources.

- **`SiteFooter`** — brand + tagline, CMS menu columns, a **contact column** (email `mailto:`, phone
  `tel:`, address), a **social row** (only set links render), and `© {brand.name} — {legal.copyright}`.
- **`FooterFinale`** (client) — fed plain props by `buildFinaleData(branding, footerMenu, locale)`
  (`src/components/landing/finale/finale-data.ts`), computed in the server page. Its in-page PRODUCT
  anchors (`#services`/`#works`/`#process`) stay coded — they address sections of this very page, so
  they're cinematic design, not company config; only the routed company column is menu-driven.
- **Copyright composition:** the setting holds only the notice; the brand name is composed in at
  render, so a rename updates every footer rather than stranding a baked-in name.
- **SEO:** `generateMetadata` adds `metadataBase` + `alternates.canonical` + OpenGraph + Twitter
  cards from `seo.siteUrl`/`seo.shareImageUrl`, with the `twitter:site` handle **derived from
  `social.twitter`** (no redundant setting). `app/sitemap.ts` + `app/robots.ts` are driven by the
  same site url and degrade to empty/no-sitemap when it's unset (never publishing a broken URL).
  `src/branding/organization-json-ld.tsx` emits the site-wide `Organization` structured data
  (`sameAs` from the social links, contactPoint from contact). **Per-page `metaTitle`/
  `metaDescription` still come from the CMS pages builder and override these site-wide defaults.**
  Admin-authored CMS pages + blog posts are not yet enumerated in the sitemap (no list read in the
  website data layer) — a follow-up, not a guess.

## Known limitation (8.C prerequisite) — RESOLVED in 8.C-1

~~No PUBLIC media id→url endpoint exists…~~ — superseded: the public batch resolver
(`GET /api/media/public?ids=…` + `src/data/media.ts`/`src/media/`) shipped in 8.C-1 (see the
Data layer section above) and every image-bearing page since (portfolio, about) uses it, falling
back to a gradient/initial treatment only when an id is unresolved (F3), never as a blanket
placeholder.

## Tests (TDD1)

`env`, `fetch-envelope`, the data layer (`content.spec` + `collections.spec`), `branding-to-css-vars`
(incl. F7 null-safety), i18n `parity` + `locale-route`, the CMS `cms-render`, the `lead-form`, the
motion cores (`motion-core.spec` — split/orbit/count-up) + React parts (`motion-react.spec` — Lenis
reduced-motion gating, reveal/word-split), and the landing sections (`landing-sections.spec` —
DB content, empty states, WEB10 orbit cards, trust derivation). **66 specs.**

## One universe — per-route star systems + comet-flight navigation (P8.D, 2026-07-09)

The whole site now lives in ONE universe (owner directive, WEB12 — supersedes the 8.C-1
"cosmos landing-only" decision): the WebGL canvas + the flight director moved to the locale
layout (`UniverseMount`/`UniverseProvider`, persistent across routes), every route family is
its own star system (landing = the untouched WEB11 solar journey; services = "Constellation";
services/[slug] = slug-seeded "Close Orbit"; **portfolio + portfolio/[slug] = the works
"Galaxy"** — the landing's largest violet ringed world with case-study sparks orbiting it (index
and detail share the system, 8.E); **about = "Hearth"** (teal, 8.E-2 — one steady unringed core
with a still ring of team sparks, deliberately the calmest system); **process = "Waypoints"**
(indigo, 8.E-2 — the landing process world's planet with 4 moons orbiting continuously, one per
phase); **blog + blog/[slug] = the "Logbook"** (amber, 8.E-3 — one steady unringed rocky reading
world with a slow drift of small "log-entry" sparks, calm like the Hearth; index and detail share
the system); **contact + faq + careers = "Beacon"** (emerald — the "reach out / we answer" cluster
shares one system, 8.E-4, so faq↔contact is an intra-system hop); **request-a-project = "Launchpad"**
(rose/coral ignition, 8.E-5 — the flagship conversion surface gets its OWN system: a rocky launch-world
low in the frame with a hot ignition core, staged liftoff rings and an ember column rising past the
camera; `landing>request` gets the grand ignition flight + `*>request` gives every page's CTA a
consistent launch); **legal (privacy/terms) + CMS + 404/error = "Adrift"** (`ambient`),
and navigation is a DIRECTIONAL comet flight (`departure → cruise → arrival`) with the
router push at the cruise boundary so the old page departs intact and the RSC stream hides
inside the warp tunnel. Full anatomy, contracts and the new-route recipe live in the module
doc: `src/motion/universe/universe.md`. Accent is now route-resolved (`AccentStyle`
`:has([data-system])` rules off each page's `SystemStage` marker — `WebsiteShell` runs in
`pageAccent="route"` mode); marketing pages are system-lit with ONE signature element each
(constellation thread / orbital arc / beacon pulse, `marketing.css`); reduced motion
collapses flights to a brief opacity veil and mobile (no canvas) flies the CSS `TravelVeil`
off the same director state.
