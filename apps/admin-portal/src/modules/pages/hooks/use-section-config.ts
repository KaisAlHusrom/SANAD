import {
  type SectionCollectionConfig,
  type SectionNode,
  type SectionType,
  type SectionUpsertRequest,
} from '@sanad/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '../../../data/toast';
import { useUpsertSectionMutation } from '../api/pages.api';

export type ConfigMode = SectionCollectionConfig['mode'];

/** The modes a collection can offer + where its records are managed (deep-link). */
export interface CollectionMeta {
  /** i18n key under `config.collections.*` for the collection's display name. */
  nameKey: string;
  /** Admin route to manage the underlying records ("Manage {collection} →"). */
  manageTo: string;
  /** Selection modes valid for this collection (services has no `featured` flag). */
  modes: ConfigMode[];
  /** Which lookup the `picked` ServerSelect searches; omitted when the collection has no `picked`. */
  pickedCollection?:
    | 'services'
    | 'portfolio'
    | 'testimonials'
    | 'blog'
    | 'faq'
    | 'team';
}

/**
 * Which `section.type`s are collection-backed (Phase 3) + their config affordances. Grown one
 * collection at a time as each section is unified into `@sanad/web-ui` (services first — MS9).
 */
export const COLLECTION_SECTIONS: Partial<Record<SectionType, CollectionMeta>> =
  {
    services: {
      nameKey: 'config.collections.services',
      manageTo: '/content/services',
      modes: ['all', 'picked'],
      pickedCollection: 'services',
    },
    // trust's constellation shows the DISTINCT categories of the published projects — breadth of
    // domains, not a curated pick — so it offers `all`-only (an optional limit, no ids picker).
    trust: {
      nameKey: 'config.collections.portfolio',
      manageTo: '/content/portfolio',
      modes: ['all'],
    },
    // the WEB10 works orbit is a CURATED showcase of case studies — offer `featured` (the reel),
    // `picked` (explicit ordered projects) + `all` (every project by drag order).
    work: {
      nameKey: 'config.collections.portfolio',
      manageTo: '/content/portfolio',
      modes: ['featured', 'picked', 'all'],
      pickedCollection: 'portfolio',
    },
    // the testimonials wall — offer `featured` (the flagged reel), `picked` (explicit ordered
    // quotes) + `all` (every testimonial by drag order); testimonials carry a `featured` flag.
    testimonials: {
      nameKey: 'config.collections.testimonials',
      manageTo: '/content/testimonials',
      modes: ['featured', 'picked', 'all'],
      pickedCollection: 'testimonials',
    },
    // the blog teaser — offer `picked` (explicit ordered posts) + `all` (latest by drag order);
    // blog posts have no `featured` flag (only published/draft), so no `featured` mode.
    blog: {
      nameKey: 'config.collections.blog',
      manageTo: '/content/blog',
      modes: ['picked', 'all'],
      pickedCollection: 'blog',
    },
    // the `/faq` accordion (Phase 5) — offer `picked` (explicit ordered questions) + `all` (every FAQ
    // by drag order); FAQs have no `featured` flag, so no `featured` mode.
    faq: {
      nameKey: 'config.collections.faq',
      manageTo: '/content/faqs',
      modes: ['all', 'picked'],
      pickedCollection: 'faq',
    },
    // the `/about` roster (Phase 5) — offer `featured` (the flagged leadership set), `picked` (explicit
    // ordered members) + `all` (every member by drag order); team members carry a `featured` flag.
    team: {
      nameKey: 'config.collections.team',
      manageTo: '/content/team',
      modes: ['featured', 'picked', 'all'],
      pickedCollection: 'team',
    },
  };

/** The collection meta for a section type, or undefined when it links no collection. */
export function collectionMetaFor(
  type: SectionType,
): CollectionMeta | undefined {
  return COLLECTION_SECTIONS[type];
}

export interface UseSectionConfigResult {
  mode: ConfigMode;
  setMode: (mode: ConfigMode) => void;
  limit: string;
  setLimit: (limit: string) => void;
  ids: string[];
  setIds: (ids: string[]) => void;
  isDirty: boolean;
  isSaving: boolean;
  save: () => Promise<void>;
}

/** Build the config payload from the current control state (limit omitted unless a valid 1–50;
 *  ids kept only for `picked`). Pure → unit-tested. */
export function configFromControls(
  mode: ConfigMode,
  limit: string,
  ids: string[],
): SectionCollectionConfig {
  const parsed = Number(limit);
  const hasLimit =
    limit.trim().length > 0 &&
    Number.isInteger(parsed) &&
    parsed >= 1 &&
    parsed <= 50;
  return {
    mode,
    ...(hasLimit ? { limit: parsed } : {}),
    ids: mode === 'picked' ? ids : [],
  };
}

/**
 * Build a FULL section upsert body carrying the new `config`, threading the section's copy +
 * published + sortOrder through unchanged so saving the collection never wipes the editorial copy
 * (the upsert writes translations from the body). Pure → unit-tested (mirrors `buildInlineUpsert`).
 */
export function buildConfigUpsertBody(
  pageId: string,
  section: SectionNode,
  config: SectionCollectionConfig,
): SectionUpsertRequest {
  return {
    id: section.id,
    pageId,
    type: section.type,
    sortOrder: section.sortOrder,
    published: section.published,
    eyebrow: section.eyebrow,
    title: section.title,
    subtitle: section.subtitle,
    config,
  };
}

/**
 * The collection-link editor state for a section (U5). Seeds from `section.config`, tracks the
 * mode/limit/picked-ids, and saves a FULL section upsert body carrying the new `config` — the
 * section's copy (eyebrow/title/subtitle) + published + sortOrder are threaded through unchanged so
 * saving the collection never wipes the editorial copy (the upsert writes translations from the body).
 */
export function useSectionConfig(
  pageId: string,
  section: SectionNode,
): UseSectionConfigResult {
  const { t } = useTranslation('pages');
  const [upsertSection, { isLoading }] = useUpsertSectionMutation();

  const initial = section.config;
  const [mode, setMode] = useState<ConfigMode>(initial?.mode ?? 'all');
  const [limit, setLimit] = useState<string>(
    initial?.limit != null ? String(initial.limit) : '',
  );
  const [ids, setIds] = useState<string[]>(initial?.ids ?? []);

  const config = configFromControls(mode, limit, ids);
  const isDirty =
    JSON.stringify(config) !==
    JSON.stringify(
      configFromControls(
        initial?.mode ?? 'all',
        initial?.limit != null ? String(initial.limit) : '',
        initial?.ids ?? [],
      ),
    );

  const save = async (): Promise<void> => {
    const body = buildConfigUpsertBody(pageId, section, config);
    try {
      await upsertSection({ body, pageId }).unwrap();
      toast.success(t('config.saved'));
    } catch {
      toast.error(t('config.saveFailed'));
    }
  };

  return {
    mode,
    setMode,
    limit,
    setLimit,
    ids,
    setIds,
    isDirty,
    isSaving: isLoading,
    save,
  };
}
