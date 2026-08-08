import { pickLocalized } from '@sanad/contracts';
import { BlockRenderer } from '../../block-renderer/block-renderer.js';
import { isEditorMode } from '../../mode/render-mode.js';
import type { SectionComponentProps } from '../section-component.types.js';
import { SectionField } from '../section-field.js';
import { resolveSlots } from '../section-slots.js';
import { RICH_TEXT_COPY } from './rich-text-copy.js';

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

/**
 * The `richtext` prose band — the shared per-type component both the website (`mode='live'`, with its
 * `.lp-flow` `Reveal`) and the admin Content Studio (`mode='preview'|'edit'`) render (preview===live).
 * A section head (eyebrow/title/subtitle — section-owned copy, inline-editable in `edit`) over the
 * prose column, which is the section's `richtext` blocks rendered as trusted HTML by the existing
 * `BlockRenderer` (`.web-richtext-body`). Long-form prose is authored in the typed Quill block modal
 * (the locked Phase-4 decision), NOT inline — so no `EditableRichText`. This is also the component the
 * seeded privacy/terms pages render through, so head fields carry NO live fallback (a blank head field
 * renders nothing; the coded strings are edit placeholders only — F7 for prose). Tokens-only `.web-*`,
 * logical properties (RTL, U6/U7).
 */
export function RichTextSection({
  section,
  locale,
  mode,
  slots,
  resolveImageUrl,
}: SectionComponentProps) {
  const { Reveal } = resolveSlots(slots);
  const blocks = [...section.blocks].sort(bySortOrder);

  const eyebrow = pickLocalized(section.eyebrow, locale);
  const title = pickLocalized(section.title, locale);
  const subtitle = pickLocalized(section.subtitle, locale);
  const hasHead = Boolean(eyebrow || title || subtitle);

  if (!hasHead && blocks.length === 0 && !isEditorMode(mode)) return null;

  // edit-only placeholder (never a live fallback — prose head is fully author-supplied)
  const hint = (value: string) => (mode === 'edit' ? value : '');

  return (
    <section className="web-richtext-section" data-section-type="richtext">
      <Reveal className="web-richtext-head">
        <SectionField
          as="p"
          className="web-richtext-eyebrow"
          value={eyebrow}
          fallback={hint(pickLocalized(RICH_TEXT_COPY.eyebrow, locale))}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
        />
        <SectionField
          as="h2"
          className="web-richtext-title"
          value={title}
          fallback={hint(pickLocalized(RICH_TEXT_COPY.title, locale))}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
        <SectionField
          as="p"
          className="web-richtext-lead"
          value={subtitle}
          fallback={hint(pickLocalized(RICH_TEXT_COPY.lead, locale))}
          mode={mode}
          multiline
          path={{ kind: 'section', sectionId: section.id, field: 'subtitle' }}
        />
      </Reveal>

      {blocks.length > 0 ? (
        <div className="web-richtext-prose">
          {blocks.map((block) => (
            <BlockRenderer
              key={block.id}
              node={block}
              locale={locale}
              mode={mode}
              sectionId={section.id}
              resolveImageUrl={resolveImageUrl}
            />
          ))}
        </div>
      ) : isEditorMode(mode) ? (
        <div className="web-placeholder" aria-hidden="true" />
      ) : null}
    </section>
  );
}
