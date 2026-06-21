# 04 — Website (content-driven, animated, Arabic-first)

> The public site: Next.js App Router, 100% DB-driven, premium Arabic-first identity, Awwwards-caliber motion. Rules WEB1–WEB6 + F-canon govern it. The visual brief is also distilled in `.claude/docs/claude-design-prompt.md`.

## Principles
- **Content-driven (WEB1):** every text/image/number/identity value comes from the gateway (content-service + settings-service). No hardcoded marketing copy. Coded defaults (U9/F7) cover first-paint + missing content.
- **SEO-first (WEB2):** page content fetched in **server components** via a typed fetch client on `libs/contracts`; client components only for interactivity/animation. Per-page metadata, sitemap, OpenGraph, hreflang (ar/en).
- **Arabic default + RTL (U7/U8):** `ar` is the default route/locale, RTL is the default direction; `en` is secondary.

## Data flow
- `website` server components call gateway read endpoints (`/content/pages/:slug`, `/content/services`, `/content/portfolio`, `/content/blog`, `/content/testimonials`, `/content/faq`, `/content/menus`, `/settings/branding`).
- Branding (colors/logo/fonts/social/contact) → CSS variables injected at the root from settings with coded defaults (never blank).
- Contact / **request-a-project** form → gateway → content-service `lead` + `lead.created` event → notifications.

## Design system (tokens — `libs/web/ui`)
**Single fixed signature theme (WEB7) — the website has NO dark/light toggle.** One opinionated, bespoke art direction *is* the brand. (Dual dark+light lives only in the dashboards.) The look must be unmistakably **سند التقنية** and avoid templated clichés (WEB9).
- **Type (the signature tell):** a premium Arabic display + text pairing as the brand voice (candidates Cairo / Tajawal / IBM Plex Sans Arabic / Readex Pro — aim for a distinctive, ownable choice). Arabic ~+12% size, line-height ~1.8, **no letter-spacing** (WEB5); matched Latin for English; one numeral system applied consistently. Self-host WOFF2 variable, `unicode-range` split, `font-display: swap`.
- **Surface & color:** premium dark canvas with a **surface ladder** separated by **1px hairlines** (depth from the ladder + hairlines, not heavy shadows); **2–3 rationed emissive accents** with bloom/additive glow; baseline near-black `#0A0F0E`, off-white `#EAF2F0`, slate `#7E928E`, deep-teal primary `#0E7C7B`→`#14B8A6`, ghost-lime CTA `#A8E635` — but treat these as a starting point to make ownable, not a default. Render gradients in **Oklab + blue-noise dithering** (no banding/muddiness). **One signature decorative element per page, used once.** All values are tokens (U6); brand values resolve from settings at runtime.
- Spacing, radius, shadow/elevation, z-index — token scales, no inline literals (U6/U18).

## Signature interactions (reference-derived: Active Theory, Resn, Framer, Raycast)
- **Persistent hero "moment," not a banner:** one real-time WebGL scene/object unique to Sanad, resolving into clear, filterable content (dual-mode: wow + clarity).
- **Velocity-reactive cursor** emitting an on-brand trail (calligraphic ink / geometric tessellation / single luminous thread — **not** generic dots).
- **Full-screen in-place transitions** (preview expands into detail; no hard reloads; one continuous world).
- **A few genuinely tactile hero objects** — grabbable / cursor-velocity-reactive with real spring physics (quality over quantity).
- **Motion discipline (Framer/Raycast):** spring physics not fixed durations (reveal ≈ stiffness 200 / damping 22; hover snappier); reveals fade-up ~24px (never >40px), stagger 60–80ms, trigger at 20% in view, **one focal animation per viewport**; hover scale 1.02–1.05, lift y −4px, press 0.97. Crispness = instant low-amplitude state changes + hairline precision.
- **Show real work mid-operation** — live states, real metrics as UI chips, the phased-delivery method visualized — not stock illustration.

## Signature scroll choreography (WEB10 — the centerpiece)
The landing page is **one continuous journey around a persistent central element** (Active Theory-style), not stacked independent sections.
- **One persistent central object** stays centered and **travels through the whole scroll, morphing per section** (hero mark → services conduit → phased-delivery path → works spine). Never just scrolls away.
- **Works section = a spine + orbiting cards:** the central element becomes a vertical axis; project cards **orbit around it driven by scroll progress** while the section is **pinned** (ring: `angle = index/count × 360°`, rotation scrubbed by scroll).
- Every section animates **in relation to the central anchor** → one living world.
- **Build model:** a single normalized scroll-progress (0→1) drives a fixed full-viewport layer (Three.js/R3F object, or a pinned SVG/DOM element for a lighter build) that the page scrolls over; transitions use GSAP ScrollTrigger **pin + scrub**, synced to Lenis. drei `ScrollControls` if the canvas is the page.
- **Guardrails:** scroll-**linked**, never scroll-**jacked** (native scrollbar/keyboard/find-on-page intact); transform/opacity only (60fps); mobile = simplified/static central element; `prefers-reduced-motion` → central element settles into clean static per-section states. **RTL:** vertical journey identical; **flip the sign** of card-orbit direction + any left/right motion via a `--dir: 1/-1` scalar; normalize `scrollLeft` if any horizontal scroll is used (browser-inconsistent in RTL).
- **References:** Active Theory (scroll-driven WebGL worlds), Lusion (WebGL scroll-sync), Aristide Benoist, Locomotive.

## Sound layer (WEB8 — signature, tasteful; Resn-inspired)
- **Never autoplay.** Unlock the AudioContext on the first user gesture (the intro/enter doubles as the unlock); then optionally fade in a **quiet ambient bed**.
- **Persistent, always-visible sound on/off toggle**, default **off**, choice persisted (localStorage).
- Cues only on **meaningful** events (hero grab/release, section arrival, primary CTA), low volume — **never** per-hover. Optionally make a hero visual **audio-reactive** (Web Audio `AnalyserNode` FFT → accent color/motion).
- Pair with `prefers-reduced-motion` as a **"calm mode"** (motion + sound off). Nothing audio-only; mobile stays silent until tapped.

## Clichés to refuse (WEB9)
Generic particle/dot constellations · drifting aurora-blob mesh backgrounds (unless Oklab-correct & uniquely shaped) · default-lit spinning 3D blob/torus/icosahedron · magnetic buttons + giant inverting cursor · word-by-word reveal of every paragraph · scroll-jacked horizontal galleries (also break RTL/trackpads) · badge walls · "scroll to explore" bouncing chevron · fake terminal/percentage loaders · infinite logo marquees · autoplay sound/video. Favor one or two ownable signatures over piled-on effects.

## Animation stack (WEB3)
- **Lenis** — smooth/inertia scroll + infinite marquees. Wire to GSAP ticker (`lenis.on('scroll', ScrollTrigger.update)` → `gsap.ticker.add(t => lenis.raf(t*1000))` → `lagSmoothing(0)`).
- **GSAP + ScrollTrigger** (+ `useGSAP`) — pin, scrub, parallax, horizontal sections, snap; **SplitText** for staggered reveals.
- **Framer Motion** — page/route transitions (`AnimatePresence`), in-view reveals, hover/layout.
- **React-Three-Fiber + drei** — WebGL hero / particles. Lazy-load the canvas (`dynamic`, `ssr:false`), `frameloop="demand"`.
- **Division:** Framer Motion = component UI/transitions; GSAP = scroll choreography.

## Reduced motion (WEB4 — mandatory)
Honor `prefers-reduced-motion`: gate Lenis instantiation behind the check (it doesn't auto-respect it), kill parallax/scroll-reveal/animated-gradients/autoplay, swap x/y motion for opacity (`<MotionConfig reducedMotion="user">`). Essential feedback stays.

## RTL motion (WEB5/WEB6)
- **Arabic text reveals split by WORD, not letter** (letter-splitting breaks cursive ligatures). Use a word-splitter.
- Horizontal motion reverses under RTL (a right-side drawer slides from the right). No logical property for `transform` → flip via a `[dir="rtl"]`-scoped CSS custom property feeding the keyframes.
- **Do mirror:** layout, nav order, directional icons, progress bars, carousels. **Don't mirror:** logos, media-playback controls, numbers/numerals, charts with a time axis, code, symmetric icons.

## Pages (all DB-driven)
1. **Landing** — hero (WebGL/aurora, outcome-led headline, one high-contrast CTA "ابدأ مشروعك") → trust logos → **bento services** → **discover/design/build/launch phase timeline** (the company's phased-delivery method) → **case studies** (Challenge/Solution/Outcome + metrics) → animated stats → testimonials → blog teaser → CTA → contact.
2. **About** — story, team, values (trust theme).
3. **Services** (+ detail) — what Sanad builds (SaaS, mobile, LMS, ERP…), each with its own bespoke section.
4. **Portfolio / Case studies** (+ detail) — bespoke visual treatment per project.
5. **Process** — the phased delivery + weekly-meeting + post-delivery-support method, as an animated timeline.
6. **Blog** (+ post) — categories/tags, WYSIWYG content from CMS, social share, ar/en.
7. **Contact** + **Request-a-project** — multi-step form → lead.
8. **FAQ** — from CMS.
9. **Careers** — open roles (ties to future HR/recruitment).
10. **Legal** — privacy / terms.

> Confirm during P8 review whether to keep all of Process / FAQ / Careers / Legal.

## Performance & a11y
- Hero media WebP/AVIF, contrast ≥ 4.5:1, lazy-load below-the-fold + the R3F canvas, animate transform/opacity only, preload only above-fold fonts. Keyboard-navigable; motion respects the OS setting.

## Reference studios to emulate (motion craft)
Active Theory, Resn, Locomotive, Cuberto, Obys, Unseen Studio. Arabic/Gulf type & identity benchmarks: Khatt Foundation, TPTQ Arabic; brand sites NEOM, Vision 2030 (premium Arabic-first feel). Browse Awwwards directory for vetted references.
