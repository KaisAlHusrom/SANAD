'use client';

import type { Dictionary } from '../i18n/get-dictionary';
import { useSound } from '../motion/audio';

/**
 * The persistent, always-visible sound on/off control (WEB8) — sits in the top-nav actions beside
 * the locale switch, defaults OFF, and its state persists (via `useSoundPreference` behind the
 * provider). Under `prefers-reduced-motion` it renders **visible but disabled** ("calm mode"), so
 * the mandated toggle is always present without ever making noise. Tokens-only styling (U6); the
 * two-bar/wave glyph is inline SVG (`currentColor`) so it needs no icon dependency.
 */
export function SoundToggle({ dict }: { dict: Dictionary }) {
  const { enabled, available, toggle } = useSound();
  const label = enabled ? dict.audio.on : dict.audio.off;

  return (
    <button
      type="button"
      className={`sound-toggle${enabled ? ' sound-toggle--active' : ''}`}
      aria-pressed={enabled}
      aria-label={label}
      title={dict.audio.label}
      disabled={!available}
      onClick={available ? toggle : undefined}
    >
      <svg
        className="sound-toggle-glyph"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 9v6h4l5 4V5L8 9H4z" />
        {enabled ? (
          <>
            <path d="M16 9a4 4 0 0 1 0 6" />
            <path d="M18.5 6.5a7.5 7.5 0 0 1 0 11" />
          </>
        ) : (
          <path d="M22 9l-6 6M16 9l6 6" />
        )}
      </svg>
      <span className="sound-toggle-label">{label}</span>
    </button>
  );
}
