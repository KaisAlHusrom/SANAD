import { clamp } from '../cosmos/math/smoothstep';

/**
 * The single source of truth for the cosmos scroll journey — a tiny ref-backed store (NOT React
 * state, so reads never trigger a re-render). `MotionProvider` feeds it from the native scroll event
 * (driven by the speed-capped smooth scroller) + cursor; the R3F `useFrame` reads a live snapshot via
 * `getState()` each frame (zero-alloc) and calls `tick()` to advance the velocity→warp smoothing; the
 * few discrete DOM overlays (moons, works) `subscribe()`. `progress` is the scroll 0→1 (advanced at
 * the capped pace, so velocity is naturally bounded); `warp` the smoothed scroll velocity that drives
 * the hyperspace streaks + halo pulse. Under reduced-motion, velocity/warp/cursor stay 0 but
 * `progress` still updates so the static fallback positions correctly (WEB4).
 */

export interface CosmosScrollState {
  /** 0→1 over the whole page (drives camera Y + world colour). */
  progress: number;
  /** Raw |Δprogress| on the last tick. */
  velocity: number;
  /** Exponentially-smoothed velocity. */
  velSmooth: number;
  /** 0→1 warp intensity (hyperspace streaks + coin halo). */
  warp: number;
  /** Normalized cursor parallax, −1..1. */
  cursorX: number;
  cursorY: number;
  reducedMotion: boolean;
  /** Impact-finale progress 0→1 (the comet→Earth strike); 0 for the whole flight before it. */
  finale: number;
  /** World-space impact point the finale publishes so the coin can fly into it as the comet. */
  impactX: number;
  impactY: number;
  impactZ: number;
  /**
   * The flight director's warp input (P8.D) — `warp` is the max of the scroll warp and this,
   * so every warp consumer (streaks, coin tail, FOV) responds to a comet flight for free.
   */
  travelWarp: number;
}

export interface CosmosScrollStore {
  getState(): Readonly<CosmosScrollState>;
  setProgress(progress: number): void;
  setCursor(x: number, y: number): void;
  setReducedMotion(reduced: boolean): void;
  /** Set the impact-finale progress (driven by the R3F finale from the `#impact` scroll). */
  setFinale(finale: number): void;
  /** Publish the world-space impact point (the finale computes it camera-relative each frame). */
  setFinaleImpact(x: number, y: number, z: number): void;
  /** The flight director's warp contribution (0 releases it back to the scroll warp). */
  setTravelWarp(warp: number): void;
  /** Advance velocity→warp smoothing one frame (called from the R3F loop). */
  tick(): void;
  subscribe(fn: () => void): () => void;
}

/** Smoothing constants (reference-locked): velSmooth eases 18%/frame, warp 10%/frame off it. */
const VEL_SMOOTH = 0.18;
const WARP_EASE = 0.1;
const WARP_GAIN = 64;

/**
 * Pure warp step — the heart of the hyperspace effect, extracted so it's unit-tested without a
 * store. `velSmooth` chases the raw velocity; `warp` chases `clamp(velSmooth * 64, 0, 1)`. Both
 * decay toward 0 at rest (raw velocity → 0 when scrolling stops), so streaks fade on their own.
 */
export function stepWarp(
  prev: { velSmooth: number; warp: number },
  velocity: number,
): { velSmooth: number; warp: number } {
  const velSmooth = prev.velSmooth + (velocity - prev.velSmooth) * VEL_SMOOTH;
  const warpTarget = clamp(velSmooth * WARP_GAIN, 0, 1);
  const warp = prev.warp + (warpTarget - prev.warp) * WARP_EASE;
  return { velSmooth, warp };
}

export function createCosmosScrollStore(): CosmosScrollStore {
  const state: CosmosScrollState = {
    progress: 0,
    velocity: 0,
    velSmooth: 0,
    warp: 0,
    cursorX: 0,
    cursorY: 0,
    reducedMotion: false,
    finale: 0,
    impactX: 0,
    impactY: 0,
    impactZ: 0,
    travelWarp: 0,
  };
  let lastTickProgress = 0;
  const subscribers = new Set<() => void>();
  const notify = (): void => {
    subscribers.forEach((fn) => fn());
  };

  return {
    getState: () => state,
    setProgress(progress) {
      state.progress = clamp(progress, 0, 1);
      notify();
    },
    setCursor(x, y) {
      if (state.reducedMotion) return;
      state.cursorX = clamp(x, -1, 1);
      state.cursorY = clamp(y, -1, 1);
    },
    setFinale(finale) {
      state.finale = clamp(finale, 0, 1);
    },
    setFinaleImpact(x, y, z) {
      state.impactX = x;
      state.impactY = y;
      state.impactZ = z;
    },
    setTravelWarp(warp) {
      state.travelWarp = clamp(warp, 0, 1);
    },
    setReducedMotion(reduced) {
      state.reducedMotion = reduced;
      if (reduced) {
        state.velSmooth = 0;
        state.warp = 0;
        state.velocity = 0;
        state.cursorX = 0;
        state.cursorY = 0;
      }
    },
    tick() {
      const velocity = Math.abs(state.progress - lastTickProgress);
      lastTickProgress = state.progress;
      state.velocity = velocity;
      if (state.reducedMotion) {
        state.velSmooth = 0;
        state.warp = 0;
        return;
      }
      const stepped = stepWarp(state, velocity);
      state.velSmooth = stepped.velSmooth;
      // the stronger source wins (never additive) — a flight igniting mid-scroll can only
      // raise the field, and releasing travelWarp hands back to the decaying scroll warp
      state.warp = Math.max(stepped.warp, state.travelWarp);
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },
  };
}
