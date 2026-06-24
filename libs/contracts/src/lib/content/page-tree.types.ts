import type { LocalizedText } from '../common/localized-text.js';
import type { BlockType } from './block-type.zod.types.js';
import type { PageStatus } from './page-status.zod.types.js';
import type { SectionType } from './section-type.zod.types.js';

/**
 * The assembled Page → Section → Block tree the website renders (WEB1/WEB2) and the admin
 * edits (P7). Translatable copy is carried in BOTH locales (`LocalizedText`, never blank
 * — F7) so the website picks the active locale and the admin edits per-locale tabs (W6)
 * from one fetch. Pure response shapes → `.types` files (U16).
 */
export interface BlockNode {
  id: string;
  type: BlockType;
  sortOrder: number;
  /** Non-translatable structured data (stat values in Western digits, icon keys, urls). */
  data: Record<string, unknown>;
  imageMediaId: string | null;
  title: LocalizedText;
  body: LocalizedText;
}

export interface SectionNode {
  id: string;
  type: SectionType;
  sortOrder: number;
  published: boolean;
  eyebrow: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  blocks: BlockNode[];
}

export interface PageTree {
  id: string;
  slug: string;
  status: PageStatus;
  sortOrder: number;
  title: LocalizedText;
  metaTitle: LocalizedText;
  metaDescription: LocalizedText;
  sections: SectionNode[];
  createdAt: string;
  updatedAt: string;
}

/** A page row WITHOUT its tree — the admin page list (P7). */
export interface PageSummary {
  id: string;
  slug: string;
  status: PageStatus;
  sortOrder: number;
  title: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
