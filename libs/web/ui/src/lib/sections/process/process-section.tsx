import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import type { ComponentType } from 'react';
import { isEditorMode, type RenderMode } from '../../mode/render-mode.js';
import { SectionField } from '../section-field.js';
import { resolveSlots, type SectionSlots } from '../section-slots.js';
import { PROCESS_COPY } from './process-copy.js';
import type { ProcessStepView } from './process-step-view.types.js';
import { deriveProcessSteps } from './process-steps.js';

export interface ProcessSectionProps {
  section: SectionNode;
  locale: Locale;
  mode: RenderMode;
  /** Website injects `Reveal` (the `.lp-flow` head marker) for `live`; the admin omits it. */
  slots?: SectionSlots;
  /**
   * The live "phases as moons" visualization — the website's `ProcessMoons`, injected for
   * `mode='live'`. The admin preview/edit (and any live render without it) omits it and draws the
   * phase-briefing cards statically (editable in `edit`). A ProcessSection-specific prop (like
   * hero's `anchorId`) so the generic `SectionSlots` union stays free of a process-only concern.
   */
  System?: ComponentType<{ steps: ProcessStepView[] }>;
}

/**
 * The `process` phased-delivery method — the shared per-type component both the website
 * (`mode='live'`, with its `ProcessMoons` `System` + `.lp-flow` `Reveal`) and the admin Content
 * Studio (`mode='preview'|'edit'`) render (preview === live). A centered head over the phase
 * briefings — the section's `step` blocks (position counter + mono duration + body + joined
 * `feature` deliverables). Live, the moons orbit and the cards cross-fade one at a time; the editor
 * shows them statically, with the phase title/body inline-editable. Empty renders nothing live, a
 * placeholder in the editor. Tokens-only `.web-*`, logical properties (RTL, U6/U7).
 */
export function ProcessSection({
  section,
  locale,
  mode,
  slots,
  System,
}: ProcessSectionProps) {
  const { Reveal } = resolveSlots(slots);
  const giveLabel = pickLocalized(PROCESS_COPY.give, locale);
  const steps = deriveProcessSteps(section, locale, giveLabel);

  if (steps.length === 0 && !isEditorMode(mode)) return null;

  return (
    <section className="web-process" data-section-type="process">
      <Reveal className="web-process-head">
        <SectionField
          as="p"
          className="web-process-eyebrow"
          value={pickLocalized(section.eyebrow, locale)}
          fallback={pickLocalized(PROCESS_COPY.eyebrow, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'eyebrow' }}
        />
        <SectionField
          as="h2"
          className="web-process-title"
          value={pickLocalized(section.title, locale)}
          fallback={pickLocalized(PROCESS_COPY.title, locale)}
          mode={mode}
          path={{ kind: 'section', sectionId: section.id, field: 'title' }}
        />
      </Reveal>

      {System && mode === 'live' ? (
        <System steps={steps} />
      ) : steps.length > 0 ? (
        <div className="web-process-static">
          {steps.map((step, index) => (
            <article
              key={step.id}
              className={`web-process-card web-phase--${index % 4}`}
            >
              <div className="web-process-card-meta">
                <span className="web-ltr">{step.label}</span>
                {step.duration ? (
                  <span className="web-process-card-meta-dur">
                    {step.duration}
                  </span>
                ) : null}
              </div>
              <SectionField
                as="h3"
                className="web-process-card-title"
                value={step.title}
                mode={mode}
                path={{
                  kind: 'block',
                  sectionId: section.id,
                  blockId: step.id,
                  field: 'title',
                }}
              />
              <SectionField
                as="p"
                className="web-process-card-body"
                value={step.body}
                mode={mode}
                path={{
                  kind: 'block',
                  sectionId: section.id,
                  blockId: step.id,
                  field: 'body',
                }}
              />
              {step.deliverables.length > 0 ? (
                <ul
                  className="web-process-card-give"
                  aria-label={step.giveLabel}
                >
                  {step.deliverables.map((item, deliverableIndex) => (
                    <li
                      key={`${step.id}-give-${deliverableIndex}`}
                      className="web-process-card-give-item"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="web-placeholder" aria-hidden="true" />
      )}
    </section>
  );
}
