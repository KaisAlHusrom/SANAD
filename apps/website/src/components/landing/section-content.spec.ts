import { describe, expect, it } from 'vitest';
import type { SectionNode } from '@sanad/contracts';
import {
  blockLocalized,
  blocksFor,
  firstBlockFor,
  splitMetric,
} from './section-content';

function loc(ar: string, en = ar) {
  return { ar, en };
}

const section = {
  id: 'sec-services',
  type: 'services',
  sortOrder: 0,
  published: true,
  eyebrow: loc(''),
  title: loc(''),
  subtitle: loc(''),
  blocks: [
    {
      id: 'f2',
      type: 'feature',
      sortOrder: 2,
      data: { service: 'saas' },
      imageMediaId: null,
      title: loc('نطاق متعدد المستأجرين'),
      body: loc(''),
    },
    {
      id: 'f1',
      type: 'feature',
      sortOrder: 1,
      data: { service: 'saas' },
      imageMediaId: null,
      title: loc('اشتراكات وفوترة'),
      body: loc(''),
    },
    {
      id: 'f3',
      type: 'feature',
      sortOrder: 3,
      data: { service: 'erp' },
      imageMediaId: null,
      title: loc('مخزون ومحاسبة'),
      body: loc(''),
    },
    {
      id: 't1',
      type: 'text',
      sortOrder: 0,
      data: { service: 'saas', tech: 'NestJS · Postgres' },
      imageMediaId: null,
      title: loc(''),
      body: loc(''),
    },
    {
      id: 'sf1',
      type: 'feature',
      sortOrder: 4,
      data: { step: 2 },
      imageMediaId: null,
      title: loc('نماذج قابلة للنقر'),
      body: loc(''),
    },
  ],
} as unknown as SectionNode;

describe('blocksFor (CMS block joins — data[key] ↔ owner)', () => {
  it('returns matching blocks of the type, in sortOrder', () => {
    const features = blocksFor(section, 'feature', 'service', 'saas');
    expect(features.map((block) => block.id)).toEqual(['f1', 'f2']);
  });

  it('matches numeric data values loosely (step blocks store numbers)', () => {
    expect(
      blocksFor(section, 'feature', 'step', 2).map((block) => block.id),
    ).toEqual(['sf1']);
  });

  it('returns [] for a missing section or no match (null-safe, F7)', () => {
    expect(blocksFor(undefined, 'feature', 'service', 'saas')).toEqual([]);
    expect(blocksFor(section, 'feature', 'service', 'mobile')).toEqual([]);
  });
});

describe('blockLocalized (translatable values in the data bag)', () => {
  const block = {
    id: 'b1',
    type: 'step',
    sortOrder: 0,
    data: {
      duration: { ar: 'أسبوع ١–٢', en: 'Weeks 1–2' },
      broken: { ar: 1 },
      plain: 'x',
    },
    imageMediaId: null,
    title: loc(''),
    body: loc(''),
  } as unknown as Parameters<typeof blockLocalized>[0];

  it('returns a verified LocalizedText from the data bag', () => {
    expect(blockLocalized(block, 'duration')).toEqual({
      ar: 'أسبوع ١–٢',
      en: 'Weeks 1–2',
    });
  });

  it('rejects malformed shapes instead of casting (U15)', () => {
    expect(blockLocalized(block, 'broken')).toBeUndefined();
    expect(blockLocalized(block, 'plain')).toBeUndefined();
    expect(blockLocalized(block, 'missing')).toBeUndefined();
  });
});

describe('splitMetric (metric-led result bars)', () => {
  it('splits a leading metric token from its label', () => {
    expect(splitMetric('−40% زمن التسليم')).toEqual({
      value: '−40%',
      label: 'زمن التسليم',
    });
    expect(splitMetric('+320% نشاط شهري')).toEqual({
      value: '+320%',
      label: 'نشاط شهري',
    });
    expect(splitMetric('3x faster releases')).toEqual({
      value: '3x',
      label: 'faster releases',
    });
    expect(splitMetric('1.2M معاملة شهريًا')).toEqual({
      value: '1.2M',
      label: 'معاملة شهريًا',
    });
    expect(splitMetric('200K تنزيل')).toEqual({
      value: '200K',
      label: 'تنزيل',
    });
  });

  it('returns the whole string as label when no metric leads', () => {
    expect(splitMetric('نتيجة نوعية للعميل')).toEqual({
      value: '',
      label: 'نتيجة نوعية للعميل',
    });
    expect(splitMetric('')).toEqual({ value: '', label: '' });
  });
});

describe('firstBlockFor', () => {
  it('returns the first matching block of the type', () => {
    expect(firstBlockFor(section, 'text', 'service', 'saas')?.id).toBe('t1');
  });

  it('returns undefined when nothing matches', () => {
    expect(firstBlockFor(section, 'text', 'service', 'erp')).toBeUndefined();
  });
});
