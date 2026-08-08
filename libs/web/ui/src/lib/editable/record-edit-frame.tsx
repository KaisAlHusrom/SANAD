'use client';

import { SquarePen } from 'lucide-react';
import type { ReactNode } from 'react';
import { type EditableCollection, useEditContext } from './edit-context.js';

export interface RecordEditFrameProps {
  /** Which collection the wrapped card belongs to (portfolio/testimonials/blog). */
  collection: EditableCollection;
  /** The record id — passed to `onEditRecord` to open that record's editor. */
  id: string;
  children: ReactNode;
}

/**
 * Wraps a collection card (work/testimonial/blog) so that, in the admin Content Studio, hovering it
 * reveals a corner "edit record" button that jumps to that record's editor via `onEditRecord`. Those
 * covers live on their own tables — NOT the page tree — so they can't be inline-committed; opening the
 * record is the honest action. With NO `onEditRecord` on the context (the live site / read-only
 * preview) it renders the card unchanged (a passthrough) — sections render this ONLY in `mode==='edit'`
 * so the website never mounts it (no added hydration). Route/data stay in the admin (`type:ui`).
 */
export function RecordEditFrame({
  collection,
  id,
  children,
}: RecordEditFrameProps) {
  const ctx = useEditContext();
  if (!ctx?.onEditRecord) return <>{children}</>;

  return (
    <div className="web-record-edit">
      {children}
      <button
        type="button"
        className="web-record-edit-btn"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => ctx.onEditRecord?.(collection, id)}
        aria-label={ctx.editRecordLabel ?? ctx.editLabel ?? 'Edit'}
      >
        <SquarePen size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
