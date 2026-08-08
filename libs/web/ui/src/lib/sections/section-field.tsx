import { createElement, type ElementType } from 'react';
import { EditableText } from '../editable/editable-text.js';
import type { EditableFieldPath } from '../editable/field-path.js';
import type { RenderMode } from '../mode/render-mode.js';

export interface SectionFieldProps {
  /** The stored value in the active locale (may be blank). */
  value: string;
  /** Coded default (F7): shown when the value is blank in live/preview, and as the edit placeholder. */
  fallback?: string;
  path: EditableFieldPath;
  mode: RenderMode;
  /** Host element / typography class-holder (default `span`). */
  as?: ElementType;
  className?: string;
  /** Multi-line fields (leads, notes): Enter inserts a newline, commit on blur. */
  multiline?: boolean;
}

/**
 * One editable content leaf inside a per-type section. In `live`/`preview` it renders plain text
 * (the stored value, else the coded default — F7), byte-identical to non-editable markup. In
 * `edit` it renders the client `EditableText` (in-place editing), showing the STORED value with the
 * coded default as a placeholder — so editing a blank field starts empty, not pre-filled with the
 * default. The client island is reached only on the `edit` path, never on the website (U-boundary).
 */
export function SectionField({
  value,
  fallback = '',
  path,
  mode,
  as,
  className,
  multiline,
}: SectionFieldProps) {
  if (mode === 'edit') {
    return (
      <EditableText
        as={as}
        className={className}
        value={value}
        path={path}
        placeholder={fallback}
        multiline={multiline}
      />
    );
  }
  const As: ElementType = as ?? 'span';
  const display = value.trim().length > 0 ? value : fallback;
  if (!display) return null;
  // `createElement` keeps the polymorphic `As` tag's children well-typed across React 18/19.
  return createElement(As, { className }, display);
}
