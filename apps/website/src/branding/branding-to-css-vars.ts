import type { BrandingRecord } from '@sanad/contracts';
import { fonts, websiteTokens } from '@sanad/config';

/**
 * Maps the resolved branding record onto the website's `--web-*` theme custom properties
 * (the same names `@sanad/web-ui`'s `web-ui.css` declares). Injected inline on the
 * `.sanad-web` root, runtime branding wins over the stylesheet's hardcoded defaults by
 * cascade (inline style beats a rule).
 *
 * Every leaf is read null-safe with a coded default equal to `@sanad/config` (F7/U9): the
 * resolver normally fills every leaf, but a stale cache / un-deployed backend / disabled
 * group must never render the site blank. Hairlines + radius aren't brand-configurable, so
 * they stay on the stylesheet defaults; the per-page accent is set by `WebsiteShell`.
 */
export const WEB_CSS_VAR_KEYS = [
  '--web-bg',
  '--web-track',
  '--web-s1',
  '--web-s2',
  '--web-text',
  '--web-dim',
  '--web-muted',
  '--web-faint',
  '--web-sans',
  '--web-mono',
] as const;

type WebCssVarKey = (typeof WEB_CSS_VAR_KEYS)[number];

/** A deeply-optional branding shape — every leaf may be missing (sparse cache, F7). */
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export function brandingToCssVars(
  branding?: DeepPartial<BrandingRecord> | null,
): Record<WebCssVarKey, string> {
  const surface = branding?.colors?.surface;
  const text = branding?.colors?.text;
  const fontSet = branding?.fonts;

  return {
    '--web-bg': surface?.bg ?? websiteTokens.surface.bg,
    '--web-track': surface?.track ?? websiteTokens.surface.track,
    '--web-s1': surface?.s1 ?? websiteTokens.surface.s1,
    '--web-s2': surface?.s2 ?? websiteTokens.surface.s2,
    '--web-text': text?.base ?? websiteTokens.text.base,
    '--web-dim': text?.dim ?? websiteTokens.text.dim,
    '--web-muted': text?.muted ?? websiteTokens.text.muted,
    '--web-faint': text?.faint ?? websiteTokens.text.faint,
    '--web-sans': fontSet?.sans ?? fonts.sans,
    '--web-mono': fontSet?.mono ?? fonts.mono,
  };
}
