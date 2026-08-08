'use client';

import { createContext, useContext } from 'react';
import type { AudioEngine } from './audio-engine';

/**
 * The sound-layer context (WEB8) the `AudioProvider` supplies and the `SoundToggle` consumes.
 * `available` is `false` under `prefers-reduced-motion` (calm mode) — the toggle stays visible but
 * inert. The default value keeps `useSound()` safe when a component renders outside a provider (the
 * toggle then renders disabled), so isolated tests need no wrapper.
 */

export interface SoundContextValue {
  engine: AudioEngine | null;
  enabled: boolean;
  /** Whether sound is offered at all (false under reduced-motion "calm mode"). */
  available: boolean;
  /** Unlock + flip the preference (no-op when unavailable). */
  toggle(): void;
}

const DEFAULT: SoundContextValue = {
  engine: null,
  enabled: false,
  available: false,
  toggle: () => undefined,
};

export const SoundContext = createContext<SoundContextValue>(DEFAULT);

export function useSound(): SoundContextValue {
  return useContext(SoundContext);
}
