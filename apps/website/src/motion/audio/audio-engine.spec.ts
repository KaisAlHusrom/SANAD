import { describe, expect, it, vi } from 'vitest';
import { createAudioEngine, type AudioContextFactory } from './audio-engine';
import { MASTER_CEILING } from './cue-defs';

/**
 * jsdom has no real `AudioContext`, so we inject a tracking mock — this also lets us assert the
 * no-autoplay contract (WEB8): the context must not exist until `unlock()`.
 */
function mockAudio() {
  const param = () => ({
    value: 0,
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    cancelScheduledValues: vi.fn(),
    setTargetAtTime: vi.fn(),
  });
  const counts = { oscillators: 0, gains: 0 };
  const close = vi.fn();
  const resume = vi.fn();
  const ctx = {
    currentTime: 0,
    state: 'suspended' as AudioContextState,
    destination: {},
    resume,
    close,
    createGain: () => {
      counts.gains++;
      return { gain: param(), connect: vi.fn() };
    },
    createOscillator: () => {
      counts.oscillators++;
      return {
        type: 'sine' as OscillatorType,
        frequency: param(),
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
    },
  };
  const factory = vi.fn(() => ctx as unknown as AudioContext);
  return {
    factory: factory as unknown as AudioContextFactory,
    ctx,
    counts,
    factorySpy: factory,
  };
}

describe('createAudioEngine (WEB8)', () => {
  it('creates NO context until unlock() — no autoplay', () => {
    const { factory, factorySpy } = mockAudio();
    const engine = createAudioEngine(factory);
    expect(engine.hasContext()).toBe(false);
    expect(factorySpy).not.toHaveBeenCalled();

    engine.unlock();
    expect(engine.hasContext()).toBe(true);
    expect(factorySpy).toHaveBeenCalledTimes(1);
  });

  it('resumes a suspended context on unlock and builds the master bus', () => {
    const { factory, ctx, counts } = mockAudio();
    const engine = createAudioEngine(factory);
    engine.unlock();
    expect(ctx.resume).toHaveBeenCalled();
    expect(counts.gains).toBe(1); // the master gain
  });

  it('is silent while disabled — cues create no oscillators', () => {
    const { factory, counts } = mockAudio();
    const engine = createAudioEngine(factory);
    engine.unlock();
    engine.playChime(440);
    engine.playCta();
    engine.startAmbient();
    expect(counts.oscillators).toBe(0);
  });

  it('plays a chime once enabled + unlocked', () => {
    const { factory, counts } = mockAudio();
    const engine = createAudioEngine(factory);
    engine.unlock();
    engine.setEnabled(true);
    const before = counts.oscillators;
    engine.playChime(440);
    expect(counts.oscillators).toBe(before + 1);
  });

  it('does not play before unlock even when enabled', () => {
    const { factory, counts, factorySpy } = mockAudio();
    const engine = createAudioEngine(factory);
    engine.setEnabled(true);
    engine.playChime(440);
    expect(factorySpy).not.toHaveBeenCalled();
    expect(counts.oscillators).toBe(0);
  });

  it('runs the ambient bed when enabled and tears down on dispose', () => {
    const { factory, ctx, counts } = mockAudio();
    const engine = createAudioEngine(factory);
    engine.unlock();
    engine.setEnabled(true);
    engine.startAmbient();
    expect(counts.oscillators).toBe(2); // root + fifth drone
    engine.setAmbientIntensity(0.5); // no throw when bed is live
    engine.dispose();
    expect(ctx.close).toHaveBeenCalled();
    expect(engine.hasContext()).toBe(false);
  });

  it('caps the master output at the low ceiling', () => {
    expect(MASTER_CEILING).toBeLessThanOrEqual(0.5);
  });
});
