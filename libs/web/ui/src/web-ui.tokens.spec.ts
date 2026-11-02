import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  fonts,
  processPhaseAccents,
  websiteTokens,
  websiteZLayers,
} from '@sanad/config';
import { describe, expect, it } from 'vitest';

/**
 * Drift guard for the one risk of the colocated-CSS approach: `web-ui.css` hand-authors the
 * `--web-*` values, which MUST equal the website token single source (`@sanad/config`, U6). If a
 * token changes in `tokens.ts` but not the CSS (or vice-versa), this fails.
 *
 * The CSS is read off disk by deriving the sibling path from this spec's own location — NOT via
 * `new URL('./web-ui.css', import.meta.url)`, which Vite rewrites into an asset reference.
 */
const css = readFileSync(
  fileURLToPath(import.meta.url).replace(/[^/]+$/, 'web-ui.css'),
  'utf8',
);

/**
 * Compare whitespace-free: prettier owns `.css` formatting and re-spaces function arguments
 * (`rgba(255,255,255,0.08)` → `rgba(255, 255, 255, 0.08)`), while the same token in `tokens.ts` is
 * a TS string literal it never touches — so a literal match can never hold for those two values.
 */
const strip = (value: string) => value.replace(/\s+/g, '');
const cssText = strip(css);

describe('web-ui.css token parity with @sanad/config', () => {
  it('contains every website surface + text + hairline value', () => {
    const values = [
      ...Object.values(websiteTokens.surface),
      ...Object.values(websiteTokens.text),
      ...Object.values(websiteTokens.hairline),
    ];
    for (const value of values) {
      expect(cssText).toContain(strip(value));
    }
  });

  it('contains the website font families', () => {
    expect(cssText).toContain(strip(fonts.sans));
    expect(cssText).toContain(strip(fonts.mono));
  });

  it('contains the process phase-accent cycle (--web-phase-*)', () => {
    for (const value of processPhaseAccents) {
      expect(cssText).toContain(strip(value));
    }
  });

  // The ladder is only useful if the CSS actually carries it — a token declared in @sanad/config
  // and forgotten here compiles to NOTHING, silently, which is the failure mode U29 exists for.
  it('declares every website z-layer token', () => {
    const cssVar = (key: string) =>
      `--web-z-${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`;
    for (const [key, value] of Object.entries(websiteZLayers)) {
      expect(cssText).toContain(strip(`${cssVar(key)}:${value};`));
    }
  });
});
