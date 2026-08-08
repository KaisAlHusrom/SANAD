import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import { BlockRenderer } from '../block-renderer/block-renderer.js';
import { isEditorMode, type RenderMode } from '../mode/render-mode.js';
import { sectionComponentFor } from '../sections/section-registry.js';
import type { SectionSlots } from '../sections/section-slots.js';

export interface SectionBlockProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  resolveImageUrl?: (imageMediaId: string) => string;
  /** Website injects motion for `live`; admin omits it. Forwarded to the per-type component. */
  slots?: SectionSlots;
}

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

/**
 * Renders one `SectionNode` to the website's section layout — the eyebrow/title/subtitle plus the
 * ordered blocks. The admin preview passes the selected section; the website (P8) composes these
 * via `SectionRenderer`. In `preview` an unpublished section is dimmed and a wholly-empty section
 * shows a placeholder; in `live` it renders nothing when empty (the data layer filters publish
 * state upstream). `// P8: branch on section.type here for bespoke per-section layouts.`
 */
export function SectionBlock({
  section,
  locale,
  mode,
  resolveImageUrl,
  slots,
}: SectionBlockProps) {
  // P8 seam: a registered type renders its bespoke shared layout (the same component the website
  // uses live); everything else falls through to the generic eyebrow/title/subtitle + blocks body.
  const Component = sectionComponentFor(section.type);
  if (Component) {
    const element = (
      <Component
        section={section}
        locale={locale}
        mode={mode}
        slots={slots}
        resolveImageUrl={resolveImageUrl}
      />
    );
    return isEditorMode(mode) && !section.published ? (
      <div className="web-section--unpublished">{element}</div>
    ) : (
      element
    );
  }

  const eyebrow = pickLocalized(section.eyebrow, locale);
  const title = pickLocalized(section.title, locale);
  const subtitle = pickLocalized(section.subtitle, locale);
  const blocks = [...section.blocks].sort(bySortOrder);

  const isEmpty = !eyebrow && !title && !subtitle && blocks.length === 0;
  if (isEmpty && !isEditorMode(mode)) return null;

  const dimmed = isEditorMode(mode) && !section.published;
  const className = dimmed
    ? 'web-section web-section--unpublished'
    : 'web-section';

  return (
    <section className={className} data-section-type={section.type}>
      {eyebrow ? <p className="web-kicker">{eyebrow}</p> : null}
      {title ? <h2 className="web-heading">{title}</h2> : null}
      {subtitle ? <p className="web-subtitle">{subtitle}</p> : null}

      {blocks.length > 0 ? (
        <div className="web-blocks">
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
      ) : null}

      {isEmpty ? <div className="web-placeholder" aria-hidden="true" /> : null}
    </section>
  );
}
