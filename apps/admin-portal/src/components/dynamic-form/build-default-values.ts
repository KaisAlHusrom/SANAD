import { LOCALES } from '@sanad/contracts';
import type { FieldValues } from 'react-hook-form';
import type { FieldConfig, FieldType } from './field.types';

/** The blank value for a field's type (booleans → false, multi-select → [], else ''). */
export function emptyForType(type: FieldType): unknown {
  switch (type) {
    case 'checkbox':
    case 'toggle':
      return false;
    case 'multi-select':
      return [];
    default:
      return '';
  }
}

interface BuildArgs<TValues extends FieldValues> {
  fields: FieldConfig<TValues>[];
  /** Edit prefill (with an optional `translations` map); omit for create. */
  record?: Record<string, unknown>;
}

/**
 * Derive RHF default values from the field configs: create defaults by type / explicit
 * `defaultValue`, or prefill from a record on edit. Translatable fields are flattened
 * into a per-locale `translations` map (W6) the LocaleTabs bind to. Pure → unit-tested.
 */
export function buildDefaultValues<TValues extends FieldValues>({
  fields,
  record,
}: BuildArgs<TValues>): TValues {
  const values: Record<string, unknown> = {};
  const translations: Record<string, Record<string, unknown>> = {};
  const recordTranslations = (record?.['translations'] ?? {}) as Record<
    string,
    Record<string, unknown> | undefined
  >;

  for (const field of fields) {
    const key = String(field.name);
    if (field.translatable) {
      for (const locale of LOCALES) {
        translations[locale] ??= {};
        const fromRecord = recordTranslations[locale]?.[key];
        translations[locale][key] = fromRecord ?? field.defaultValue ?? '';
      }
      continue;
    }
    const fromRecord = record ? record[key] : undefined;
    values[key] = fromRecord ?? field.defaultValue ?? emptyForType(field.type);
  }

  if (Object.keys(translations).length > 0) {
    values['translations'] = translations;
  }
  return values as TValues;
}
