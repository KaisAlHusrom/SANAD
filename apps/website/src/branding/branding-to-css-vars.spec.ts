import { describe, expect, it } from 'vitest';
import type { BrandingRecord } from '@sanad/contracts';
import { websiteTokens, fonts } from '@sanad/config';
import { brandingToCssVars, WEB_CSS_VAR_KEYS } from './branding-to-css-vars';

const full: Pick<BrandingRecord, 'colors' | 'fonts'> = {
  colors: {
    primary: '#22d3ee',
    secondary: '#3b82f6',
    pageAccents: {
      landing: { accent: '#22d3ee', secondary: '#3b82f6', ink: '#06121c' },
      about: { accent: '#2dd4bf', secondary: '#3b82f6', ink: '#06121c' },
      services: { accent: '#38bdf8', secondary: '#3b82f6', ink: '#06121c' },
      serviceDetail: {
        accent: '#6366f1',
        secondary: '#3b82f6',
        ink: '#0a0c1c',
      },
    },
    surface: { bg: '#010203', track: '#020304', s1: '#030405', s2: '#040506' },
    text: { base: '#fff', dim: '#eee', muted: '#ddd', faint: '#ccc' },
  },
  fonts: { sans: "'Custom Sans'", mono: "'Custom Mono'" },
};

describe('brandingToCssVars', () => {
  it('maps a full branding record onto every --web-* var', () => {
    const vars = brandingToCssVars(full);
    expect(vars['--web-bg']).toBe('#010203');
    expect(vars['--web-s2']).toBe('#040506');
    expect(vars['--web-text']).toBe('#fff');
    expect(vars['--web-faint']).toBe('#ccc');
    expect(vars['--web-sans']).toBe("'Custom Sans'");
    expect(vars['--web-mono']).toBe("'Custom Mono'");
    for (const key of WEB_CSS_VAR_KEYS) {
      expect(vars[key]).toBeTruthy();
    }
  });

  it('fills every leaf from @sanad/config when branding is sparse/null (F7)', () => {
    // A stale cache / un-deployed backend may omit groups; never render blank.
    const vars = brandingToCssVars({ colors: { surface: { bg: '#111' } } });
    expect(vars['--web-bg']).toBe('#111');
    // missing leaves fall back to the coded defaults (= @sanad/config)
    expect(vars['--web-track']).toBe(websiteTokens.surface.track);
    expect(vars['--web-text']).toBe(websiteTokens.text.base);
    expect(vars['--web-sans']).toBe(fonts.sans);
    for (const key of WEB_CSS_VAR_KEYS) {
      expect(vars[key]).toBeTruthy();
    }
  });

  it('returns a complete default set for null/undefined branding', () => {
    const vars = brandingToCssVars(null);
    expect(Object.keys(vars).sort()).toEqual([...WEB_CSS_VAR_KEYS].sort());
    expect(vars['--web-bg']).toBe(websiteTokens.surface.bg);
  });
});
