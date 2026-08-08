import type { BlockNode, BlockType } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { buildDefaultValues } from '../../../components/dynamic-form/build-default-values';
import type { FieldConfig } from '../../../components/dynamic-form/field.types';
import {
  BLOCK_BODY,
  BLOCK_DATA_KEYS,
  BLOCK_HAS_IMAGE,
  BLOCK_TYPES,
  type BlockFormValues,
  blockDefaultData,
  blockFormSchema,
  fromBlockData,
  toBlockData,
} from './block-data';

/**
 * Mirror the fields `useBlockForm` builds for a block kind (title always; the kind's data keys;
 * an image picker only when the kind carries an image; a body only when it renders one). This is
 * the crux of the silent-save bug: the schema MUST accept the exact defaults these fields seed.
 */
function fieldsForType(type: BlockType): FieldConfig<BlockFormValues>[] {
  const fields: FieldConfig<BlockFormValues>[] = [
    { name: 'title', type: 'text', label: 'title', translatable: true },
  ];
  for (const key of BLOCK_DATA_KEYS[type]) {
    if (key === 'value') {
      fields.push({
        name: 'value',
        type: 'number',
        label: 'value',
        defaultValue: 0,
      });
    } else if (key === 'variant') {
      fields.push({
        name: 'variant',
        type: 'select',
        label: 'variant',
        defaultValue: 'primary',
      });
    } else {
      fields.push({
        name: key as FieldConfig<BlockFormValues>['name'],
        type: 'text',
        label: key,
      });
    }
  }
  if (BLOCK_HAS_IMAGE[type]) {
    fields.push({ name: 'imageMediaId', type: 'custom', label: 'image' });
  }
  const body = BLOCK_BODY[type];
  if (body === 'richtext') {
    fields.push({
      name: 'body',
      type: 'custom',
      label: 'body',
      translatable: true,
    });
  } else if (body === 'textarea') {
    fields.push({
      name: 'body',
      type: 'textarea',
      label: 'body',
      translatable: true,
    });
  }
  return fields;
}

describe('block-data typed editor (U21)', () => {
  it('builds default data per type', () => {
    expect(blockDefaultData('stat')).toEqual({ value: 0, suffix: '' });
    expect(blockDefaultData('cta')).toEqual({ href: '', variant: 'primary' });
    expect(blockDefaultData('text')).toEqual({});
  });

  it('collects only the kind-specific keys into the data object on submit', () => {
    const values = {
      value: 120,
      suffix: '+',
      href: 'ignored',
      imageMediaId: '',
    };
    expect(toBlockData('stat', values)).toEqual({ value: 120, suffix: '+' });
    expect(toBlockData('text', values)).toEqual({});
  });

  it('flattens a node back into form keys for the edit prefill, defaulting missing keys', () => {
    const node = {
      id: 'b1',
      type: 'cta',
      sortOrder: 0,
      data: { href: '/contact' },
      imageMediaId: null,
      title: { ar: '', en: '' },
      body: { ar: '', en: '' },
    } satisfies BlockNode;
    expect(fromBlockData(node)).toEqual({
      href: '/contact',
      variant: 'primary',
    });
  });

  it('validates a stat block (coerces the numeric value), rejects a bad cta variant', () => {
    const stat = blockFormSchema('stat').safeParse({
      imageMediaId: '',
      translations: {
        ar: { title: 'مشروع', body: '' },
        en: { title: '', body: '' },
      },
      value: '120',
      suffix: '+',
    });
    expect(stat.success).toBe(true);
    if (stat.success) {
      expect(stat.data.value).toBe(120);
    }

    const badCta = blockFormSchema('cta').safeParse({
      imageMediaId: '',
      translations: {
        ar: { title: '', body: '' },
        en: { title: '', body: '' },
      },
      href: '/contact',
      variant: 'tertiary',
    });
    expect(badCta.success).toBe(false);
  });

  // Regression (silent block-save no-op): the schema must accept the EXACT defaults the live
  // form seeds — for stat/image/cta the form renders no `body` (and stat/cta no image), so those
  // keys are undefined. Before the fix, the required `translations.body`/`imageMediaId` rejected
  // undefined and `handleSubmit` aborted with no toast. This drives the real defaults, unlike the
  // hand-passed `body: ''` above which masked the bug.
  it.each(BLOCK_TYPES)(
    'accepts the real create defaults the builder seeds for a "%s" block',
    (type) => {
      const values = buildDefaultValues<BlockFormValues>({
        fields: fieldsForType(type),
      });
      const result = blockFormSchema(type).safeParse(values);
      expect(result.success).toBe(true);
    },
  );
});
