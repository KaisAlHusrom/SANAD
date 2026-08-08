import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { fonts, processPhaseAccents, websiteTokens } from '@sanad/config';
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

describe('web-ui.css token parity with @sanad/config', () => {
  it('contains every website surface + text + hairline value', () => {
    const values = [
      ...Object.values(websiteTokens.surface),
      ...Object.values(websiteTokens.text),
      ...Object.values(websiteTokens.hairline),
    ];
    for (const value of values) {
      expect(css).toContain(value);
    }
  });

  it('contains the website font families', () => {
    expect(css).toContain(fonts.sans);
    expect(css).toContain(fonts.mono);
  });

  it('contains the process phase-accent cycle (--web-phase-*)', () => {
    for (const value of processPhaseAccents) {
      expect(css).toContain(value);
    }
  });
});
