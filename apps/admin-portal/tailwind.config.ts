import type { Config } from 'tailwindcss';

/**
 * Tailwind preset for the admin portal. Semantic color utilities map to the PORTAL
 * CSS custom properties (`var(--bg)`, `var(--accent)`, …) — the actual values are
 * single-sourced in `@sanad/config` (`portalDark`/`portalLight`) and injected once at
 * runtime via `renderPortalThemeCss()`. This file only wires utilities to those vars
 * (U6 — no hardcoded color values here). The key set mirrors `Object.keys(portalDark)`.
 * Radius scale + fonts follow design-spec §4.
 */
const tokenColor = (name: string): string => `var(--${name})`;

/** A token mixed with transparency — see the `scrim`/`veil` note below for why not `/opacity`. */
const tokenMix = (name: string, percent: number): string =>
  `color-mix(in oklab, var(--${name}) ${percent}%, transparent)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: tokenColor('bg'),
        surface: {
          DEFAULT: tokenColor('surface'),
          2: tokenColor('surface-2'),
          3: tokenColor('surface-3'),
        },
        sidebar: tokenColor('sidebar'),
        border: {
          DEFAULT: tokenColor('border'),
          2: tokenColor('border-2'),
        },
        text: tokenColor('text'),
        dim: tokenColor('dim'),
        faint: tokenColor('faint'),
        accent: {
          DEFAULT: tokenColor('accent'),
          2: tokenColor('accent-2'),
          3: tokenColor('accent-3'),
          ink: tokenColor('accent-ink'),
          soft: tokenColor('accent-soft'),
          line: tokenColor('accent-line'),
        },
        good: tokenColor('good'),
        warn: tokenColor('warn'),
        bad: tokenColor('bad'),
        /**
         * Translucent token surfaces, named by ROLE.
         *
         * They exist because Tailwind 3.4's opacity modifier (`bg-bg/70`, `hover:bg-bad/10`)
         * emits **no CSS at all** when the color is a `var(--token)` — silently, with no error.
         * Eight call sites had written it that way, including every dialog and sheet scrim,
         * which meant the page behind an open modal was blurred but never dimmed. `color-mix`
         * is the form that actually compiles (the same canon `Badge`/`Callout` use), so it is
         * declared once here instead of re-spelled per call site (U6/U3).
         *
         * **Never write `bg-<token>/<n>` in this app** — an ESLint rule now refuses it.
         */
        scrim: tokenMix('bg', 70),
        veil: tokenMix('bg', 85),
        'veil-surface': tokenMix('surface', 92),
        'veil-accent': tokenMix('accent-soft', 85),
        'bad-soft': tokenMix('bad', 12),
      },
      borderRadius: {
        // design-spec §4 portal radius scale
        xs: '6px',
        nav: '9px',
        input: '10px',
        card: '11px',
        md: '14px',
        hero: '16px',
        pill: '999px',
      },
      letterSpacing: {
        // design-spec §4 mono kicker/eyebrow tracking
        kicker: '0.2em',
      },
      maxWidth: {
        // the pages-builder live-preview mobile device frame
        mobile: '360px',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      gridTemplateColumns: {
        // design-spec §4 portal shell: 266px sidebar + fluid content
        shell: '266px 1fr',
        // the pages-builder editor + live-preview split (narrower editor, wider preview)
        builder: 'minmax(0, 2fr) minmax(0, 3fr)',
      },
      boxShadow: {
        portal: 'var(--shadow)',
        // the live-preview "live" dot glow (Sanad Admin.dc.html §322)
        glow: '0 0 8px var(--good)',
      },
    },
  },
  plugins: [],
} satisfies Config;
