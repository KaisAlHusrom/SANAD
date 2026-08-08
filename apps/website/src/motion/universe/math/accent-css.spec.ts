import { pageAccents, universeSystems } from '@sanad/config';
import { describe, expect, it } from 'vitest';
import { buildAccentCss } from './accent-css';

describe('buildAccentCss (SSR per-route accent rules)', () => {
  const css = buildAccentCss();

  it('declares a base default so the shell never loses its accent (F7-style safety)', () => {
    expect(css).toContain(
      `.sanad-web{--web-accent:${pageAccents.landing.accent};--web-accent-ink:${pageAccents.landing.ink};}`,
    );
  });

  it('emits one :has() rule per universe system, from the token single source (U3/U6)', () => {
    for (const [system, def] of Object.entries(universeSystems)) {
      const accent = pageAccents[def.accent];
      expect(css).toContain(
        `.sanad-web:has([data-system='${system}']){--web-accent:${accent.accent};--web-accent-ink:${accent.ink};}`,
      );
    }
  });

  it('routes every system to a real accent palette (parity guard)', () => {
    for (const def of Object.values(universeSystems)) {
      expect(pageAccents[def.accent]).toBeDefined();
    }
  });
});
