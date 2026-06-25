import { z } from 'zod';
import { HEX_COLOR_PATTERN } from '../../../components/ui/hex-color';

/**
 * The branding EDIT form's validated shape (U16) — distinct from the contract's
 * `BrandingRecord` (response) and `BrandingUpdateRequest` (the deep-partial PUT). Nullable
 * leaves are plain strings here (`''` = unset); the diff maps `'' → null` on submit. Error
 * messages are i18n keys (F6), resolved in the components. The hex pattern is the single
 * source shared with `ColorInput` (U3).
 */
const hex = z.string().regex(HEX_COLOR_PATTERN, 'errors.hex');

const urlOrEmpty = z
  .string()
  .refine(
    (value) => value === '' || z.string().url().safeParse(value).success,
    {
      message: 'errors.url',
    },
  );

const emailOrEmpty = z
  .string()
  .refine(
    (value) => value === '' || z.string().email().safeParse(value).success,
    {
      message: 'errors.email',
    },
  );

const localizedText = z.object({ ar: z.string(), en: z.string() });
const pageAccent = z.object({ accent: hex, secondary: hex, ink: hex });

export const brandingFormSchema = z.object({
  brand: z.object({
    name: localizedText,
    tagline: localizedText,
    shortDesc: localizedText,
  }),
  logoUrl: urlOrEmpty,
  faviconUrl: urlOrEmpty,
  colors: z.object({
    primary: hex,
    secondary: hex,
    pageAccents: z.object({
      landing: pageAccent,
      about: pageAccent,
      services: pageAccent,
      serviceDetail: pageAccent,
    }),
    surface: z.object({ bg: hex, track: hex, s1: hex, s2: hex }),
    text: z.object({ base: hex, dim: hex, muted: hex, faint: hex }),
  }),
  fonts: z.object({
    sans: z.string().min(1, 'errors.required'),
    mono: z.string().min(1, 'errors.required'),
  }),
  social: z.object({
    twitter: urlOrEmpty,
    linkedin: urlOrEmpty,
    instagram: urlOrEmpty,
    github: urlOrEmpty,
    youtube: urlOrEmpty,
  }),
  contact: z.object({
    email: emailOrEmpty,
    phone: z.string(),
    address: localizedText,
  }),
});

export type BrandingFormValues = z.infer<typeof brandingFormSchema>;
