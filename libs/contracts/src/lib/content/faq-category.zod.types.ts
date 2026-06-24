import { z } from 'zod';

/**
 * An FAQ's grouping on the website (WEB1): `general` questions, `pricing`, `process`
 * (the phase-by-phase method), and `support` (post-launch). Mirrors the `faq_category`
 * Postgres enum (U3). Nullable on the entity — an ungrouped FAQ is allowed.
 */
export const faqCategorySchema = z.enum([
  'general',
  'pricing',
  'process',
  'support',
]);

export type FaqCategory = z.infer<typeof faqCategorySchema>;
