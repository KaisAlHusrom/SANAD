import type {
  LocalizedText,
  SettingField,
  SettingWrite,
} from '@sanad/contracts';

/** RHF treats dots as nested paths, so a setting key becomes a flat, safe field id. */
export function fieldId(key: string): string {
  return key.replace(/\./g, '__');
}

function isLocalized(value: unknown): value is LocalizedText {
  return (
    typeof value === 'object' &&
    value !== null &&
    'ar' in value &&
    'en' in value
  );
}

export interface LocalizedValue {
  ar: string;
  en: string;
}
export type SectionFormValue = string | number | boolean | LocalizedValue;
export type SectionFormValues = Record<string, SectionFormValue>;

/**
 * Project a section's resolved field values into the RHF form shape (keyed by `fieldId`):
 * `localized_text` → `{ ar, en }`, boolean → bool, number → number, everything else → a
 * string (`null` becomes `''` so the input is controlled).
 */
export function toSectionFormValues(
  fields: readonly SettingField[],
): SectionFormValues {
  const out: SectionFormValues = {};
  for (const field of fields) {
    const id = fieldId(field.key);
    switch (field.type) {
      case 'localized_text':
        out[id] = isLocalized(field.value)
          ? { ar: field.value.ar, en: field.value.en }
          : { ar: '', en: '' };
        break;
      case 'boolean':
        out[id] = field.value === true;
        break;
      case 'number':
        out[id] = typeof field.value === 'number' ? field.value : 0;
        break;
      default:
        out[id] = typeof field.value === 'string' ? field.value : '';
        break;
    }
  }
  return out;
}

/**
 * Diff the form values against the section's resolved fields → only the **changed** key→value
 * writes (the per-section Save sends just these). A blank string on a nullable leaf clears it
 * to `null` (→ coded default, U9); a `localized_text` is sent whole if either locale changed.
 */
export function toChangedWrites(
  fields: readonly SettingField[],
  values: SectionFormValues,
): SettingWrite[] {
  const writes: SettingWrite[] = [];
  for (const field of fields) {
    const current = values[fieldId(field.key)];
    if (field.type === 'localized_text') {
      const next: LocalizedValue = isLocalized(current)
        ? { ar: current.ar, en: current.en }
        : { ar: '', en: '' };
      const orig = isLocalized(field.value) ? field.value : { ar: '', en: '' };
      if (next.ar !== orig.ar || next.en !== orig.en) {
        writes.push({ key: field.key, value: next });
      }
      continue;
    }
    if (field.type === 'boolean') {
      const next = current === true;
      if (next !== (field.value === true)) {
        writes.push({ key: field.key, value: next });
      }
      continue;
    }
    if (field.type === 'number') {
      const next = typeof current === 'number' ? current : Number(current);
      if (next !== field.value) {
        writes.push({ key: field.key, value: next });
      }
      continue;
    }
    // text / color / url / image / select — a blank string clears to null.
    const raw = typeof current === 'string' ? current : '';
    const next = raw === '' ? null : raw;
    const orig = typeof field.value === 'string' ? field.value : null;
    if (next !== orig) {
      writes.push({ key: field.key, value: next });
    }
  }
  return writes;
}
