import { describe, expect, it } from 'vitest';
import { REQUEST_COPY } from './request-copy';
import {
  BUDGET_BANDS,
  PROJECT_TYPES,
  REQUEST_STEP_COUNT,
} from './request.constants';

describe('request form constants (P8.E-5)', () => {
  it('offers non-empty, uniquely-valued, bilingual choice cards', () => {
    for (const list of [PROJECT_TYPES, BUDGET_BANDS]) {
      expect(list.length).toBeGreaterThan(1);
      const values = list.map((o) => o.value);
      expect(new Set(values).size).toBe(values.length); // canonical values unique
      for (const opt of list) {
        expect(opt.value.trim().length).toBeGreaterThan(0);
        expect(opt.label.ar.trim().length).toBeGreaterThan(0);
        expect(opt.label.en.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('ships exactly REQUEST_STEP_COUNT labelled steps for the stepper', () => {
    expect(REQUEST_COPY.steps).toHaveLength(REQUEST_STEP_COUNT);
    for (const step of REQUEST_COPY.steps) {
      expect(step.title.ar.trim().length).toBeGreaterThan(0);
      expect(step.title.en.trim().length).toBeGreaterThan(0);
    }
  });
});
