import { describe, expect, it } from 'vitest';
import { directionForLocale, directionSchema } from './direction.js';

describe('direction', () => {
  it('maps ar to rtl and en to ltr', () => {
    expect(directionForLocale('ar')).toBe('rtl');
    expect(directionForLocale('en')).toBe('ltr');
  });

  it('validates the direction enum', () => {
    expect(directionSchema.parse('rtl')).toBe('rtl');
    expect(directionSchema.safeParse('sideways').success).toBe(false);
  });
});
