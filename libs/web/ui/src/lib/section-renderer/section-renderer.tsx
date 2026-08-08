import type { Locale, SectionNode } from '@sanad/contracts';
import type { RenderMode } from '../mode/render-mode.js';
import type { SectionSlots } from '../sections/section-slots.js';
import { SectionBlock } from './section-block.js';

export interface SectionRendererProps {
  sections: SectionNode[];
  locale: Locale;
  mode: RenderMode;
  resolveImageUrl?: (imageMediaId: string) => string;
  /** Website injects motion for `live`; forwarded to each per-type section component. */
  slots?: SectionSlots;
}

/**
 * Renders an ordered list of sections — the website page body (P8). The admin preview renders a
 * single selected section via `SectionBlock` directly; this is the full-page entry both consumers
 * share. Wrap in a `WebsiteShell` to attach the fixed-dark scope + per-page accent.
 */
export function SectionRenderer({
  sections,
  locale,
  mode,
  resolveImageUrl,
  slots,
}: SectionRendererProps) {
  const ordered = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <>
      {ordered.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          locale={locale}
          mode={mode}
          resolveImageUrl={resolveImageUrl}
          slots={slots}
        />
      ))}
    </>
  );
}
