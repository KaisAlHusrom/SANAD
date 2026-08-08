'use client';

import { Pencil } from 'lucide-react';
import {
  createElement,
  type ElementType,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useEditContext } from './edit-context.js';
import type { EditableFieldPath } from './field-path.js';

export interface EditableTextProps {
  /** The current localized value (already resolved to the active locale, F7-defaulted upstream). */
  value: string;
  /** Which content leaf this edits — the admin turns it into a section/block upsert on commit. */
  path: EditableFieldPath;
  /** The host element/typography class-holder (default `span`). Text lives in an inner span. */
  as?: ElementType;
  className?: string;
  /** Multi-line fields (subtitle/body): Enter inserts a newline; commit is on blur only. */
  multiline?: boolean;
  /** Shown (via CSS) when the value is empty while editing. */
  placeholder?: string;
}

function selectAll(node: HTMLElement): void {
  const selection = node.ownerDocument.getSelection();
  if (!selection) return;
  const range = node.ownerDocument.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * In-place editable text. With NO `EditContext` (the live site / read-only preview) it renders the
 * plain element — byte-identical DOM to non-editable text, so the website ships pure server HTML.
 * Inside the admin Content Studio (an `EditProvider` is present) it gains a hover outline + a
 * corner pencil; double-click or the pencil starts an uncontrolled `contentEditable` edit, and
 * Enter (single-line) / blur commits the new value to the active locale via `onCommit`. Escape
 * cancels. Logical properties keep the pencil at the inline-start corner in RTL (U7).
 */
export function EditableText({
  value,
  path,
  as,
  className,
  multiline,
  placeholder,
}: EditableTextProps) {
  const ctx = useEditContext();
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const As: ElementType = as ?? 'span';

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      selectAll(ref.current);
    }
  }, [editing]);

  if (!ctx) {
    // plain element, byte-identical to non-editable text (the live site / read-only preview).
    // `createElement` keeps the polymorphic `As` tag's children well-typed across React 18/19.
    return createElement(As, { className }, value);
  }

  const start = () => setEditing(true);

  const commit = () => {
    if (!editing) return;
    const raw = ref.current?.textContent ?? '';
    const next = multiline
      ? raw.replace(/\r/g, '')
      : raw.replace(/\s*\n\s*/g, ' ');
    setEditing(false);
    if (next !== value) ctx.onCommit(path, next, ctx.locale);
  };

  const cancel = () => {
    if (ref.current) ref.current.textContent = value;
    setEditing(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      cancel();
    } else if (event.key === 'Enter' && !multiline) {
      event.preventDefault();
      commit();
    }
  };

  const classes = [
    className,
    'web-editable',
    editing ? 'web-editable--editing' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return createElement(
    As,
    {
      className: classes,
      onDoubleClick: start,
      'data-editing': editing || undefined,
    },
    <span
      key="content"
      ref={ref}
      className="web-editable-content"
      contentEditable={editing}
      suppressContentEditableWarning
      onBlur={commit}
      onKeyDown={onKeyDown}
      data-placeholder={placeholder}
    >
      {value}
    </span>,
    editing ? null : (
      <button
        key="pencil"
        type="button"
        className="web-edit-pencil"
        // keep focus/selection off the button so a click doesn't blur-commit prematurely
        onMouseDown={(event) => event.preventDefault()}
        onClick={start}
        aria-label={ctx.editLabel ?? 'Edit'}
      >
        <Pencil size={12} aria-hidden="true" />
      </button>
    ),
  );
}
