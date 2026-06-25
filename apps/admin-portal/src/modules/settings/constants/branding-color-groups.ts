import type { FieldPath } from 'react-hook-form';
import type { BrandingFormValues } from '../validation/branding-form.zod.types';

/**
 * One advanced color field — its RHF path (type-checked against the form shape) and a
 * terse technical label. These are design-token identifiers (like CSS var names), shown
 * untranslated in the "Advanced color system" section (the group titles ARE translated).
 */
export interface ColorFieldConfig {
  name: FieldPath<BrandingFormValues>;
  label: string;
}

export interface ColorGroupConfig {
  titleKey: string;
  fields: readonly ColorFieldConfig[];
}

/** The 20 deeper color tokens (pageAccents 4×3 + surface 4 + text 4), advanced-grouped. */
export const ADVANCED_COLOR_GROUPS: readonly ColorGroupConfig[] = [
  {
    titleKey: 'colors.groups.pageAccents',
    fields: [
      { name: 'colors.pageAccents.landing.accent', label: 'landing / accent' },
      {
        name: 'colors.pageAccents.landing.secondary',
        label: 'landing / secondary',
      },
      { name: 'colors.pageAccents.landing.ink', label: 'landing / ink' },
      { name: 'colors.pageAccents.about.accent', label: 'about / accent' },
      {
        name: 'colors.pageAccents.about.secondary',
        label: 'about / secondary',
      },
      { name: 'colors.pageAccents.about.ink', label: 'about / ink' },
      {
        name: 'colors.pageAccents.services.accent',
        label: 'services / accent',
      },
      {
        name: 'colors.pageAccents.services.secondary',
        label: 'services / secondary',
      },
      { name: 'colors.pageAccents.services.ink', label: 'services / ink' },
      {
        name: 'colors.pageAccents.serviceDetail.accent',
        label: 'serviceDetail / accent',
      },
      {
        name: 'colors.pageAccents.serviceDetail.secondary',
        label: 'serviceDetail / secondary',
      },
      {
        name: 'colors.pageAccents.serviceDetail.ink',
        label: 'serviceDetail / ink',
      },
    ],
  },
  {
    titleKey: 'colors.groups.surface',
    fields: [
      { name: 'colors.surface.bg', label: 'surface / bg' },
      { name: 'colors.surface.track', label: 'surface / track' },
      { name: 'colors.surface.s1', label: 'surface / s1' },
      { name: 'colors.surface.s2', label: 'surface / s2' },
    ],
  },
  {
    titleKey: 'colors.groups.text',
    fields: [
      { name: 'colors.text.base', label: 'text / base' },
      { name: 'colors.text.dim', label: 'text / dim' },
      { name: 'colors.text.muted', label: 'text / muted' },
      { name: 'colors.text.faint', label: 'text / faint' },
    ],
  },
];
