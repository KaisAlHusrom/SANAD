import type { BrandingRecord } from '@sanad/contracts';
import { portalDark, portalLight } from '@sanad/config';

/** The id of the runtime brand-override `<style>` — appended AFTER the base portal theme. */
export const PORTAL_BRAND_STYLE_ID = 'sanad-portal-brand';

/**
 * The ink colors + accent alphas come from the locked portal tokens (U3/U6) — the derived
 * `--accent-soft`/`--accent-line` must match the base theme's translucency exactly, so a brand
 * accent looks like the design rather than a slightly different one.
 */
const INK_ON_LIGHT_ACCENT = portalDark['--accent-ink'] as string;
const INK_ON_DARK_ACCENT = portalLight['--accent-ink'] as string;
const ACCENT_SOFT_ALPHA = 0.12;
const ACCENT_LINE_ALPHA = 0.5;

/** A deeply-optional branding shape — a sparse cache must never crash the theme (F7). */
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

type Rgb = { r: number; g: number; b: number };

/** Parse `#rgb` / `#rrggbb` → channels; `null` for anything else (rgba()/hsl() etc. pass through). */
function parseHex(color: string): Rgb | null {
  const hex = color.trim().replace(/^#/, '');
  const full =
    hex.length === 3
      ? hex
          .split('')
          .map((c) => c + c)
          .join('')
      : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** `#rrggbb` + alpha → an `rgba()` string; returns `null` if the color isn't a parseable hex. */
export function hexToRgba(color: string, alpha: number): string | null {
  const rgb = parseHex(color);
  if (!rgb) return null;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

/** WCAG relative luminance (0..1) of a hex color; `null` if unparseable. */
function relativeLuminance(color: string): number | null {
  const rgb = parseHex(color);
  if (!rgb) return null;
  const channel = (v: number): number => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b)
  );
}

/** The legible ink to sit ON an accent fill: near-black for light accents, white for dark ones. */
export function accentInk(color: string): string {
  const lum = relativeLuminance(color);
  // Fall back to the design's dark ink when the color isn't a parseable hex.
  if (lum === null) return INK_ON_LIGHT_ACCENT;
  return lum > 0.5 ? INK_ON_LIGHT_ACCENT : INK_ON_DARK_ACCENT;
}

function accentDeclarations(
  primary?: string | null,
  secondary?: string | null,
): string {
  const lines: string[] = [];
  if (primary) {
    lines.push(`  --accent: ${primary};`);
    lines.push(`  --accent-ink: ${accentInk(primary)};`);
    const soft = hexToRgba(primary, ACCENT_SOFT_ALPHA);
    const line = hexToRgba(primary, ACCENT_LINE_ALPHA);
    if (soft) lines.push(`  --accent-soft: ${soft};`);
    if (line) lines.push(`  --accent-line: ${line};`);
  }
  if (secondary) {
    lines.push(`  --accent-2: ${secondary};`);
  }
  return lines.join('\n');
}

/**
 * Build the runtime brand-override CSS from the visual-identity record: the owner's primary →
 * the portal `--accent` (+ derived `--accent-ink/-soft/-line`) and secondary → `--accent-2`.
 * The same brand accent applies to both portal themes (dark default + light override) — the ink
 * is luminance-picked so text on the accent stays legible either way. Injected inline AFTER the
 * base `@sanad/config` theme so it wins by cascade; returns `''` when there's nothing to override
 * (the base tokens then stand, F7). Only these accent tokens are touched — surfaces/text stay on
 * the curated portal palette.
 */
export function renderPortalBrandCss(
  branding?: DeepPartial<BrandingRecord> | null,
): string {
  const primary = branding?.colors?.primary ?? null;
  const secondary = branding?.colors?.secondary ?? null;
  const decls = accentDeclarations(primary, secondary);
  if (!decls) return '';
  return [
    `[data-app] {\n${decls}\n}`,
    `[data-app][data-theme="light"] {\n${decls}\n}`,
  ].join('\n\n');
}
