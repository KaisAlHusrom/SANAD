import { clamp, lerp, smoothstep } from './smoothstep';

/**
 * The impact-finale timeline (WEB10), ported from the reference `updateFinale`. From the impact
 * section's local scroll `p` (0→1): the Earth **approaches** from far away and swells (first half),
 * then at the midpoint the comet **strikes** and the blast plays (`ex` is the post-impact clock),
 * while the whole scene **dissolves** (`finOut`) as the footer takes over. Pure/testable — the R3F
 * finale reads these scalars and positions the Three objects camera-relative each frame.
 */

/** Earth distance from the camera: a distant speck that is approached. */
const EARTH_FAR = 3600;
const EARTH_NEAR = 540;

export interface FinaleTimeline {
  /** Approach ease 0→1 over the first half. */
  a: number;
  /** `a²` — the actual approach curve for distance/scale. */
  aE: number;
  /** Post-impact clock (0 at the strike, up to 1.45 after). */
  ex: number;
  /** True once the comet has struck (p ≥ 0.5). */
  blast: boolean;
  /** 1 → 0 as the finale dissolves into the footer. */
  finOut: number;
  /** Earth material visibility (materialises, then dissolves). */
  earthVis: number;
  /** Earth distance from the camera along its forward axis. */
  dist: number;
  /** Earth scale multiplier. */
  scale: number;
}

export function finaleTimeline(p: number): FinaleTimeline {
  const a = smoothstep(0, 0.5, p);
  const aE = a * a;
  const ex = clamp((p - 0.5) / 0.3, 0, 1.45);
  const finOut = 1 - smoothstep(0.66, 0.86, p);
  return {
    a,
    aE,
    ex,
    blast: p >= 0.5,
    finOut,
    earthVis: smoothstep(0, 0.08, p) * finOut,
    dist: lerp(EARTH_FAR, EARTH_NEAR, aE),
    scale: lerp(0.16, 1.95, aE) + smoothstep(0.5, 1.2, ex) * 0.25,
  };
}

/** The blast flash spike — a sharp exponential decay right at the strike. */
export function blastFlash(ex: number): number {
  return Math.exp(-ex * ex * 34);
}

/**
 * The post-0.62 dissolve multiplier (reference): once the finale is dissolving into the footer,
 * every additive blast layer (halo/flash/fire/points/shock) fades with `finOut`; before that it's
 * untouched (`1`). Keeps the blast from lingering over the revealed footer.
 */
export function finaleDim(p: number, finOut: number): number {
  return p > 0.62 ? finOut : 1;
}

/**
 * Earth-halo opacity (reference): a base rim glow that grows with the approach `a`, spiked by a
 * `0.4` boost right at the strike that eases back down as the post-impact clock `ex` grows, all
 * scaled by `earthVis` so it dissolves with the scene.
 */
export function earthHaloOpacity(
  a: number,
  ex: number,
  blast: boolean,
  earthVis: number,
): number {
  const boost = blast ? (1 - smoothstep(0, 1, ex)) * 0.4 : 0;
  return (0.22 + 0.4 * a + boost) * earthVis;
}

/** Camera-shake amplitude (reference): strongest at the strike, decaying exponentially to still. */
export function blastShake(ex: number): number {
  return Math.exp(-ex * 3.6) * 18;
}

/**
 * A lateral swing-in for the Earth's approach (upgrade): the planet arcs in from the side rather
 * than zooming dead-centre — zero displacement at both ends of the approach, peaking mid-flight.
 */
export function earthApproachArc(a: number): number {
  return Math.sin(a * Math.PI) * 120;
}

/**
 * The second, warm debris ring (upgrade): a slower shock that rises after the primary cyan wave and
 * saturates late, leaving a lingering ember-coloured ring behind the strike.
 */
export function debrisWave(ex: number): number {
  return smoothstep(0.15, 1.3, ex);
}
