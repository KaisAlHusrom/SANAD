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
      },
      borderRadius: {
        // design-spec §4 portal radius scale
        nav: '9px',
        input: '10px',
        card: '11px',
        md: '14px',
        hero: '16px',
        pill: '999px',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      gridTemplateColumns: {
        // design-spec §4 portal shell: 266px sidebar + fluid content
        shell: '266px 1fr',
      },
      boxShadow: {
        portal: 'var(--shadow)',
      },
    },
  },
  plugins: [],
} satisfies Config;
