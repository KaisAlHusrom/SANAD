import { describe, expect, it } from 'vitest';
import { loc, portfolioItem, section } from '../../../test/fixtures.js';
import { deriveWorkCards, splitMetric } from './derive-work-cards.js';

describe('splitMetric', () => {
  it('splits a leading metric token from its words', () => {
    expect(splitMetric('−40% delivery time')).toEqual({
      value: '−40%',
      label: 'delivery time',
    });
    expect(splitMetric('3x throughput')).toEqual({
      value: '3x',
      label: 'throughput',
    });
  });

  it('falls back to the whole string as the label when no metric leads', () => {
    expect(splitMetric('faster onboarding')).toEqual({
      value: '',
      label: 'faster onboarding',
    });
  });
});

describe('deriveWorkCards', () => {
  const linked = () =>
    section({
      type: 'work',
      collection: {
        collection: 'portfolio',
        items: [
          portfolioItem({
            slug: 'pay',
            clientName: 'Acme',
            coverMediaId: 'media-1',
            category: {
              id: 'c',
              slug: 'commerce',
              name: loc('تجارة', 'Commerce'),
            },
            challenge: loc('', 'Legacy checkout'),
            result: loc('', '−40% delivery time'),
          }),
        ],
      },
    });

  it('projects a hydrated portfolio item onto a card (client/tag/challenge/metric/slug) + resolves the cover url server-side', () => {
    const [card] = deriveWorkCards(linked(), 'en', (id) =>
      id === 'media-1' ? 'https://cdn/x.jpg' : '',
    );
    expect(card).toMatchObject({
      slug: 'pay',
      client: 'Acme',
      tag: 'Commerce',
      challenge: 'Legacy checkout',
      resultValue: '−40%',
      resultLabel: 'delivery time',
      coverUrl: 'https://cdn/x.jpg',
    });
  });

  it('coverUrl is blank when there is no cover or no resolver (placeholder path)', () => {
    const noCover = section({
      type: 'work',
      collection: {
        collection: 'portfolio',
        items: [portfolioItem({ slug: 'p', coverMediaId: null })],
      },
    });
    expect(deriveWorkCards(noCover, 'en', () => 'x')[0]?.coverUrl).toBe('');
    // a cover id but no resolver passed → blank (never a broken image)
    expect(deriveWorkCards(linked(), 'en')[0]?.coverUrl).toBe('');
  });

  it('falls back client→summary and localizes AR', () => {
    const sec = section({
      type: 'work',
      collection: {
        collection: 'portfolio',
        items: [
          portfolioItem({
            slug: 'p',
            clientName: null,
            summary: loc('ملخّص', 'Summary'),
            category: null,
          }),
        ],
      },
    });
    const [card] = deriveWorkCards(sec, 'ar');
    expect(card?.client).toBe('ملخّص');
    expect(card?.tag).toBe(''); // uncategorised → no tag
  });

  it('is empty when the section links no portfolio collection', () => {
    expect(deriveWorkCards(section({ type: 'work' }), 'en')).toEqual([]);
  });
});
