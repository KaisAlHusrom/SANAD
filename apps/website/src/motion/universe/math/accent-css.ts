import { pageAccents, universeSystems } from '@sanad/config';

/**
 * Build the per-route accent stylesheet (P8.D): a base default plus one
 * `.sanad-web:has([data-system='x'])` rule per star system, generated from the token single
 * source (U3/U6). Server-rendered once by `AccentStyle`, so the accent is correct on the very
 * first SSR paint with zero client JS — a page declares its system via its `SystemStage`
 * marker and the cascade does the rest. `WebsiteShell`'s `pageAccent="route"` mode omits its
 * inline accent so these rules can win (an inline style would beat any selector); the base
 * rule keeps the shell accented even if a page ever ships without a marker (F7-style safety).
 */
export function buildAccentCss(): string {
  const base = `.sanad-web{--web-accent:${pageAccents.landing.accent};--web-accent-ink:${pageAccents.landing.ink};}`;
  const rules = Object.entries(universeSystems).map(([system, def]) => {
    const accent = pageAccents[def.accent];
    return `.sanad-web:has([data-system='${system}']){--web-accent:${accent.accent};--web-accent-ink:${accent.ink};}`;
  });
  return [base, ...rules].join('\n');
}
