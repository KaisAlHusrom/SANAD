import { describe, expect, it } from 'vitest';
import { buildDefaultValues, emptyForType } from './build-default-values';
import type { FieldConfig } from './field.types';

interface Form {
  title: string;
  featured: boolean;
  tags: string[];
  status: string;
  translations?: Record<string, Record<string, unknown>>;
}

describe('emptyForType', () => {
  it('defaults booleans to false, multi-select to [], else empty string', () => {
    expect(emptyForType('toggle')).toBe(false);
    expect(emptyForType('checkbox')).toBe(false);
    expect(emptyForType('multi-select')).toEqual([]);
    expect(emptyForType('text')).toBe('');
  });
});

describe('buildDefaultValues', () => {
  it('seeds create defaults by field type', () => {
    const fields: FieldConfig<Form>[] = [
      { name: 'title', type: 'text', label: 'Title' },
      { name: 'featured', type: 'toggle', label: 'Featured' },
      { name: 'tags', type: 'multi-select', label: 'Tags' },
    ];
    expect(buildDefaultValues({ fields })).toEqual({
      title: '',
      featured: false,
      tags: [],
    });
  });

  it('honours an explicit defaultValue', () => {
    const fields: FieldConfig<Form>[] = [
      {
        name: 'status',
        type: 'select',
        label: 'Status',
        defaultValue: 'draft',
      },
    ];
    expect(buildDefaultValues({ fields }).status).toBe('draft');
  });

  it('prefills from a record on edit', () => {
    const fields: FieldConfig<Form>[] = [
      { name: 'title', type: 'text', label: 'Title' },
    ];
    expect(
      buildDefaultValues({ fields, record: { title: 'Hello' } }).title,
    ).toBe('Hello');
  });

  it('flattens a translations map for translatable fields', () => {
    const fields: FieldConfig<Form>[] = [
      { name: 'title', type: 'text', label: 'Title', translatable: true },
    ];
    const values = buildDefaultValues({
      fields,
      record: { translations: { ar: { title: 'مرحبا' }, en: { title: 'Hi' } } },
    });
    expect(values.translations).toEqual({
      ar: { title: 'مرحبا' },
      en: { title: 'Hi' },
    });
  });

  it('seeds empty per-locale translations on create', () => {
    const fields: FieldConfig<Form>[] = [
      { name: 'title', type: 'text', label: 'Title', translatable: true },
    ];
    expect(buildDefaultValues({ fields }).translations).toEqual({
      ar: { title: '' },
      en: { title: '' },
    });
  });
});
