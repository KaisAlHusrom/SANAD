import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';

/** A 3- or 6-digit hex color (`#abc` / `#aabbcc`). */
const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color');

/** A URL value that may be explicitly cleared to `null`. */
const urlOrNull = z.string().url().nullable();

const pageAccentUpdate = z
  .object({ accent: hexColor, secondary: hexColor, ink: hexColor })
  .partial()
  .strict();

/**
 * The admin branding-update body (PUT /api/branding). A **deep partial** — an admin
 * edits only the leaves they change; every other value falls through to global/coded
 * default on the next resolve (U9). Strict at every level (N7). Runtime-validated →
 * `.zod.types` file (U16). The service flattens this to scope-keyed setting values.
 */
export const brandingUpdateRequestSchema = z
  .object({
    brand: z
      .object({
        name: localizedTextSchema,
        tagline: localizedTextSchema,
        shortDesc: localizedTextSchema,
      })
      .partial()
      .strict(),
    logoUrl: urlOrNull,
    faviconUrl: urlOrNull,
    colors: z
      .object({
        primary: hexColor,
        secondary: hexColor,
        pageAccents: z
          .object({
            landing: pageAccentUpdate,
            about: pageAccentUpdate,
            services: pageAccentUpdate,
            serviceDetail: pageAccentUpdate,
          })
          .partial()
          .strict(),
        surface: z
          .object({ bg: hexColor, track: hexColor, s1: hexColor, s2: hexColor })
          .partial()
          .strict(),
        text: z
          .object({
            base: hexColor,
            dim: hexColor,
            muted: hexColor,
            faint: hexColor,
          })
          .partial()
          .strict(),
      })
      .partial()
      .strict(),
    fonts: z
      .object({ sans: z.string().min(1), mono: z.string().min(1) })
      .partial()
      .strict(),
    social: z
      .object({
        twitter: urlOrNull,
        linkedin: urlOrNull,
        instagram: urlOrNull,
        github: urlOrNull,
        youtube: urlOrNull,
      })
      .partial()
      .strict(),
    contact: z
      .object({
        email: z.string().email().nullable(),
        phone: z.string().min(1).nullable(),
        address: localizedTextSchema.nullable(),
      })
      .partial()
      .strict(),
  })
  .partial()
  .strict();

export type BrandingUpdateRequest = z.infer<typeof brandingUpdateRequestSchema>;
