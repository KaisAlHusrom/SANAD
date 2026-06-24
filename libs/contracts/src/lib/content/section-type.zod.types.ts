import { z } from 'zod';

/**
 * The kind of a page section — drives which website component renders it (WEB1). The
 * landing page composes these in order; new kinds are added here + to the `section_type`
 * Postgres enum together (U3). Mirrors the designed sections in `content-defaults.md`.
 */
export const sectionTypeSchema = z.enum([
  'hero',
  'trust',
  'services',
  'process',
  'work',
  'stats',
  'testimonials',
  'blog',
  'cta',
  'richtext',
]);

export type SectionType = z.infer<typeof sectionTypeSchema>;
