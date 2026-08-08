import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import { isEditorMode, type RenderMode } from '../../mode/render-mode.js';
import { SectionField } from '../section-field.js';
import { resolveSlots, type SectionSlots } from '../section-slots.js';
import { deriveWorkCards } from './derive-work-cards.js';
import { WORKS_COPY } from './works-copy.js';
import { WorksFigure } from './works-figure.js';
import type { WorksOrbitComponent } from './work-card.types.js';

export interface WorksSectionProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  /** Website injects `Reveal` (the `.lp-flow` head marker) for `live`; the admin omits it. */
  slots?: SectionSlots;
  /** Resolve a project's `coverMediaId` to a CDN url — called SERVER-SIDE here so each card carries
   *  a plain `coverUrl` (RSC-safe: no function crosses into the client orbit). */
  resolveImageUrl?: (imageMediaId: string) => string;
  /** The `#works` anchor (hero + CTA link here) — set by the website; omitted in the admin preview. */
  anchorId?: string;
  /** The live animated orbit ring — injected for `mode='live'` (see `WorksOrbitComponent`). */
  Orbit?: WorksOrbitComponent;
}

/**
 * The WEB10 `work` orbit chapter — the shared per-type component both the website (`mode='live'`,
 * with its animated `Orbit` + `.lp-flow` `Reveal`) and the admin Content Studio (`mode='preview'|
 * 'edit'`) render (preview === live). A centered head (eyebrow/title/lead — section-owned copy,
 * inline-editable in `edit`) over the case-study cards, which come from the section's HYDRATED
 * `portfolio` collection (attached in-service from `section.config` — curated in the Portfolio
 * module via the admin config panel). Live renders the injected `Orbit` (pinned/scrubbed ring);
 * everything else draws the static `WorksFigure` grid (WEB4). Empty renders nothing live, a
 * placeholder in the editor. Tokens-only `.web-*`, logical properties (RTL, U6/U7).
 */
export function WorksSection({
  section,
  locale,
  mode,
  slots,
  resolveImageUrl,
  anchorId,
  Orbit,
}: WorksSectionProps) {
  const { Reveal } = resolveSlots(slots);
  // resolve covers HERE (server-side) so cards carry plain `coverUrl` — never a function to the orbit
  const cards = deriveWorkCards(section, locale, resolveImageUrl);
  const labels = { challenge: pickLocalized(WORKS_COPY.challenge, locale) };

  if (cards.length === 0 && !isEditorMode(mode)) return null;

  const head = (
    <div className="web-works-head">
      <Reveal>
        <p className="web-works-eyebrow">
          <SectionField
            value={pickLocalized(section.eyebrow, locale)}
            fallback={pickLocalized(WORKS_COPY.eyebrow, locale)}
            mode={mode}
            path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
          />
        </p>
      </Reveal>
      <Reveal>
        <SectionField
          as="h2"
          className="web-works-title"
          value={pickLocalized(section.title, locale)}
          fallback={pickLocalized(WORKS_COPY.title, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
      </Reveal>
      <Reveal>
        <SectionField
          as="p"
          className="web-works-lead"
          value={pickLocalized(section.subtitle, locale)}
          fallback={pickLocalized(WORKS_COPY.lead, locale)}
          mode={mode}
          multiline
          path={{ kind: 'section', sectionId: section.id, field: 'subtitle' }}
        />
      </Reveal>
    </div>
  );

  return (
    <section id={anchorId} className="web-works" data-section-type="work">
      {cards.length > 0 ? (
        Orbit && mode === 'live' ? (
          <Orbit
            head={head}
            cards={cards}
            labels={labels}
            dir={locale === 'ar' ? -1 : 1}
            locale={locale}
          />
        ) : (
          <>
            {head}
            <WorksFigure cards={cards} labels={labels} mode={mode} />
          </>
        )
      ) : (
        <>
          {head}
          <div className="web-placeholder" aria-hidden="true" />
        </>
      )}
    </section>
  );
}
