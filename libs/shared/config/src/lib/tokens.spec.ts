import { describe, expect, it } from 'vitest';
import { pageAccents, websiteTokens } from './tokens.js';
import { sanadTailwindPreset } from './tailwind-preset.js';
import {
  portalDark,
  portalLight,
  renderPortalThemeCss,
} from './portal-theme.js';

describe('design tokens', () => {
  it('locks the website base + per-page accents from the design', () => {
    expect(websiteTokens.surface.bg).toBe('#05080d');
    expect(pageAccents.landing.accent).toBe('#22d3ee');
    expect(pageAccents.about.accent).toBe('#2dd4bf');
    expect(pageAccents.services.accent).toBe('#38bdf8');
    expect(pageAccents.serviceDetail.accent).toBe('#6366f1');
  });

  it('exposes brand tokens through the Tailwind preset', () => {
    expect(sanadTailwindPreset.theme.extend.colors['bg']).toBe('#05080d');
    expect(sanadTailwindPreset.theme.extend.maxWidth['content']).toBe('1320px');
  });
});

describe('portal theme', () => {
  it('defines both themes with the same variable keys', () => {
    expect(Object.keys(portalDark).sort()).toEqual(
      Object.keys(portalLight).sort(),
    );
    expect(portalDark['--bg']).toBe('#080b11');
    expect(portalLight['--bg']).toBe('#f1f3f6');
  });

  it('renders dark default + light override CSS', () => {
    const css = renderPortalThemeCss();
    expect(css).toContain('[data-app] {');
    expect(css).toContain('[data-app][data-theme="light"] {');
    expect(css).toContain('--accent: #22d3ee;');
  });
});
