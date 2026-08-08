/**
 * The field seam between the shared renderer and the admin's data layer. An `Editable*` primitive
 * describes WHICH content leaf changed as a typed `EditableFieldPath`; the admin's `onCommit`
 * (injected via `EditContext`) turns that path + the new value + the active locale into the right
 * section/block upsert. The lib never imports RTK/data — it only speaks these paths (U-boundary:
 * `@sanad/web-ui` is `type:ui`, data-free).
 */

/** A translatable field directly on a section (eyebrow/title/subtitle). */
export interface SectionFieldPath {
  kind: 'section';
  sectionId: string;
  field: 'eyebrow' | 'title' | 'subtitle';
}

/** A translatable field on a block (its title or body). */
export interface BlockFieldPath {
  kind: 'block';
  sectionId: string;
  blockId: string;
  field: 'title' | 'body';
}

/** A non-translatable `data` key on a block (e.g. a stat's `value`/`suffix`, a cta's `href`). */
export interface BlockDataFieldPath {
  kind: 'block-data';
  sectionId: string;
  blockId: string;
  key: string;
}

/**
 * The (locale-agnostic) `imageMediaId` of an `image` block — the media picker's target. Unlike the
 * text paths this commits an asset id, not a string per locale; the admin's `onPickImage` opens the
 * library and commits the chosen id (empty clears it).
 */
export interface BlockImageFieldPath {
  kind: 'block-image';
  sectionId: string;
  blockId: string;
}

export type EditableFieldPath =
  | SectionFieldPath
  | BlockFieldPath
  | BlockDataFieldPath
  | BlockImageFieldPath;

/** A stable string key for a path (dirty/pending tracking, React keys). Locale-agnostic. */
export function fieldPathKey(path: EditableFieldPath): string {
  switch (path.kind) {
    case 'section':
      return `section:${path.sectionId}:${path.field}`;
    case 'block':
      return `block:${path.blockId}:${path.field}`;
    case 'block-data':
      return `block-data:${path.blockId}:${path.key}`;
    case 'block-image':
      return `block-image:${path.blockId}`;
  }
}
