import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import type { ComponentType } from 'react';
import { isEditorMode, type RenderMode } from '../../mode/render-mode.js';
import { SectionField } from '../section-field.js';
import { resolveSlots, type SectionSlots } from '../section-slots.js';
import { ConstellationFigure } from './constellation-figure.js';
import { TRUST_COPY } from './trust-copy.js';
import { deriveTrustDomains, type TrustDomain } from './trust-domains.js';

export interface TrustSectionProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  /** Website injects `Reveal` (the `.lp-flow` head marker) for `live`; the admin omits it. */
  slots?: SectionSlots;
  /**
   * The live animated constellation — the website's `TrustConstellation`, injected for
   * `mode='live'`. It renders the SAME `ConstellationFigure` DOM and drives the scroll-linked
   * tracing/star-pop. The admin preview/edit (and any live render without it) omits it and draws
   * the figure statically. A TrustSection-specific prop (like process's `System`) so the generic
   * `SectionSlots` union stays free of a trust-only concern.
   */
  Constellation?: ComponentType<{ domains: TrustDomain[] }>;
}

/**
 * The `trust` domain constellation (WEB1) — the shared per-type component both the website
 * (`mode='live'`, with its animated `Constellation` + `.lp-flow` `Reveal`) and the admin Content
 * Studio (`mode='preview'|'edit'`) render (preview === live). A centered head over the asterism:
 * the distinct categories of the section's HYDRATED `portfolio` collection as named stars carrying
 * their live project count (DB-driven, never a hardcoded marketing claim). Small screens fall back
 * to the labeled chip column (the asterism needs breadth). Empty renders nothing live, a
 * placeholder in the editor. Tokens-only `.web-*`, logical properties (RTL, U6/U7).
 */
export function TrustSection({
  section,
  locale,
  mode,
  slots,
  Constellation,
}: TrustSectionProps) {
  const { Reveal } = resolveSlots(slots);
  const domains = deriveTrustDomains(section, locale);

  if (domains.length === 0 && !isEditorMode(mode)) return null;

  return (
    <section className="web-trust" data-section-type="trust">
      <Reveal className="web-trust-head">
        <SectionField
          as="p"
          className="web-trust-eyebrow"
          value={pickLocalized(section.eyebrow, locale)}
          fallback={pickLocalized(TRUST_COPY.eyebrow, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
        />
        <SectionField
          as="h2"
          className="web-trust-title"
          value={pickLocalized(section.title, locale)}
          fallback={pickLocalized(TRUST_COPY.title, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
        <SectionField
          as="p"
          className="web-trust-lead"
          value={pickLocalized(section.subtitle, locale)}
          fallback={pickLocalized(TRUST_COPY.lead, locale)}
          mode={mode}
          multiline
          path={{ kind: 'section', sectionId: section.id, field: 'subtitle' }}
        />
      </Reveal>

      {domains.length > 0 ? (
        <Reveal className="web-trust-field">
          {Constellation && mode === 'live' ? (
            <Constellation domains={domains} />
          ) : (
            <ConstellationFigure domains={domains} />
          )}
          {/* breadth-starved viewports read the same domains as labeled chips */}
          <div className="web-trust-chips">
            {domains.map((domain) => (
              <div key={domain.id} className="web-trust-chip">
                <span className="web-trust-chip-mark" aria-hidden="true" />
                <span className="web-trust-chip-name">{domain.name}</span>
              </div>
            ))}
          </div>
        </Reveal>
      ) : (
        <div className="web-placeholder" aria-hidden="true" />
      )}
    </section>
  );
}
