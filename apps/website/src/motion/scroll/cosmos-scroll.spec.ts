import { describe, expect, it } from 'vitest';
import { createCosmosScrollStore, stepWarp } from './cosmos-scroll-store';
import { localProgress } from './section-progress';

describe('stepWarp (hyperspace velocity smoothing)', () => {
  it('rises toward 1 under sustained velocity', () => {
    let s = { velSmooth: 0, warp: 0 };
    for (let i = 0; i < 200; i++) s = stepWarp(s, 0.05);
    expect(s.warp).toBeGreaterThan(0.9);
    expect(s.warp).toBeLessThanOrEqual(1);
  });

  it('decays toward 0 at rest', () => {
    let s = { velSmooth: 0.02, warp: 0.8 };
    for (let i = 0; i < 200; i++) s = stepWarp(s, 0);
    expect(s.warp).toBeLessThan(0.02);
  });

  it('clamps warp to [0,1] even under a huge velocity spike', () => {
    let s = { velSmooth: 0, warp: 0 };
    for (let i = 0; i < 50; i++) s = stepWarp(s, 10);
    expect(s.warp).toBeLessThanOrEqual(1);
    expect(s.warp).toBeGreaterThanOrEqual(0);
  });
});

describe('createCosmosScrollStore', () => {
  it('clamps progress and notifies subscribers', () => {
    const store = createCosmosScrollStore();
    let calls = 0;
    const off = store.subscribe(() => {
      calls++;
    });
    store.setProgress(2);
    expect(store.getState().progress).toBe(1);
    expect(calls).toBe(1);
    off();
    store.setProgress(0.5);
    expect(calls).toBe(1); // unsubscribed
  });

  it('builds warp from scroll motion across ticks, and decays at rest', () => {
    const store = createCosmosScrollStore();
    for (let i = 1; i <= 100; i++) {
      store.setProgress(i / 1000);
      store.tick();
    }
    expect(store.getState().warp).toBeGreaterThan(0);
    const moving = store.getState().warp;
    for (let i = 0; i < 200; i++) store.tick(); // progress frozen → rest
    expect(store.getState().warp).toBeLessThan(moving);
  });

  it('lets the flight director raise warp through travelWarp (P8.D) and release it', () => {
    const store = createCosmosScrollStore();
    store.setTravelWarp(0.9);
    store.tick(); // page is still — scroll warp ~0, travel warp must win
    expect(store.getState().warp).toBeCloseTo(0.9, 5);
    store.setTravelWarp(0);
    for (let i = 0; i < 5; i++) store.tick();
    expect(store.getState().warp).toBeLessThan(0.9); // decays back to the scroll warp
  });

  it('keeps warp hard-zero under reduced motion even with a travel warp set (WEB4)', () => {
    const store = createCosmosScrollStore();
    store.setReducedMotion(true);
    store.setTravelWarp(1);
    store.tick();
    expect(store.getState().warp).toBe(0);
  });

  it('zeroes velocity/warp/cursor under reduced-motion but keeps progress live', () => {
    const store = createCosmosScrollStore();
    store.setReducedMotion(true);
    store.setCursor(1, 1);
    store.setProgress(0.4);
    for (let i = 0; i < 10; i++) {
      store.setProgress(0.4 + i / 100);
      store.tick();
    }
    const s = store.getState();
    expect(s.warp).toBe(0);
    expect(s.cursorX).toBe(0);
    expect(s.progress).toBeGreaterThan(0.4); // still tracks scroll for the static fallback
  });
});

describe('localProgress (sticky chapter)', () => {
  it('is 0 at pin, 1 at release, 0.5 at the sticky midpoint', () => {
    // section top 1000, height 3000 (300vh), viewport 1000 → scrollable 2000
    expect(localProgress(1000, 1000, 3000, 1000)).toBe(0);
    expect(localProgress(3000, 1000, 3000, 1000)).toBe(1);
    expect(localProgress(2000, 1000, 3000, 1000)).toBe(0.5);
  });

  it('clamps outside the section', () => {
    expect(localProgress(0, 1000, 3000, 1000)).toBe(0);
    expect(localProgress(9999, 1000, 3000, 1000)).toBe(1);
  });

  it('snaps 0→1 for a section shorter than the viewport (no divide-by-zero)', () => {
    expect(localProgress(500, 1000, 800, 1000)).toBe(0);
    expect(localProgress(1000, 1000, 800, 1000)).toBe(1);
  });
});
