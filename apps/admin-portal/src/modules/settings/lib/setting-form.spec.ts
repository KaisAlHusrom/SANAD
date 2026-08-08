import type { SettingField } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { fieldId, toChangedWrites, toSectionFormValues } from './setting-form';

const fields: SettingField[] = [
  {
    key: 'branding.colors.primary',
    type: 'color',
    requirement: 'optional',
    value: '#22d3ee',
  },
  {
    key: 'branding.brand.name',
    type: 'localized_text',
    requirement: 'optional',
    value: { ar: 'سَنَد', en: 'Sanad' },
  },
  {
    key: 'branding.social.twitter',
    type: 'url',
    requirement: 'optional',
    value: 'https://x.com/s',
  },
];

describe('setting-form helpers', () => {
  it('fieldId makes a dotted key RHF-safe', () => {
    expect(fieldId('branding.colors.primary')).toBe(
      'branding__colors__primary',
    );
  });

  it('projects resolved values into the form shape by type', () => {
    const values = toSectionFormValues(fields);
    expect(values['branding__colors__primary']).toBe('#22d3ee');
    expect(values['branding__brand__name']).toEqual({
      ar: 'سَنَد',
      en: 'Sanad',
    });
    expect(values['branding__social__twitter']).toBe('https://x.com/s');
  });

  it('null value projects to an empty string (controlled input)', () => {
    const values = toSectionFormValues([
      {
        key: 'branding.logoUrl',
        type: 'image',
        requirement: 'optional',
        value: null,
      },
    ]);
    expect(values['branding__logoUrl']).toBe('');
  });

  it('returns no writes when nothing changed', () => {
    const values = toSectionFormValues(fields);
    expect(toChangedWrites(fields, values)).toEqual([]);
  });

  it('emits only changed keys; clears a blanked nullable leaf to null', () => {
    const values = toSectionFormValues(fields);
    values['branding__colors__primary'] = '#ff0000';
    values['branding__social__twitter'] = '';
    const writes = toChangedWrites(fields, values);
    expect(writes).toEqual([
      { key: 'branding.colors.primary', value: '#ff0000' },
      { key: 'branding.social.twitter', value: null },
    ]);
  });

  it('emits a localized write when either locale changed', () => {
    const values = toSectionFormValues(fields);
    values['branding__brand__name'] = { ar: 'سَنَد', en: 'Sanad Tech' };
    const writes = toChangedWrites(fields, values);
    expect(writes).toEqual([
      { key: 'branding.brand.name', value: { ar: 'سَنَد', en: 'Sanad Tech' } },
    ]);
  });
});
