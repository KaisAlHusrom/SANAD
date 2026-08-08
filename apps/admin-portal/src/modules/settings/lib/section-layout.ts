import type { SettingField, SettingSection } from '@sanad/contracts';

export interface FieldGroup {
  /** `colorGroups` i18n key (e.g. 'base'); undefined = an untitled group. */
  titleKey?: string;
  /** Render this group inside the "advanced" disclosure. */
  advanced?: boolean;
  fields: SettingField[];
}

/**
 * Split a section into render groups. Most sections are one flat group; the large `colors`
 * section is sub-grouped by token family (brand colors up front, then page-accents / surfaces
 * / text colors behind an "advanced" disclosure) — mirroring the design's branding editor.
 */
export function sectionGroups(section: SettingSection): FieldGroup[] {
  if (section.section !== 'colors') {
    return [{ fields: [...section.fields] }];
  }
  const pick = (test: (key: string) => boolean): SettingField[] =>
    section.fields.filter((field) => test(field.key));
  return [
    {
      titleKey: 'base',
      fields: pick(
        (key) =>
          key === 'branding.colors.primary' ||
          key === 'branding.colors.secondary',
      ),
    },
    {
      titleKey: 'pageAccents',
      advanced: true,
      fields: pick((key) => key.includes('.colors.pageAccents.')),
    },
    {
      titleKey: 'surface',
      advanced: true,
      fields: pick((key) => key.includes('.colors.surface.')),
    },
    {
      titleKey: 'text',
      advanced: true,
      fields: pick((key) => key.includes('.colors.text.')),
    },
  ].filter((group) => group.fields.length > 0);
}
