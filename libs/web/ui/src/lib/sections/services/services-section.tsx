import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import { isEditorMode, type RenderMode } from '../../mode/render-mode.js';
import { SectionField } from '../section-field.js';
import { resolveSlots, type SectionSlots } from '../section-slots.js';
import { deriveServiceCards } from './service-systems.js';
import { SERVICES_COPY } from './services-copy.js';

export interface ServicesSectionProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  /** Website injects `Reveal` (`.lp-flow` markers) for `live`; the admin omits it (static preview). */
  slots?: SectionSlots;
}

/**
 * The `services` capability chapter — the shared per-type component both the website (`mode='live'`,
 * with its `.lp-flow` `Reveal`s) and the admin Content Studio (`mode='preview'|'edit'`) render
 * (preview === live). The section HEAD (eyebrow/title/lead) is section-owned copy — inline-editable
 * in `edit`; the system CARDS come from the section's HYDRATED `services` collection (attached
 * in-service from `section.config` — Phase 3), edited in the Services module (a "Manage services →"
 * deep-link in the admin section editor), so they render as plain content here. Each card is a
 * bracket-framed instrument: a mono `SYS·NN / SLUG` designation + geometric mark, the outcome-led
 * summary, capability bullets (joined `feature` blocks, coded fallback otherwise — U9/F7) and a mono
 * tech signature. Empty renders nothing live, a placeholder in the editor. Tokens-only `.web-*`,
 * logical properties (RTL, U6/U7).
 */
export function ServicesSection({
  section,
  locale,
  mode,
  slots,
}: ServicesSectionProps) {
  const { Reveal } = resolveSlots(slots);
  const cards = deriveServiceCards(section, locale);

  if (cards.length === 0 && !isEditorMode(mode)) return null;

  return (
    <section className="web-services" data-section-type="services">
      <Reveal>
        <div className="web-services-head">
          <SectionField
            as="p"
            className="web-services-eyebrow"
            value={pickLocalized(section.eyebrow, locale)}
            fallback={pickLocalized(SERVICES_COPY.eyebrow, locale)}
            mode={mode}
            path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
          />
          <SectionField
            as="h2"
            className="web-services-title"
            value={pickLocalized(section.title, locale)}
            fallback={pickLocalized(SERVICES_COPY.title, locale)}
            mode={mode}
            path={{ kind: 'section', sectionId: section.id, field: 'title' }}
          />
          <SectionField
            as="p"
            className="web-services-lead"
            value={pickLocalized(section.subtitle, locale)}
            fallback={pickLocalized(SERVICES_COPY.lead, locale)}
            mode={mode}
            multiline
            path={{ kind: 'section', sectionId: section.id, field: 'subtitle' }}
          />
        </div>
      </Reveal>

      {cards.length > 0 ? (
        <div className="web-services-grid">
          {cards.map((card) => (
            <Reveal key={card.id}>
              <article className="web-panel web-sys">
                <div className="web-sys-head">
                  <span className="web-micro web-ltr">
                    {`SYS·${String(card.index + 1).padStart(2, '0')} / ${card.slug.toUpperCase()}`}
                  </span>
                  <span
                    className={`web-sys-mark web-sys-mark--${card.index % 4}`}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="web-sys-title">{card.title}</h3>
                <p className="web-sys-body">{card.summary}</p>
                {card.caps.length > 0 ? (
                  <ul className="web-sys-caps">
                    {card.caps.map((cap) => (
                      <li key={cap.id} className="web-sys-cap">
                        {cap.text}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {card.tech ? (
                  <div className="web-sys-tech web-ltr">{card.tech}</div>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="web-placeholder" aria-hidden="true" />
      )}
    </section>
  );
}
