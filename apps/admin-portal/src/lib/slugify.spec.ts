import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe('slugify', () => {
  it('kebab-cases a latin title', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Sanad Tech Platform')).toBe('sanad-tech-platform');
  });

  it('lowercases and strips punctuation', () => {
    expect(slugify('Hello,  World!! (2026)')).toBe('hello-world-2026');
    expect(slugify('  trim  me  ')).toBe('trim-me');
  });

  it('transliterates an Arabic title to a valid latin slug', () => {
    const out = slugify('سند التقنية');
    expect(out).toMatch(SLUG_RE);
    expect(out).toContain('snd');
  });

  it('strips Arabic diacritics (tashkeel) and tatweel before transliterating', () => {
    // same word with/without harakat → same slug
    expect(slugify('مَرْحَبًا')).toBe(slugify('مرحبا'));
  });

  it('handles a mixed Arabic + latin + number title', () => {
    const out = slugify('مشروع SANAD 2026');
    expect(out).toMatch(SLUG_RE);
    expect(out).toContain('sanad');
    expect(out).toContain('2026');
  });

  it('returns an empty string for empty / non-transliterable input', () => {
    expect(slugify('')).toBe('');
    expect(slugify('   ')).toBe('');
    expect(slugify('!!!')).toBe('');
  });

  it('always satisfies the contract slug regex for non-empty output', () => {
    for (const input of ['Hello World', 'سند التقنية', 'a--b__c  d']) {
      const out = slugify(input);
      if (out) expect(out).toMatch(SLUG_RE);
    }
  });

  it('caps the slug length at 160 with no trailing hyphen', () => {
    const out = slugify('word '.repeat(60));
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith('-')).toBe(false);
    expect(out).toMatch(SLUG_RE);
  });
});
