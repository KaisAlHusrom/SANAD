import type { Direction } from '@sanad/contracts';
import Quill from 'quill';
import { useEffect, useRef, type RefObject } from 'react';

export interface UseRichTextOptions {
  /** The HTML string the editor holds (RHF field value). */
  value: string;
  /** Fired with the editor's HTML on every user edit (never on a programmatic sync). */
  onChange: (html: string) => void;
  placeholder?: string;
  direction: Direction;
}

export interface UseRichTextResult {
  /** Attach to the div Quill mounts into (its toolbar is inserted as a preceding sibling). */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * A restrained snow toolbar — headings, inline marks, quote/code, lists, link, clear. No
 * image/video/font/colour pickers: blog body is structured prose, and media goes through the
 * media library (W5), not pasted base64. The `direction` button lets an author flip a block.
 */
const TOOLBAR: ReadonlyArray<ReadonlyArray<unknown>> = [
  [{ header: [2, 3, 4, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  ['blockquote', 'code-block'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ direction: 'rtl' }, { align: [] }],
  ['link'],
  ['clean'],
];

/**
 * The Quill lifecycle hook (U5) for the shared rich-text editor. Initialises Quill (snow) once
 * on a container ref, bridges its `text-change` to `onChange(html)`, and keeps the editor in
 * sync when the RHF `value` changes externally — guarding both directions with an internal-change
 * ref so a programmatic set never echoes back as a user edit (the loop the Bishola reference
 * guards against). `value`/`onChange`/`placeholder` are read off refs so the editor is built
 * exactly once; only `direction` re-applies live. Strictly typed (no `any`); `Quill` is a
 * default import (the frontend analog of N12 — Vite bundles it).
 */
export function useRichText({
  value,
  onChange,
  placeholder,
  direction,
}: UseRichTextOptions): UseRichTextResult {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const internalRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const placeholderRef = useRef(placeholder);
  onChangeRef.current = onChange;
  valueRef.current = value;
  placeholderRef.current = placeholder;

  // Build Quill once. Everything reactive is read from refs so a prop change never re-creates
  // the editor (which would drop focus + selection mid-edit).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || quillRef.current) {
      return;
    }
    const quill = new Quill(container, {
      theme: 'snow',
      placeholder: placeholderRef.current,
      modules: { toolbar: TOOLBAR },
    });

    if (valueRef.current) {
      internalRef.current = true;
      quill.root.innerHTML = valueRef.current;
      internalRef.current = false;
    }

    quill.on('text-change', () => {
      if (internalRef.current) {
        return;
      }
      onChangeRef.current(quill.root.innerHTML);
    });

    quillRef.current = quill;

    return () => {
      quillRef.current = null;
      // Quill has no destroy(); clearing the host lets a remount (locale-tab switch) rebuild.
      container.innerHTML = '';
    };
  }, []);

  // Reflect an external value change (edit-prefill, reset) into the editor without echoing.
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill || value === quill.root.innerHTML) {
      return;
    }
    internalRef.current = true;
    quill.root.innerHTML = value;
    internalRef.current = false;
  }, [value]);

  // The editing area follows the active locale's direction (U7); Arabic-first → rtl default.
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) {
      return;
    }
    quill.root.setAttribute('dir', direction);
    quill.root.style.textAlign = direction === 'rtl' ? 'right' : 'left';
  }, [direction]);

  return { containerRef };
}
