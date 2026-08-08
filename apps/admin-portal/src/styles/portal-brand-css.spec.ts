import { describe, expect, it } from 'vitest';
import type { BrandingRecord } from '@sanad/contracts';
import { portalDark, portalLight } from '@sanad/config';
import { accentInk, hexToRgba, renderPortalBrandCss } from './portal-brand-css';

describe('portal brand-override CSS', () => {
  it('the ink tokens it reads actually exist in both themes', () => {
    // The builder indexes `portalDark/portalLight['--accent-ink']` through a
    // `Record<string,string>`, so a token rename would silently emit `undefined`.
    expect(portalDark['--accent-ink']).toBeTruthy();
    expect(portalLight['--accent-ink']).toBeTruthy();
  });

  it('maps primary → --accent (+ derived ink/soft/line) and secondary → --accent-2', () => {
    const css = renderPortalBrandCss({
      colors: { primary: '#ff0000', secondary: '#00ff00' },
    } as Partial<BrandingRecord> as BrandingRecord);
    expect(css).toContain('--accent: #ff0000;');
    expect(css).toContain('--accent-2: #00ff00;');
    expect(css).toContain('--accent-soft: rgba(255, 0, 0, 0.12);');
    expect(css).toContain('--accent-line: rgba(255, 0, 0, 0.5);');
    // applies to both portal themes so the brand accent survives the dark/light toggle
    expect(css).toContain('[data-app] {');
    expect(css).toContain('[data-app][data-theme="light"] {');
  });

  it('picks legible ink: dark ink on a light accent, white on a dark accent', () => {
    expect(accentInk('#e6f7ff')).toBe('#04121a');
    expect(accentInk('#0a1a2f')).toBe('#ffffff');
  });

  it('supports shorthand hex and ignores non-hex colors for rgba derivation', () => {
    expect(hexToRgba('#f00', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
    expect(hexToRgba('rgb(1,2,3)', 0.5)).toBeNull();
  });

  it('returns empty CSS when there is nothing to override (base tokens stand, F7)', () => {
    expect(renderPortalBrandCss(null)).toBe('');
    expect(renderPortalBrandCss({})).toBe('');
    expect(renderPortalBrandCss({ colors: {} } as BrandingRecord)).toBe('');
  });
});
