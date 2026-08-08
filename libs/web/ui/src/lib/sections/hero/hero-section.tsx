import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import type { RenderMode } from '../../mode/render-mode.js';
import { SectionField } from '../section-field.js';
import { resolveSlots, type SectionSlots } from '../section-slots.js';
import { HERO_COPY } from './hero-copy.js';

export interface HeroSectionProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  /** Website injects Reveal/WordReveal for `live`; the admin omits them (faithful-static). */
  slots?: SectionSlots;
  /**
   * The DOM id for the rendered `<section>` (the website passes `"hero"` so the cosmos planet-dock
   * (`use-section-metrics`), the wayfinder rail and the `#hero` anchor keep resolving). Omitted in
   * the admin preview (no cosmos to dock).
   */
  anchorId?: string;
}

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

/**
 * The `hero` mission-opening — the shared per-type component, the SINGLE source rendered by the
 * live website AND the admin preview (preview === live). The editable CONTENT (eyebrow, headline,
 * lead, proof strip) lives here; the cosmos chrome — the legibility `Backdrop` veil, the warp
 * `Actions` CTAs, the scroll `Cue` — is INJECTED as slots by the site for `mode='live'` and defaults
 * to static/empty for the admin. In `live` the injected `Headline` slot (WordReveal) plays the word
 * cascade; in `edit` the headline becomes inline-editable and everything else lights up its pencil.
 */
export function HeroSection({
  section,
  locale,
  mode,
  slots,
  anchorId,
}: HeroSectionProps) {
  const { Reveal, Headline, Actions, Backdrop, Cue } = resolveSlots(slots);
  const title = pickLocalized(section.title, locale);
  const titleFallback = pickLocalized(HERO_COPY.title, locale);
  const proofBlocks = [...section.blocks]
    .sort(bySortOrder)
    .filter((block) => block.type === 'feature');

  return (
    <section id={anchorId} className="web-hero" data-section-type="hero">
      <Backdrop />
      <div className="web-hero-top">
        <Reveal>
          <SectionField
            as="p"
            className="web-hero-eyebrow"
            value={pickLocalized(section.eyebrow, locale)}
            fallback={pickLocalized(HERO_COPY.eyebrow, locale)}
            mode={mode}
            path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
          />
        </Reveal>
        {mode === 'edit' ? (
          <SectionField
            as="h1"
            className="web-hero-title"
            value={title}
            fallback={titleFallback}
            mode={mode}
            path={{ kind: 'section', sectionId: section.id, field: 'title' }}
          />
        ) : (
          <Headline
            text={title.trim().length > 0 ? title : titleFallback}
            className="web-hero-title"
          />
        )}
      </div>

      <div className="web-hero-bottom">
        <Reveal>
          <SectionField
            as="p"
            className="web-hero-lead"
            value={pickLocalized(section.subtitle, locale)}
            fallback={pickLocalized(HERO_COPY.lead, locale)}
            mode={mode}
            multiline
            path={{ kind: 'section', sectionId: section.id, field: 'subtitle' }}
          />
        </Reveal>
        <div className="web-hero-actions">
          <Actions
            primaryLabel={pickLocalized(HERO_COPY.startProject, locale)}
            secondaryLabel={pickLocalized(HERO_COPY.seeWork, locale)}
          />
        </div>
        <div className="web-hero-proof">
          {proofBlocks.length > 0
            ? proofBlocks.map((block) => (
                <SectionField
                  key={block.id}
                  as="span"
                  className="web-hero-proof-item"
                  value={pickLocalized(block.title, locale)}
                  mode={mode}
                  path={{
                    kind: 'block',
                    sectionId: section.id,
                    blockId: block.id,
                    field: 'title',
                  }}
                />
              ))
            : HERO_COPY.proof.map((item, index) => (
                <span key={index} className="web-hero-proof-item">
                  {pickLocalized(item, locale)}
                </span>
              ))}
        </div>
        <Cue />
      </div>
    </section>
  );
}
