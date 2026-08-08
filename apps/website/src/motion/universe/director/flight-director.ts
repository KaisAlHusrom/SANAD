import { FLIGHT } from '../constants';
import { createIdleFlightState, stepFlightPhases } from '../math/flight-phases';
import { reducePlan } from '../math/reduce-plan';
import {
  makeRecoveryPlan,
  resolveFlightPlan,
} from '../math/resolve-flight-plan';
import type {
  FlightPhase,
  FlightState,
  ResolvedSystem,
  SystemId,
} from '../types';

export interface DepartInput {
  /** The locale-prefixed href to push at the departure→cruise boundary. */
  href: string;
  to: ResolvedSystem;
  /** Back/forward recovery: the DOM already swapped — no push, no departure. */
  recovery?: boolean;
}

/**
 * The flight director (P8.D) — the single authority over travel state. Ref-backed like the
 * cosmos scroll store: the R3F scene reads `getState()` per frame, DOM readers run their own
 * rAF only while a flight is active, and NOTHING re-renders React during a flight. It owns
 * its own clock (an rAF loop alive only between depart and idle) because on mobile/reduced
 * motion there is no canvas — the CSS veil flight runs off the identical state machine.
 */
export interface FlightDirector {
  getState(): Readonly<FlightState>;
  /** Notified every tick while a flight is active (and on every discrete state write). */
  subscribe(listener: (state: FlightState) => void): () => void;
  /** Fired on ENTRY into a phase (cruise entry is where the router push happens). */
  onPhase(
    phase: FlightPhase,
    handler: (state: FlightState) => void,
  ): () => void;
  /** Start (or retarget) a flight. False → no plan (same place); caller plain-pushes. */
  depart(input: DepartInput): boolean;
  /** Fast-forward the rest of the flight (Escape / click during flight). */
  skip(): void;
  /**
   * The destination page's content is mounted. Adopts the ACTUAL landed system (a flight
   * that resolves into a 404 arrives into `ambient`, never hangs). While idle it simply
   * re-syncs the current system (direct load / locale switch).
   */
  markRouteReady(resolved: ResolvedSystem): void;
  setReducedMotion(reduced: boolean): void;
  /** Advance the clock — called by the internal scheduler; public so tests drive time. */
  tick(nowMs: number): void;
}

export interface FlightDirectorOptions {
  initialSystem?: SystemId;
  initialSlug?: string | null;
  /** Replaces the rAF loop (tests drive time via `tick()` directly). Returns a canceller. */
  schedule?: (tick: (nowMs: number) => void) => () => void;
}

function rafSchedule(tick: (nowMs: number) => void): () => void {
  let handle = 0;
  const loop = (ts: number) => {
    tick(ts);
    handle = requestAnimationFrame(loop);
  };
  handle = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(handle);
}

export function createFlightDirector(
  options: FlightDirectorOptions = {},
): FlightDirector {
  const schedule = options.schedule ?? rafSchedule;
  let state = createIdleFlightState(
    options.initialSystem ?? 'landing',
    options.initialSlug ?? null,
  );
  let lastNow: number | null = null;
  let cancel: (() => void) | null = null;
  const listeners = new Set<(s: FlightState) => void>();
  const phaseHandlers = new Map<FlightPhase, Set<(s: FlightState) => void>>();

  const notify = () => {
    for (const listener of listeners) listener(state);
  };
  const firePhase = (phase: FlightPhase) => {
    const handlers = phaseHandlers.get(phase);
    if (handlers) for (const handler of handlers) handler(state);
  };

  const stopClock = () => {
    cancel?.();
    cancel = null;
    lastNow = null;
  };
  const startClock = () => {
    if (cancel) return;
    lastNow = null; // fresh baseline — the gap since the last flight must not count
    cancel = schedule(tick);
  };

  function tick(nowMs: number): void {
    const prevNow = lastNow;
    lastNow = nowMs;
    if (state.phase === 'idle') return;
    const dt =
      prevNow === null
        ? 0
        : Math.min(Math.max(nowMs - prevNow, 0), FLIGHT.MAX_TICK_DT);
    const prevPhase = state.phase;
    state = stepFlightPhases(state, dt);
    if (state.phase !== prevPhase) firePhase(state.phase);
    notify();
    if (state.phase === 'idle') stopClock();
  }

  function depart(input: DepartInput): boolean {
    const from: ResolvedSystem =
      state.phase === 'idle'
        ? { system: state.currentSystem, slug: state.currentSlug }
        : { system: state.to ?? state.currentSystem, slug: state.toSlug };
    let plan = resolveFlightPlan(from, input.to);
    if (!plan) return false;
    if (state.reducedMotion) plan = reducePlan(plan);
    if (input.recovery) plan = makeRecoveryPlan(plan);
    // retargeting past departure: we're already between systems — restart at the tunnel
    const retargetInFlight =
      state.phase === 'cruise' || state.phase === 'arrival';
    state = {
      ...state,
      phase: retargetInFlight ? 'cruise' : 'departure',
      t: 0,
      phaseElapsed: 0,
      from: from.system,
      to: input.to.system,
      toSlug: input.to.slug,
      plan,
      pendingHref: input.recovery ? null : input.href,
      routeReady: false,
      skipping: false,
    };
    startClock();
    if (retargetInFlight) firePhase('cruise'); // the swapped pendingHref still gets its push
    notify();
    return true;
  }

  function markRouteReady(resolved: ResolvedSystem): void {
    if (state.phase === 'idle') {
      if (
        state.currentSystem === resolved.system &&
        state.currentSlug === resolved.slug
      ) {
        return;
      }
      state = {
        ...state,
        currentSystem: resolved.system,
        currentSlug: resolved.slug,
      };
      notify();
      return;
    }
    if (
      state.routeReady &&
      state.to === resolved.system &&
      state.toSlug === resolved.slug
    ) {
      return; // idempotent
    }
    state = {
      ...state,
      to: resolved.system,
      toSlug: resolved.slug,
      routeReady: true,
    };
    notify();
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    onPhase(phase, handler) {
      let handlers = phaseHandlers.get(phase);
      if (!handlers) {
        handlers = new Set();
        phaseHandlers.set(phase, handlers);
      }
      handlers.add(handler);
      return () => phaseHandlers.get(phase)?.delete(handler);
    },
    depart,
    skip() {
      if (state.phase === 'idle' || state.skipping) return;
      state = { ...state, skipping: true };
      notify();
    },
    markRouteReady,
    setReducedMotion(reduced) {
      if (state.reducedMotion === reduced) return;
      state = { ...state, reducedMotion: reduced };
      notify();
    },
    tick,
  };
}
