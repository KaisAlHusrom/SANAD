/**
 * Sanad design tokens — the single source of truth for color/space/type/radius
 * (U6). Values are locked from the imported Claude designs
 * (docs/design/design-spec.md). No surface hardcodes a literal; everything
 * resolves from here (and brand-configurable values later override at runtime).
 */

/** Website: single fixed dark signature theme (no toggle, WEB7). */
export const websiteTokens = {
  surface: {
    bg: '#05080d',
    track: '#070a10',
    s1: '#0c111c',
    s2: '#161d2a',
  },
  text: {
    base: '#e7eaf0',
    dim: '#aab2c5',
    muted: '#8b93a7',
    faint: '#5d6678',
  },
  hairline: {
    base: 'rgba(255,255,255,0.08)',
    strong: 'rgba(255,255,255,0.14)',
  },
} as const;

/** Per-page accent that drives the cosmos scene, scroll bar, CTA and glows. */
export const pageAccents = {
  landing: { accent: '#22d3ee', secondary: '#3b82f6', ink: '#06121c' },
  about: { accent: '#2dd4bf', secondary: '#3b82f6', ink: '#06121c' },
  services: { accent: '#38bdf8', secondary: '#3b82f6', ink: '#06121c' },
  serviceDetail: { accent: '#6366f1', secondary: '#3b82f6', ink: '#0a0c1c' },
  // P8.E Portfolio: works = the landing "works" world's violet (the largest ringed planet).
  works: { accent: '#a855f7', secondary: '#6366f1', ink: '#0f0618' },
  // P8.E-2 Process: the landing "process" world's indigo (the phased-delivery moons planet).
  process: { accent: '#6366f1', secondary: '#a855f7', ink: '#0a0c1c' },
  // P8.E-3 Blog: the landing "blog" world's amber (the ship's-log rocky planet).
  blog: { accent: '#f59e0b', secondary: '#fbbf24', ink: '#15110a' },
  // P8.E-5 Request-a-project "Launchpad": a distinct warm ignition accent (rose/coral) — the
  // flagship "Start a project" conversion surface has its OWN system, not the contact emerald.
  request: { accent: '#fb7185', secondary: '#c084fc', ink: '#160611' },
  // P8.D one-universe additions: contact = the beacon emerald (the design's testimonials
  // world light — no contact entry exists in design-spec §1, owner-approved 2026-07-09);
  // ambient = the landing cyan, dimmed by CSS on the deep-space fallback pages.
  contact: { accent: '#34d399', secondary: '#3b82f6', ink: '#06121c' },
  ambient: { accent: '#22d3ee', secondary: '#3b82f6', ink: '#06121c' },
} as const;

export type PageAccentKey = keyof typeof pageAccents;

/**
 * The four-colour phase-accent cycle for the landing `process` moons + phase-briefing cards
 * (cyan → sky → indigo → teal, locked from `docs/design/source/Sanad Landing.dc.html`). Indexed
 * `phase % 4`; drives the shared `@sanad/web-ui` process cards' `--web-phase` so the admin preview
 * shows the SAME per-phase colour as the live moons (preview===live). Single source (U6).
 */
export const processPhaseAccents = [
  '#22d3ee',
  '#38bdf8',
  '#818cf8',
  '#2dd4bf',
] as const;

/**
 * The nine landing "worlds" (WEB10) — one planet per section of the scroll journey. `glow` is the
 * section's signature light (drives the world-veil, sun, and process moons); `fog` is the section's
 * deep-space tint (the scene fog + clear colour — distinct from the glow); `palette` are the three
 * shading shades of the planet surface; `type` selects its archetype; `radius`/`ring` size it.
 * Locked from `docs/design/source/Sanad Landing.dc.html`. Scene-placement (3D offsets, particle
 * spreads) is runtime presentation and lives with the website's cosmos, not here (U6 carve-out).
 */
export const landingWorlds = {
  hero: {
    glow: '#22d3ee',
    fog: '#060912',
    palette: ['#56cfee', '#2ea6cf', '#176f96'],
    type: 'star',
    radius: 104,
    ring: false,
  },
  trust: {
    glow: '#2dd4bf',
    fog: '#061016',
    palette: ['#9af5e6', '#2dd4bf', '#0c7d70'],
    type: 'gas',
    radius: 96,
    ring: false,
  },
  services: {
    glow: '#38bdf8',
    fog: '#061119',
    palette: ['#cfecff', '#38bdf8', '#1668a0'],
    type: 'gas',
    radius: 98,
    ring: true,
  },
  process: {
    glow: '#6366f1',
    fog: '#0a0a1e',
    palette: ['#d6dcff', '#6366f1', '#312e9c'],
    type: 'gas',
    radius: 84,
    ring: false,
  },
  works: {
    glow: '#a855f7',
    fog: '#130a20',
    palette: ['#efd9ff', '#a855f7', '#6a21a6'],
    type: 'gas',
    radius: 138,
    ring: true,
  },
  stats: {
    glow: '#22d3ee',
    fog: '#07111c',
    palette: ['#e6feff', '#7ef0ff', '#22d3ee'],
    type: 'ice',
    radius: 88,
    ring: false,
  },
  testimonials: {
    glow: '#34d399',
    fog: '#08131c',
    palette: ['#bff7d8', '#34d399', '#10704c'],
    type: 'rocky',
    radius: 86,
    ring: false,
  },
  blog: {
    glow: '#f59e0b',
    fog: '#15110a',
    palette: ['#ffe6a3', '#f59e0b', '#9a4d07'],
    type: 'rocky',
    radius: 84,
    ring: false,
  },
  cta: {
    glow: '#2dd4bf',
    fog: '#04131c',
    palette: ['#d9fff4', '#7af0dd', '#23c4cb'],
    type: 'star',
    radius: 130,
    ring: true,
  },
} as const;

/** The section order the journey travels through (drives per-world scroll placement). */
export const landingWorldOrder = [
  'hero',
  'trust',
  'services',
  'process',
  'works',
  'stats',
  'testimonials',
  'blog',
  'cta',
] as const;

export type LandingWorldKey = keyof typeof landingWorlds;

/**
 * The "one universe" star systems (P8.D) — one per public route family. Every page idles
 * inside its own star system and navigation is a comet flight between them. `palette` is the
 * system's three shading shades (light→mid→deep) and `fog` its deep-space tint, locked from
 * design-spec §1's per-page cosmos cols; `accent` names the `pageAccents` palette the route
 * resolves onto `--web-accent` (via the website's `AccentStyle` `:has()` rules). The landing
 * system IS the hero star of the landing journey, so it references `landingWorlds.hero`
 * (single source, U3); `ambient` (CMS pages / 404 / error) drifts in the same landing light.
 */
export const universeSystems = {
  landing: {
    accent: 'landing',
    palette: landingWorlds.hero.palette,
    fog: landingWorlds.hero.fog,
  },
  services: {
    accent: 'services',
    palette: ['#cfecff', '#38bdf8', '#1668a0'],
    fog: '#061119',
  },
  serviceDetail: {
    accent: 'serviceDetail',
    palette: ['#d6dcff', '#6366f1', '#312e9c'],
    fog: '#0a0a1e',
  },
  // P8.E Portfolio "Galaxy" — the works world (the largest ringed violet planet), single-sourced.
  works: {
    accent: 'works',
    palette: landingWorlds.works.palette,
    fog: landingWorlds.works.fog,
  },
  // P8.E-2 About "Hearth" — the trust world's teal (single-sourced; pageAccents.about is this hex).
  about: {
    accent: 'about',
    palette: landingWorlds.trust.palette,
    fog: landingWorlds.trust.fog,
  },
  // P8.E-2 Process "Waypoints" — the process world's indigo moons planet, single-sourced.
  process: {
    accent: 'process',
    palette: landingWorlds.process.palette,
    fog: landingWorlds.process.fog,
  },
  // P8.E-3 Blog "Logbook" — the blog world's amber rocky planet, single-sourced.
  blog: {
    accent: 'blog',
    palette: landingWorlds.blog.palette,
    fog: landingWorlds.blog.fog,
  },
  contact: {
    accent: 'contact',
    palette: ['#bff7d8', '#34d399', '#10704c'],
    fog: '#08131c',
  },
  // P8.E-5 Request-a-project "Launchpad" — its OWN ignition system (rose/coral), the flagship
  // conversion surface; a warm launch light against near-black, distinct from every other system.
  request: {
    accent: 'request',
    palette: ['#ffd9dd', '#fb7185', '#8f1d3a'],
    fog: '#0c0709',
  },
  ambient: {
    accent: 'ambient',
    palette: landingWorlds.hero.palette,
    fog: landingWorlds.hero.fog,
  },
} as const satisfies Record<
  string,
  {
    accent: PageAccentKey;
    palette: readonly [string, string, string];
    fog: string;
  }
>;

export type UniverseSystemKey = keyof typeof universeSystems;

/** Radius scale (px), shared website + portals. */
export const radius = {
  xs: 2,
  sm: 9,
  md: 11,
  lg: 14,
  xl: 16,
  '2xl': 18,
  '3xl': 22,
  pill: 999,
} as const;

/**
 * The website's stacking ladder — every SITE-GLOBAL layer, in paint order.
 *
 * It exists because these numbers were scattered as bare integers across four stylesheets, so
 * nobody could answer "what sits above what" without grepping, and a new fixed layer had to guess.
 *
 * It covers global layers only. Ordering INSIDE one component's own stacking context (the process
 * moons over their system, a works card's orbit depth) stays a local number: promoting those would
 * assert a site-wide relationship that does not exist, and orbit depth is runtime data anyway.
 *
 * Caveat worth knowing before trusting the numbers as painted order: `.lp-content` is itself
 * `z-index: 10`, so the landing layers nested inside it (`ignition`, `finale`, `wayfinder`) are
 * local to THAT context and paint below `nav`/`scrollProgress` despite the larger numbers. The
 * ladder records the intent; where intent and paint order differ, a `:has()` rule enforces it.
 */
export const websiteZLayers = {
  under: -1,
  cosmos: 1,
  /** The WEB13 lift: content over the persistent cosmos canvas must claim a stacking context. */
  lift: 1,
  worldVeil: 2,
  content: 10,
  popover: 20,
  wayfinder: 40,
  finale: 45,
  cursor: 55,
  travelVeil: 60,
  nav: 65,
  scrollProgress: 70,
  consentBar: 80,
  ignition: 90,
  overlay: 100,
} as const;

/** Spacing rhythm (px). */
export const spacing = [
  2, 6, 8, 10, 12, 14, 16, 18, 22, 24, 26, 28, 30, 34, 38, 46, 48,
] as const;

/** Content max width (px). */
export const contentMaxWidth = 1320;

/** Type families — IBM Plex Sans Arabic (text/display) + IBM Plex Mono (labels). */
export const fonts = {
  sans: "'IBM Plex Sans Arabic', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
} as const;
