# Sanad Tech — Design spec (locked)

> The single written spec the `designer` agent and P7/P8 build against. Values are extracted verbatim
> from the imported Claude Design files (see [`README.md`](./README.md)) and are **authoritative**.
> Honors rules U6 (tokens only), U7 (RTL), WEB7 (website single theme), WEB10 (signature scroll).
> **Per the owner's decision (2026-06-21): keep the persistent central object + orbiting-cards
> choreography; REMOVE the literal sci-fi HUD** (km/s velocity readout + `SND-xx` star-map
> coordinates). Keep a restrained scroll-progress indicator.

---

## 0. Brand fundamentals

- **Wordmark:** `سَنَد` (bold) + `التقنية` (medium, dimmed). Always RTL, never mirrored.
- **Glyph mark (used in designs):** a rotated rounded square (diamond) outline with a glowing solid
  diamond core — `inset:0` 1px accent border `rotate(45deg)` + `inset:7px` solid accent core with
  `box-shadow` glow. This is a _placeholder_ mark; the real logo comes from `logo-prompt.md`.
- **Typography:**
  - Display + text: **IBM Plex Sans Arabic** (weights 300/400/500/600/700).
  - Mono / labels / code / numerals-in-mono: **IBM Plex Mono** (400/500).
  - Self-host both as WOFF2 (rules: no CDN in prod); designs used Google Fonts — we localize.
  - **Never apply `letter-spacing` to Arabic.** Mono Latin labels use `letter-spacing: 0.12em–0.3em`.
  - **Numerals: Western digits** as the consistent system across website + portals (the designs mix
    Western on the website and Eastern-Arabic `٢٧٠٬٠٠٠` in the client portal — we standardize on
    **Western** everywhere; record any later change in the rules log).
  - `unicode-bidi: isolate; direction: ltr` on every Latin run inside Arabic (SaaS, ERP, tech names).
- **Direction:** root `dir="rtl" lang="ar"`. RTL is the default; LTR (`en`) is the special case.

---

## 1. WEBSITE tokens (single fixed dark signature theme — no toggle, WEB7)

### Surface ladder (depth by hairlines, not heavy shadow)

| Token           | Value                                                                                            | Use                               |
| --------------- | ------------------------------------------------------------------------------------------------ | --------------------------------- |
| `bg`            | `#05080d`                                                                                        | page base (near-black)            |
| `surface-track` | `#070a10`                                                                                        | scrollbar track / deepest         |
| `surface-1`     | `#0c111c`                                                                                        | raised surface                    |
| `surface-2`     | `#161d2a`                                                                                        | scrollbar thumb / higher surface  |
| card gradient   | `linear-gradient(180deg, rgba(15,21,30,.62), rgba(10,14,22,.5))` + `backdrop-filter: blur(12px)` | glass cards                       |
| hairline        | `rgba(255,255,255,0.08)`                                                                         | default 1px border                |
| hairline-strong | `rgba(255,255,255,0.14)`                                                                         | secondary buttons / stronger edge |

### Text ramp

| Token        | Value                 | Use                   |
| ------------ | --------------------- | --------------------- |
| `text`       | `#e7eaf0`             | primary               |
| `text-dim`   | `#aab2c5` / `#aeb6c8` | nav, body lead        |
| `text-muted` | `#8b93a7` / `#9aa3b6` | card body             |
| `text-faint` | `#5d6678`             | mono labels, captions |

### Per-page accent (the signature color shift per surface)

Each page resolves **one accent** that drives the cosmos scene, the scroll bar, CTA fill, glows.
| Page | Accent | Secondary | Soft glow rgba | Cosmos `cols` |
|---|---|---|---|---|
| Landing | `#22d3ee` cyan | `#3b82f6` | `rgba(34,211,238,*)` | — |
| About | `#2dd4bf` teal | `#3b82f6` | `rgba(45,212,191,*)` | `['#9af5e6','#2dd4bf','#0c7d70']` |
| Services | `#38bdf8` sky | `#3b82f6` | `rgba(56,189,248,*)` | `['#cfecff','#38bdf8','#1668a0']` |
| Service detail | `#6366f1` indigo (`#818cf8` light) | `#3b82f6` | `rgba(99,102,241,*)` | `['#d6dcff','#6366f1','#312e9c']` |
| Accent-on light text | `#a5b4fc` (indigo pages) / `#5eead4` (teal pages) | | | |

> Implement accent as a CSS custom property set per route (e.g. `--accent`, `--accent-2`,
> `--accent-soft`, `--accent-line`) so a single token system serves all pages (U6). CTA text-on-accent
> is near-black: `#06121c` (cyan/teal/sky) / `#0a0c1c` (indigo).

### Radius scale

`2–3px` (tick accents) · `8/9px` (small) · `11px` (icon tiles) · `13px` (chat) · `16px` (support cards)
· `18px` (capability cards) · `20px` (image/value cards) · `22px` (service cards) · `999px` (pills) · `50%` (orbs/avatars).

### Spacing rhythm

Base unit ~`2px`. Common steps: `6 8 10 12 14 16 18 22 24 26 28 30 34 38 46 48`. Section padding uses
fluid `clamp(22px,6vw,96px)` inline + `5–18vh` block. Content max-width **1320px**, centered.

### Type scale (fluid)

| Role         | Size                                                                                         |
| ------------ | -------------------------------------------------------------------------------------------- |
| H1 hero      | `clamp(40px,6–6.4vw,88–92px)`, line-height `1.07–1.08`, weight 600, `letter-spacing:-0.02em` |
| H2 section   | `clamp(28px,3.6vw,48px)`, weight 600, `-0.01em`                                              |
| H2 CTA       | `clamp(30px,4.4vw,64px)`, weight 600                                                         |
| Stat number  | `clamp(34px,4vw,56px)`, weight 700                                                           |
| Lead/body    | `clamp(17px,1.5vw,21px)`, line-height `1.9`                                                  |
| Card body    | `14–15px`, line-height `1.8–1.85`                                                            |
| Mono eyebrow | `11–13px`, `letter-spacing:0.18–0.3em`, accent color                                         |

### Shadow / glow

- Card hover: `0 24–28px 60–70px rgba(0,0,0,0.4–0.45), 0 0 48–56px rgba(<accent>,0.1–0.12)`.
- CTA: `0 0 24–34px rgba(<accent>,0.35–0.4)` → hover `0 0 46–50px rgba(<accent>,0.6–0.65)`.
- Hover transforms: card lift `translateY(-4 to -5px)`; CTA `translateY(-2px)`; border → `<accent> @0.5`.
- Gradients rendered in **Oklab** with blue-noise dithering to avoid banding (rules WEB design).

---

## 2. WEBSITE — page structure (sections in order)

**Global chrome (all pages):** fixed top nav (logo right, links `خدماتنا / من نحن / أعمالنا` center-ish,
pill CTA `تواصل معنا` accent), 2px top scroll-progress bar (accent gradient), footer
(logo + tagline / two nav columns / `© سَنَد التقنية`). **Removed:** the bottom-right depth-HUD
(velocity + coordinates).

- **Landing:** Hero (headline + 2 CTAs) → Trust/clients (domains + stats) → Services (4-up:
  SaaS/Mobile/LMS/ERP) → Process timeline (اكتشاف→تصميم→تطوير→إطلاق) → **Works** (orbiting case-study
  cards around the central spine — the WEB10 centerpiece) → Stats (4-up) → Testimonials (2) →
  Blog teaser (3) → CTA (الإطلاق) → Footer.
- **About:** Hero → Story (2-col text + image 4:5) → Values (3 cards: الثِّقة/TRUST, الإتقان/MASTERY,
  الحِرفة/CRAFT) → Team (4-col grid, role bilingual) → Stats (4-up) → CTA → Footer.
- **Services:** Hero → Core services (2×2 cards, link to detail) → Supporting (4-up) → Method
  (4-phase row) → Tech-stack strip (LTR mono) → CTA → Footer.
- **Service detail:** Breadcrumb hero (2 CTAs) → Capabilities (3×2) → Build journey (sticky-left +
  4 steps right) → Outcomes (3 metrics) → Tech pills → Related services (3) → CTA → Footer.

---

## 3. SIGNATURE interaction (WEB10) — central object + orbiting cards

- A **persistent fixed full-viewport layer** (`#scene-canvas`, z-1) renders the central object
  (`cosmos.js` = Three.js + UnrealBloom in the design). One normalized scroll-progress (0→1) drives it.
- A **radial `world-veil`** (z-2, `mix-blend:screen`, accent-tinted) brightens per section; a vignette
  radial sits above it.
- An **`ink-canvas`** (z-55) carries the velocity-reactive cursor trail (on-brand line/ink — **not**
  generic dots, WEB9).
- **Works section = the spine:** the central object becomes a vertical axis and the case-study cards
  **orbit** it; `angle = index / count × 360°`, rotation **scrubbed by scroll** while the section is
  **pinned** (GSAP ScrollTrigger pin+scrub synced to Lenis).
- **Keyframes present:** `sanadPulse` (opacity .35↔1), `emberRise` (rising particles), `craterPulse`.
- **REMOVED (owner decision):** `depth-hud` — the `السرعة 0 كم/ث` velocity readout + `إحداثيات SND-xx`
  star-map coordinates. Keep the top scroll-progress bar (restrained, on-brand).
- **Guardrails (WEB10/WEB4/WEB6):** scroll-**linked not jacked** (native scrollbar/keyboard/find intact);
  animate transform/opacity only (60fps); lazy-load the canvas; **mobile** → lighter/static central
  element; **`prefers-reduced-motion`** → central object settles into clean static per-section states,
  cursor trail + ambient off ("calm mode"); **RTL** → flip orbit-direction sign + any x-motion via a
  `--dir: 1/-1` scalar.
- **Sound (WEB8):** not in the designs; when added it is opt-in, gestured-unlock, default-off, muteable,
  cues on meaningful events only.

---

## 4. PORTAL tokens (admin + client — dual dark + light theme)

Applied on a `[data-app]` root; theme switches via `[data-app][data-theme="light"]`. Implement as the
shadcn-on-tokens base in `libs/web/ui`.

### Dark (default)

```
--bg:#080b11;  --surface:#0d121b;  --surface-2:#111826;  --surface-3:#161f30;  --sidebar:#0a0e15;
--border:rgba(255,255,255,0.07);   --border-2:rgba(255,255,255,0.12);
--text:#e7eaf0;  --dim:#97a1b5;    --faint:#5d6678;
--accent:#22d3ee; --accent-2:#2dd4bf; --accent-3:#3b82f6;
--accent-ink:#04121a; --accent-soft:rgba(34,211,238,0.12); --accent-line:rgba(34,211,238,0.5);
--good:#34d399;  --warn:#fbbf24;   --bad:#fb7185;
--shadow:0 1px 0 rgba(255,255,255,0.02);
```

### Light

```
--bg:#f1f3f6;  --surface:#ffffff;  --surface-2:#fafbfc;  --surface-3:#f4f6f9;  --sidebar:#ffffff;
--border:rgba(12,18,28,0.09);      --border-2:rgba(12,18,28,0.16);
--text:#101826;  --dim:#586173;    --faint:#8b94a4;
--accent:#0e9bb8; --accent-2:#0f9b8a; --accent-3:#2563eb;
--accent-ink:#ffffff; --accent-soft:rgba(14,155,184,0.10); --accent-line:rgba(14,155,184,0.45);
--good:#059669;  --warn:#d97706;   --bad:#e11d48;
--shadow:0 1px 2px rgba(12,18,28,0.04);
```

- **Status mixing:** statuses use `color-mix(in oklab, var(--good|warn|bad) 16–18%, transparent)` for
  the pill background + the solid token for text.
- **Portal radius:** inputs `10px`, small cards `11px`, nav buttons `9px`, medium cards `14px`,
  large/hero `16px`, pills/avatars `999px`/`50%`.

### Shell (both portals)

- **Sidebar** `266px`, `var(--sidebar)`, `border-inline-start` hairline, sticky full-height:
  brand header → (client only) project switcher → nav list (active = `--accent-soft` bg + `--accent`
  fg + `inset -3px 0 0 --accent` inline-end bar) → footer user card + logout.
- **Topbar** `64px`, sticky, `backdrop-filter: blur(10px)`, `color-mix(in oklab, var(--bg) 80%, transparent)`:
  screen title + subtitle (start) → spacer → actions (client: `+ طلب جديد`, notifications bell w/ dot,
  theme toggle; admin: live-preview toggle, theme toggle).
- **Content** scrolls; page padding `26px clamp(20px,3vw,36px) 56px`.

### Nav inventory

- **Admin:** `لوحة التحكّم` · `إدارة المحتوى` · `الهوية والإعدادات` · `مكتبة الوسائط` ·
  `صندوق العملاء المحتملين` · `المستخدمون والصلاحيات`.
- **Client:** `مشروعي` · `المراحل والجدول` · `التسليمات` (warn badge) · `الرسائل والاجتماعات` ·
  `الفواتير` · `الدعم`.

### Portal screen inventory (content-shaped skeleton + empty + error for each, F2)

- **Admin:** Login · Dashboard (3 stat cards + activity + quick actions) · Content management
  (per-locale ar/en tabs + editor + live preview) · Branding & settings (color/logo/type editors) ·
  Media library (asset grid) · Leads inbox (table + status) · Users & roles (list + role matrix) ·
  Live preview.
- **Client:** Login (split brand panel) · Dashboard (hero progress ring 62% + 3 status cards + phase
  stepper + activity) · Phases (per-phase cards, progress bar, task chips) · Deliverables (rows w/
  approve / request-changes / download) · Messages (chat thread + weekly meeting-notes panel) ·
  Invoices (3 stat tiles + payments table + pay-online) · Support (tickets list + support-contract
  widget: tier, hours used, coverage left, response time).

### Shared portal components → build in `libs/web/ui` (reuse-before-create, F9)

Stat tile · data table (CSS-grid header + rows) · status/priority pill · progress bar · phase stepper ·
chat bubble · form input (focus → `--accent-line`) · primary/secondary button · sidebar nav button ·
avatar (gradient + initial) · skeleton (content-shaped).

---

## 5. Build notes / deviations from the raw designs

- Designs inline all styles + use the Design Component runtime (`support.js`, `sc-if`, `sc-for`,
  `{{bindings}}`). We **re-implement** as React (Vite portals / Next.js website) + Tailwind-on-tokens;
  do not port `support.js`.
- All hardcoded hex in the designs → **tokens** (U6). No inline literals survive into our code except
  genuine runtime values (chart widths, canvas coords), commented.
- All copy → from settings/CMS with the coded defaults in `content-defaults.md` (U9, WEB1).
- The cosmos scene is re-implemented with React-Three-Fiber + drei (lazy `frameloop="demand"`),
  reduced-motion fallback, mobile simplification — per WEB10.
