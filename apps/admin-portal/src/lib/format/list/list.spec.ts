import { describe, expect, it } from 'vitest';
import { formatList } from './list';

describe('formatList', () => {
  it('joins with the ARABIC separator in ar', () => {
    const joined = formatList(['بكسل Meta', 'بكسل TikTok'], 'ar');
    expect(joined).toContain('بكسل Meta');
    expect(joined).toContain('بكسل TikTok');
    expect(joined).not.toContain(', ');
  });

  // The defect this replaced: `join('، ')` put the Arabic comma into the English page.
  it('joins with the ENGLISH separator in en', () => {
    expect(formatList(['Meta pixel', 'TikTok pixel'], 'en')).toBe(
      'Meta pixel and TikTok pixel',
    );
    expect(formatList(['a', 'b', 'c'], 'en')).toBe('a, b, and c');
  });

  it('handles the degenerate lists a warning actually produces', () => {
    expect(formatList([], 'en')).toBe('');
    expect(formatList(['only'], 'en')).toBe('only');
  });
});
