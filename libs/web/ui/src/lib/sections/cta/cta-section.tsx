import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import type { RenderMode } from '../../mode/render-mode.js';
import { SectionField } from '../section-field.js';
import { resolveSlots, type SectionSlots } from '../section-slots.js';
import { CTA_COPY } from './cta-copy.js';

export interface CtaSectionProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  /**
   * Website injects `Reveal` (`.lp-flow` markers), the warp `Actions` (→ request-a-project + `#works`)
   * and the `Backdrop` cosmos chrome (veil/glow/rings) for `mode='live'`; the admin omits them
   * (faithful-static preview — a clean surface, plain-label CTAs).
   */
  slots?: SectionSlots;
}

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

/**
 * The `cta` launch band — the shared per-type component both the website (`mode='live'`, with its
 * cosmos `Backdrop`, warp `Actions` + `.lp-flow` `Reveal`s) and the admin Content Studio
 * (`mode='preview'|'edit'`) render (preview === live). A centered close: eyebrow → headline → lead →
 * the primary/ghost CTA row → the friction-killing "what happens after your message" step sequence
 * (the section's `feature` blocks, coded `CTA_COPY.steps` otherwise — F7). Tokens-only `.web-*`,
 * logical properties (RTL, U6/U7).
 */
export function CtaSection({ section, locale, mode, slots }: CtaSectionProps) {
  const { Reveal, Actions, Backdrop } = resolveSlots(slots);
  const stepBlocks = [...section.blocks]
    .sort(bySortOrder)
    .filter((block) => block.type === 'feature');

  return (
    <section className="web-cta-band" data-section-type="cta">
      <Backdrop />
      <Reveal>
        <SectionField
          as="p"
          className="web-cta-eyebrow"
          value={pickLocalized(section.eyebrow, locale)}
          fallback={pickLocalized(CTA_COPY.eyebrow, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
        />
      </Reveal>
      <Reveal>
        <SectionField
          as="h2"
          className="web-cta-title"
          value={pickLocalized(section.title, locale)}
          fallback={pickLocalized(CTA_COPY.title, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
      </Reveal>
      <Reveal>
        <SectionField
          as="p"
          className="web-cta-lead"
          value={pickLocalized(section.subtitle, locale)}
          fallback={pickLocalized(CTA_COPY.lead, locale)}
          mode={mode}
          multiline
          path={{ kind: 'section', sectionId: section.id, field: 'subtitle' }}
        />
      </Reveal>
      <Reveal>
        <div className="web-hero-actions">
          <Actions
            primaryLabel={pickLocalized(CTA_COPY.startProject, locale)}
            secondaryLabel={pickLocalized(CTA_COPY.seeWork, locale)}
          />
        </div>
      </Reveal>
      <Reveal>
        <div
          className="web-cta-steps"
          aria-label={pickLocalized(CTA_COPY.stepsTitle, locale)}
        >
          {stepBlocks.length > 0
            ? stepBlocks.map((block, index) => (
                <div key={block.id} className="web-cta-step">
                  <span className="web-cta-step-index web-ltr">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <SectionField
                    as="p"
                    className="web-cta-step-text"
                    value={pickLocalized(block.title, locale)}
                    mode={mode}
                    path={{
                      kind: 'block',
                      sectionId: section.id,
                      blockId: block.id,
                      field: 'title',
                    }}
                  />
                </div>
              ))
            : CTA_COPY.steps.map((step, index) => (
                <div key={index} className="web-cta-step">
                  <span className="web-cta-step-index web-ltr">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="web-cta-step-text">
                    {pickLocalized(step, locale)}
                  </p>
                </div>
              ))}
        </div>
      </Reveal>
    </section>
  );
}
