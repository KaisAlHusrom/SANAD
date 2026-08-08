import { describe, expect, it } from 'vitest';
import { FLIGHT_PATH } from '../constants';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import type { FlightPose } from './system-rest-pose';
import { arrivalPose, cruisePose, departurePose } from './comet-path';

const plan = FLIGHT_PLANS['landing>services'];
const returnPlan = FLIGHT_PLANS['services>landing'];
if (!plan || !returnPlan) throw new Error('missing plans');

const start: FlightPose = {
  x: 12,
  y: -840,
  z: 420,
  lookX: 4,
  lookY: -870,
  lookZ: 0,
  roll: 0,
};
const rest: FlightPose = {
  x: 0,
  y: 0,
  z: 420,
  lookX: 0,
  lookY: -30,
  lookZ: 0,
  roll: 0,
};

describe('departurePose', () => {
  it('starts EXACTLY at the captured camera pose (no jump on ignition)', () => {
    const p = departurePose(0, start, plan, 1);
    expect(p.x).toBeCloseTo(start.x, 5);
    expect(p.y).toBeCloseTo(start.y, 5);
    expect(p.lookY).toBeCloseTo(start.lookY, 5);
    expect(p.roll).toBeCloseTo(0, 5);
  });

  it('dives DIVE units below the start by the end, centered and level', () => {
    const p = departurePose(1, start, plan, 1);
    expect(p.y).toBeCloseTo(start.y - FLIGHT_PATH.DIVE, 4);
    expect(p.x).toBeCloseTo(0, 4);
    expect(p.roll).toBeCloseTo(0, 4); // the bank flourish resolves level for the tunnel
  });

  it('banks mid-flight, mirrored under RTL, opposite for the return plan (WEB6)', () => {
    const ltr = departurePose(0.5, start, plan, 1);
    const rtl = departurePose(0.5, start, plan, -1);
    const back = departurePose(0.5, start, returnPlan, 1);
    expect(Math.abs(ltr.roll)).toBeGreaterThan(0.01);
    expect(rtl.roll).toBeCloseTo(-ltr.roll, 5);
    expect(Math.sign(back.roll)).toBe(-Math.sign(ltr.roll)); // outbound ≠ return
  });
});

describe('cruisePose', () => {
  const entry = departurePose(1, start, plan, 1);

  it('continues from the departure end pose (no seam into the tunnel)', () => {
    const p = cruisePose(0, entry, plan, 1);
    expect(p.y).toBeCloseTo(entry.y, 4);
    expect(p.x).toBeCloseTo(entry.x, 4);
  });

  it('drifts steadily down the corridor', () => {
    const a = cruisePose(500, entry, plan, 1);
    const b = cruisePose(1500, entry, plan, 1);
    expect(a.y).toBeLessThan(entry.y);
    expect(b.y).toBeLessThan(a.y);
    expect(b.y).toBeCloseTo(entry.y - FLIGHT_PATH.CRUISE_SPEED * 1.5, 3);
  });

  it('sways laterally with the plan lateral, mirrored under RTL', () => {
    const ltr = cruisePose(700, entry, plan, 1);
    const rtl = cruisePose(700, entry, plan, -1);
    expect(rtl.x).toBeCloseTo(-ltr.x, 5);
  });
});

describe('arrivalPose', () => {
  const entry: FlightPose = { ...start, y: -2400, lookY: -2430 };

  it('starts at the tunnel-exit pose and ends EXACTLY at the rest pose (idle handoff)', () => {
    for (const decel of ['glide', 'overshoot', 'drop'] as const) {
      const p0 = arrivalPose(
        0,
        entry,
        rest,
        { ...plan, arrival: { ...plan.arrival, decel } },
        1,
      );
      const p1 = arrivalPose(
        1,
        entry,
        rest,
        { ...plan, arrival: { ...plan.arrival, decel } },
        1,
      );
      expect(p0.y).toBeCloseTo(entry.y, 4);
      expect(p1.x).toBeCloseTo(rest.x, 4);
      expect(p1.y).toBeCloseTo(rest.y, 4);
      expect(p1.lookY).toBeCloseTo(rest.lookY, 4);
      expect(p1.roll).toBeCloseTo(0, 4);
    }
  });

  it('overshoot passes the rest pose and settles back ("coming home")', () => {
    let overshot = false;
    for (let t = 0.4; t < 1; t += 0.02) {
      const p = arrivalPose(t, entry, rest, returnPlan, 1);
      if (p.y > rest.y) overshot = true;
    }
    expect(overshot).toBe(true);
  });

  it('glide approaches monotonically (no wobble)', () => {
    let prev = entry.y;
    for (let t = 0.05; t <= 1.001; t += 0.05) {
      const p = arrivalPose(Math.min(t, 1), entry, rest, plan, 1);
      expect(p.y).toBeGreaterThanOrEqual(prev - 0.001);
      prev = p.y;
    }
  });
});
