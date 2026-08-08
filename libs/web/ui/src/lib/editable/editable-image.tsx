'use client';

import { ImagePlus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEditContext } from './edit-context.js';
import type { BlockImageFieldPath } from './field-path.js';

export interface EditableImageProps {
  /** The resolved CDN url of the image, or undefined → the placeholder frame. */
  url?: string;
  alt?: string;
  /** Which image leaf this edits — the admin turns it into a block `imageMediaId` upsert. */
  path?: BlockImageFieldPath;
  /** The frame class (e.g. `web-image-frame`, `web-orbit-cover-frame`) applied to the img/placeholder. */
  className?: string;
  /** What to show inside the empty placeholder frame (an icon) — kept i18n-free in the lib. */
  placeholder?: ReactNode;
}

/**
 * An in-place editable image. With NO `EditContext` (the live site / read-only preview) it renders
 * exactly the plain `<img>` (or placeholder frame) — byte-identical DOM to non-editable imagery, so
 * the website ships pure server HTML. Inside the admin Content Studio (an `EditProvider` with
 * `onPickImage` is present) it wraps the frame with a hover outline + a corner "change image" button;
 * clicking it (or double-clicking the frame) opens the admin media picker via `onPickImage(path)`.
 * The lib never imports the media data layer (U-boundary, `type:ui`).
 */
export function EditableImage({
  url,
  alt,
  path,
  className,
  placeholder,
}: EditableImageProps) {
  const ctx = useEditContext();
  const frame = url ? (
    // resolved CDN src — a genuine runtime value (the media resolver), not a token
    <img className={className} src={url} alt={alt ?? ''} loading="lazy" />
  ) : (
    <div className={className}>{placeholder}</div>
  );

  if (!ctx?.onPickImage || !path) return frame;

  const pick = () => ctx.onPickImage?.(path);

  return (
    <div className="web-editable-image" onDoubleClick={pick}>
      {frame}
      <button
        type="button"
        className="web-edit-image-btn"
        // keep focus off the button so it doesn't steal it from the frame
        onMouseDown={(event) => event.preventDefault()}
        onClick={pick}
        aria-label={ctx.pickImageLabel ?? ctx.editLabel ?? 'Edit'}
      >
        <ImagePlus size={14} aria-hidden="true" />
      </button>
    </div>
  );
}
