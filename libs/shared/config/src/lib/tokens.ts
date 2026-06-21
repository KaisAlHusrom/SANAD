/**
 * Sanad design tokens — the single source of truth for color/space/type/radius
 * (U6). Values are locked from the imported Claude designs
 * (.claude/design/design-spec.md). No surface hardcodes a literal; everything
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
} as const;

export type PageAccentKey = keyof typeof pageAccents;

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
