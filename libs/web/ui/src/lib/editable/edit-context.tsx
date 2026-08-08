'use client';

import type { HydratedCollection, Locale } from '@sanad/contracts';
import { createContext, type ReactNode, useContext } from 'react';
import type { EditableFieldPath } from './field-path.js';

/** Which collection a cover belongs to (the `HydratedCollection` discriminant) — an `onEditRecord` arg. */
export type EditableCollection = HydratedCollection['collection'];

/**
 * The edit seam, PROVIDED BY THE ADMIN (never the website). It carries the active editing locale
 * and the callbacks the `Editable*` primitives fire — the admin wires these to its RTK mutations
 * so `@sanad/web-ui` stays data-free (`type:ui`). When no provider is present (the live site, or
 * the read-only `preview`), the primitives fall back to rendering plain content.
 */
export interface EditContextValue {
  /** The locale being edited (ar/en); commits target this locale, the other is preserved. */
  locale: Locale;
  /** Persist a single field change. The admin merges it into the right section/block upsert. */
  onCommit: (path: EditableFieldPath, value: string, locale: Locale) => void;
  /** Open the admin media picker for an editable image; resolves to the chosen field. Optional. */
  onPickImage?: (path: EditableFieldPath) => void;
  /**
   * Jump to the editor of a collection record whose cover is shown in a section (work/testimonial/
   * blog). Those covers live on their own tables — NOT the page tree — so they can't be inline-
   * committed; the honest action is to open the record. Injected by the admin (route-free lib).
   */
  onEditRecord?: (collection: EditableCollection, id: string) => void;
  /** The `fieldPathKey` currently saving (for a spinner/disabled state), or null. Optional. */
  pendingKey?: string | null;
  /** Localized "Edit" aria-label for the pencil affordance — injected so the lib stays i18n-free. */
  editLabel?: string;
  /** Localized "Change image" aria-label for the image-pick affordance (falls back to `editLabel`). */
  pickImageLabel?: string;
  /** Localized "Edit record" aria-label for the collection-cover affordance (falls back to `editLabel`). */
  editRecordLabel?: string;
}

const EditContext = createContext<EditContextValue | null>(null);

export function EditProvider({
  value,
  children,
}: {
  value: EditContextValue;
  children: ReactNode;
}) {
  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
}

/** The active edit seam, or `null` when not in an editing surface (live/preview). */
export function useEditContext(): EditContextValue | null {
  return useContext(EditContext);
}
