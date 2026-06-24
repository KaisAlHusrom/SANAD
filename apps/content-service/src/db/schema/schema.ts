import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outboxTable } from '@sanad/messaging';
import { pageTable } from './page.table.js';
import { pageTranslationTable } from './page-translation.table.js';
import { sectionTable } from './section.table.js';
import { sectionTranslationTable } from './section-translation.table.js';
import { blockTable } from './block.table.js';
import { blockTranslationTable } from './block-translation.table.js';
import { serviceTable } from './service.table.js';
import { serviceTranslationTable } from './service-translation.table.js';
import { testimonialTable } from './testimonial.table.js';
import { testimonialTranslationTable } from './testimonial-translation.table.js';
import { teamMemberTable } from './team-member.table.js';
import { teamMemberTranslationTable } from './team-member-translation.table.js';
import { portfolioCategoryTable } from './portfolio-category.table.js';
import { portfolioCategoryTranslationTable } from './portfolio-category-translation.table.js';
import { portfolioProjectTable } from './portfolio-project.table.js';
import { portfolioProjectTranslationTable } from './portfolio-project-translation.table.js';
import { blogCategoryTable } from './blog-category.table.js';
import { blogCategoryTranslationTable } from './blog-category-translation.table.js';
import { blogTagTable } from './blog-tag.table.js';
import { blogTagTranslationTable } from './blog-tag-translation.table.js';
import { blogPostTable } from './blog-post.table.js';
import { blogPostTranslationTable } from './blog-post-translation.table.js';
import { blogPostTagTable } from './blog-post-tag.table.js';
import { faqTable } from './faq.table.js';
import { faqTranslationTable } from './faq-translation.table.js';
import { menuTable } from './menu.table.js';
import { menuItemTable } from './menu-item.table.js';
import { menuItemTranslationTable } from './menu-item-translation.table.js';
import { leadTable } from './lead.table.js';
import { processedMessageTable } from './processed-message.table.js';

/**
 * The content service's full Drizzle schema (its own DB, MS5) — the Page→Section→Block tree,
 * the services collection, leads, the idempotency ledger, and the Outbox.
 */
export const schema = {
  pageTable,
  pageTranslationTable,
  sectionTable,
  sectionTranslationTable,
  blockTable,
  blockTranslationTable,
  serviceTable,
  serviceTranslationTable,
  testimonialTable,
  testimonialTranslationTable,
  teamMemberTable,
  teamMemberTranslationTable,
  portfolioCategoryTable,
  portfolioCategoryTranslationTable,
  portfolioProjectTable,
  portfolioProjectTranslationTable,
  blogCategoryTable,
  blogCategoryTranslationTable,
  blogTagTable,
  blogTagTranslationTable,
  blogPostTable,
  blogPostTranslationTable,
  blogPostTagTable,
  faqTable,
  faqTranslationTable,
  menuTable,
  menuItemTable,
  menuItemTranslationTable,
  leadTable,
  processedMessageTable,
  outboxTable,
};

/** The typed Drizzle handle bound to this service's schema (injected via `DRIZZLE`). */
export type ContentDb = NodePgDatabase<typeof schema>;
