import { z } from 'zod';

/**
 * The kind of a block within a section — drives the block renderer (WEB1). `text`/`richtext`
 * carry translatable copy; `stat`/`step`/`feature` carry structured `data` (numbers in
 * Western digits, icon keys) plus translatable labels; `image` references a media asset;
 * `cta` carries a label + url. Mirrors the `block_type` Postgres enum (U3).
 */
export const blockTypeSchema = z.enum([
  'text',
  'richtext',
  'stat',
  'step',
  'feature',
  'image',
  'cta',
]);

export type BlockType = z.infer<typeof blockTypeSchema>;
