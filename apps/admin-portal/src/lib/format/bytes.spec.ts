import { describe, expect, it } from 'vitest';
import { formatBytes } from './bytes';

describe('formatBytes', () => {
  it('shows plain bytes for a tiny file', () => {
    expect(formatBytes(512, 'en')).toMatch(/^512\s?byte/i);
  });

  it('steps up the unit as the file grows', () => {
    expect(formatBytes(2048, 'en')).toMatch(/^2\s?kB|^2\s?KB/i);
    expect(formatBytes(1024 * 1024 * 3, 'en')).toMatch(/3\s?MB/i);
    expect(formatBytes(1024 ** 3 * 1.8, 'en')).toMatch(/1\.8\s?GB/i);
  });

  it('keeps at most one decimal — a size is a glance, not an audit', () => {
    expect(formatBytes(1024 * 1024 * 1.26, 'en')).toMatch(/1\.3\s?MB/i);
  });

  it('formats in Arabic with WESTERN numerals (the locked numeral decision, U8)', () => {
    const arabic = formatBytes(1024 * 1024 * 5, 'ar');
    expect(arabic).toMatch(/5/);
    expect(arabic).not.toMatch(/[٠-٩]/);
  });

  it('handles zero and nonsense without producing NaN', () => {
    expect(formatBytes(0, 'en')).toMatch(/0/);
    expect(formatBytes(Number.NaN, 'en')).toMatch(/0/);
    expect(formatBytes(-5, 'en')).toMatch(/0/);
  });
});
