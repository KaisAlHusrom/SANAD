import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const WORKSPACE_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const baseline = JSON.parse(
  readFileSync(new URL('./baseline.json', import.meta.url), 'utf8'),
);

/**
 * The ratchet's guards that the RULE itself cannot enforce. Between them and the rule's two
 * messages (a new violation errors; a listed path that now complies errors), the baseline can
 * only ever shrink.
 */
describe('U26 baseline (the ratchet)', () => {
  it('never grows past the committed ceiling', () => {
    // `maxPaths` is lowered by the burndown, never raised — raising it is a one-line diff a
    // reviewer can see, which is the whole point of keeping it separate from `paths`.
    expect(baseline.paths.length).toBeLessThanOrEqual(baseline.maxPaths);
  });

  it('lists only files that still exist — a rotted entry silently widens the ratchet', () => {
    const missing = baseline.paths.filter(
      (path) => !existsSync(`${WORKSPACE_ROOT}${path}`),
    );
    expect(missing).toEqual([]);
  });

  it('is sorted and free of duplicates, so a diff reads as a burndown', () => {
    expect(baseline.paths).toEqual([...baseline.paths].sort());
    expect(new Set(baseline.paths).size).toBe(baseline.paths.length);
  });

  it('carries the regenerate-me note, so nobody hand-edits it', () => {
    expect(baseline['//']).toContain('nx run lint-rules:baseline');
  });
});
