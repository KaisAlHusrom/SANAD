import type {
  BlockUpsertRequest,
  Locale,
  LocalizedText,
  SectionNode,
  SectionUpsertRequest,
} from '@sanad/contracts';
import type { EditableFieldPath } from '@sanad/web-ui';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import {
  useUpsertBlockMutation,
  useUpsertSectionMutation,
} from '../api/pages.api';

/** Override one locale of a translatable field, preserving the other (Arabic-first, U7/U8). */
function withLocale(
  text: LocalizedText,
  locale: Locale,
  value: string,
): LocalizedText {
  return { ...text, [locale]: value };
}

/** A block `data` value coerces to the type its editor uses — numeric for the stat `value`. */
function coerceDataValue(key: string, value: string): unknown {
  if (key === 'value') {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }
  return value;
}

/** The upsert an inline edit resolves to — a full section or block body, tagged by kind. */
export type InlineUpsert =
  | { kind: 'section'; body: SectionUpsertRequest }
  | { kind: 'block'; body: BlockUpsertRequest };

/**
 * Map one in-place field edit to a FULL section/block upsert body — merging the change into the
 * current node so the untouched locale and sibling fields are preserved (pure → unit-tested). A
 * `block`/`block-data` path with no matching block returns null (a stale edit; the caller drops it).
 */
export function buildInlineUpsert(
  pageId: string,
  section: SectionNode,
  path: EditableFieldPath,
  value: string,
  locale: Locale,
): InlineUpsert | null {
  if (path.kind === 'section') {
    const body: SectionUpsertRequest = {
      id: section.id,
      pageId,
      type: section.type,
      sortOrder: section.sortOrder,
      published: section.published,
      eyebrow: section.eyebrow,
      title: section.title,
      subtitle: section.subtitle,
    };
    body[path.field] = withLocale(section[path.field], locale, value);
    return { kind: 'section', body };
  }

  const block = section.blocks.find((b) => b.id === path.blockId);
  if (!block) return null;
  const body: BlockUpsertRequest = {
    id: block.id,
    sectionId: section.id,
    type: block.type,
    sortOrder: block.sortOrder,
    data: block.data,
    imageMediaId: block.imageMediaId,
    title: block.title,
    body: block.body,
  };
  if (path.kind === 'block') {
    body[path.field] = withLocale(block[path.field], locale, value);
  } else if (path.kind === 'block-data') {
    body.data = { ...block.data, [path.key]: coerceDataValue(path.key, value) };
  } else {
    // block-image: `value` is the picked media id (locale-agnostic); empty clears the image.
    body.imageMediaId = value || null;
  }
  return { kind: 'block', body };
}

/**
 * Turns an in-place `EditableFieldPath` edit (from the `@sanad/web-ui` studio primitives) into the
 * right section/block upsert — merging the change into the current node so the OTHER locale and the
 * untouched siblings are preserved. The upsert mutations patch the tree cache optimistically (in
 * their `onQueryStarted`), so the preview updates instantly and reverts on failure. This is the
 * admin's data seam; the shared lib stays data-free (`type:ui`).
 */
export function useInlineCommit(pageId: string, section: SectionNode) {
  const { t } = useTranslation('common');
  const [upsertSection] = useUpsertSectionMutation();
  const [upsertBlock] = useUpsertBlockMutation();

  return useCallback(
    (path: EditableFieldPath, value: string, locale: Locale) => {
      const upsert = buildInlineUpsert(pageId, section, path, value, locale);
      if (!upsert) return;
      const onError = () => toast.error(t('states.error'));
      if (upsert.kind === 'section') {
        upsertSection({ body: upsert.body, pageId }).unwrap().catch(onError);
      } else {
        upsertBlock({ body: upsert.body, pageId }).unwrap().catch(onError);
      }
    },
    [pageId, section, upsertSection, upsertBlock, t],
  );
}

/**
 * Page-scope map of one in-place edit → a full section/block upsert: resolve the target section from
 * the tree by the path's `sectionId` (every `EditableFieldPath` carries it), then delegate to
 * `buildInlineUpsert`. Returns null when the section is gone (a stale edit — the caller drops it).
 * Pure → unit-tested.
 */
export function buildPageInlineUpsert(
  pageId: string,
  sections: SectionNode[],
  path: EditableFieldPath,
  value: string,
  locale: Locale,
): InlineUpsert | null {
  const section = sections.find((s) => s.id === path.sectionId);
  if (!section) return null;
  return buildInlineUpsert(pageId, section, path, value, locale);
}

/**
 * The **page-scope** inline commit for the preview-first Studio canvas (Phase 4b): the whole page is
 * editable at once, so an edit's target section is resolved from the tree by the path's `sectionId`
 * rather than a single fixed `section`. Otherwise identical to `useInlineCommit` — merges the change
 * (preserving the other locale + siblings) and lets the upsert mutations patch the cache optimistically.
 */
export function usePageInlineCommit(pageId: string, sections: SectionNode[]) {
  const { t } = useTranslation('common');
  const [upsertSection] = useUpsertSectionMutation();
  const [upsertBlock] = useUpsertBlockMutation();

  return useCallback(
    (path: EditableFieldPath, value: string, locale: Locale) => {
      const upsert = buildPageInlineUpsert(
        pageId,
        sections,
        path,
        value,
        locale,
      );
      if (!upsert) return;
      const onError = () => toast.error(t('states.error'));
      if (upsert.kind === 'section') {
        upsertSection({ body: upsert.body, pageId }).unwrap().catch(onError);
      } else {
        upsertBlock({ body: upsert.body, pageId }).unwrap().catch(onError);
      }
    },
    [pageId, sections, upsertSection, upsertBlock, t],
  );
}
