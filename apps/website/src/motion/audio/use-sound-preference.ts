'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * The persisted sound on/off preference (WEB8) — **defaults OFF**, and the choice survives reloads
 * (localStorage). SSR-safe: the first render is always `false` (matches the server), then an effect
 * hydrates the stored value, so there is no hydration mismatch and no `window` access on the server
 * (the `reduced-motion.ts` guard pattern).
 */

export const SOUND_PREF_KEY = 'sanad-sound';

export function useSoundPreference(): [boolean, (value: boolean) => void] {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(SOUND_PREF_KEY) === 'true') {
      setEnabledState(true);
    }
  }, []);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SOUND_PREF_KEY, value ? 'true' : 'false');
    }
  }, []);

  return [enabled, setEnabled];
}
