import { ambientGain, ctaFrequency, envelopeGain } from './audio-graph';
import {
  AMBIENT_FADE_S,
  AMBIENT_FIFTH_HZ,
  AMBIENT_ROOT_HZ,
  CHIME_DECAY_S,
  CHIME_GAIN,
  CTA_DECAY_S,
  CTA_GAIN,
  CUE_ATTACK_S,
  MASTER_CEILING,
} from './cue-defs';

/**
 * The imperative Web-Audio shell (WEB8) — a thin wrapper over one `AudioContext` that the
 * `AudioProvider` drives. Deliberately **lazy**: no context, oscillators, or sound exist until
 * `unlock()` is called from a real user gesture (no-autoplay). All scheduling reads
 * `ctx.currentTime` (the audio clock, never `Date.now()` — N3). The musical/mix numbers all come
 * from the pure `audio-graph` + `cue-defs`, so this file is only plumbing; its behaviour is tested
 * with an injected mock context (jsdom has no real `AudioContext`).
 */

export type AudioContextFactory = () => AudioContext;

export interface AudioEngine {
  /** Create/resume the context — call ONLY from a user gesture (WEB8 no-autoplay). Idempotent. */
  unlock(): void;
  /** Whether the underlying context has been created (i.e. a gesture unlocked it). */
  hasContext(): boolean;
  setEnabled(enabled: boolean): void;
  isEnabled(): boolean;
  /** Fade the quiet ambient bed in (requires unlock + enabled). */
  startAmbient(): void;
  /** Fade the ambient bed out and tear its nodes down. */
  stopAmbient(): void;
  /** Track scroll velocity → bed loudness (0→1 warp). No-op when the bed isn't running. */
  setAmbientIntensity(warp: number): void;
  /** A one-shot arrival chime at `freq` Hz (silent unless unlocked + enabled). */
  playChime(freq: number): void;
  /** The primary-CTA activation tone (silent unless unlocked + enabled). */
  playCta(): void;
  /** Stop everything and close the context. */
  dispose(): void;
}

const defaultFactory: AudioContextFactory = () => new AudioContext();

export function createAudioEngine(
  ctxFactory: AudioContextFactory = defaultFactory,
): AudioEngine {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let enabled = false;
  // the running ambient bed (two detuned oscillators through one gain)
  let bed: { gain: GainNode; oscillators: OscillatorNode[] } | null = null;

  const unlock = (): void => {
    if (!ctx) {
      ctx = ctxFactory();
      master = ctx.createGain();
      master.gain.value = MASTER_CEILING;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
  };

  /** Schedule a one-shot tone through the master bus using the audio clock (N3). */
  const playTone = (
    freq: number,
    peak: number,
    decay: number,
    type: OscillatorType,
  ): void => {
    if (!ctx || !master || !enabled) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    // linear attack to `peak`, then exponential decay (envelopeGain's shape, scheduled natively)
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak, now + CUE_ATTACK_S);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(
        peak * envelopeGain(CUE_ATTACK_S + decay, CUE_ATTACK_S, decay),
        1e-4,
      ),
      now + CUE_ATTACK_S + decay,
    );
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + CUE_ATTACK_S + decay + 0.05);
  };

  return {
    unlock,
    hasContext: () => ctx !== null,
    setEnabled(next) {
      enabled = next;
      if (!next) this.stopAmbient();
    },
    isEnabled: () => enabled,
    startAmbient() {
      if (!ctx || !master || !enabled || bed) return;
      const context = ctx;
      const now = context.currentTime;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(ambientGain(0), now + AMBIENT_FADE_S);
      const oscillators = [AMBIENT_ROOT_HZ, AMBIENT_FIFTH_HZ].map((hz) => {
        const osc = context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(hz, now);
        osc.connect(gain);
        osc.start(now);
        return osc;
      });
      gain.connect(master);
      bed = { gain, oscillators };
    },
    stopAmbient() {
      if (!ctx || !bed) return;
      const now = ctx.currentTime;
      const { gain, oscillators } = bed;
      bed = null;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + AMBIENT_FADE_S);
      oscillators.forEach((osc) => osc.stop(now + AMBIENT_FADE_S + 0.05));
    },
    setAmbientIntensity(warp) {
      if (!ctx || !bed) return;
      const now = ctx.currentTime;
      bed.gain.gain.setTargetAtTime(ambientGain(warp), now, 0.2);
    },
    playChime(freq) {
      playTone(freq, CHIME_GAIN, CHIME_DECAY_S, 'triangle');
    },
    playCta() {
      playTone(ctaFrequency(), CTA_GAIN, CTA_DECAY_S, 'sine');
    },
    dispose() {
      this.stopAmbient();
      if (ctx) {
        void ctx.close();
        ctx = null;
        master = null;
      }
      enabled = false;
    },
  };
}
