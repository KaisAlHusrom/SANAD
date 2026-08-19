import { BRANDING_SETTING_DEFAULTS } from '../branding-catalog.js';
import type { ResolvedValue } from '../resolved-value.js';
import { SECURITY_SETTING_DEFAULTS } from '../security-catalog/security-catalog.js';

/**
 * The flat-key projection of EVERY group's coded defaults (U9) — the resolver's terminal
 * fallback and the per-locale fallback source.
 *
 * It lived inside `branding-catalog.ts` while branding was the only group; P8.10.A added
 * `security`, so keeping it there would have made one group's catalog quietly authoritative
 * for all of them. A key present in two groups would silently shadow (the merge is a spread),
 * which is why the spec asserts there is no collision rather than trusting the shape.
 */
export const SETTINGS_DEFAULTS: Readonly<Record<string, ResolvedValue>> = {
  ...BRANDING_SETTING_DEFAULTS,
  ...SECURITY_SETTING_DEFAULTS,
};
