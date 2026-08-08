'use client';

import { useState } from 'react';
import { RecordEditFrame } from '../../editable/record-edit-frame.js';
import type { RenderMode } from '../../mode/render-mode.js';
import type { FaqRowData } from './derive-faqs.js';

/**
 * The FAQ accordion (F9 — no reusable disclosure exists in the kit, so this is the token-styled one),
 * ported into `@sanad/web-ui` from the website's `FaqAccordion`. A flat list of question/answer
 * disclosures: each row is a `<button>` toggling `aria-expanded` on its panel; multiple rows may be
 * open independently. The panel expands via the CSS `grid-template-rows: 0fr → 1fr` technique
 * (`.web-faq-answer`), dropped under `prefers-reduced-motion` (WEB4) — the content is always in the
 * DOM (SEO/accessible). RTL-correct: the chevron uses a logical rotation, layout uses logical
 * properties (U7). It receives only PLAIN strings (RSC-safe) so no data layer / `pickLocalized`
 * crosses the client boundary. In `edit`, each row is wrapped in `RecordEditFrame` (FAQs live on their
 * own table — deep-link to the record editor).
 */
export function FaqDisclosures({
  rows,
  mode,
}: {
  rows: FaqRowData[];
  mode: RenderMode;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <ul className="web-faq-list">
      {rows.map((row) => {
        const isOpen = open.has(row.id);
        const panelId = `faq-panel-${row.id}`;
        const disclosure = (
          <>
            <button
              type="button"
              className="web-faq-q"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(row.id)}
            >
              <span className="web-faq-q-text">{row.question}</span>
              <span className="web-faq-chevron" aria-hidden="true" />
            </button>
            <div id={panelId} className="web-faq-answer" role="region">
              <div className="web-faq-answer-inner">
                {row.category ? (
                  <span className="web-faq-cat">{row.category}</span>
                ) : null}
                <p className="web-faq-answer-text">{row.answer}</p>
              </div>
            </div>
          </>
        );
        return (
          <li
            key={row.id}
            className="web-faq-item web-panel"
            data-open={isOpen ? 'true' : 'false'}
          >
            {mode === 'edit' ? (
              <RecordEditFrame collection="faq" id={row.id}>
                {disclosure}
              </RecordEditFrame>
            ) : (
              disclosure
            )}
          </li>
        );
      })}
    </ul>
  );
}
