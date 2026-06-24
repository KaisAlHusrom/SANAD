import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * Postgres enums mirroring the contract unions (`@sanad/contracts`). Kept here so the
 * migrations create the types in this service's own DB (MS5). Values MUST match the Zod
 * enums (`pageStatusSchema`, `sectionTypeSchema`, `blockTypeSchema`, `serviceCategorySchema`,
 * `leadSourceSchema`, `leadStatusSchema`, `faqCategorySchema`, `menuKeySchema`).
 */
export const pageStatusEnum = pgEnum('page_status', ['draft', 'published']);

export const sectionTypeEnum = pgEnum('section_type', [
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

export const blockTypeEnum = pgEnum('block_type', [
  'text',
  'richtext',
  'stat',
  'step',
  'feature',
  'image',
  'cta',
]);

export const serviceCategoryEnum = pgEnum('service_category', [
  'core',
  'support',
]);

export const leadSourceEnum = pgEnum('lead_source', [
  'contact',
  'request-project',
]);

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'contacted',
  'archived',
]);

export const faqCategoryEnum = pgEnum('faq_category', [
  'general',
  'pricing',
  'process',
  'support',
]);

export const menuKeyEnum = pgEnum('menu_key', ['primary', 'footer']);

export const portfolioStatusEnum = pgEnum('portfolio_status', [
  'draft',
  'published',
]);

export const blogPostStatusEnum = pgEnum('blog_post_status', [
  'draft',
  'published',
]);
