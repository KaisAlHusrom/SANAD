import type { BlockNode, BlockType } from '@sanad/contracts';
import { z } from 'zod';
import {
  localizedFormSchema,
  phantomTranslatableKeys,
} from '../../../components/dynamic-form/localized-form';

/**
 * The typed per-block-type `data` editor (the owner's U21 decision: real fields per type, never
 * a raw-JSON textarea). Each block kind exposes a small set of non-translatable `data` keys
 * (stat → value/suffix, cta → href/variant, feature/step → icon) plus the translatable
 * `title`/`body` the kind uses. These are kept FLAT in the form (the kit's `buildDefaultValues`
 * keys by name, so a `data.x` path can't nest) and pivoted into the contract's `data` object on
 * submit by `toBlockData`. Pure → unit-tested.
 */

export const BLOCK_TYPES: readonly BlockType[] = [
  'text',
  'richtext',
  'stat',
  'step',
  'feature',
  'image',
  'cta',
];

/** The non-translatable `data` keys each block kind carries (flat form fields → `data`). */
export const BLOCK_DATA_KEYS: Record<BlockType, readonly string[]> = {
  text: [],
  richtext: [],
  stat: ['value', 'suffix'],
  step: ['icon'],
  feature: ['icon'],
  image: [],
  cta: ['href', 'variant'],
};

/** How each block kind renders its translatable `body` (or none); `title` shows for all. */
export const BLOCK_BODY: Record<BlockType, 'none' | 'textarea' | 'richtext'> = {
  text: 'textarea',
  richtext: 'richtext',
  stat: 'none',
  step: 'textarea',
  feature: 'textarea',
  image: 'none',
  cta: 'none',
};

/** Whether the kind carries an `imageMediaId` (the media picker shows only for these). */
export const BLOCK_HAS_IMAGE: Record<BlockType, boolean> = {
  text: false,
  richtext: false,
  stat: false,
  step: false,
  feature: true,
  image: true,
  cta: false,
};

/** The CTA button variants (a fixed coded enum → plain Select, W5). */
export const CTA_VARIANTS = ['primary', 'secondary'] as const;

/** The Zod schema for a single data key (shared across the kinds that use it). */
const DATA_FIELD_SCHEMA: Record<string, z.ZodTypeAny> = {
  value: z.coerce.number(),
  suffix: z.string().trim().max(16),
  icon: z.string().trim().max(64),
  href: z.union([z.literal(''), z.string().trim().max(2048)]),
  variant: z.enum(CTA_VARIANTS),
};

/** The blank/default value for a data key (seeds create + the prefill fallback). */
const DATA_FIELD_DEFAULT: Record<string, unknown> = {
  value: 0,
  suffix: '',
  icon: '',
  href: '',
  variant: 'primary',
};

/** The form values shape across every block kind (per-kind keys are present-or-absent). */
export interface BlockFormValues {
  /** Present only for kinds that render an image picker (feature/image); absent otherwise. */
  imageMediaId?: string;
  title?: string;
  body?: string;
  translations: {
    ar: Record<string, string>;
    en: Record<string, string>;
  };
  value?: number;
  suffix?: string;
  icon?: string;
  href?: string;
  variant?: (typeof CTA_VARIANTS)[number];
}

/**
 * Build the block-editor form schema for a given kind: the translatable title (+ body only for
 * the kinds that render one), the optional media id (present only for image-bearing kinds), and
 * the kind's typed `data` keys. The schema MUST validate exactly the fields the kind RENDERS —
 * `useBlockForm` seeds `translations.body`/`imageMediaId` only when it renders them, so requiring
 * them for a kind that doesn't would reject the seeded defaults and make the save a silent no-op
 * (the 2026-07-10 bug). `.strict()` is NOT used (the kit form may carry phantom keys); the
 * contract edge stays strict (N7).
 */
export function blockFormSchema(type: BlockType): z.ZodType<BlockFormValues> {
  const dataShape = Object.fromEntries(
    BLOCK_DATA_KEYS[type].map((key) => [key, DATA_FIELD_SCHEMA[key]]),
  );
  const translatableKeys =
    BLOCK_BODY[type] === 'none' ? ['title'] : ['title', 'body'];
  return z.object({
    imageMediaId: z.union([z.literal(''), z.string().uuid()]).optional(),
    ...phantomTranslatableKeys(['title', 'body']),
    translations: localizedFormSchema({ optional: translatableKeys }),
    ...dataShape,
  }) as unknown as z.ZodType<BlockFormValues>;
}

/** The default form data values for a fresh block of `type` (the create prefill seed). */
export function blockDefaultData(type: BlockType): Record<string, unknown> {
  return Object.fromEntries(
    BLOCK_DATA_KEYS[type].map((key) => [key, DATA_FIELD_DEFAULT[key]]),
  );
}

/** Collect a block kind's flat form data keys into the contract's `data` object (submit). */
export function toBlockData(
  type: BlockType,
  values: Record<string, unknown>,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of BLOCK_DATA_KEYS[type]) {
    data[key] = values[key];
  }
  return data;
}

/** Flatten a block node's `data` object back into the form's top-level keys (edit prefill). */
export function fromBlockData(node: BlockNode): Record<string, unknown> {
  const flat: Record<string, unknown> = {};
  for (const key of BLOCK_DATA_KEYS[node.type]) {
    flat[key] = node.data[key] ?? DATA_FIELD_DEFAULT[key];
  }
  return flat;
}
