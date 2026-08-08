import { clamp } from '../cosmos/math/smoothstep';
import {
  AMBIENT_BASE_GAIN,
  AMBIENT_MAX_GAIN,
  AMBIENT_WARP_GAIN,
  CTA_SEMITONE,
  PENTATONIC_SEMITONES,
  ROOT_HZ,
} from './cue-defs';

/**
 * The pure heart of the sound layer (WEB8) — every scalar the `audio-engine` schedules is computed
 * here, with **no AudioContext / DOM**, so the musical + mix behaviour is unit-tested in isolation
 * (the audio analog of `cosmos/math`; the imperative graph is verified by listening, U21e). Frame-
 * independent: time is passed in (the engine feeds `AudioContext.currentTime`, never `Date.now()` —
 * N3).
 */

/** Equal-tempered frequency `root · 2^(semitones/12)`. */
function transpose(root: number, semitones: number): number {
  return root * Math.pow(2, semitones / 12);
}

/**
 * Which of the `worldCount` worlds the scroll is nearest to (0…worldCount−1). Mirrors the veil's
 * placement — worlds sit evenly at `i/(worldCount−1)`, so the nearest is `round(progress·(n−1))`.
 * Changing this value across a scroll frame is the "section arrival" event the chime fires on.
 */
export function sectionIndexAt(progress: number, worldCount: number): number {
  if (worldCount < 2) return 0;
  const scaled = clamp(progress, 0, 1) * (worldCount - 1);
  return clamp(Math.round(scaled), 0, worldCount - 1);
}

/** The arrival-chime frequency for a world — one pentatonic note per world (index clamped). */
export function chimeFrequency(sectionIndex: number): number {
  const i = clamp(Math.round(sectionIndex), 0, PENTATONIC_SEMITONES.length - 1);
  return transpose(ROOT_HZ, PENTATONIC_SEMITONES[i] ?? 0);
}

/** The primary-CTA activation tone. */
export function ctaFrequency(): number {
  return transpose(ROOT_HZ, CTA_SEMITONE);
}

/**
 * Ambient-bed gain: quiet at rest, rising with scroll velocity (`warp`, 0→1), hard-capped low.
 * Monotonic in `warp` and always within `[base, AMBIENT_MAX_GAIN]`.
 */
export function ambientGain(warp: number, base = AMBIENT_BASE_GAIN): number {
  const raw = base + clamp(warp, 0, 1) * AMBIENT_WARP_GAIN;
  return clamp(raw, 0, AMBIENT_MAX_GAIN);
}

/**
 * A one-shot cue envelope (0→1) at time `t` seconds after trigger: a fast linear attack to 1, then
 * an exponential decay that has effectively died by `attack + decay`. 0 before the trigger. Pure so
 * the chime/CTA shape is asserted without scheduling.
 */
export function envelopeGain(t: number, attack: number, decay: number): number {
  if (t <= 0) return 0;
  if (t < attack) return t / attack;
  const d = (t - attack) / decay;
  if (d >= 1) return 0;
  return Math.exp(-d * 4);
}
