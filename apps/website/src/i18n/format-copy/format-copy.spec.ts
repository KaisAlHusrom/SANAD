import { describe, expect, it } from 'vitest';
import { formatCopy } from './format-copy';

describe('formatCopy', () => {
  it('fills a placeholder', () => {
    expect(formatCopy('Kept for {{days}} days.', { days: 180 }, 'en')).toBe(
      'Kept for 180 days.',
    );
  });

  it('fills the same placeholder everywhere it appears', () => {
    expect(formatCopy('{{n}} of {{n}}', { n: 2 }, 'en')).toBe('2 of 2');
  });

  // U8: Arabic reads Western digits on this site — `Intl` would otherwise hand back Arabic-Indic
  // numerals for the `ar` locale and the number would stop matching every other figure on screen.
  it('keeps Arabic numerals Western', () => {
    expect(formatCopy('نحفظه {{days}} يومًا', { days: 180 }, 'ar')).toBe(
      'نحفظه 180 يومًا',
    );
  });

  it('groups a large number for the reader', () => {
    expect(formatCopy('{{n}}', { n: 12345 }, 'en')).toBe('12,345');
  });

  it('passes strings through untouched', () => {
    expect(formatCopy('{{who}} decided', { who: 'Layla' }, 'en')).toBe(
      'Layla decided',
    );
  });

  // A template referring to a param the caller forgot is a bug, but a raw `{{days}}` on screen is
  // a worse one — leave the placeholder visible in dev, never crash the page it sits on.
  it('leaves an unknown placeholder alone rather than throwing', () => {
    expect(formatCopy('{{missing}} here', {}, 'en')).toBe('{{missing}} here');
  });
});
