import { describe, expect, it } from 'vitest';
import {
  landingWorldOrder,
  landingWorlds,
  pageAccents,
  universeSystems,
  websiteTokens,
  websiteZLayers,
} from './tokens.js';
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

  it('locks the nine landing worlds (WEB10 cosmos)', () => {
    const keys = Object.keys(landingWorlds);
    expect(keys).toHaveLength(9);
    // the scroll order lists exactly the nine worlds
    expect([...landingWorldOrder].sort()).toEqual(keys.sort());
    // every glow + palette entry is a valid 6-digit hex
    const hex = /^#[0-9a-f]{6}$/;
    for (const world of Object.values(landingWorlds)) {
      expect(world.glow).toMatch(hex);
      expect(world.palette).toHaveLength(3);
      world.palette.forEach((c) => expect(c).toMatch(hex));
      expect(world.radius).toBeGreaterThan(0);
    }
    // the works world is the purple ringed centrepiece the cards orbit
    expect(landingWorlds.works.glow).toBe('#a855f7');
    expect(landingWorlds.works.ring).toBe(true);
  });

  it('locks the one-universe star systems (P8.D) onto real accents', () => {
    // the two accents added for P8.D (contact = the testimonials emerald; ambient = landing's)
    expect(pageAccents.contact.accent).toBe('#34d399');
    expect(pageAccents.ambient.accent).toBe('#22d3ee');
    expect(Object.keys(universeSystems).sort()).toEqual([
      'about',
      'ambient',
      'blog',
      'contact',
      'landing',
      'process',
      'request',
      'serviceDetail',
      'services',
      'works',
    ]);
    const hex = /^#[0-9a-f]{6}$/;
    for (const def of Object.values(universeSystems)) {
      expect(pageAccents[def.accent]).toBeDefined();
      expect(def.palette).toHaveLength(3);
      def.palette.forEach((c) => expect(c).toMatch(hex));
      expect(def.fog).toMatch(hex);
    }
    // page systems keep the design-spec §1 per-page cosmos cols
    expect(universeSystems.services.palette[1]).toBe('#38bdf8');
    expect(universeSystems.serviceDetail.palette[1]).toBe('#6366f1');
    // the works "Galaxy" system IS the landing works world (single source, U3)
    expect(universeSystems.works.palette).toBe(landingWorlds.works.palette);
    expect(pageAccents.works.accent).toBe('#a855f7');
    // the landing system IS the hero star of the landing journey (single source, U3)
    expect(universeSystems.landing.palette).toBe(landingWorlds.hero.palette);
    // P8.E-2: About "Hearth" IS the trust world's teal; Process "Waypoints" IS the process world's indigo
    expect(universeSystems.about.palette).toBe(landingWorlds.trust.palette);
    expect(pageAccents.about.accent).toBe('#2dd4bf');
    expect(universeSystems.process.palette).toBe(landingWorlds.process.palette);
    expect(pageAccents.process.accent).toBe('#6366f1');
    // P8.E-3: Blog "Logbook" IS the blog world's amber (single source, U3)
    expect(universeSystems.blog.palette).toBe(landingWorlds.blog.palette);
    expect(pageAccents.blog.accent).toBe('#f59e0b');
    // P8.E-5: Request-a-project "Launchpad" is its OWN ignition system — a distinct warm
    // rose/coral, not the contact emerald (the flagship "Start a project" conversion surface).
    expect(pageAccents.request.accent).toBe('#fb7185');
    expect(universeSystems.request.accent).toBe('request');
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

describe('website z-layer ladder', () => {
  // The ladder's whole value is that reading it tells you the paint intent. Two layers sharing a
  // number are fine (`cosmos`/`lift` are both 1 by design), but a LATER key with a SMALLER value
  // would mean the object no longer reads as an order at all.
  it('reads top-to-bottom as a real order', () => {
    const values = Object.values(websiteZLayers);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1] as number);
    }
  });

  it('puts the consent surfaces where the design needs them', () => {
    // Above the chrome, so the bar is reachable over the full-viewport landing finale…
    expect(websiteZLayers.consentBar).toBeGreaterThan(websiteZLayers.nav);
    expect(websiteZLayers.consentBar).toBeGreaterThan(websiteZLayers.finale);
    // …and below the first-arrival beat, which owns the screen while it plays.
    expect(websiteZLayers.consentBar).toBeLessThan(websiteZLayers.ignition);
    // A modal is by definition the topmost interactive surface.
    expect(websiteZLayers.overlay).toBeGreaterThan(
      Math.max(
        ...Object.values(websiteZLayers).filter(
          (v) => v !== websiteZLayers.overlay,
        ),
      ),
    );
  });
});
