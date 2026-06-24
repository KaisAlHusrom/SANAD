import type {
  BlockNode,
  LocalizedText,
  PageSummary,
  PageTree,
  SectionNode,
} from '@sanad/contracts';
import type {
  BlockRow,
  PageRow,
  SectionRow,
} from '../../../db/schema/index.js';

/** A null-safe empty translatable value (F7) — the default when a field is untranslated. */
const EMPTY: LocalizedText = { ar: '', en: '' };

type Fields = Record<string, LocalizedText>;

function field(fields: Fields | undefined, name: string): LocalizedText {
  return fields?.[name] ?? EMPTY;
}

/** Assemble a single block node (translatable copy resolved to both locales). */
export function assembleBlock(
  row: BlockRow,
  fields: Fields | undefined,
): BlockNode {
  return {
    id: row.id,
    type: row.type,
    sortOrder: row.sortOrder,
    data: row.data,
    imageMediaId: row.imageMediaId,
    title: field(fields, 'title'),
    body: field(fields, 'body'),
  };
}

/** Assemble a section node with its ordered blocks. */
export function assembleSection(
  row: SectionRow,
  fields: Fields | undefined,
  blocks: BlockNode[],
): SectionNode {
  return {
    id: row.id,
    type: row.type,
    sortOrder: row.sortOrder,
    published: row.published,
    eyebrow: field(fields, 'eyebrow'),
    title: field(fields, 'title'),
    subtitle: field(fields, 'subtitle'),
    blocks,
  };
}

/** Assemble the page summary (admin list — no tree). */
export function assemblePageSummary(
  row: PageRow,
  fields: Fields | undefined,
): PageSummary {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    sortOrder: row.sortOrder,
    title: field(fields, 'title'),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Assemble the full Page → Section → Block tree (both locales, WEB1/WEB2). */
export function assemblePageTree(
  row: PageRow,
  fields: Fields | undefined,
  sections: SectionNode[],
): PageTree {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    sortOrder: row.sortOrder,
    title: field(fields, 'title'),
    metaTitle: field(fields, 'metaTitle'),
    metaDescription: field(fields, 'metaDescription'),
    sections,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
