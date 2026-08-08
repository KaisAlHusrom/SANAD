import { universeSystems } from '@sanad/config';
import { describe, expect, it } from 'vitest';
import { CAMERA } from '../../cosmos/constants';
import type { SystemId } from '../types';
import { systemRestPose } from './system-rest-pose';

describe('systemRestPose (where a flight must hand the camera back)', () => {
  it('gives every system a rest pose at the canonical camera distance, level roll', () => {
    for (const system of Object.keys(universeSystems) as SystemId[]) {
      const pose = systemRestPose(system);
      expect(pose.z).toBe(CAMERA.z);
      expect(pose.roll).toBe(0);
      expect(pose.lookY).toBeLessThan(pose.y); // the flight reads as a descent — look below
    }
  });

  it('matches the landing camera at scroll 0 exactly (seamless idle handoff)', () => {
    const pose = systemRestPose('landing');
    expect(pose.x).toBe(0);
    expect(pose.y).toBeCloseTo(0, 10); // cameraY(0) — which is -0, hence closeTo
  });
});
