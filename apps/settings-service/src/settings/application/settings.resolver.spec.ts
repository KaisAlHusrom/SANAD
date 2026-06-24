import { describe, expect, it, vi } from 'vitest';
import type {
  SettingRow,
  SettingTranslationRow,
  SettingValueRow,
} from '../../db/schema/index.js';
import type { SettingRepository } from '../infrastructure/setting.repository.js';
import type { SettingValueRepository } from '../infrastructure/setting-value.repository.js';
import type { SettingTranslationRepository } from '../infrastructure/setting-translation.repository.js';
import { isLocalizedText } from './resolved-value.js';
import { SettingsResolver } from './settings.resolver.js';

function settingRow(over: Partial<SettingRow>): SettingRow {
  return {
    id: 's1',
    key: 'branding.colors.primary',
    group: 'branding',
    type: 'color',
    requirement: 'optional',
    scope: 'global',
    options: null,
    defaultValue: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: null,
    ...over,
  };
}

function valueRow(over: Partial<SettingValueRow>): SettingValueRow {
  return {
    id: 'v1',
    settingId: 's1',
    scope: 'global',
    scopeId: null,
    value: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    deletedAt: null,
    ...over,
  };
}

function txRow(over: Partial<SettingTranslationRow>): SettingTranslationRow {
  return {
    settingValueId: 'v1',
    locale: 'ar',
    value: '',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...over,
  };
}

function makeResolver(parts: {
  findByKey?: SettingRow | null;
  findByGroup?: SettingRow[];
  findOne?: (scope: string, scopeId: string | null) => SettingValueRow | null;
  findForSettings?: (scope: string) => SettingValueRow[];
  findForValues?: SettingTranslationRow[];
}) {
  const settings = {
    findByKey: vi.fn(async () => parts.findByKey ?? null),
    findByGroup: vi.fn(async () => parts.findByGroup ?? []),
  } as unknown as SettingRepository;
  const values = {
    findOne: vi.fn(
      async (_id: string, scope: string, scopeId: string | null) =>
        parts.findOne ? parts.findOne(scope, scopeId) : null,
    ),
    findForSettings: vi.fn(async (_ids: string[], scope: string) =>
      parts.findForSettings ? parts.findForSettings(scope) : [],
    ),
  } as unknown as SettingValueRepository;
  const translations = {
    findForValues: vi.fn(async () => parts.findForValues ?? []),
  } as unknown as SettingTranslationRepository;
  return new SettingsResolver(settings, values, translations);
}

describe('SettingsResolver.resolveKey', () => {
  it('returns the coded default when the value is unset', async () => {
    const resolver = makeResolver({
      findByKey: settingRow({}),
      findOne: () => null,
    });
    expect(
      await resolver.resolveKey('branding.colors.primary', { scope: 'global' }),
    ).toBe('#22d3ee');
  });

  it('returns the coded default when the key has no catalog row', async () => {
    const resolver = makeResolver({ findByKey: null });
    expect(
      await resolver.resolveKey('branding.colors.primary', { scope: 'global' }),
    ).toBe('#22d3ee');
  });

  it('returns the stored global value over the coded default', async () => {
    const resolver = makeResolver({
      findByKey: settingRow({}),
      findOne: (scope) =>
        scope === 'global' ? valueRow({ value: '#abcdef' }) : null,
    });
    expect(
      await resolver.resolveKey('branding.colors.primary', { scope: 'global' }),
    ).toBe('#abcdef');
  });

  it('prefers a client override over the global value', async () => {
    const resolver = makeResolver({
      findByKey: settingRow({}),
      findOne: (scope) =>
        scope === 'client'
          ? valueRow({
              id: 'v-c',
              scope: 'client',
              scopeId: 'c1',
              value: '#111111',
            })
          : valueRow({ value: '#999999' }),
    });
    expect(
      await resolver.resolveKey('branding.colors.primary', {
        scope: 'client',
        scopeId: 'c1',
      }),
    ).toBe('#111111');
  });

  it('falls back per-locale to the coded default for a partial localized override', async () => {
    const resolver = makeResolver({
      findByKey: settingRow({
        key: 'branding.brand.name',
        type: 'localized_text',
      }),
      findOne: () => valueRow({ value: null }),
      findForValues: [txRow({ locale: 'ar', value: 'سَنَد المخصص' })],
    });
    const result = await resolver.resolveKey('branding.brand.name', {
      scope: 'global',
    });
    expect(isLocalizedText(result)).toBe(true);
    if (isLocalizedText(result)) {
      expect(result.ar).toBe('سَنَد المخصص');
      expect(result.en).toBe('Sanad Tech'); // coded default fills the missing locale
    }
  });
});

describe('SettingsResolver.resolveGroup', () => {
  it('returns an empty map when the group has no catalog rows', async () => {
    const resolver = makeResolver({ findByGroup: [] });
    expect(
      await resolver.resolveGroup('branding', { scope: 'global' }),
    ).toEqual({});
  });

  it('includes only keys that have a stored value (unset keys default later)', async () => {
    const resolver = makeResolver({
      findByGroup: [settingRow({ id: 's1', key: 'branding.colors.primary' })],
      findForSettings: (scope) =>
        scope === 'global'
          ? [valueRow({ settingId: 's1', value: '#222222' })]
          : [],
    });
    const result = await resolver.resolveGroup('branding', { scope: 'global' });
    expect(result).toEqual({ 'branding.colors.primary': '#222222' });
  });
});
