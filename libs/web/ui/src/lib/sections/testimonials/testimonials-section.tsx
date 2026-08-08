import { pickLocalized } from '@sanad/contracts';
import { RecordEditFrame } from '../../editable/record-edit-frame.js';
import { isEditorMode } from '../../mode/render-mode.js';
import type { SectionComponentProps } from '../section-component.types.js';
import { SectionField } from '../section-field.js';
import { resolveSlots } from '../section-slots.js';
import { deriveTestimonialCards } from './derive-testimonials.js';
import { TestimonialCard } from './testimonial-card.js';
import { TESTIMONIALS_COPY } from './testimonials-copy.js';

/**
 * The `testimonials` received-transmissions wall (WEB1) — the shared per-type component both the
 * website (`mode='live'`, with its `.lp-flow` `Reveal`) and the admin Content Studio
 * (`mode='preview'|'edit'`) render (preview === live). A centered head (eyebrow/title — section-owned
 * copy, inline-editable in `edit`) over the quote cards, which come from the section's HYDRATED
 * `testimonials` collection (curated in the Testimonials module via the admin config panel). There is
 * no bespoke per-card motion beyond the injected `Reveal`, so this needs no injected visualizer prop
 * (simpler than works/trust). Empty renders nothing live, a placeholder in the editor. Tokens-only
 * `.web-*`, logical properties (RTL, U6/U7).
 */
export function TestimonialsSection({
  section,
  locale,
  mode,
  slots,
  resolveImageUrl,
}: SectionComponentProps) {
  const { Reveal } = resolveSlots(slots);
  // resolve avatars HERE (server-side) so cards carry a plain `avatarUrl` — never a function crosses
  const cards = deriveTestimonialCards(section, locale, resolveImageUrl);

  if (cards.length === 0 && !isEditorMode(mode)) return null;

  return (
    <section className="web-quotes" data-section-type="testimonials">
      <Reveal className="web-quotes-head">
        <SectionField
          as="p"
          className="web-quotes-eyebrow"
          value={pickLocalized(section.eyebrow, locale)}
          fallback={pickLocalized(TESTIMONIALS_COPY.eyebrow, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
        />
        <SectionField
          as="h2"
          className="web-quotes-title"
          value={pickLocalized(section.title, locale)}
          fallback={pickLocalized(TESTIMONIALS_COPY.title, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
      </Reveal>

      {cards.length > 0 ? (
        <div className="web-quotes-grid">
          {cards.map((card, index) => {
            const el = (
              <TestimonialCard
                card={card}
                designation={`TRX·${String(index + 1).padStart(2, '0')}`}
              />
            );
            return (
              <Reveal key={card.id}>
                {mode === 'edit' ? (
                  <RecordEditFrame collection="testimonials" id={card.id}>
                    {el}
                  </RecordEditFrame>
                ) : (
                  el
                )}
              </Reveal>
            );
          })}
        </div>
      ) : (
        <div className="web-placeholder" aria-hidden="true" />
      )}
    </section>
  );
}
