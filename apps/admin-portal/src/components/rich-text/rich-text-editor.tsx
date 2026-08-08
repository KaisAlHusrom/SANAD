import 'quill/dist/quill.snow.css';
import './rich-text.css';
import type { Direction } from '@sanad/contracts';
import { useDirection } from '../../providers/direction/use-direction';
import { useRichText } from './use-rich-text';

export interface RichTextEditorProps {
  /** HTML string (RHF field value). */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Override the editing direction; defaults to the active locale's (the per-locale tab). */
  direction?: Direction;
  'aria-label'?: string;
}

/**
 * The shared Quill (snow) rich-text editor (presentational; lifecycle in `useRichText`, U5).
 * The wrapper owns the token border/radius; Quill inserts its toolbar above the editing area
 * inside it. Tokens-only + RTL-correct (U6/U7) so it reads on-design in dark + light (U21).
 * Reused app-wide via `RichTextField` and the DynamicForm `custom` field (W5-style decoupling).
 */
export function RichTextEditor({
  value,
  onChange,
  placeholder,
  direction,
  'aria-label': ariaLabel,
}: RichTextEditorProps) {
  const { direction: documentDirection } = useDirection();
  const { containerRef } = useRichText({
    value,
    onChange,
    placeholder,
    direction: direction ?? documentDirection,
  });

  return (
    <div className="sanad-rich-text overflow-hidden rounded-input border border-border-2 bg-surface focus-within:border-accent-line">
      <div ref={containerRef} aria-label={ariaLabel} />
    </div>
  );
}
