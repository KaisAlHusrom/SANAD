'use client';

import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { prefersReducedMotion } from '../reduced-motion';
import { useCosmosScrollStore } from '../scroll';
import { createAudioEngine } from './audio-engine';
import { chimeFrequency, sectionIndexAt } from './audio-graph';
import { WORLD_COUNT } from './cue-defs';
import { SoundContext, type SoundContextValue } from './audio-context';
import { useSoundPreference } from './use-sound-preference';

/**
 * Owns the sound layer (WEB8). Mounted **inside** `MotionProvider` so it can read the one
 * `CosmosScrollStore` the R3F cosmos also reads. Wires: (1) a persisted on/off preference; (2) the
 * no-autoplay contract — a persisted-ON preference still waits for the first user gesture before the
 * bed starts; (3) a per-frame loop mapping scroll velocity → bed loudness and firing a soft chime
 * when the nearest **section changes**; (4) a delegated click that plays the CTA tone when a primary
 * CTA is pressed — so the **server-rendered** CTA links stay untouched (WEB2). Under
 * `prefers-reduced-motion` the engine never starts ("calm mode" = motion + sound off, WEB4).
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  const store = useCosmosScrollStore();
  const engineRef = useRef(createAudioEngine());
  const [enabled, setEnabled] = useSoundPreference();
  // computed client-side after mount so SSR and first client render agree (no hydration mismatch)
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(!prefersReducedMotion());
    const engine = engineRef.current;
    return () => engine.dispose();
  }, []);

  // keep the engine's enable flag in step with the preference
  useEffect(() => {
    engineRef.current.setEnabled(available && enabled);
  }, [available, enabled]);

  const toggle = useCallback(() => {
    if (!available) return;
    const engine = engineRef.current;
    engine.unlock(); // this click IS the unlocking gesture
    const next = !enabled;
    engine.setEnabled(next);
    if (next) engine.startAmbient();
    else engine.stopAmbient();
    setEnabled(next);
  }, [available, enabled, setEnabled]);

  // no-autoplay: a preference persisted ON from a prior visit still waits for a gesture this load
  useEffect(() => {
    if (!available || !enabled) return;
    const engine = engineRef.current;
    if (engine.hasContext()) return;
    const onGesture = () => {
      engine.unlock();
      engine.startAmbient();
    };
    window.addEventListener('pointerdown', onGesture, {
      once: true,
      passive: true,
    });
    window.addEventListener('keydown', onGesture, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [available, enabled]);

  // per-frame: scroll velocity → bed loudness; nearest-section change → arrival chime
  useEffect(() => {
    if (!available || !enabled || !store) return;
    const engine = engineRef.current;
    let raf = 0;
    let lastIndex = sectionIndexAt(store.getState().progress, WORLD_COUNT);
    const tick = () => {
      const s = store.getState();
      engine.setAmbientIntensity(s.warp);
      const idx = sectionIndexAt(s.progress, WORLD_COUNT);
      if (idx !== lastIndex) {
        lastIndex = idx;
        engine.playChime(chimeFrequency(idx));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [available, enabled, store]);

  // meaningful event: primary-CTA activation (delegated, so server-rendered links stay untouched)
  useEffect(() => {
    if (!available) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('.lp-cta--primary')) engineRef.current.playCta();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [available]);

  const value = useMemo<SoundContextValue>(
    () => ({ engine: engineRef.current, enabled, available, toggle }),
    [enabled, available, toggle],
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}
