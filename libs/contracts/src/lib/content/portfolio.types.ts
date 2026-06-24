import type { LocalizedText } from '../common/localized-text.js';
import type { PortfolioStatus } from './portfolio-status.zod.types.js';

/**
 * The portfolio category embedded in a project read (embed-on-read): just enough to render the
 * label/filter without a second fetch. `null` when the project is uncategorized.
 */
export interface PortfolioCategoryRef {
  id: string;
  slug: string;
  name: LocalizedText;
}

/**
 * A portfolio project / case study as the gateway returns it (WEB1). `clientName` is a proper
 * noun (non-translatable); the translatable `title`/`summary`/`challenge`/`solution`/`result`
 * are carried in BOTH locales (`LocalizedText`, null-safe — F7). `category` is embedded (id +
 * slug + name) or null. `coverMediaId` is a soft media reference (MS5). `publishedAt` is set the
 * first time the project is published. Pure shape (U16).
 */
export interface PortfolioProjectItem {
  id: string;
  slug: string;
  category: PortfolioCategoryRef | null;
  coverMediaId: string | null;
  clientName: string | null;
  projectUrl: string | null;
  status: PortfolioStatus;
  publishedAt: string | null;
  featured: boolean;
  sortOrder: number;
  title: LocalizedText;
  summary: LocalizedText;
  challenge: LocalizedText;
  solution: LocalizedText;
  result: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
