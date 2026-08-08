import {
  pickLocalized,
  type BlockNode,
  type Locale,
  type LocalizedText,
  type PageTree,
  type SectionNode,
} from '@sanad/contracts';

/**
 * Pure helpers the bespoke landing sections use to read the seeded `landing` page-tree
 * (WEB1) null-safely (F7). A missing/unpublished section, a missing field, or a blank
 * translation all fall back to a coded default — the page never renders blank (U9).
 */

/** The first PUBLISHED section of a given type, or undefined. */
export function findSection(
  page: PageTree | null,
  type: string,
): SectionNode | undefined {
  return page?.sections.find(
    (section) => section.type === type && section.published,
  );
}

/** Pick the active locale's text, falling back to `fallback` when missing/blank (F7). */
export function localizedOr(
  value: LocalizedText | undefined,
  locale: Locale,
  fallback = '',
): string {
  if (!value) return fallback;
  const picked = pickLocalized(value, locale);
  return picked.trim().length > 0 ? picked : fallback;
}

/** A section's blocks in render order. */
export function sortedBlocks(section: SectionNode | undefined): BlockNode[] {
  return section
    ? [...section.blocks].sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
}

/** A non-translatable numeric field off a block's `data` bag (stat value, step index). */
export function blockNumber(
  block: BlockNode,
  key: string,
  fallback = 0,
): number {
  const raw = block.data[key];
  const num = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(num) ? num : fallback;
}

/** A non-translatable string field off a block's `data` bag (cta href, stat suffix). */
export function blockString(
  block: BlockNode,
  key: string,
  fallback = '',
): string {
  const raw = block.data[key];
  return typeof raw === 'string' && raw.length > 0 ? raw : fallback;
}

/**
 * A translatable value stored in a block's `data` bag (e.g. a step's `duration`). The bag is
 * loose JSON, so the shape is verified — never cast (U15); anything malformed is undefined (F7).
 */
export function blockLocalized(
  block: BlockNode,
  key: string,
): LocalizedText | undefined {
  const raw = block.data[key];
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const candidate = raw as Record<string, unknown>;
    if (
      typeof candidate['ar'] === 'string' &&
      typeof candidate['en'] === 'string'
    ) {
      return { ar: candidate['ar'], en: candidate['en'] };
    }
  }
  return undefined;
}

/**
 * The blocks of a type "joined" to an owner by a `data[key]` marker (e.g. a service card's
 * capability `feature` blocks carry `data.service = <slug>`; a process step's deliverables carry
 * `data.step = <n>`). Loose string comparison so numeric markers match their string form.
 * Null-safe: a missing section or no match returns [] (F7). Sorted by `sortOrder`.
 */
export function blocksFor(
  section: SectionNode | undefined,
  type: string,
  key: string,
  value: string | number,
): BlockNode[] {
  return sortedBlocks(section).filter(
    (block) => block.type === type && String(block.data[key]) === String(value),
  );
}

/**
 * Split a metric-led result string ("−40% زمن التسليم") into the metric token and its label, so
 * the works result bar can set the number in mono LTR and the words in text type. Strings with no
 * leading metric come back whole in `label` (F7 — never lose content to formatting).
 */
export function splitMetric(result: string): { value: string; label: string } {
  // metric token = optional sign, then digits with an optional magnitude/unit tail (1.2M, 200K, +320%, 3x)
  const match = /^([+\-−±~]?[0-9٠-٩][0-9٠-٩.,]*[%٪x×+KMBkmb]?)\s+(\S.*)$/u.exec(
    result.trim(),
  );
  const value = match?.[1];
  const label = match?.[2];
  if (value !== undefined && label !== undefined) {
    return { value: value.trim(), label: label.trim() };
  }
  return { value: '', label: result.trim() };
}

/** The first block joined to an owner (see `blocksFor`), or undefined. */
export function firstBlockFor(
  section: SectionNode | undefined,
  type: string,
  key: string,
  value: string | number,
): BlockNode | undefined {
  return blocksFor(section, type, key, value)[0];
}
