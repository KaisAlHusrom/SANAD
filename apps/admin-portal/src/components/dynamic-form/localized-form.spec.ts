import { describe, expect, it } from 'vitest';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
  toLocalizedFormRecord,
  toLocalizedUpsertBody,
} from './localized-form';

describe('localizedFormSchema', () => {
  it('requires required keys in the default locale (ar) but allows an empty secondary locale', () => {
    const schema = localizedFormSchema({
      required: ['title'],
      optional: ['summary'],
    });
    // ar filled, en empty → valid (en falls back via pickLocalized)
    expect(
      schema.safeParse({
        ar: { title: 'ع', summary: '' },
        en: { title: '', summary: '' },
      }).success,
    ).toBe(true);
    // ar (default) empty → invalid
    expect(
      schema.safeParse({
        ar: { title: '', summary: '' },
        en: { title: 'E', summary: '' },
      }).success,
    ).toBe(false);
  });

  it('trims values', () => {
    const schema = localizedFormSchema({ required: ['title'] });
    const parsed = schema.parse({ ar: { title: ' ع ' }, en: { title: ' E ' } });
    expect(parsed).toEqual({ ar: { title: 'ع' }, en: { title: 'E' } });
  });
});

describe('phantomTranslatableKeys', () => {
  it('produces optional string entries for each key', () => {
    const phantom = phantomTranslatableKeys(['title', 'summary']);
    expect(Object.keys(phantom).sort()).toEqual(['summary', 'title']);
    expect(phantom.title?.safeParse(undefined).success).toBe(true);
    expect(phantom.title?.safeParse('x').success).toBe(true);
  });
});

describe('toLocalizedFormRecord', () => {
  it('flattens each translatable field into a translations map', () => {
    const record = toLocalizedFormRecord(
      {
        slug: 'saas',
        coverMediaId: null,
        title: { ar: 'منصة', en: 'SaaS' },
        summary: { ar: 'وصف', en: 'Desc' },
      },
      ['title', 'summary'],
    );
    expect(record.translations).toEqual({
      ar: { title: 'منصة', summary: 'وصف' },
      en: { title: 'SaaS', summary: 'Desc' },
    });
    expect(record.slug).toBe('saas');
    expect(record.coverMediaId).toBeNull();
  });

  it('defaults a missing locale to an empty string', () => {
    const record = toLocalizedFormRecord({ title: { ar: 'منصة' } }, ['title']);
    expect(record.translations).toEqual({
      ar: { title: 'منصة' },
      en: { title: '' },
    });
  });
});

describe('toLocalizedUpsertBody', () => {
  it('pivots translations back to top-level LocalizedText and nullifies cleared keys', () => {
    const body = toLocalizedUpsertBody<Record<string, unknown>>(
      {
        slug: 'saas',
        category: 'core',
        coverMediaId: '',
        iconKey: 'rocket',
        sortOrder: 3,
        translations: {
          ar: { title: 'منصة', summary: '' },
          en: { title: 'SaaS', summary: 'Desc' },
        },
      },
      {
        translatableKeys: ['title', 'summary'],
        nullableKeys: ['coverMediaId'],
      },
    );
    expect(body).toEqual({
      slug: 'saas',
      category: 'core',
      coverMediaId: null,
      iconKey: 'rocket',
      sortOrder: 3,
      title: { ar: 'منصة', en: 'SaaS' },
      summary: { ar: '', en: 'Desc' },
    });
    expect(body.translations).toBeUndefined();
  });

  it('round-trips an entity through record and body', () => {
    const entity = {
      slug: 'saas',
      category: 'core',
      sortOrder: 0,
      coverMediaId: null,
      title: { ar: 'منصة', en: 'SaaS' },
    };
    const record = toLocalizedFormRecord(entity, ['title']);
    const body = toLocalizedUpsertBody<typeof entity>(
      { ...record, sortOrder: 0 },
      { translatableKeys: ['title'], nullableKeys: ['coverMediaId'] },
    );
    expect(body.title).toEqual({ ar: 'منصة', en: 'SaaS' });
    expect(body.slug).toBe('saas');
  });
});
