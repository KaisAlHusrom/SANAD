import { fonts, pageAccents, radius, websiteTokens } from './tokens.js';

/**
 * Minimal shape of a Tailwind preset — typed locally so this lib needs no
 * Tailwind dependency. Apps spread `sanadTailwindPreset` into their config so
 * every utility resolves brand tokens (U6).
 */
export interface TailwindPreset {
  theme: {
    extend: {
      colors: Record<string, string | Record<string, string>>;
      borderRadius: Record<string, string>;
      fontFamily: Record<string, string[]>;
      maxWidth: Record<string, string>;
    };
  };
}

const px = (value: number): string => `${value}px`;

/** The Sanad Tailwind preset, built from the locked design tokens. */
export const sanadTailwindPreset: TailwindPreset = {
  theme: {
    extend: {
      colors: {
        bg: websiteTokens.surface.bg,
        surface: {
          DEFAULT: websiteTokens.surface.s1,
          track: websiteTokens.surface.track,
          raised: websiteTokens.surface.s2,
        },
        ink: {
          DEFAULT: websiteTokens.text.base,
          dim: websiteTokens.text.dim,
          muted: websiteTokens.text.muted,
          faint: websiteTokens.text.faint,
        },
        'accent-landing': pageAccents.landing.accent,
        'accent-about': pageAccents.about.accent,
        'accent-services': pageAccents.services.accent,
        'accent-detail': pageAccents.serviceDetail.accent,
      },
      borderRadius: {
        sm: px(radius.sm),
        md: px(radius.md),
        lg: px(radius.lg),
        xl: px(radius.xl),
        '2xl': px(radius['2xl']),
        '3xl': px(radius['3xl']),
      },
      fontFamily: {
        sans: [fonts.sans],
        mono: [fonts.mono],
      },
      maxWidth: {
        content: '1320px',
      },
    },
  },
};
