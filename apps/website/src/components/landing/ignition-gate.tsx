'use client';

import { useEffect, useState } from 'react';
import { IGNITION_MS, shouldPlayIgnition } from '../../motion/cosmos/math';
import {
  isTouchDevice,
  prefersReducedMotion,
} from '../../motion/reduced-motion';

/** Session flag — the ignition is a first-arrival beat, never a repeat performance. */
const IGNITION_KEY = 'sanad-ignited';
/** Give the cosmos canvas this long to mount before giving up and skipping (real readiness, WEB9). */
const CANVAS_WAIT_MS = 3000;

/**
 * The ignition (8.B-4 Stage 5b) — on the first full-motion desktop visit of a session, the page
 * opens on black and the hero star ignites out of it: a fixed veil with the brand diamond that
 * dissolves once everything is **genuinely ready** (`document.fonts.ready` + the cosmos canvas in
 * the DOM). No progress numbers, no minimum spinner time — readiness gates it, the beat itself is
 * ~1.1s (WEB9). Skippable instantly (wheel / touch / key / click), once per session
 * (`sessionStorage`), and never shown at all in calm mode or without the canvas (WEB4 — those
 * visits go straight to content).
 */
export function IgnitionGate() {
  // render nothing on the server and the first client paint (no hydration mismatch), then decide
  const [phase, setPhase] = useState<'idle' | 'veiled' | 'igniting'>('idle');

  useEffect(() => {
    const played = window.sessionStorage.getItem(IGNITION_KEY) === '1';
    if (
      !shouldPlayIgnition({
        reducedMotion: prefersReducedMotion(),
        touch: isTouchDevice(),
        alreadyPlayed: played,
        // the mount decision is the same media gate CosmosMount uses; the canvas itself is awaited below
        canvasPresent: !window.matchMedia('(max-width: 768px)').matches,
      })
    ) {
      return;
    }
    window.sessionStorage.setItem(IGNITION_KEY, '1');
    setPhase('veiled');

    let done = false;
    let raf = 0;
    let fallback = 0;
    const ignite = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      setPhase('igniting');
    };

    // real readiness: fonts loaded AND the lazy cosmos canvas mounted (or the wait cap hit)
    const start = performance.now();
    const waitForCanvas = () => {
      if (done) return;
      if (
        document.querySelector('.cosmos-canvas') ||
        performance.now() - start > CANVAS_WAIT_MS
      ) {
        void document.fonts.ready.then(ignite);
        return;
      }
      raf = requestAnimationFrame(waitForCanvas);
    };
    raf = requestAnimationFrame(waitForCanvas);
    fallback = window.setTimeout(ignite, CANVAS_WAIT_MS + 1200);

    // any gesture skips the beat instantly
    const skip = () => ignite();
    window.addEventListener('wheel', skip, { passive: true });
    window.addEventListener('touchstart', skip, { passive: true });
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('touchstart', skip);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, []);

  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (phase !== 'igniting') return;
    const t = window.setTimeout(() => setGone(true), IGNITION_MS);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === 'idle' || gone) return null;
  return (
    <div
      className={`lp-ignition${phase === 'igniting' ? ' is-igniting' : ''}`}
      aria-hidden="true"
    >
      <span className="lp-ignition-mark" />
    </div>
  );
}
