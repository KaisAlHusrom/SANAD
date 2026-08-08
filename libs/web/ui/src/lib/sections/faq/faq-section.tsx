import { pickLocalized } from '@sanad/contracts';
import { isEditorMode } from '../../mode/render-mode.js';
import type { SectionComponentProps } from '../section-component.types.js';
import { SectionField } from '../section-field.js';
import { resolveSlots } from '../section-slots.js';
import { deriveFaqRows } from './derive-faqs.js';
import { FaqDisclosures } from './faq-disclosures.js';
import { FAQ_SECTION_COPY } from './faq-copy.js';

/**
 * The `faq` accordion section (WEB1) — the shared per-type component both the website (`mode='live'`,
 * with its `.lp-flow` `Reveal`) and the admin Content Studio (`mode='preview'|'edit'`) render
 * (preview===live). A head (eyebrow/title — section-owned copy, inline-editable in `edit`) over the
 * disclosure list, whose rows come from the section's HYDRATED `faq` collection (curated in the FAQ
 * module via the admin config panel). Rows are localized server-side (`deriveFaqRows`) so only plain
 * strings cross into the client `FaqDisclosures` (RSC-safe). Empty renders nothing live, a placeholder
 * in the editor. Tokens-only `.web-*`, logical properties (RTL, U6/U7).
 */
export function FaqSection({
  section,
  locale,
  mode,
  slots,
}: SectionComponentProps) {
  const { Reveal } = resolveSlots(slots);
  const rows = deriveFaqRows(section, locale);

  if (rows.length === 0 && !isEditorMode(mode)) return null;

  return (
    <section className="web-faq" data-section-type="faq">
      <Reveal className="web-faq-head">
        <SectionField
          as="p"
          className="web-faq-eyebrow"
          value={pickLocalized(section.eyebrow, locale)}
          fallback={pickLocalized(FAQ_SECTION_COPY.eyebrow, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
        />
        <SectionField
          as="h2"
          className="web-faq-title"
          value={pickLocalized(section.title, locale)}
          fallback={pickLocalized(FAQ_SECTION_COPY.title, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
      </Reveal>

      {rows.length > 0 ? (
        <Reveal className="web-faq-body">
          <FaqDisclosures rows={rows} mode={mode} />
        </Reveal>
      ) : (
        <div className="web-placeholder" aria-hidden="true" />
      )}
    </section>
  );
}
